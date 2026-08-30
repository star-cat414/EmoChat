import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { getCurrentUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <PageHeader
          title="Settings"
          subtitle="Manage your account, notifications and privacy"
        />
        <SettingsPanel user={user} />
      </div>
    </AppShell>
  );
}
