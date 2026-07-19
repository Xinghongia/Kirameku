import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient
from jose import jwt


os.environ["PYTHON_DOTENV_DISABLED"] = "1"
os.environ["DATABASE_URL"] = "postgresql://audit:audit@127.0.0.1:1/audit"
os.environ["SECRET_KEY"] = "local-audit-secret-key"
os.environ["AUTO_CREATE_TABLES"] = "false"
for variable in (
    "OSS_ACCESS_KEY_ID",
    "OSS_ACCESS_KEY_SECRET",
    "OSS_BUCKET_NAME",
    "OSS_ENDPOINT",
    "OSS_CUSTOM_DOMAIN",
    "OSS_PREFIX",
):
    os.environ.pop(variable, None)

from app.api import upload  # noqa: E402
from app.config import ALGORITHM, SECRET_KEY  # noqa: E402
from app.deps import get_current_user  # noqa: E402
from app.main import app  # noqa: E402


def find_route(path: str, method: str):
    return next(
        route
        for route in app.routes
        if getattr(route, "path", None) == path
        and method in getattr(route, "methods", set())
    )


def route_depends_on(route, dependency) -> bool:
    return any(item.call is dependency for item in route.dependant.dependencies)


class RunnableBaselineTests(unittest.TestCase):
    def test_lifespan_does_not_create_tables_by_default(self):
        with patch("app.main.init_db") as init_db:
            with TestClient(app) as client:
                self.assertEqual(client.get("/api/health").status_code, 200)
            init_db.assert_not_called()

    def test_liveness_does_not_check_external_services(self):
        with TestClient(app) as client:
            response = client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_readiness_returns_503_without_exposing_connection_details(self):
        with patch(
            "app.main.check_database_connection",
            side_effect=RuntimeError("postgresql://user:password@example/database"),
        ):
            with TestClient(app) as client:
                response = client.get("/api/health/ready")

        self.assertEqual(response.status_code, 503)
        body = response.text
        self.assertNotIn("password", body)
        self.assertNotIn("postgresql://", body)

    def test_readiness_returns_200_when_database_check_passes(self):
        with patch("app.main.check_database_connection"):
            with TestClient(app) as client:
                response = client.get("/api/health/ready")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ready"})

    def test_upload_bucket_requires_complete_oss_configuration(self):
        with self.assertRaises(HTTPException) as raised:
            upload._get_bucket()

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(raised.exception.detail, "OSS storage is not configured")

    def test_management_routes_require_existing_admin_dependency(self):
        protected_routes = (
            ("/api/visitors", "GET"),
            ("/api/visitors/{visitor_id}", "DELETE"),
            ("/api/visitors", "DELETE"),
            ("/api/dashboard/stats", "GET"),
        )

        for path, method in protected_routes:
            with self.subTest(path=path, method=method):
                self.assertTrue(
                    route_depends_on(find_route(path, method), get_current_user)
                )

    def test_management_routes_return_401_without_token(self):
        protected_requests = (
            ("GET", "/api/visitors"),
            ("DELETE", "/api/visitors/1"),
            ("DELETE", "/api/visitors"),
            ("GET", "/api/dashboard/stats"),
        )

        with TestClient(app) as client:
            for method, path in protected_requests:
                with self.subTest(path=path, method=method):
                    response = client.request(method, path)
                    self.assertEqual(response.status_code, 401)

    def test_github_user_token_is_not_accepted_as_admin(self):
        token = jwt.encode(
            {"sub": "1", "login": "visitor", "type": "github"},
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials=token
        )

        with self.assertRaises(HTTPException) as raised:
            get_current_user(credentials)

        self.assertEqual(raised.exception.status_code, 403)

    def test_admin_claim_is_accepted_by_existing_dependency(self):
        token = jwt.encode(
            {"sub": "admin", "admin": True}, SECRET_KEY, algorithm=ALGORITHM
        )
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials=token
        )

        payload = get_current_user(credentials)

        self.assertTrue(payload["admin"])

    def test_public_visitor_routes_remain_without_admin_dependency(self):
        public_routes = (
            ("/api/visitors/count", "GET"),
            ("/api/visitors/location", "GET"),
            ("/api/visitors/record", "POST"),
        )

        for path, method in public_routes:
            with self.subTest(path=path, method=method):
                self.assertFalse(
                    route_depends_on(find_route(path, method), get_current_user)
                )


if __name__ == "__main__":
    unittest.main()
