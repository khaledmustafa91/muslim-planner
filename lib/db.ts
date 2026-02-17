import { sql, sqlParams } from "@/lib/sql";
import { defaultSections } from "@/lib/default-plan";
import type { PlanResponse, PlannerCheckin, PlannerSection, ScheduledTask } from "@/lib/types";

export interface UserRecord {
  id: string;
  username: string;
  password_hash: string;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const result = await sql<UserRecord>`
    SELECT id, username, password_hash
    FROM users
    WHERE username = ${username}
    LIMIT 1
  `;

  return result.rows[0] ?? null;
}

export async function createUser(username: string, passwordHash: string): Promise<UserRecord> {
  const result = await sql<UserRecord>`
    INSERT INTO users (id, username, password_hash)
    VALUES (gen_random_uuid(), ${username}, ${passwordHash})
    RETURNING id, username, password_hash
  `;

  return result.rows[0];
}

async function createPlanWithDefaults(userId: string, ramadanYear: number): Promise<string> {
  const plan = await sql<{ id: string }>`
    INSERT INTO plans (id, user_id, ramadan_year, day_count)
    VALUES (gen_random_uuid(), ${userId}, ${ramadanYear}, 30)
    RETURNING id
  `;
  const planId = plan.rows[0].id;

  for (let sectionIndex = 0; sectionIndex < defaultSections.length; sectionIndex += 1) {
    const section = defaultSections[sectionIndex];
    const sectionInsert = await sql<{ id: string }>`
      INSERT INTO sections (id, plan_id, title, sort_order)
      VALUES (gen_random_uuid(), ${planId}, ${section.title}, ${sectionIndex + 1})
      RETURNING id
    `;

    const sectionId = sectionInsert.rows[0].id;
    for (let taskIndex = 0; taskIndex < section.tasks.length; taskIndex += 1) {
      const task = section.tasks[taskIndex];
      await sql`
        INSERT INTO tasks (id, section_id, title, task_type, sort_order)
        VALUES (gen_random_uuid(), ${sectionId}, ${task.title}, ${task.type ?? "regular"}, ${taskIndex + 1})
      `;
    }
  }

  return planId;
}

export async function getOrCreatePlan(userId: string, ramadanYear: number): Promise<string> {
  const existing = await sql<{ id: string }>`
    SELECT id
    FROM plans
    WHERE user_id = ${userId} AND ramadan_year = ${ramadanYear}
    LIMIT 1
  `;

  if (existing.rows[0]?.id) {
    return existing.rows[0].id;
  }

  return createPlanWithDefaults(userId, ramadanYear);
}

export async function getPlanProgress(planId: string): Promise<number> {
  const result = await sql<{ progress: number }>`
    WITH plan_stats AS (
      SELECT
        COUNT(DISTINCT t.id) AS total_tasks,
        (SELECT day_count FROM plans WHERE id = ${planId}) AS day_count
      FROM tasks t
      JOIN sections s ON s.id = t.section_id
      WHERE s.plan_id = ${planId}
    ),
    completed_stats AS (
      SELECT COUNT(*) AS completed_count
      FROM checkins c
      JOIN tasks t ON t.id = c.task_id
      JOIN sections s ON s.id = t.section_id
      WHERE s.plan_id = ${planId} AND c.done = true
    )
    SELECT
      CASE
        WHEN total_tasks = 0 OR day_count = 0 THEN 0
        ELSE ROUND((completed_count::numeric / (total_tasks * day_count) * 100)::numeric)
      END AS progress
    FROM plan_stats, completed_stats
  `;
  return result.rows[0]?.progress ?? 0;
}

