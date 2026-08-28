import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { MyEmotionDashboard } from "@/components/analytics/MyEmotionDashboard";
import { getCurrentUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <MyEmotionDashboard currentUserId={user.id} />
    </AppShell>
  );
}
