import { NextRequest, NextResponse } from "next/server";
import { assertPlanOwnership, updatePlanDayCount } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  const body = await request.json().catch(() => null);
  const planId = body?.planId;
  const dayCount = Number(body?.dayCount);

  if (typeof planId !== "string" || (dayCount !== 29 && dayCount !== 30)) {
    return badRequest("بيانات الأيام غير صالحة");
  }

  const ownsPlan = await assertPlanOwnership(planId, session.userId);
  if (!ownsPlan) {
    return badRequest("غير مصرح", 403);
  }

  await updatePlanDayCount(planId, dayCount);
  return NextResponse.json({ ok: true });
}
