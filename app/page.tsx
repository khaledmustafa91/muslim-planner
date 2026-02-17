import { getSessionFromCookies } from "@/lib/auth";
import { PlannerClient } from "@/components/planner-client";
import { LandingPage } from "@/components/landing-page";

export default async function HomePage() {
  const session = await getSessionFromCookies();
  
  if (!session) {
    return <LandingPage />;
  }

  return <PlannerClient username={session.username} />;
}