export async function getPlanByYear(userId: string, ramadanYear: number): Promise<PlanResponse> {
  const planId = await getOrCreatePlan(userId, ramadanYear);

  const planRow = await sql<{ 
    day_count: 29 | 30; 
    ramadan_offset: number;
    location_city: string | null;
    location_country: string | null;
    calculation_method: number | null;
  }>`
    SELECT day_count, ramadan_offset, location_city, location_country, calculation_method
    FROM plans
    WHERE id = ${planId} AND user_id = ${userId}
    LIMIT 1
  `;

  if (!planRow.rows[0]) {
    throw new Error("Plan not found");
  }

  const sectionRows = await sql<{
    section_id: string;
    section_title: string;
    section_order: number;
    task_id: string;
    task_title: string;
    task_order: number;
    task_type: "regular" | "prayer";
  }>`
    SELECT
      s.id AS section_id,
      s.title AS section_title,
      s.sort_order AS section_order,
      t.id AS task_id,
      t.title AS task_title,
      t.sort_order AS task_order,
      t.task_type AS task_type
    FROM sections s
    LEFT JOIN tasks t ON s.id = t.section_id
    WHERE s.plan_id = ${planId}
    ORDER BY s.sort_order ASC, t.sort_order ASC
  `;

  const sectionsMap = new Map<string, PlannerSection>();
  for (const row of sectionRows.rows) {
    if (!sectionsMap.has(row.section_id)) {
      sectionsMap.set(row.section_id, {
        id: row.section_id,
        title: row.section_title,
        order: row.section_order,
        tasks: []
      });
    }

    if (row.task_id) {
      sectionsMap.get(row.section_id)?.tasks.push({
        id: row.task_id,
        title: row.task_title,
        order: row.task_order,
        type: row.task_type
      });
    }
  }

  const checkinRows = await sql<PlannerCheckin>`
    SELECT t.id AS "taskId", c.day_number AS "dayNumber", c.done
    FROM checkins c
    JOIN tasks t ON t.id = c.task_id
    JOIN sections s ON s.id = t.section_id
    WHERE s.plan_id = ${planId}
  `;

  const progress = await getPlanProgress(planId);

  const scheduledRows = await sql<ScheduledTask & { dayNumber: number }>`
    SELECT 
      ts.id, 
      ts.task_id AS "taskId", 
      t.title, 
      s.title AS "sectionTitle", 
      ts.scheduled_time AS "scheduledTime",
      ts.day_number AS "dayNumber",
      ts.duration_minutes AS "durationMinutes",
      COALESCE(c.done, false) AS done
    FROM task_schedules ts
    JOIN tasks t ON t.id = ts.task_id
    JOIN sections s ON s.id = t.section_id
    LEFT JOIN checkins c ON c.task_id = t.id AND c.day_number = ts.day_number
    WHERE s.plan_id = ${planId}
    ORDER BY ts.scheduled_time ASC
  `;

  return {
    planId,
    ramadanYear,
    dayCount: planRow.rows[0].day_count,
    ramadanOffset: planRow.rows[0].ramadan_offset,
    locationCity: planRow.rows[0].location_city ?? undefined,
    locationCountry: planRow.rows[0].location_country ?? undefined,
    calculationMethod: planRow.rows[0].calculation_method ?? undefined,
    sections: [...sectionsMap.values()],
    checkins: checkinRows.rows,
    progress,
    scheduledTasks: scheduledRows.rows
  };
}

export async function scheduleTask(taskId: string, dayNumber: number, scheduledTime: string, durationMinutes: number = 30): Promise<void> {
  await sql`
    INSERT INTO task_schedules (id, task_id, day_number, scheduled_time, duration_minutes)
    VALUES (gen_random_uuid(), ${taskId}, ${dayNumber}, ${scheduledTime}, ${durationMinutes})
    ON CONFLICT (task_id, day_number)
    DO UPDATE SET scheduled_time = EXCLUDED.scheduled_time, duration_minutes = EXCLUDED.duration_minutes
  `;
}

