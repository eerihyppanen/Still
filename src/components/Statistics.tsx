import { useMemo } from "react";
import { View } from "react-native";
import { Card, Txt } from "./ui";
import { ProgressChart } from "./ProgressChart";
import { useApp } from "../state/AppProvider";
import { dailyProgress } from "../domain/history";
import { habitStats, summarize } from "../domain/habits";
import {
  datesBetween,
  formatDate,
  monthDates,
  parseDate,
  weekDates,
} from "../domain/dates";
import { useTheme } from "../theme/ThemeProvider";

export function Statistics() {
  const { habits, completions, today } = useApp();
  const { colors } = useTheme();
  const data = useMemo(() => {
    const first = habits.reduce(
      (min, h) => (h.createdDate < min ? h.createdDate : min),
      today,
    );
    const overall = summarize(
      habits,
      completions,
      datesBetween(first, today),
      today,
    );
    const streaks = habits.map((h) => ({
      archived: h.archived,
      ...habitStats(h, completions, today),
    }));
    const weekly = dailyProgress(
      habits,
      completions,
      weekDates(today),
      today,
    ).map((d) => ({ ...d, label: formatDate(d.date, { weekday: "narrow" }) }));
    const month = monthDates(today);
    const monthly = [];
    for (let start = 0; start < month.length; start += 7) {
      const dates = month.slice(start, start + 7);
      monthly.push({
        label: `${start + 1}–${Math.min(start + 7, month.length)}`,
        ...summarize(habits, completions, dates, today),
      });
    }
    return {
      overall,
      totalCheckIns: completions.filter((entry) => entry.date <= today).length,
      current: Math.max(
        0,
        ...streaks.filter((s) => !s.archived).map((s) => s.currentStreak),
      ),
      longest: Math.max(0, ...streaks.map((s) => s.longestStreak)),
      weekly,
      monthly,
    };
  }, [habits, completions, today]);
  return (
    <>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[
          { value: data.overall.scheduled ? `${data.overall.rate}%` : "—", label: "Scheduled-day completion" },
          { value: data.totalCheckIns, label: "Total check-ins" },
          { value: data.current, label: "Best current streak" },
          { value: data.longest, label: "Longest habit streak" },
        ].map((stat) => (
          <Card
            key={stat.label}
            style={{ flexGrow: 1, flexBasis: "45%", gap: 5 }}
          >
            <Txt size={30} weight="700" style={{ color: colors.primary }}>
              {stat.value}
            </Txt>
            <Txt size={13} muted>
              {stat.label}
            </Txt>
          </Card>
        ))}
      </View>
      <Txt size={12} muted>
        Streaks and completion rates use specific-day schedules. Weekly goals are shown in the recap.
      </Txt>
      <ProgressChart
        title="This week"
        subtitle={`${formatDate(weekDates(today)[0]!, { month: "short", day: "numeric" })} – ${formatDate(weekDates(today)[6]!, { month: "short", day: "numeric" })}`}
        points={data.weekly}
      />
      <ProgressChart
        title={formatDate(today, { month: "long" })}
        subtitle={`Completion by week of the month · ${parseDate(today).getFullYear()}`}
        points={data.monthly}
      />
    </>
  );
}
