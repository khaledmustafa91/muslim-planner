import { NextRequest, NextResponse } from "next/server";
import { assertTaskOwnership, toggleCheckin } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  const body = await request.json().catch(() => null);
  const taskId = body?.taskId;
  const dayNumber = Number(body?.dayNumber);
  const done = Boolean(body?.done);

  if (typeof taskId !== "string" || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 30) {
    return badRequest("بيانات المتابعة غير صالحة");
  }

  const ownership = await assertTaskOwnership(taskId, session.userId);
  if (!ownership) {
    return badRequest("غير مصرح", 403);
  }

  await toggleCheckin(taskId, dayNumber, done);
  return NextResponse.json({ ok: true });
}
