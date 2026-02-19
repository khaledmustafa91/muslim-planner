import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";
import {
    createTask,
    assertSectionOwnership,
    assertTaskOwnership,
    scheduleTasksBatch,
    assertPlanOwnership
} from "@/lib/db";
import { getRamadanDays } from "@/lib/date-utils";
import { sql } from "@/lib/sql";

export async function POST(request: NextRequest) {
    const session = await getSessionFromCookies();
    if (!session) return badRequest("غير مصرح", 401);

    const body = await request.json().catch(() => ({}));
    const {
        planId,
        year,
        taskId,
        sectionId,
        title,
        scheduleType,
        selectedDate, // this is dayNumber or Date string? Frontend sends dayNumber usually or date string
        selectedDayOfWeek,
        time,
        duration
    } = body;

    if (!planId || !year || !time) return badRequest("البيانات ناقصة");

    try {
        // 1. Verify Plan Ownership & Get Offset
        const planResult = await sql<{ ramadan_offset: number }>`
      SELECT ramadan_offset 
      FROM plans 
      WHERE id = ${planId} AND user_id = ${session.userId} 
      LIMIT 1
    `;

        if (!planResult.rows[0]) return badRequest("الخطة غير موجودة", 404);
        const offset = planResult.rows[0].ramadan_offset;

        // 2. Handle Task Creation/Verification
        let finalTaskId = taskId;

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

        // 3. Calculate Days
        const days = getRamadanDays(year, offset);
        const daysToSchedule: number[] = [];

        if (scheduleType === "once") {
            // selectedDate might be dayNumber (number) or date string
            // Frontend PlannerClient sends: selectedDate: trackerForm.selectedDate || selectedDay
            // selectedDay is int (1-30).
            // So let's assume it's the day number.
            const dayNum = Number(selectedDate);
            if (dayNum >= 1 && dayNum <= 30) {
                daysToSchedule.push(dayNum);
            }
        } else if (scheduleType === "daily") {
            // All days
            days.forEach(d => daysToSchedule.push(d.dayNumber));
        } else if (scheduleType === "weekly") {
            // Filter by day of week
            const targetDay = Number(selectedDayOfWeek); // 0-6
            days.forEach(d => {
                if (d.gregorianDate.getDay() === targetDay) {
                    daysToSchedule.push(d.dayNumber);
                }
            });
        }

        // 4. Batch Insert
        const rows = daysToSchedule.map(dayNum => ({
            taskId: finalTaskId,
            dayNumber: dayNum,
            time,
            duration: duration || 30
        }));

        await scheduleTasksBatch(rows);

        return NextResponse.json({
            ok: true,
            count: rows.length,
            taskId: finalTaskId
        });

    } catch (error) {
        console.error("[SCHEDULE_RECURRING_ERROR]", error);
        return badRequest("تعذر جدولة المهام");
    }
}