export async function scheduleTasksBatch(
  rows: { taskId: string; dayNumber: number; time: string; duration: number }[]
): Promise<void> {
  if (rows.length === 0) return;

  const valuePlaceholders = rows.map((_, i) => {
    const base = i * 4;
    return `(gen_random_uuid(), $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
  }).join(", ");

  const params = rows.flatMap(r => [r.taskId, r.dayNumber, r.time, r.duration]);

  await sqlParams(
    `INSERT INTO task_schedules (id, task_id, day_number, scheduled_time, duration_minutes)
     VALUES ${valuePlaceholders}
     ON CONFLICT (task_id, day_number)
     DO UPDATE SET scheduled_time = EXCLUDED.scheduled_time, duration_minutes = EXCLUDED.duration_minutes`,
    params
  );
}

export async function deleteScheduledTask(scheduledId: string): Promise<void> {
  await sql`DELETE FROM task_schedules WHERE id = ${scheduledId}`;
}

export async function updateTaskSchedule(id: string, time?: string, duration?: number): Promise<void> {
  if (time !== undefined && duration !== undefined) {
    await sql`UPDATE task_schedules SET scheduled_time = ${time}, duration_minutes = ${duration} WHERE id = ${id}`;
  } else if (time !== undefined) {
    await sql`UPDATE task_schedules SET scheduled_time = ${time} WHERE id = ${id}`;
  } else if (duration !== undefined) {
    await sql`UPDATE task_schedules SET duration_minutes = ${duration} WHERE id = ${id}`;
  }
}

export async function assertScheduledTaskOwnership(scheduledId: string, userId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1
    FROM task_schedules ts
    JOIN tasks t ON t.id = ts.task_id
    JOIN sections s ON s.id = t.section_id
    JOIN plans p ON p.id = s.plan_id
    WHERE ts.id = ${scheduledId} AND p.user_id = ${userId}
    LIMIT 1
  `;
  return result.rowCount > 0;
}

export async function assertPlanOwnership(planId: string, userId: string): Promise<boolean> {
  const owned = await sql`
    SELECT 1
    FROM plans
    WHERE id = ${planId} AND user_id = ${userId}
    LIMIT 1
  `;
  return owned.rowCount > 0;
}

export async function createSection(planId: string, title: string): Promise<{ id: string; order: number }> {
  const nextOrder = await sql<{ next_order: number }>`
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order
    FROM sections
    WHERE plan_id = ${planId}
  `;

  const result = await sql<{ id: string; sort_order: number }>`
    INSERT INTO sections (id, plan_id, title, sort_order)
    VALUES (gen_random_uuid(), ${planId}, ${title}, ${nextOrder.rows[0].next_order})
    RETURNING id, sort_order
  `;

  return { id: result.rows[0].id, order: result.rows[0].sort_order };
}

export async function updateSection(sectionId: string, title?: string, order?: number): Promise<void> {
  if (title !== undefined && order !== undefined) {
    await sql`UPDATE sections SET title = ${title}, sort_order = ${order} WHERE id = ${sectionId}`;
    return;
  }
  if (title !== undefined) {
    await sql`UPDATE sections SET title = ${title} WHERE id = ${sectionId}`;
    return;
  }
  if (order !== undefined) {
    await sql`UPDATE sections SET sort_order = ${order} WHERE id = ${sectionId}`;
  }
}

export async function deleteSection(sectionId: string): Promise<void> {
  await sql`DELETE FROM sections WHERE id = ${sectionId}`;
}

export async function assertSectionOwnership(sectionId: string, userId: string): Promise<{ planId: string } | null> {
  const result = await sql<{ plan_id: string }>`
    SELECT s.plan_id
    FROM sections s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.id = ${sectionId} AND p.user_id = ${userId}
    LIMIT 1
  `;

  if (!result.rows[0]) {
    return null;
  }
  return { planId: result.rows[0].plan_id };
}

export async function createTask(sectionId: string, title: string, type: "regular" | "prayer" = "regular") {
  const nextOrder = await sql<{ next_order: number }>`
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order
    FROM tasks
    WHERE section_id = ${sectionId}
  `;

  const result = await sql<{ id: string; sort_order: number }>`
    INSERT INTO tasks (id, section_id, title, task_type, sort_order)
    VALUES (gen_random_uuid(), ${sectionId}, ${title}, ${type}, ${nextOrder.rows[0].next_order})
    RETURNING id, sort_order
  `;

  return { id: result.rows[0].id, order: result.rows[0].sort_order };
}

export async function assertTaskOwnership(taskId: string, userId: string): Promise<{ sectionId: string; planId: string } | null> {
  const result = await sql<{ section_id: string; plan_id: string }>`
    SELECT t.section_id, s.plan_id
    FROM tasks t
    JOIN sections s ON s.id = t.section_id
    JOIN plans p ON p.id = s.plan_id
    WHERE t.id = ${taskId} AND p.user_id = ${userId}
    LIMIT 1
  `;

  if (!result.rows[0]) {
    return null;
  }

  return { sectionId: result.rows[0].section_id, planId: result.rows[0].plan_id };
}

export async function updateTask(taskId: string, data: { title?: string; order?: number; sectionId?: string }): Promise<void> {
  const { title, order, sectionId } = data;
  if (title !== undefined && order !== undefined && sectionId !== undefined) {
    await sql`UPDATE tasks SET title = ${title}, sort_order = ${order}, section_id = ${sectionId} WHERE id = ${taskId}`;
    return;
  }
  if (title !== undefined && order !== undefined) {
    await sql`UPDATE tasks SET title = ${title}, sort_order = ${order} WHERE id = ${taskId}`;
    return;
  }
  if (title !== undefined && sectionId !== undefined) {
    await sql`UPDATE tasks SET title = ${title}, section_id = ${sectionId} WHERE id = ${taskId}`;
    return;
  }
  if (order !== undefined && sectionId !== undefined) {
    await sql`UPDATE tasks SET sort_order = ${order}, section_id = ${sectionId} WHERE id = ${taskId}`;
    return;
  }
  if (title !== undefined) {
    await sql`UPDATE tasks SET title = ${title} WHERE id = ${taskId}`;
    return;
  }
  if (order !== undefined) {
    await sql`UPDATE tasks SET sort_order = ${order} WHERE id = ${taskId}`;
    return;
  }
  if (sectionId !== undefined) {
    await sql`UPDATE tasks SET section_id = ${sectionId} WHERE id = ${taskId}`;
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  await sql`DELETE FROM tasks WHERE id = ${taskId}`;
}

export async function toggleCheckin(taskId: string, dayNumber: number, done: boolean): Promise<void> {
  await sql`
    INSERT INTO checkins (id, task_id, day_number, done)
    VALUES (gen_random_uuid(), ${taskId}, ${dayNumber}, ${done})
    ON CONFLICT (task_id, day_number)
    DO UPDATE SET done = EXCLUDED.done, updated_at = NOW()
  `;
}

export async function updatePlanDayCount(planId: string, dayCount: 29 | 30): Promise<void> {
  await sql`UPDATE plans SET day_count = ${dayCount} WHERE id = ${planId}`;
}

export async function updatePlanOffset(planId: string, offset: number): Promise<void> {
  await sql`UPDATE plans SET ramadan_offset = ${offset} WHERE id = ${planId}`;
}

export async function updatePlanLocation(planId: string, city: string, country: string, method: number): Promise<void> {
  await sql`
    UPDATE plans 
    SET location_city = ${city}, location_country = ${country}, calculation_method = ${method} 
    WHERE id = ${planId}
  `;
}

export async function reorderSections(planId: string, sectionIds: string[]): Promise<void> {
  // Update all sections in a single transaction-like sequence
  // We use a loop here because our sql helper doesn't support transactions yet, 
  // but since we are in a serverless environment, it's efficient enough.
  for (let i = 0; i < sectionIds.length; i++) {
    await sql`
      UPDATE sections 
      SET sort_order = ${i + 1} 
      WHERE id = ${sectionIds[i]} AND plan_id = ${planId}
    `;
  }
}

export async function reorderTasks(sectionId: string, taskIds: string[]): Promise<void> {
  for (let i = 0; i < taskIds.length; i++) {
    await sql`
      UPDATE tasks 
      SET sort_order = ${i + 1}, section_id = ${sectionId}
      WHERE id = ${taskIds[i]}
    `;
  }
}
