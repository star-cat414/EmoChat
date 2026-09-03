import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { signupSendOtp, signupVerifyOtp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "details" | "verify";

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSendCode = async () => {
    setError(null);
    setSubmitting(true);
    const res = await signupSendOtp(email, username, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setStep("verify");
  };

  const onVerify = async () => {
    setError(null);
    setSubmitting(true);
    const res = await signupVerifyOtp(email, code, username, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.replace("/(tabs)");
  };

  const validDetails = email && username && password.length >= 6;

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
          <Link href="/(auth)/login" className="mb-6 flex-row items-center self-start">
            <ArrowLeft size={20} color="#6366f1" />
            <Text className="ml-1 text-sm font-medium text-primary">Back</Text>
          </Link>

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
              Create your account.
            </Text>
          </View>

          {step === "details" ? (
            <>
              <Text className="mb-6 text-xl font-semibold text-foreground">
                Sign up
              </Text>
              <Input
                label="Username"
                placeholder="emochat_fan"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
              />
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
                placeholder="At least 6 characters"
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
                disabled={!validDetails}
                onPress={onSendCode}
              >
                Send verification code
              </Button>
            </>
          ) : (
            <>
              <Text className="mb-2 text-xl font-semibold text-foreground">
                Verify your email
              </Text>
              <Text className="mb-6 text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <Text className="font-medium text-foreground">{email}</Text>. Enter
                it below to finish creating your account.
              </Text>
              <Input
                label="Verification code"
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              {error ? (
                <Text className="mb-3 text-sm text-destructive">{error}</Text>
              ) : null}
              <Button
                size="lg"
                full
                loading={submitting}
                disabled={code.length !== 6}
                onPress={onVerify}
              >
                Verify & create account
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 self-center"
                onPress={() => setStep("details")}
              >
                Change details
              </Button>
            </>
          )}

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/(auth)/login" className="font-semibold text-primary">
                Sign in
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
