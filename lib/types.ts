export type TaskType = "regular" | "prayer";

export interface PlannerTask {
  id: string;
  title: string;
  order: number;
  type: TaskType;
}

export interface PlannerSection {
  id: string;
  title: string;
  order: number;
  tasks: PlannerTask[];
}

export interface PlannerCheckin {
  taskId: string;
  dayNumber: number;
  done: boolean;
}

export interface PlanResponse {
  planId: string;
  ramadanYear: number;
  dayCount: 29 | 30;
  sections: PlannerSection[];
  checkins: PlannerCheckin[];
}

export interface SessionPayload {
  userId: string;
  username: string;
}
