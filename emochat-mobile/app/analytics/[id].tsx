import { useLocalSearchParams } from "expo-router";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default function ConversationAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AnalyticsView
      title="Conversation mood"
      query={{ type: "conversation", id: id ?? "" }}
    />
  );
}
