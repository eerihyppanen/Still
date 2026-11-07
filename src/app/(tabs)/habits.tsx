import { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Empty, Heading, Screen, Txt } from "../../components/ui";
import { HabitRow } from "../../components/HabitRow";
import {
  ReorderHabits,
  type ReorderScrollMetrics,
} from "../../components/ReorderHabits";
import { useApp } from "../../state/AppProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { pausedUntil } from "../../domain/habits";
import { resumeDateLabel } from "../../domain/labels";
export default function Habits() {
  const router = useRouter();
  const app = useApp();
  const { colors } = useTheme();
  const [reordering, setReordering] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const metrics = useRef<ReorderScrollMetrics>({
    y: 0,
    height: 0,
    contentHeight: 0,
  });
  const active = app.habits.filter((h) => !h.archived);
  const resumes = new Map(active.map((habit) => [habit.id, pausedUntil(habit, app.today)]));
  const paused = active.filter((habit) => resumes.get(habit.id)).length;
  const showOrdering = reordering && active.length > 1;
  return (
    <Screen
      scrollRef={scrollRef}
      scrollViewProps={{
        style:
          Platform.OS === "web"
            ? ({ scrollbarGutter: "stable" } as ViewStyle)
            : undefined,
        scrollEnabled: !interacting,
        scrollEventThrottle: 16,
        onScroll: (event) => {
          metrics.current.y = event.nativeEvent.contentOffset.y;
        },
        onLayout: (event) => {
          metrics.current.height = event.nativeEvent.layout.height;
        },
        onContentSizeChange: (_width, height) => {
          metrics.current.contentHeight = height;
        },
      }}
    >
      <Heading
        title="Habits"
        subtitle={paused ? `${active.length - paused} active · ${paused} paused` : `${active.length} active ${active.length === 1 ? "habit" : "habits"}`}
        action={
          active.length > 0 && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              {active.length > 1 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showOrdering ? "Finish reordering habits" : "Reorder habits"
                  }
                  accessibilityState={{
                    expanded: showOrdering,
                    disabled: app.busy || interacting,
                  }}
                  disabled={app.busy || interacting}
                  onPress={() => setReordering(!showOrdering)}
                  style={{
                    minHeight: 44,
                    padding: 10,
                    justifyContent: "center",
                    opacity: app.busy || interacting ? 0.5 : 1,
                  }}
                >
                  <Txt size={14} weight="600" style={{ color: colors.primary }}>
                    {showOrdering ? "Done" : "Reorder"}
                  </Txt>
                </Pressable>
              )}
              {!showOrdering && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="New habit"
                  disabled={app.busy || interacting}
                  onPress={() => router.push("/habit-form")}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: colors.tint,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: app.busy || interacting ? 0.5 : pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="add" size={24} color={colors.primary} />
                </Pressable>
              )}
            </View>
          )
        }
      />
      {active.length ? (
        showOrdering ? (
          <ReorderHabits
            key={active
              .map((h) => h.id)
              .sort()
              .join(":")}
            habits={active}
            disabled={app.busy}
            scrollRef={scrollRef}
            metrics={metrics}
            onInteractionChange={setInteracting}
            onReorder={app.reorderHabits}
          />
        ) : (
          <View style={{ gap: 12 }}>
            {active.map((h) => {
              const resume = resumes.get(h.id);
              return <HabitRow key={h.id} habit={h} subtitle={resume ? `Paused until ${resumeDateLabel(resume, app.today)}` : undefined} />;
            })}
          </View>
        )
      ) : (
        <Empty
          title="No active habits"
          message={
            app.habits.length
              ? "Restore archived habits in Settings, or add a new habit."
              : "Add a habit to start tracking it."
          }
          action={
            <Button
              title="New habit"
              icon="add"
              onPress={() => router.push("/habit-form")}
            />
          }
        />
      )}
    </Screen>
  );
}
