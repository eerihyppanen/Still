import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import type { NavigationProp } from "expo-router/react-navigation";
import { View } from "react-native";
import { Button, Empty, Heading, Screen, Section } from "../../components/ui";
import { CalendarHistory } from "../../components/CalendarHistory";
import { Statistics } from "../../components/Statistics";
import { WeeklyRecap } from "../../components/WeeklyRecap";
import { useApp } from "../../state/AppProvider";
import { parseDate } from "../../domain/dates";
import { ChoiceControl } from "../../components/ChoiceControl";
type HistoryParams = { date?: string; view?: "calendar" | "insights" };
export default function History() {
  const router = useRouter();
  // Keep param updates bound to this mounted screen after Android recreation.
  const navigation =
    useNavigation<NavigationProp<{ history: HistoryParams }, "history">>();
  const { habits, completions, today } = useApp();
  const { date, view } = useLocalSearchParams<{
    date?: string;
    view?: string;
  }>();
  const activeView = view === "insights" ? "insights" : "calendar";
  let selected = today;
  try {
    if (date) {
      parseDate(date);
      selected = date > today ? today : date;
    }
  } catch {
    /* Ignore invalid incoming links. */
  }
  return (
    <Screen>
      <Heading title="History" />
      {!habits.length ? (
        <Empty
          icon="calendar-outline"
          title="No history yet"
          message="Add a habit, then check it off to see your progress here."
          action={
            <Button
              title="New habit"
              onPress={() => router.push("/habit-form")}
            />
          }
        />
      ) : (
        <>
          <ChoiceControl
            options={
              [
                { value: "calendar", label: "Calendar" },
                { value: "insights", label: "Insights" },
              ] as const
            }
            value={activeView}
            onChange={(value) => navigation.setParams({ view: value })}
          />
          <View
            style={{ display: activeView === "calendar" ? "flex" : "none" }}
          >
            <CalendarHistory
              selectedDate={selected}
              habits={habits}
              records={completions}
              today={today}
              onDateChange={(date) => navigation.setParams({ date })}
            />
          </View>
          {activeView === "insights" && (
            <>
              <Section title="Weekly recap" />
              <WeeklyRecap />
              <Section title="Statistics" />
              <Statistics />
            </>
          )}
        </>
      )}
    </Screen>
  );
}
