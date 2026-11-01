import { useState } from "react";
import { Linking, Platform, Switch, View } from "react-native";
import { Button, Card, Txt, s } from "./ui";
import { useApp } from "../state/AppProvider";
import { useTheme } from "../theme/ThemeProvider";
import { requestReminderPermission } from "../notifications/expo-reminders";
import { TestReminder } from "./TestReminder";
export function NotificationSettings() {
  const app = useApp();
  const { colors } = useTheme();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
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
    <Card>
      <View style={s.row}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={20} weight="600">
            Gentle reminders
          </Txt>
          <Txt size={13} muted>
            A nudge, when you choose.
          </Txt>
        </View>
        <Switch
          accessibilityLabel="Enable habit notifications"
          value={app.settings.remindersEnabled}
          disabled={pending || app.busy || Platform.OS === "web"}
          onValueChange={(value) => void toggle(value)}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <Txt size={14} muted accessibilityLiveRegion="polite">
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
      <Txt size={12} muted>
        Reminder times are set per habit. Your phone may delay delivery when
        battery saving or Focus is on.
      </Txt>
      <TestReminder
        enabled={
          app.settings.remindersEnabled &&
          app.notificationStatus.state === "ready"
        }
        busy={pending || app.busy}
      />
    </Card>
  );
}
