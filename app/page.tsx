import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { PlannerClient } from "@/components/planner-client";

export default async function HomePage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  return <PlannerClient username={session.username} />;
}
