import { View, Text, Image } from "react-native";

import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};
const sizeText = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
};

export function Avatar({
  src,
  username,
  size = "md",
  className,
}: {
  src?: string | null;
  username?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const container = cn(
    "relative shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent",
    sizes[size],
    className
  );
  if (src) {
    return (
      <View className={container}>
        <Image source={{ uri: src }} className="h-full w-full" resizeMode="cover" />
      </View>
    );
  }
  return (
    <View className={container}>
      <Text className={cn("font-semibold text-accent-foreground", sizeText[size])}>
        {initialsOf(username)}
      </Text>
    </View>
  );
}

export function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}
