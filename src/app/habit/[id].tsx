import { useState } from "react";
import { Pressable, View } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Button, Card, Empty, Screen, Txt } from "../../components/ui";
import { useApp } from "../../state/AppProvider";
import { habitStats, isScheduled, scheduleOn, weeklyGoalProgress } from "../../domain/habits";
import { streakLabel, weeklyGoalLabel } from "../../domain/labels";
import { TIME_GROUPS } from "../../domain/groups";
import { scheduleLabel } from "../../components/HabitRow";
import { CalendarHistory } from "../../components/CalendarHistory";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PauseHabit } from "../../components/PauseHabit";
import { useTheme } from "../../theme/ThemeProvider";
export default function HabitDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useApp();
  const { colors } = useTheme();
  const habit = app.habits.find((h) => h.id === id);
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  if (!habit)
    return (
      <Screen>
        <Stack.Screen options={{ headerRight: () => null }} />
        <Empty
          title="This habit isn’t here"
          message="It may have been deleted."
          action={
            <Button title="Go to Today" onPress={() => router.replace("/")} />
          }
        />
      </Screen>
    );
  const stats = habitStats(habit, app.completions, app.today);
  const weekly = scheduleOn(habit, app.today)?.weeklyTarget !== undefined;
  const goal = weekly
    ? weeklyGoalProgress(habit, app.completions, app.today)
    : undefined;
  async function act() {
    try {
      if (confirm === "delete") {
        await app.deleteHabit(id);
        router.replace("/(tabs)/habits");
      } else {
        await app.setArchived(id, !habit!.archived);
        setConfirm(null);
      }
    } catch {
      /* AppGate displays the saved error. */
    }
  }
  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit habit"
              disabled={app.busy}
              onPress={() =>
                router.push({ pathname: "/habit-form", params: { id } })
              }
              style={{
                minHeight: 44,
                paddingHorizontal: 12,
                justifyContent: "center",
              }}
            >
              <Txt weight="600" style={{ color: colors.primary }}>
                Edit
              </Txt>
            </Pressable>
          ),
        }}
      />
      <View style={{ alignItems: "center", gap: 10 }}>
        <Txt size={52}>{habit.emoji}</Txt>
        <Txt size={30} weight="700">
          {habit.name}
        </Txt>
        <Txt muted>
          {habit.archived ? "Archived · " : ""}
          {habit.timeOfDay && habit.timeOfDay !== "anytime"
            ? `${TIME_GROUPS.find((group) => group.key === habit.timeOfDay)?.title} · `
            : ""}
          {scheduleLabel(habit)}
        </Txt>
        {!!habit.description && (
          <Txt muted style={{ textAlign: "center" }}>
            {habit.description}
          </Txt>
        )}
      </View>
      <Card>
        <Txt size={24} weight="600">
          {goal
            ? weeklyGoalLabel(goal.completed, goal.target)
            : stats.currentStreak === 0 &&
                (habit.archived || !isScheduled(habit, app.today))
              ? "No streak yet"
              : streakLabel(stats.currentStreak)}
        </Txt>
        <Txt muted>
          {stats.totalCompleted}{" "}
          {stats.totalCompleted === 1 ? "check-in" : "check-ins"}
          {!weekly && ` · ${stats.completionRate}% scheduled-day completion`}
        </Txt>
        {!weekly && (
          <Txt muted>
            Longest streak: {stats.longestStreak} scheduled{" "}
            {stats.longestStreak === 1 ? "day" : "days"}
          </Txt>
        )}
      </Card>
      {!habit.archived && <PauseHabit habit={habit} />}
      <CalendarHistory
        habits={[habit]}
        records={app.completions}
        today={app.today}
      />
      <Button
        title={habit.archived ? "Restore habit" : "Archive habit"}
        variant="secondary"
        icon="archive-outline"
        onPress={() => setConfirm("archive")}
      />
      <Button
        title="Delete habit"
        variant="danger"
        onPress={() => setConfirm("delete")}
      />
      <ConfirmDialog
        visible={!!confirm}
        title={
          confirm === "delete"
            ? "Delete this habit permanently?"
            : habit.archived
              ? "Restore this habit?"
              : "Archive this habit?"
        }
        message={
          confirm === "delete"
            ? "All check-ins for this habit will also be deleted. This cannot be undone."
            : "Your past check-ins and progress will stay saved."
        }
        confirmLabel={
          confirm === "delete"
            ? "Yes, delete habit"
            : habit.archived
              ? "Restore habit"
              : "Archive habit"
        }
        destructive={confirm === "delete"}
        busy={app.busy}
        onConfirm={() => void act()}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}
