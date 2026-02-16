import { NextRequest, NextResponse } from "next/server";
import { assertPlanOwnership, createSection } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  const body = await request.json().catch(() => null);
  const planId = body?.planId;
  const title = body?.title;

  if (typeof planId !== "string" || typeof title !== "string" || !title.trim()) {
    return badRequest("بيانات القسم غير صالحة");
  }

  const ownsPlan = await assertPlanOwnership(planId, session.userId);
  if (!ownsPlan) {
    return badRequest("غير مصرح", 403);
  }

  const section = await createSection(planId, title.trim());
  return NextResponse.json({ ok: true, section });
}
