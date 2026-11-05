import { useRouter, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Button, Empty, Heading, Screen, Section } from "../../components/ui";
import { CalendarHistory } from "../../components/CalendarHistory";
import { Statistics } from "../../components/Statistics";
import { WeeklyRecap } from "../../components/WeeklyRecap";
import { useApp } from "../../state/AppProvider";
import { parseDate } from "../../domain/dates";
import { ChoiceControl } from "../../components/ChoiceControl";
export default function History() {
  const router = useRouter();
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
          title="Your story starts today"
          message="Create a habit and your check-ins will become a picture of your progress."
          action={
            <Button
              title="Create a habit"
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
            onChange={(value) => router.setParams({ view: value })}
          />
          <View
            style={{ display: activeView === "calendar" ? "flex" : "none" }}
          >
            <CalendarHistory
              selectedDate={selected}
              habits={habits}
              records={completions}
              today={today}
              onDateChange={(date) => router.setParams({ date })}
            />
          </View>
          {activeView === "insights" && (
            <>
              <Section title="Weekly recap" />
              <WeeklyRecap />
              <Section title="The bigger picture" />
              <Statistics />
            </>
          )}
        </>
      )}
    </Screen>
  );
}
