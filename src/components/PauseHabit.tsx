import { createElement, useState } from "react";
import { Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDays, dateKey, parseDate } from "../domain/dates";
import { pausedUntil, pendingResumeDate } from "../domain/habits";
import { resumeDateLabel } from "../domain/labels";
import type { DateKey, Habit } from "../domain/models";
import { supportsDeferredReminders } from "../notifications/expo-reminders";
import { useApp } from "../state/AppProvider";
import { useTheme } from "../theme/ThemeProvider";
import { Button, Card, Txt } from "./ui";

export function PauseHabit({ habit }: { habit: Habit }) {
  const { today, busy, setPause } = useApp();
  const { colors, dark } = useTheme();
  const [draft, setDraft] = useState<DateKey | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const resume = pendingResumeDate(habit, today);
  const paused = pausedUntil(habit, today);
  const tomorrow = addDays(today, 1);
  const selected = draft && draft >= tomorrow ? draft : tomorrow;

  async function save(date: DateKey | null) {
    try {
      await setPause(habit.id, date);
      setDraft(null);
      setPickerOpen(false);
    } catch {
      /* AppGate displays the saved error. */
    }
  }

  return (
    <Card>
      {resume && (
        <Txt weight="600">
          {`${paused ? "Paused until" : "Resume scheduled for"} ${resumeDateLabel(resume, today)}`}
        </Txt>
      )}
      {draft === null ? (
        <>
          {resume && (
            <Button
              title={paused ? "Resume now" : "Cancel pause"}
              onPress={() => void save(null)}
              disabled={busy}
            />
          )}
          <Button
            title={resume ? "Change resume date" : "Pause until…"}
            icon="pause-outline"
            variant="secondary"
            disabled={busy}
            onPress={() => setDraft(resume ?? tomorrow)}
          />
        </>
      ) : (
        <>
          <Txt weight="600">Resume date</Txt>
          {Platform.OS === "web" ? (
            createElement("input", {
              type: "date",
              "aria-label": "Resume date",
              min: tomorrow,
              value: draft,
              disabled: busy,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                setDraft(event.target.value),
              style: {
                minHeight: 44,
                paddingInline: 12,
                borderRadius: 12,
                fontSize: 16,
                color: colors.text,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                colorScheme: dark ? "dark" : "light",
              },
            })
          ) : (
            <>
              <Button
                title={resumeDateLabel(selected, today)}
                icon="calendar-outline"
                variant="secondary"
                disabled={busy}
                onPress={() => setPickerOpen(!pickerOpen)}
              />
              {pickerOpen && (
                <DateTimePicker
                  value={parseDate(selected)}
                  minimumDate={parseDate(tomorrow)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  themeVariant={dark ? "dark" : "light"}
                  onChange={(event, date) => {
                    if (Platform.OS === "android") setPickerOpen(false);
                    if (event.type === "set" && date) setDraft(dateKey(date));
                  }}
                />
              )}
            </>
          )}
          <Txt size={13} muted>
            Past check-ins stay saved. The habit returns to its schedule on this date.
          </Txt>
          {habit.reminderTime && (
            <Txt size={13} muted>
              {supportsDeferredReminders
                ? "Reminders resume on the first scheduled day back."
                : "Still schedules your first reminder back. Open the app after the pause to restore recurring reminders."}
            </Txt>
          )}
          <Button
            title="Save pause"
            onPress={() => void save(draft)}
            disabled={busy || draft < tomorrow}
          />
          <Button
            title="Cancel"
            variant="secondary"
            disabled={busy}
            onPress={() => {
              setDraft(null);
              setPickerOpen(false);
            }}
          />
        </>
      )}
    </Card>
  );
}
