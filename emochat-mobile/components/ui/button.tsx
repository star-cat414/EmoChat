import { forwardRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends PressableProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 rounded-lg",
  md: "h-11 px-4 rounded-xl",
  lg: "h-12 px-5 rounded-xl",
};

const sizeText: Record<Size, string> = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
};

export const Button = forwardRef<any, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, full, className, textClassName, disabled, children, style, ...props },
  ref
) {
  const base = cn("items-center justify-center flex-row gap-2", sizeClasses[size], full && "w-full");
  const disabledState = disabled || loading;

  if (variant === "primary") {
    return (
      <Pressable
        ref={ref}
        disabled={disabledState}
        className={cn(base, disabledState && "opacity-50", className)}
        style={({ pressed }) => [{ overflow: "hidden" }, pressed && { opacity: 0.85 }, style as ViewStyle]}
        {...props}
      >
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#d946ef"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <ButtonContent loading={loading} textClassName={cn(sizeText[size], "text-white font-semibold", textClassName)}>
          {children as React.ReactNode}
        </ButtonContent>
      </Pressable>
    );
  }

  const variantClass: Record<Variant, string> = {
    secondary: "bg-accent text-accent-foreground",
    ghost: "bg-transparent text-foreground",
    outline: "border border-border bg-card text-foreground",
    destructive: "bg-destructive text-white",
    primary: "",
  };

  return (
    <Pressable
      ref={ref}
      disabled={disabledState}
      className={cn(
        base,
        variantClass[variant],
        disabledState && "opacity-50",
        className
      )}
      style={({ pressed }) => {
        const s: ViewStyle = {};
        if (pressed) s.opacity = 0.8;
        return [s, style as ViewStyle];
      }}
      {...props}
    >
      <ButtonContent loading={loading} textClassName={cn(sizeText[size], variantClass[variant], textClassName)}>
        {children as React.ReactNode}
      </ButtonContent>
    </Pressable>
  );
});

function ButtonContent({ loading, textClassName, children }: { loading?: boolean; textClassName: string; children: React.ReactNode }) {
  if (loading) {
    return (
      <>
        <ActivityIndicator size="small" color="currentColor" />
        {children != null ? <Text className={textClassName}>{children}</Text> : null}
      </>
    );
  }
  return <Text className={textClassName}>{children}</Text>;
}
