import { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { Button, Empty, Heading, Screen, Txt } from "../../components/ui";
import { HabitRow } from "../../components/HabitRow";
import {
  ReorderHabits,
  type ReorderScrollMetrics,
} from "../../components/ReorderHabits";
import { useApp } from "../../state/AppProvider";
import { useTheme } from "../../theme/ThemeProvider";
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
        title="Your habits"
        subtitle={`${active.length} ${active.length === 1 ? "routine" : "routines"} to grow with you.`}
        action={
          active.length > 1 && (
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
            {active.map((h) => (
              <HabitRow key={h.id} habit={h} />
            ))}
          </View>
        )
      ) : (
        <Empty
          title="Make a little room"
          message="Build a routine around something that matters to you."
        />
      )}
      <Button
        title="New habit"
        icon="add"
        disabled={interacting}
        onPress={() => router.push("/habit-form")}
      />
    </Screen>
  );
}
