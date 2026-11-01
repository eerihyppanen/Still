import type { NotificationStatus } from "./expo-reminders";

export function getHabitReminderFeedback(
  status: NotificationStatus,
  enabled: boolean,
  archived = false,
): { message: string; needsSettings: boolean } {
  if (archived)
    return {
      message:
        "Restore this habit to receive reminders. Its reminder time will stay saved.",
      needsSettings: false,
    };
  if (status.state === "unsupported")
    return {
      message:
        "Reminders are available in the Android and iOS app. You can save a reminder time here.",
      needsSettings: false,
    };
  if (!enabled)
    return {
      message:
        "Reminders are off in Still. Save this habit, then enable them in Settings.",
      needsSettings: true,
    };
  switch (status.state) {
    case "ready":
      return {
        message:
          "Notifications are enabled. Save this habit to apply its reminder.",
        needsSettings: false,
      };
    case "denied":
      return {
        message:
          "Notifications are blocked in device settings. Save this habit, then open Settings to allow them.",
        needsSettings: true,
      };
    case "error":
      return {
        message:
          "Reminders could not be checked or updated. Save this habit, then retry in Settings.",
        needsSettings: true,
      };
    case "off":
      return {
        message: "Checking reminder availability…",
        needsSettings: false,
      };
  }
}
