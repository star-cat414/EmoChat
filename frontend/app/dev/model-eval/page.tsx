import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ModelEvaluationView } from "@/components/dev/ModelEvaluationView";
import { getCurrentUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ModelEvalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <ModelEvaluationView />
    </AppShell>
  );
}
