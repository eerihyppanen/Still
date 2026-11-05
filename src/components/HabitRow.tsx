import { useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Txt, s } from "./ui";
import { useTheme } from "../theme/ThemeProvider";
import type { Habit } from "../domain/models";
import { WEEKDAYS } from "../domain/models";
import { streakLabel } from "../domain/labels";
import { useReducedMotion } from "../theme/useReducedMotion";
export function scheduleLabel(habit: Habit) {
  const days = habit.schedules[habit.schedules.length - 1]?.weekdays ?? [];
  return days.length === 7
    ? "Every day"
    : WEEKDAYS.filter((day) => days.includes(day.value))
        .map((day) => day.label.slice(0, 3))
        .join(", ");
}
export function HabitRow({
  habit,
  completed,
  streak,
  onToggle,
  disabled,
  subtitle,
  compact = false,
}: {
  habit: Habit;
  completed?: boolean;
  streak?: number;
  onToggle?: () => void;
  disabled?: boolean;
  subtitle?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  function toggle() {
    if (!reduced) {
      scale.setValue(0.97);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
    onToggle?.();
  }
  return (
    <Animated.View
      style={[
        s.row,
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: completed ? colors.success : colors.border,
          borderRadius: compact ? 14 : 22,
          paddingRight: compact ? 4 : 12,
          gap: compact ? 4 : 12,
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${habit.name}`}
        onPress={() =>
          router.push({ pathname: "/habit/[id]", params: { id: habit.id } })
        }
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          padding: compact ? 8 : 16,
          minHeight: compact ? 56 : undefined,
          gap: compact ? 10 : 14,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: compact ? 32 : 50,
            height: compact ? 32 : 50,
            backgroundColor: dark ? colors.tint : `${habit.color}14`,
            borderRadius: compact ? 10 : 18,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Txt size={compact ? 20 : 25}>{habit.emoji}</Txt>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Txt
            size={compact ? 15 : 16}
            weight="600"
            style={
              completed
                ? { textDecorationLine: "line-through", color: colors.muted }
                : undefined
            }
          >
            {habit.name}
          </Txt>
          {(!compact || subtitle) && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              {streak !== undefined && streak > 0 && (
                <Ionicons
                  name="flame-outline"
                  size={14}
                  color={colors.primary}
                />
              )}
              <Txt size={13} muted>
                {subtitle ??
                  (streak !== undefined
                    ? streakLabel(streak)
                    : scheduleLabel(habit))}
              </Txt>
            </View>
          )}
        </View>
      </Pressable>
      {onToggle ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!completed, disabled }}
          aria-checked={!!completed}
          aria-disabled={disabled}
          accessibilityLabel={`${completed ? "Uncheck" : "Complete"} ${habit.name}`}
          disabled={disabled}
          onPress={toggle}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            opacity: disabled || pressed ? 0.5 : 1,
          })}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 12,
              borderWidth: completed ? 0 : 1.5,
              borderColor: colors.border,
              backgroundColor: completed ? colors.success : colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {completed && (
              <Ionicons
                name="checkmark"
                size={20}
                color={dark ? "#17261E" : "#FFFFFF"}
              />
            )}
          </View>
        </Pressable>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.muted}
          style={{ marginRight: 8 }}
        />
      )}
    </Animated.View>
  );
}
