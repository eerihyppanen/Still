import { useMemo } from "react";
import { View } from "react-native";
import { formatDate } from "../domain/dates";
import { weeklyRecap } from "../domain/history";
import { useApp } from "../state/AppProvider";
import { Card, Txt } from "./ui";

export function WeeklyRecap() {
  const { habits, completions, today } = useApp();
  const { dates, total, mostConsistent, hardestDays } = useMemo(
    () => weeklyRecap(habits, completions, today),
    [habits, completions, today],
  );
  const dateFormat = { month: "short", day: "numeric" } as const;
  const range =
    dates.length === 1
      ? formatDate(today, dateFormat)
      : `${formatDate(dates[0]!, dateFormat)} – ${formatDate(today, dateFormat)}`;
  return (
    <Card>
      <Txt size={13} muted>
        {range} · This week so far
      </Txt>
      <Txt size={22} weight="700">
        {total.scheduled
          ? `${total.completed} of ${total.scheduled} planned check-ins complete`
          : "No planned check-ins yet this week"}
      </Txt>
      {total.scheduled > 0 && (
        <>
          <View style={{ gap: 4 }}>
            <Txt weight="600">Most consistent routine</Txt>
            <Txt muted>
              {mostConsistent
                ? `${mostConsistent.habit.name} · ${mostConsistent.completed} of ${mostConsistent.scheduled} complete`
                : "Your first check-in will show up here."}
            </Txt>
          </View>
          <View style={{ gap: 4 }}>
            <Txt weight="600">Hardest days</Txt>
            {hardestDays.length ? (
              hardestDays.map((day) => (
                <Txt key={day.date} muted>
                  {formatDate(day.date, { weekday: "long" })} · {day.completed}{" "}
                  of {day.scheduled} complete
                </Txt>
              ))
            ) : (
              <Txt muted>No missed check-ins on earlier days this week.</Txt>
            )}
            <Txt size={12} muted>
              Based on completion rates for past days with planned habits.
            </Txt>
          </View>
        </>
      )}
    </Card>
  );
}
