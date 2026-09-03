import { forwardRef } from "react";
import {
  TextInput,
  Text,
  View,
  type TextInputProps,
} from "react-native";

import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  className?: string;
  inputClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, inputClassName, ...props },
  ref
) {
  return (
    <View className={cn("mb-4", className)}>
      {label ? (
        <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#94a3b8"
        className={cn(
          "h-12 rounded-xl border border-border bg-card px-4 text-[15px] text-foreground",
          error ? "border-destructive" : "focus:border-primary",
          inputClassName
        )}
        {...props}
      />
      {error ? (
        <Text className="mt-1 text-xs text-destructive">{error}</Text>
      ) : null}
    </View>
  );
});
