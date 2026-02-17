import { NextRequest, NextResponse } from "next/server";
import { assertPlanOwnership, updatePlanDayCount, updatePlanOffset, updatePlanLocation } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  const body = await request.json().catch(() => null);
  const planId = body?.planId;
  const dayCount = body?.dayCount !== undefined ? Number(body.dayCount) : undefined;
  const ramadanOffset = body?.ramadanOffset !== undefined ? Number(body.ramadanOffset) : undefined;
  const locationCity = body?.locationCity;
  const locationCountry = body?.locationCountry;
  const calculationMethod = body?.calculationMethod !== undefined ? Number(body.calculationMethod) : undefined;

  if (typeof planId !== "string") {
    return badRequest("معرف الخطة مطلوب");
  }

  const ownsPlan = await assertPlanOwnership(planId, session.userId);
  if (!ownsPlan) {
    return badRequest("غير مصرح", 403);
  }

  if (dayCount !== undefined) {
    if (dayCount !== 29 && dayCount !== 30) return badRequest("عدد الأيام غير صالح");
    await updatePlanDayCount(planId, dayCount);
  }

  if (ramadanOffset !== undefined) {
    if (isNaN(ramadanOffset)) return badRequest("الإزاحة غير صالحة");
    await updatePlanOffset(planId, ramadanOffset);
  }

  if (locationCity !== undefined && locationCountry !== undefined && calculationMethod !== undefined) {
    await updatePlanLocation(planId, locationCity, locationCountry, calculationMethod);
  }

  return NextResponse.json({ ok: true });
}
