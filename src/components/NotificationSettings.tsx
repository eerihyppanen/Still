import { useState } from "react";
import { Linking, Platform, Switch, View } from "react-native";
import { Button, Card, Txt, s } from "./ui";
import { useApp } from "../state/AppProvider";
import { useTheme } from "../theme/ThemeProvider";
import { requestReminderPermission } from "../notifications/expo-reminders";
import { TestReminder } from "./TestReminder";
import { Disclosure } from "./Disclosure";
export function NotificationSettings() {
  const app = useApp();
  const { colors } = useTheme();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [helpExpanded, setHelpExpanded] = useState(false);
  async function toggle(enabled: boolean) {
    setPending(true);
    setFeedback("");
    try {
      if (enabled) {
        const permission = await requestReminderPermission();
        if (permission.state !== "ready") {
          setFeedback(permission.message);
          return;
        }
      }
      await app.saveSettings({ ...app.settings, remindersEnabled: enabled });
    } catch (e) {
      setFeedback(
        e instanceof Error
          ? e.message
          : "Could not save your notification preference.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <View style={{ gap: 14 }}>
      <Card style={{ padding: 16, gap: 8 }}>
        <View style={s.row}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt weight="600">Reminders</Txt>
          </View>
          <Switch
            accessibilityLabel="Enable habit notifications"
            value={app.settings.remindersEnabled}
            disabled={pending || app.busy || Platform.OS === "web"}
            onValueChange={(value) => void toggle(value)}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <Txt size={13} muted accessibilityLiveRegion="polite">
          {feedback || app.notificationStatus.message}
        </Txt>
        {Platform.OS !== "web" &&
          (app.notificationStatus.state === "denied" || !!feedback) && (
            <Button
              title="Open device settings"
              variant="secondary"
              onPress={() =>
                void Linking.openSettings().catch(() =>
                  setFeedback(
                    "Open your device settings and allow notifications for Still.",
                  ),
                )
              }
            />
          )}
        {app.notificationStatus.state === "error" && (
          <Button
            title="Retry reminders"
            variant="secondary"
            onPress={() => void app.reload()}
          />
        )}
      </Card>
      <Disclosure
        title="Reminder help"
        summary={
          Platform.OS === "web"
            ? "How reminders work on your phone"
            : "Times, delivery and a test reminder"
        }
        expanded={helpExpanded}
        onToggle={() => setHelpExpanded((value) => !value)}
      >
        <Txt size={14} muted>
          Set a reminder time in each habit. Battery saving and Focus can delay
          delivery.
        </Txt>
        <TestReminder
          enabled={
            app.settings.remindersEnabled &&
            app.notificationStatus.state === "ready"
          }
          busy={pending || app.busy}
        />
      </Disclosure>
    </View>
  );
}
