from sqlalchemy import text
from sqlmodel import SQLModel, create_engine, Session
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)


def init_db():
    SQLModel.metadata.create_all(engine)


def check_database_connection():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def get_session():
    with Session(engine) as session:
        yield session
