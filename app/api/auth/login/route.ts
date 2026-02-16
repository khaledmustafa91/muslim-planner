import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { badRequest, normalizeUsername, validateCredentials } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = body?.username;
  const password = body?.password;

  const validationError = validateCredentials(username, password);
  if (validationError) {
    return badRequest(validationError);
  }

  const normalizedUsername = normalizeUsername(username);
  const user = await findUserByUsername(normalizedUsername);
  if (!user) {
    return badRequest("بيانات الدخول غير صحيحة", 401);
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    return badRequest("بيانات الدخول غير صحيحة", 401);
  }

  await setSessionCookie({ userId: user.id, username: user.username });
  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username } });
}
