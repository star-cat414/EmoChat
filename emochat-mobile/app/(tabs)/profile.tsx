import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { LogOut, BarChart3, Pencil } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/lib/useProfile";
import { logout } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id ?? "");
  const [signingOut, setSigningOut] = useState(false);

  const onLogout = async () => {
    setSigningOut(true);
    await logout();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="p-4">
        <View className="items-center py-6">
          <Avatar
            src={profile?.avatar_url}
            username={profile?.username}
            size="lg"
          />
          <Text className="mt-3 text-xl font-bold text-foreground">
            {profile?.username ?? "Unknown"}
          </Text>
          {profile?.email ? (
            <Text className="mt-0.5 text-sm text-muted-foreground">
              {profile.email}
            </Text>
          ) : null}
          {profile?.bio ? (
            <Text className="mt-2 text-center text-sm text-foreground">
              {profile.bio}
            </Text>
          ) : null}
        </View>

        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <Link href="/profile/edit" asChild>
            <Pressable className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted">
              <Pencil size={18} color="#6366f1" />
              <Text className="flex-1 text-[15px] text-foreground">Edit profile</Text>
            </Pressable>
          </Link>
          <View className="h-px bg-border" />
          <Link href="/analytics" asChild>
            <Pressable className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted">
              <BarChart3 size={18} color="#6366f1" />
              <Text className="flex-1 text-[15px] text-foreground">My emotion dashboard</Text>
            </Pressable>
          </Link>
        </View>

        <View className="mt-6 items-center">
          <Pressable
            onPress={onLogout}
            disabled={signingOut}
            className="h-11 flex-row items-center justify-center gap-2 self-stretch rounded-xl border border-border bg-card"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="font-medium text-destructive">
              {signingOut ? "Signing out…" : "Sign out"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
