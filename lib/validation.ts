import { NextResponse } from "next/server";

export function validateCredentials(username: unknown, password: unknown): string | null {
  if (typeof username !== "string" || typeof password !== "string") {
    return "بيانات الدخول غير صحيحة";
  }

  const normalized = username.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 32) {
    return "اسم المستخدم يجب أن يكون بين 3 و 32 حرفًا";
  }

  if (password.length < 6 || password.length > 20) {
    return "كلمة المرور يجب أن تكون بين 6 و 20 حرفًا";
  }

  return null;
}

export function validateUsernameFormat(username: string): string | null {
  if (!/^[^\u0600-\u06FF\s]+$/.test(username.trim())) {
    return "اسم المستخدم يجب أن يحتوي على حروف إنجليزية أو رموز بدون مسافات أو حروف عربية";
  }
  return null;
}

export function badRequest(message: string, status = 400) {
  console.warn(`[BadRequest] ${status}: ${message}`);
  return NextResponse.json({ error: message }, { status });
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
