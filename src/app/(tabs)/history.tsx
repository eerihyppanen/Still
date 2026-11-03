import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, Empty, Heading, Screen, Section } from "../../components/ui";
import { CalendarHistory } from "../../components/CalendarHistory";
import { Statistics } from "../../components/Statistics";
import { WeeklyRecap } from "../../components/WeeklyRecap";
import { useApp } from "../../state/AppProvider";
import { parseDate } from "../../domain/dates";
export default function History() {
  const router = useRouter();
  const { habits, completions, today } = useApp();
  const { date } = useLocalSearchParams<{ date?: string }>();
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
      <Heading
        title="Look how far you’ve come."
        subtitle="Every check-in is a small promise kept."
      />
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
          <Section title="Your calendar" />
          <CalendarHistory
            key={selected}
            initialDate={selected}
            habits={habits}
            records={completions}
            today={today}
          />
          <Section title="Weekly recap" />
          <WeeklyRecap />
          <Section title="The bigger picture" />
          <Statistics />
        </>
      )}
    </Screen>
  );
}
