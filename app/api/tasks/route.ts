import { NextRequest, NextResponse } from "next/server";
import { assertSectionOwnership, createTask } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  const body = await request.json().catch(() => null);
  const sectionId = body?.sectionId;
  const title = body?.title;
  const type = body?.type === "prayer" ? "prayer" : "regular";

  if (typeof sectionId !== "string" || typeof title !== "string" || !title.trim()) {
    return badRequest("بيانات المهمة غير صالحة");
  }

  const ownership = await assertSectionOwnership(sectionId, session.userId);
  if (!ownership) {
    return badRequest("غير مصرح", 403);
  }

  const task = await createTask(sectionId, title.trim(), type);
  return NextResponse.json({ ok: true, task });
}
