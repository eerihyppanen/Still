import type { PropsWithChildren } from "react";
import { Pressable, View, type ViewProps } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card, Txt } from "./ui";
import { useTheme } from "../theme/ThemeProvider";

export function Disclosure({
  title,
  summary,
  expanded,
  onToggle,
  onLayout,
  disabled,
  children,
}: PropsWithChildren<{
  title: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  onLayout?: ViewProps["onLayout"];
  disabled?: boolean;
}>) {
  const { colors } = useTheme();
  return (
    <View onLayout={onLayout}>
      <Card style={{ padding: 0, gap: 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${summary}`}
          accessibilityState={{ expanded, disabled }}
          disabled={disabled}
          onPress={onToggle}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            gap: 12,
            minHeight: 64,
            opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          })}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Txt weight="600">{title}</Txt>
            <Txt size={13} muted numberOfLines={2}>
              {summary}
            </Txt>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.muted}
          />
        </Pressable>
        {expanded && (
          <View style={{ padding: 16, paddingTop: 0, gap: 20 }}>
            {children}
          </View>
        )}
      </Card>
    </View>
  );
}
