import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { assertPlanOwnership } from "@/lib/db";
import { sql } from "@/lib/sql";
import { badRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("بيانات غير صحيحة");
  }

  const { planId } = body;
  if (!planId || typeof planId !== "string") {
    return badRequest("معرف الخطة مطلوب");
  }

  // Verify user owns this plan
  const ownership = await assertPlanOwnership(planId, session.userId);
  if (!ownership) {
    return badRequest("غير مصرح", 403);
  }

  // Bulk delete all checkins for this plan in a single query
  await sql`
    DELETE FROM checkins
    WHERE task_id IN (
      SELECT t.id
      FROM tasks t
      JOIN sections s ON s.id = t.section_id
      WHERE s.plan_id = ${planId}
    )
  `;

  return NextResponse.json({ ok: true });
}
