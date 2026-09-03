import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onLogin = async () => {
    setError(null);
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 items-center">
            <LinearGradient
              colors={["#6366f1", "#8b5cf6", "#d946ef"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="mb-4 h-16 w-16 items-center justify-center rounded-3xl"
            >
              <Text className="text-3xl">💬</Text>
            </LinearGradient>
            <Text className="text-3xl font-bold">
              <Text className="text-primary">Emo</Text>
              <Text className="text-fuchsia-500">Chat</Text>
            </Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Chat that understands how you feel.
            </Text>
          </View>

          <Text className="mb-6 text-xl font-semibold text-foreground">Sign in</Text>

          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <Text className="mb-3 text-sm text-destructive">{error}</Text>
          ) : null}

          <Button
            size="lg"
            full
            loading={submitting}
            onPress={onLogin}
            disabled={!email || !password}
          >
            Sign in
          </Button>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-muted-foreground">
              No account yet?{" "}
              <Link href="/(auth)/register" className="font-semibold text-primary">
                Create one
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
