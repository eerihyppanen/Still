import { useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Button,
  Card,
  Empty,
  Screen,
  Section,
  Txt,
  s,
} from "../../components/ui";
import { ProgressRing } from "../../components/ProgressRing";
import { HabitRow } from "../../components/HabitRow";
import { Disclosure } from "../../components/Disclosure";
import { StillMark } from "../../components/StillMark";
import { useApp } from "../../state/AppProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { habitStats, scheduleOn, weeklyGoalProgress } from "../../domain/habits";
import { weeklyGoalLabel } from "../../domain/labels";
import { todayHabits } from "../../domain/history";
import { groupTodayHabits } from "../../domain/groups";
import { formatDate, weekDates, parseDate } from "../../domain/dates";
export default function Today() {
  const router = useRouter();
  const { habits, completions, today, busy, setCompletion } = useApp();
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const scheduled = todayHabits(habits, completions, today);
  const daily = scheduled.filter(
    (habit) => scheduleOn(habit, today)?.weeklyTarget === undefined,
  );
  const weekly = groupTodayHabits(scheduled.filter(
    (habit) => scheduleOn(habit, today)?.weeklyTarget !== undefined,
  )).flatMap((group) => group.habits);
  const groups = groupTodayHabits(daily);
  const done = new Set(
    completions.filter((c) => c.date === today).map((c) => c.habitId),
  );
  const completed = scheduled.filter((h) => done.has(h.id)).length;
  const dailyCompleted = daily.filter((habit) => done.has(habit.id)).length;
  const weeklyUnfinished = weekly.filter((habit) => !done.has(habit.id));
  const completedExpanded = expandedDate === today;
  const hasActiveHabits = habits.some((habit) => !habit.archived);
  function renderHabit(habit: (typeof scheduled)[number]) {
    const weekly = scheduleOn(habit, today)?.weeklyTarget !== undefined;
    const progress = weekly
      ? weeklyGoalProgress(habit, completions, today)
      : undefined;
    return (
      <HabitRow
        key={habit.id}
        habit={habit}
        completed={done.has(habit.id)}
        streak={weekly ? undefined : habitStats(habit, completions, today).currentStreak}
        subtitle={progress && weeklyGoalLabel(progress.completed, progress.target)}
        disabled={busy}
        onToggle={() =>
          void setCompletion(habit.id, today, !done.has(habit.id)).catch(
            () => undefined,
          )
        }
      />
    );
  }
  return (
    <Screen contentContainerStyle={{ gap: 16, paddingTop: 16 }}>
      <View style={s.row}>
        <View style={{ flexDirection: "row", gap: 7, alignItems: "center" }}>
          <StillMark size={24} />
          <Txt weight="700" size={21}>
            still
          </Txt>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexShrink: 1,
          }}
        >
          <Txt size={12} muted style={{ flexShrink: 1 }}>
            {formatDate(today, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Txt>
          {habits.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New habit"
              onPress={() => router.push("/habit-form")}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.tint,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Txt size={26} weight="700" style={{ letterSpacing: -0.5 }}>
          Today
        </Txt>
      </View>
      <View style={[s.row, { gap: 4 }]}>
        {weekDates(today).map((day) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${formatDate(day, { weekday: "long", day: "numeric", month: "long" })}${day > today ? ". Future date, not available yet" : ". View history"}`}
            accessibilityState={{ disabled: day > today }}
            disabled={day > today}
            key={day}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/history",
                params: { date: day, view: "calendar" },
              })
            }
            style={{
              flex: 1,
              alignItems: "center",
              gap: 4,
              backgroundColor: day === today ? colors.primary : colors.surface,
              paddingVertical: 8,
              borderRadius: 15,
              opacity: day > today ? 0.4 : 1,
            }}
          >
            <Txt
              size={12}
              style={{ color: day === today ? colors.onPrimary : colors.muted }}
            >
              {formatDate(day, { weekday: "narrow" })}
            </Txt>
            <Txt
              size={15}
              weight="600"
              style={{ color: day === today ? colors.onPrimary : colors.text }}
            >
              {parseDate(day).getDate()}
            </Txt>
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor:
                  day === today ? colors.onPrimary : "transparent",
              }}
            />
          </Pressable>
        ))}
      </View>
      {daily.length > 0 && (
        <Card
          style={{
            backgroundColor: colors.tint,
            borderColor: colors.tint,
            padding: 14,
          }}
        >
          <View
            style={[
              s.row,
              fontScale > 1.35 && {
                flexDirection: "column",
                alignItems: "stretch",
              },
            ]}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <Txt size={18} weight="600">
                {dailyCompleted === daily.length
                  ? "All planned habits done"
                  : "Today’s progress"}
              </Txt>
              <Txt size={14} muted>
                {`${dailyCompleted} of ${daily.length} ${daily.length === 1 ? "habit" : "habits"} complete`}
              </Txt>
            </View>
            <ProgressRing
              completed={dailyCompleted}
              total={daily.length}
              size={
                fontScale > 1.35
                  ? Math.min(width - 76, Math.round(100 * fontScale))
                  : width < 360
                    ? 76
                    : 88
              }
            />
          </View>
        </Card>
      )}
      {(daily.length > 0 || !scheduled.length) &&
        (groups.length <= 1 || dailyCompleted === daily.length) && (
          <Section
            title={groups[0]?.title ?? "Today’s habits"}
            aside={daily.length ? `${daily.length} planned` : undefined}
          />
        )}
      {!hasActiveHabits ? (
        <Empty
          title={habits.length ? "All habits are archived" : "No habits yet"}
          message={
            habits.length
              ? "Your history is saved. Restore a habit from Settings."
              : "Add a habit and choose how often to track it."
          }
          action={
            <Button
              title={habits.length ? "Open Settings" : "New habit"}
              icon={habits.length ? "settings-outline" : "add"}
              onPress={() =>
                router.push(habits.length ? "/(tabs)/settings" : "/habit-form")
              }
            />
          }
        />
      ) : !scheduled.length ? (
        <Empty
          icon="partly-sunny-outline"
          title="Nothing scheduled today"
          message="You can view or change your schedule in Habits."
          action={
            <Button
              title="View habits"
              variant="secondary"
              onPress={() => router.push("/(tabs)/habits")}
            />
          }
        />
      ) : (
        <View style={{ gap: 12 }}>
          {groups.map((group) => {
            const unfinished = group.habits.filter(
              (habit) => !done.has(habit.id),
            );
            if (!unfinished.length) return null;
            return (
              <View key={group.key} style={{ gap: 12 }}>
                {groups.length > 1 && (
                  <Section
                    title={group.title}
                    aside={`${unfinished.length} left`}
                  />
                )}
                {unfinished.map(renderHabit)}
              </View>
            );
          })}
          {!!weeklyUnfinished.length && (
            <View style={{ gap: 12 }}>
              <Section title="Weekly goals" />
              {weeklyUnfinished.map(renderHabit)}
            </View>
          )}
          {completed > 0 && (
            <Disclosure
              title={`${completed} completed`}
              summary="Review or undo check-ins"
              expanded={completedExpanded}
              onToggle={() => setExpandedDate(completedExpanded ? null : today)}
            >
              {completedExpanded &&
                groups.map((group) => {
                  const finished = group.habits.filter((habit) =>
                    done.has(habit.id),
                  );
                  if (!finished.length) return null;
                  return (
                    <View key={group.key} style={{ gap: 12 }}>
                      {groups.length > 1 && <Txt muted>{group.title}</Txt>}
                      {finished.map(renderHabit)}
                    </View>
                  );
                })}
              {completedExpanded &&
                weekly.filter((habit) => done.has(habit.id)).map(renderHabit)}
            </Disclosure>
          )}
        </View>
      )}
    </Screen>
  );
}
