import { useAuth } from "@/lib/useAuth";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default function AnalyticsScreen() {
  const { user } = useAuth();
  return (
    <AnalyticsView title="My emotion dashboard" query={{ type: "user", id: user?.id ?? "" }} />
  );
}
