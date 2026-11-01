import { useEffect, useReducer, useState } from "react";
import { AppState, Platform, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  getCalendars,
  getLocales,
  useCalendars,
  useLocales,
} from "expo-localization";
import { Button, Txt } from "./ui";
import { useTheme } from "../theme/ThemeProvider";
import { formatReminderTime } from "../domain/time-format";
export function ReminderTimeField({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (time: string) => void;
  inputRef?: React.Ref<React.ComponentRef<typeof TextInput>>;
}) {
  const [open, setOpen] = useState(false);
  const { colors, dark } = useTheme();
  // Subscribe to configuration changes and read fresh values after foregrounding.
  // Android's clock-format setting can change without a calendar event.
  useCalendars();
  useLocales();
  const [, refreshPreferences] = useReducer(
    (version: number) => version + 1,
    0,
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshPreferences();
    });
    return () => subscription.remove();
  }, []);
  const locale = getLocales()[0].languageTag;
  const uses24hourClock =
    getCalendars()[0].uses24hourClock ??
    new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions()
      .hour12 === false;
  const formatted = formatReminderTime(value, uses24hourClock, locale);
  const [hour = 9, minute = 0] = value.split(":").map(Number);
  const selected = new Date();
  selected.setHours(hour, minute, 0, 0);
  if (Platform.OS === "web")
    return (
      <View style={{ gap: 8 }}>
        <TextInput
          ref={inputRef}
          accessibilityLabel="Reminder time in 24 hour format"
          value={value}
          onChangeText={onChange}
          maxLength={5}
          placeholder="09:00"
          placeholderTextColor={colors.muted}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            minHeight: 52,
            padding: 14,
            color: colors.text,
            fontSize: 16,
          }}
        />
        <Txt size={13} muted>
          24-hour time (HH:MM). Reminders are delivered in the mobile app.
        </Txt>
        <Txt size={13} muted>
          Shown on this device as {formatted}.
        </Txt>
      </View>
    );
  return (
    <View style={{ gap: 8 }}>
      <Button
        title={`Remind me at ${formatted}`}
        variant="secondary"
        icon="time-outline"
        onPress={() => setOpen(true)}
      />
      {open && (
        <>
          <DateTimePicker
            value={selected}
            mode="time"
            is24Hour={uses24hourClock}
            themeVariant={dark ? "dark" : "light"}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (Platform.OS === "android") setOpen(false);
              if (event.type !== "dismissed" && date)
                onChange(
                  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
                );
            }}
          />
          {Platform.OS === "ios" && (
            <Button
              title="Done"
              variant="secondary"
              onPress={() => setOpen(false)}
            />
          )}
        </>
      )}
    </View>
  );
}
