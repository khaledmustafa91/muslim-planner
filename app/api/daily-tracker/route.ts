import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";
import { scheduleTask, createTask, assertSectionOwnership, assertTaskOwnership, deleteScheduledTask, assertScheduledTaskOwnership } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return badRequest("غير مصرح", 401);

  const body = await request.json().catch(() => ({}));
  const { taskId, sectionId, title, dayNumber, time } = body;

  if (!dayNumber || !time) return badRequest("البيانات ناقصة");

  try {
    let finalTaskId = taskId;

    // If no taskId, we're creating a new task
    if (!taskId) {
      if (!sectionId || !title) return badRequest("يجب اختيار القسم واسم المهمة");
      
      const ownership = await assertSectionOwnership(sectionId, session.userId);
      if (!ownership) return badRequest("غير مصرح", 403);

      const newTask = await createTask(sectionId, title);
      finalTaskId = newTask.id;
    } else {
      const ownership = await assertTaskOwnership(taskId, session.userId);
      if (!ownership) return badRequest("غير مصرح", 403);
    }

    await scheduleTask(finalTaskId, dayNumber, time);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TRACKER_POST_ERROR]", error);
    return badRequest("تعذر حفظ المهمة");
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return badRequest("غير مصرح", 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return badRequest("معرف غير صالح");

  try {
    const owned = await assertScheduledTaskOwnership(id, session.userId);
    if (!owned) return badRequest("غير مصرح", 403);

    await deleteScheduledTask(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TRACKER_DELETE_ERROR]", error);
    return badRequest("تعذر حذف المهمة");
  }
}
