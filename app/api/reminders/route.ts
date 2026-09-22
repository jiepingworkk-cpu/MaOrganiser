import { NextResponse } from "next/server";
import {
  sendAllReminders,
  sendUserReminders,
  verifyIdToken,
} from "~/lib/server";

export const runtime = "nodejs";

/**
 * GET  — สำหรับ Vercel Cron (ลบ / ยิง manual) ส่งเตือน deadline ให้ทุกผู้ใช้
 * POST — ส่ง push ทดสอบให้ผู้ใช้ที่ส่ง id token มา
 */
export async function GET(req: Request) {
  const secret =
    req.headers.get("x-cron-secret") ??
    new URL(req.url).searchParams.get("secret");
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }
  const res = await sendAllReminders();
  return NextResponse.json(res);
}

export async function POST(req: Request) {
  let token = "";
  try {
    const body = (await req.json()) as { token?: string };
    token = body.token ?? "";
  } catch {
    token = "";
  }
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "missing token" },
      { status: 400 }
    );
  }
  const decoded = await verifyIdToken(token);
  if (!decoded) {
    return NextResponse.json(
      { ok: false, message: "invalid token" },
      { status: 401 }
    );
  }
  const res = await sendUserReminders(decoded.uid, true);
  return NextResponse.json(res);
}