import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import type { NotificationContentInput } from "expo-notifications";
import type { Completion, Habit } from "../domain/models";
import { parseDate } from "../domain/dates";
import {
  REMINDER_CATEGORY,
  NOTIFICATION_TASK,
  reconcileSnoozes,
} from "./actions";
import {
  TEST_REMINDER_ID,
  sendTestReminder,
  type TestReminderDriver,
} from "./test-reminder";
import {
  buildReminderPlan,
  reconcileReminders,
  type ReminderDriver,
} from "./reminders";

export interface NotificationStatus {
  state: "off" | "ready" | "denied" | "unsupported" | "error";
  message: string;
}
let queue: Promise<unknown> = Promise.resolve();
let initialized = false;
type DeferredReminderScheduler = {
  scheduleDeferred(
    id: string,
    content: NotificationContentInput,
    startsOn: string,
    hour: number,
    minute: number,
    weekday: number | null,
  ): Promise<void>;
};
const deferredScheduler =
  Platform.OS === "android"
    ? requireOptionalNativeModule<DeferredReminderScheduler>("StillReminders")
    : null;
export const supportsDeferredReminders = deferredScheduler !== null;
async function nativeNotifications() {
  const notifications = await import("expo-notifications");
  if (!initialized) {
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === "android")
      await notifications.setNotificationChannelAsync("habits", {
        name: "Habit reminders",
        importance: notifications.AndroidImportance.DEFAULT,
        sound: null,
      });
    await notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
      {
        identifier: "stillDone",
        buttonTitle: "Done",
        options: { opensAppToForeground: Platform.OS !== "android" },
      },
      {
        identifier: "stillSnooze",
        buttonTitle: "Snooze 10 min",
        options: { opensAppToForeground: Platform.OS !== "android" },
      },
    ]);
    if (Platform.OS === "android")
      await notifications.registerTaskAsync(NOTIFICATION_TASK);
    initialized = true;
  }
  return notifications;
}
export async function requestReminderPermission(): Promise<NotificationStatus> {
  if (Platform.OS === "web")
    return {
      state: "unsupported",
      message: "Local reminders are available in the iOS and Android app.",
    };
  try {
    const n = await nativeNotifications();
    const current = await n.getPermissionsAsync();
    const result = current.granted
      ? current
      : await n.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: false, allowSound: false },
        });
    return result.granted ||
      result.ios?.status === n.IosAuthorizationStatus.PROVISIONAL
      ? { state: "ready", message: "Reminders are allowed on this device." }
      : {
          state: "denied",
          message:
            "Notifications are not allowed. You can enable them in your device settings; your habits will keep working.",
        };
  } catch {
    return {
      state: "error",
      message:
        "Notification permission could not be checked. Try again on your device.",
    };
  }
}
export function syncReminders(
  habits: Habit[],
  enabled: boolean,
  today: string,
  completions: Completion[] = [],
): Promise<NotificationStatus> {
  const result = queue.then(async (): Promise<NotificationStatus> => {
    if (Platform.OS === "web")
      return {
        state: "unsupported",
        message: "Local reminders are available in the iOS and Android app.",
      };
    try {
      const n = await nativeNotifications();
      const driver: ReminderDriver = {
        list: async () =>
          (await n.getAllScheduledNotificationsAsync()).map((item) => ({
            id: item.identifier,
            signature: String(item.content.data?.signature ?? ""),
          })),
        cancel: (id) => n.cancelScheduledNotificationAsync(id),
        schedule: async (plan) => {
          const content: NotificationContentInput = {
            title: plan.title,
            body: plan.body,
            sound: false,
            categoryIdentifier: REMINDER_CATEGORY,
            data: {
              habitId: plan.habitId,
              signature: plan.signature,
              reminderTime: habits.find((h) => h.id === plan.habitId)?.reminderTime,
              scheduleWeekday: plan.weekday,
              ...(plan.occurrenceDate ? { occurrenceDate: plan.occurrenceDate } : {}),
            },
          };
          if (plan.startsOn && deferredScheduler) {
            await deferredScheduler.scheduleDeferred(
              plan.id, content, plan.startsOn, plan.hour, plan.minute, plan.weekday,
            );
            return;
          }
          const date = plan.occurrenceDate ? parseDate(plan.occurrenceDate) : undefined;
          date?.setHours(plan.hour, plan.minute, 0, 0);
          await n.scheduleNotificationAsync({
            identifier: plan.id,
            content,
            trigger: date
              ? { type: n.SchedulableTriggerInputTypes.DATE, date, channelId: "habits" }
              : plan.weekday === null
                ? {
                    type: n.SchedulableTriggerInputTypes.DAILY,
                    hour: plan.hour,
                    minute: plan.minute,
                    channelId: "habits",
                  }
                : {
                    type: n.SchedulableTriggerInputTypes.WEEKLY,
                    weekday: plan.weekday,
                    hour: plan.hour,
                    minute: plan.minute,
                    channelId: "habits",
                  },
          });
        },
      };
      const permission = await n.getPermissionsAsync();
      const permitted =
        permission.granted ||
        permission.ios?.status === n.IosAuthorizationStatus.PROVISIONAL;
      const snapshot = {
        habits,
        completions,
        settings: {
          theme: "system" as const,
          remindersEnabled: enabled && permitted,
          hapticsEnabled: false,
        },
      };
      await reconcileSnoozes(
        {
          scheduled: async () =>
            (await n.getAllScheduledNotificationsAsync()).map((item) => ({
              id: item.identifier,
              data: item.content.data ?? {},
            })),
          presented: async () =>
            (await n.getPresentedNotificationsAsync()).map((item) => ({
              id: item.request.identifier,
              data: item.request.content.data ?? {},
            })),
          cancel: (id) => n.cancelScheduledNotificationAsync(id),
          dismiss: (id) => n.dismissNotificationAsync(id),
        },
        snapshot,
        today,
      );
      if (!enabled) {
        await n.cancelScheduledNotificationAsync(TEST_REMINDER_ID);
        await reconcileReminders(driver, [], false);
        return {
          state: "off",
          message: "Reminders are off.",
        };
      }
      if (
        !permission.granted &&
        permission.ios?.status !== n.IosAuthorizationStatus.PROVISIONAL
      ) {
        await n.cancelScheduledNotificationAsync(TEST_REMINDER_ID);
        await reconcileReminders(driver, [], false);
        return {
          state: "denied",
          message:
            "Notifications are blocked in device settings. Your habit reminders are saved and can be enabled again there.",
        };
      }
      const plans = buildReminderPlan(
        habits,
        today,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        completions,
        supportsDeferredReminders,
      );
      await reconcileReminders(driver, plans, true);
      return {
        state: "ready",
        message: plans.length
          ? "Your reminders are set for your local time."
          : "Choose a reminder time when creating or editing a habit.",
      };
    } catch (e) {
      return {
        state: "error",
        message:
          e instanceof Error
            ? e.message
            : "Reminders could not be updated. Reopen the app to retry.",
      };
    }
  });
  queue = result.catch(() => undefined);
  return result;
}

