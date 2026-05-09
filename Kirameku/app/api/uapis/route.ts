import { NextRequest, NextResponse } from "next/server";

const BASE = "https://uapis.cn/api/v1";

function getTargetUrl(req: NextRequest) {
  const subPath = req.nextUrl.searchParams.get("path");
  if (!subPath) return null;
  const params = new URLSearchParams(req.nextUrl.searchParams);
  params.delete("path");
  const qs = params.toString();
  return `${BASE}/${subPath}${qs ? `?${qs}` : ""}`;
}

export async function GET(req: NextRequest) {
  const url = getTargetUrl(req);
  if (!url) return NextResponse.json({ message: "Missing 'path' parameter." }, { status: 400 });
  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "请求外部API失败" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const url = getTargetUrl(req);
  if (!url) return NextResponse.json({ message: "Missing 'path' parameter." }, { status: 400 });
  try {
    const body = await req.json();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "请求外部API失败" }, { status: 502 });
  }
}
