import { NextRequest, NextResponse } from "next/server";
import { getPlanByYear, getOrCreatePlan } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";

function getRequestedYear(rawYear: string | null): number {
  const currentYear = new Date().getFullYear();
  const parsed = Number(rawYear ?? currentYear);
  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 3000) {
    throw new Error("عام غير صالح");
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  try {
    const year = getRequestedYear(request.nextUrl.searchParams.get("year"));
    const plan = await getPlanByYear(session.userId, year);
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }
    return badRequest("تعذر تحميل الخطة", 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  const body = await request.json().catch(() => null);
  const year = Number(body?.year ?? new Date().getFullYear());
  if (!Number.isInteger(year) || year < 2000 || year > 3000) {
    return badRequest("عام غير صالح");
  }

  const planId = await getOrCreatePlan(session.userId, year);
  return NextResponse.json({ ok: true, planId });
}
