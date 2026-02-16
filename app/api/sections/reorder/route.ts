import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { assertPlanOwnership, reorderSections } from "@/lib/db";
import { badRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return badRequest("غير مصرح", 401);

  const body = await request.json().catch(() => null);
  const { planId, sectionIds } = body || {};

  if (!planId || !Array.isArray(sectionIds)) {
    return badRequest("بيانات غير صالحة");
  }

  const ownsPlan = await assertPlanOwnership(planId, session.userId);
  if (!ownsPlan) return badRequest("غير مصرح", 403);

  await reorderSections(planId, sectionIds);
  return NextResponse.json({ ok: true });
}