export function queuedNative<T>(action: () => Promise<T>): Promise<T> {
  const result = queue.then(action);
  queue = result.catch(() => undefined);
  return result;
}
export function sendTestNotification(): Promise<void> {
  return queuedNative(async () => {
    if (Platform.OS === "web")
      throw new Error("Test reminders are available in the mobile app.");
    const n = await nativeNotifications();
    const permission = await n.getPermissionsAsync();
    const permitted =
      permission.granted ||
      permission.ios?.status === n.IosAuthorizationStatus.PROVISIONAL;
    const driver: TestReminderDriver = {
      cancel: (id) => n.cancelScheduledNotificationAsync(id),
      schedule: async (id, seconds) => {
        await n.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: "Still test reminder",
            body: "Test notification received.",
            sound: false,
            data: { kind: "reminder-test" },
          },
          trigger: {
            type: n.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            repeats: false,
            channelId: "habits",
          },
        });
      },
    };
    await n.dismissNotificationAsync(TEST_REMINDER_ID);
    await sendTestReminder(driver, permitted);
  });
}
export function cancelTestNotification(): Promise<void> {
  return queuedNative(async () => {
    if (Platform.OS === "web") return;
    const n = await nativeNotifications();
    await n.cancelScheduledNotificationAsync(TEST_REMINDER_ID);
    await n.dismissNotificationAsync(TEST_REMINDER_ID);
  });
}
export type TestNotificationState = "idle" | "pending" | "delivered";
export function getTestNotificationState(): Promise<TestNotificationState> {
  return queuedNative(async () => {
    if (Platform.OS === "web") return "idle";
    const n = await nativeNotifications();
    if (
      (await n.getAllScheduledNotificationsAsync()).some(
        (item) => item.identifier === TEST_REMINDER_ID,
      )
    )
      return "pending";
    return (await n.getPresentedNotificationsAsync()).some(
      (item) => item.request.identifier === TEST_REMINDER_ID,
    )
      ? "delivered"
      : "idle";
  });
}
export async function subscribeToTestNotification(
  onReceived: () => void,
): Promise<() => void> {
  if (Platform.OS === "web") return () => {};
  const n = await nativeNotifications();
  const subscription = n.addNotificationReceivedListener((notification) => {
    if (notification.request.identifier === TEST_REMINDER_ID) onReceived();
  });
  return () => subscription.remove();
}
