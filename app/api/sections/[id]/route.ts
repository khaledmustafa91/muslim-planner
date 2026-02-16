import { NextRequest, NextResponse } from "next/server";
import { assertSectionOwnership, deleteSection, updateSection } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";

interface Context {
  params: { id: string };
}

export async function PATCH(request: NextRequest, context: Context) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  const { id } = context.params;
  const ownership = await assertSectionOwnership(id, session.userId);
  if (!ownership) {
    return badRequest("غير مصرح", 403);
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : undefined;
  const order = Number.isInteger(body?.order) ? body.order : undefined;

  if (title === undefined && order === undefined) {
    return badRequest("لا توجد تغييرات");
  }

  await updateSection(id, title, order);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await getSessionFromCookies();
  if (!session) {
    return badRequest("غير مصرح", 401);
  }

  const { id } = context.params;
  const ownership = await assertSectionOwnership(id, session.userId);
  if (!ownership) {
    return badRequest("غير مصرح", 403);
  }

  await deleteSection(id);
  return NextResponse.json({ ok: true });
}
