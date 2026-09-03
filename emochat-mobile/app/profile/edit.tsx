import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Image as ImageIcon } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/lib/useProfile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const ext = asset.uri.split(".").pop() || "jpg";
    const uid = user?.id ?? "anon";
    const path = `${uid}/avatar-${Date.now()}.${ext}`;
    const mime = asset.mimeType ?? "image/jpeg";

    const { data } = await supabase.storage
      .from("avatars")
      .upload(path, { uri: asset.uri, name: path, type: mime } as unknown as Blob, {
        contentType: mime,
        upsert: true,
      });
    if (!data) return;
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", uid);
    router.replace("/(tabs)/profile");
  };

  const onSave = async () => {
    const uid = user?.id ?? "";
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
      setError("Username must be 3-24 chars (letters, numbers, underscore)");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({ username: username.trim(), bio: bio.trim() || null })
      .eq("id", uid);
    setSaving(false);
    if (err) {
      setError("That username is already taken. Try another.");
      return;
    }
    router.replace("/(tabs)/profile");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center gap-3 border-b border-border bg-card px-3 py-3">
          <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-lg">
            <ArrowLeft size={20} color="#0f172a" />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-foreground">Edit profile</Text>
        </View>

        <ScrollView contentContainerClassName="p-4">
          <View className="mb-6 items-center">
            <View className="relative">
              <Avatar src={profile?.avatar_url} username={profile?.username} size="lg" />
              <Pressable
                onPress={pickAvatar}
                className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-primary"
              >
                <ImageIcon size={14} color="#fff" />
              </Pressable>
            </View>
            <Text className="mt-2 text-xs text-muted-foreground">Tap to change photo</Text>
          </View>

          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            inputClassName="h-24 pt-3"
            placeholder="Tell people a little about yourself"
          />

          {error ? <Text className="mb-3 text-sm text-destructive">{error}</Text> : null}

          <Button size="lg" full loading={saving} onPress={onSave}>
            Save changes
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
