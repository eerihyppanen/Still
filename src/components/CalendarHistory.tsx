import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Card, Txt, s } from "./ui";
import { HabitRow } from "./HabitRow";
import { useTheme } from "../theme/ThemeProvider";
import { useApp } from "../state/AppProvider";
import { dailyProgress } from "../domain/history";
import { isScheduled } from "../domain/habits";
import { formatDate, monthDates, parseDate, shiftMonth } from "../domain/dates";
import type { Completion, DateKey, Habit } from "../domain/models";

export function CalendarHistory({
  habits,
  records,
  today,
  initialDate = today,
}: {
  habits: Habit[];
  records: Completion[];
  today: DateKey;
  initialDate?: DateKey;
}) {
  const [month, setMonth] = useState(initialDate.slice(0, 7) + "-01");
  const [selected, setSelected] = useState(
    initialDate > today ? today : initialDate,
  );
  const { colors } = useTheme();
  const app = useApp();
  const days = useMemo(
    () => dailyProgress(habits, records, monthDates(month), today),
    [habits, records, month, today],
  );
  const offset = (parseDate(month).getDay() + 6) % 7;
  const earliest =
    habits
      .reduce((min, h) => (h.createdDate < min ? h.createdDate : min), today)
      .slice(0, 7) + "-01";
  const selectedHabits = habits.filter(
    (h) =>
      isScheduled(h, selected) ||
      records.some((r) => r.habitId === h.id && r.date === selected),
  );
  const done = new Set(
    records.filter((r) => r.date === selected).map((r) => r.habitId),
  );
  function changeMonth(amount: number) {
    const next = shiftMonth(month, amount);
    setMonth(next);
    setSelected(next.slice(0, 7) === today.slice(0, 7) ? today : next);
  }
  return (
    <Card style={{ padding: 16 }}>
      <View style={s.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={month <= earliest}
          onPress={() => changeMonth(-1)}
          style={{ padding: 12, opacity: month <= earliest ? 0.3 : 1 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Txt size={18} weight="600">
          {formatDate(month, { month: "long", year: "numeric" })}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          disabled={month >= today.slice(0, 7) + "-01"}
          onPress={() => changeMonth(1)}
          style={{
            padding: 12,
            opacity: month >= today.slice(0, 7) + "-01" ? 0.3 : 1,
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row" }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <View
            key={i}
            style={{
              width: "14.2857%",
              alignItems: "center",
              paddingVertical: 6,
            }}
          >
            <Txt size={12} muted>
              {day}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {Array.from({ length: offset }, (_, i) => (
          <View key={`blank-${i}`} style={{ width: "14.2857%", height: 48 }} />
        ))}
        {days.map((day) => {
          const full = day.scheduled > 0 && day.completed === day.scheduled;
          return (
            <Pressable
              key={day.date}
              accessibilityRole="button"
              accessibilityState={{
                selected: selected === day.date,
                disabled: day.date > today,
              }}
              accessibilityLabel={`${formatDate(day.date, { month: "long", day: "numeric" })}, ${day.completed} of ${day.scheduled} complete`}
              disabled={day.date > today}
              onPress={() => setSelected(day.date)}
              hitSlop={2}
              style={{
                width: "14.2857%",
                minHeight: 48,
                padding: 2,
                opacity: day.date > today ? 0.3 : 1,
              }}
            >
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 13,
                  gap: 2,
                  backgroundColor: full
                    ? colors.successTint
                    : selected === day.date
                      ? colors.tint
                      : "transparent",
                  borderWidth: 1.5,
                  borderColor:
                    selected === day.date ? colors.primary : "transparent",
                }}
              >
                <Txt
                  size={15}
                  weight={day.date === today ? "700" : "400"}
                  style={{ color: full ? colors.success : colors.text }}
                >
                  {parseDate(day.date).getDate()}
                </Txt>
                <Txt
                  size={9}
                  style={{
                    height: 11,
                    color: full ? colors.success : colors.primary,
                  }}
                >
                  {full ? "✓" : day.completed ? "●" : day.scheduled ? "·" : ""}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Txt size={12} muted>
        ✓ All complete ● Some complete · Planned
      </Txt>
      <View
        style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }}
      />
      <View style={s.row}>
        <Txt weight="600">
          {formatDate(selected, { month: "short", day: "numeric" })}
        </Txt>
        <Txt muted size={13}>
          {selectedHabits.filter((h) => done.has(h.id)).length} of{" "}
          {selectedHabits.length} complete
        </Txt>
      </View>
      {!selectedHabits.length ? (
        <Txt size={14} muted>
          No habits were scheduled for this date.
        </Txt>
      ) : (
        selectedHabits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            completed={done.has(habit.id)}
            subtitle={
              habit.archived
                ? "Archived habit"
                : "Tap the check to update this day"
            }
            disabled={app.busy}
            onToggle={() =>
              void app
                .setCompletion(habit.id, selected, !done.has(habit.id))
                .catch(() => undefined)
            }
          />
        ))
      )}
      {(selected !== today || month.slice(0, 7) !== today.slice(0, 7)) && (
        <Button
          title="Back to today"
          variant="secondary"
          onPress={() => {
            setMonth(today.slice(0, 7) + "-01");
            setSelected(today);
          }}
        />
      )}
    </Card>
  );
}
