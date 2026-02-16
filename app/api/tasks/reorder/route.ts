import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { assertSectionOwnership, reorderTasks } from "@/lib/db";
import { badRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return badRequest("غير مصرح", 401);

  const body = await request.json().catch(() => null);
  const { sectionId, taskIds } = body || {};

  if (!sectionId || !Array.isArray(taskIds)) {
    return badRequest("بيانات غير صالحة");
  }

  const ownership = await assertSectionOwnership(sectionId, session.userId);
  if (!ownership) return badRequest("غير مصرح", 403);

  await reorderTasks(sectionId, taskIds);
  return NextResponse.json({ ok: true });
}
