import { NextResponse } from "next/server";

export function validateCredentials(username: unknown, password: unknown): string | null {
  if (typeof username !== "string" || typeof password !== "string") {
    return "بيانات الدخول غير صحيحة";
  }

  const normalized = username.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 32) {
    return "اسم المستخدم يجب أن يكون بين 3 و 32 حرفًا";
  }

  if (password.length < 6 || password.length > 72) {
    return "كلمة المرور يجب أن تكون بين 6 و 72 حرفًا";
  }

  return null;
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
