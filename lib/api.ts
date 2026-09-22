"use client";

export interface ApiResult {
  ok: boolean;
  sent?: number;
  message?: string;
}

/** ส่ง push ทดสอบไปยังอุปกรณ์ของผู้ใช้ (ฝั่ง server อ่าน id token) */
export async function sendTestPush(idToken: string): Promise<ApiResult> {
  try {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken }),
    });
    const data = (await res.json()) as ApiResult;
    return data;
  } catch {
    return { ok: false, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" };
  }
}