import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByUsername } from "@/lib/db";
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
  const existing = await findUserByUsername(normalizedUsername);
  if (existing) {
    return badRequest("اسم المستخدم مستخدم بالفعل", 409);
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await createUser(normalizedUsername, hash);

  await setSessionCookie({ userId: user.id, username: user.username });
  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username } });
}
