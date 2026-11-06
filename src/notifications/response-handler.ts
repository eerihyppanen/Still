import { Platform } from "react-native";
import { getRepository } from "../data/connection";
import { dateKey } from "../domain/dates";
import {
  parseReminderResponse,
  REMINDER_CATEGORY,
  runReminderAction,
  SNOOZE_PREFIX,
  snoozeIsCurrent,
} from "./actions";
import { queuedNative } from "./expo-reminders";
import { publishWidget } from "../widgets/sync";

let actions: Promise<unknown> = Promise.resolve();
export async function cancelHabitSnoozes(habitId: string) {
  const n = await import("expo-notifications");
  const prefix = `${SNOOZE_PREFIX}${habitId}:`;
  for (const item of await n.getAllScheduledNotificationsAsync())
    if (item.identifier.startsWith(prefix))
      await n.cancelScheduledNotificationAsync(item.identifier);
  for (const item of await n.getPresentedNotificationsAsync())
    if (item.request.identifier.startsWith(prefix))
      await n.dismissNotificationAsync(item.request.identifier);
}
export function handleReminderResponse(response: unknown): Promise<boolean> {
  const action = parseReminderResponse(response);
  if (!action || Platform.OS === "web") return Promise.resolve(false);
  const result = actions.then(async () => {
    const repo = await getRepository();
    const n = await import("expo-notifications");
    await runReminderAction(action, {
      snapshot: () => repo.snapshot(),
      complete: async (id, date) => {
        await repo.completeReminder(
          id,
          date,
          action.receipt,
          action.reminderTime,
        );
      },
      dismiss: (id) => n.dismissNotificationAsync(id),
      cancelSnoozes: (id) => queuedNative(() => cancelHabitSnoozes(id)),
      snooze: (plan) =>
        queuedNative(async () => {
          const snapshot = await repo.snapshot();
          const permission = await n.getPermissionsAsync();
          if (
            !(
              permission.granted ||
              permission.ios?.status === n.IosAuthorizationStatus.PROVISIONAL
            ) ||
            !snoozeIsCurrent(
              {
                habitId: plan.habit.id,
                date: plan.date,
                reminderTime: plan.habit.reminderTime,
              },
              snapshot,
              dateKey(),
            )
          )
            return;
          const fireAt = await repo.snoozeDeadline(plan.receipt, plan.fireAt);
          if (fireAt <= Date.now()) return;
          const scheduled = await n.getAllScheduledNotificationsAsync();
          if (
            scheduled.filter((item) => item.identifier !== plan.id).length >= 63
          )
            throw new Error(
              "Too many pending reminders to snooze. Open Still to review your reminder times.",
            );
          await n.scheduleNotificationAsync({
            identifier: plan.id,
            content: {
              title: `${plan.habit.emoji} ${plan.habit.name}`,
              body: "Check in when you’re done.",
              sound: false,
              categoryIdentifier: REMINDER_CATEGORY,
              data: {
                habitId: plan.habit.id,
                occurrenceDate: plan.date,
                date: plan.date,
                reminderTime: plan.habit.reminderTime,
              },
            },
            trigger: {
              type: n.SchedulableTriggerInputTypes.DATE,
              date: new Date(fireAt),
              channelId: "habits",
            },
          });
        }),
    });
    await n.clearLastNotificationResponse();
    try {
      publishWidget(await repo.snapshot(), dateKey());
    } catch {
      /* Widget refresh is separate from the saved check-in. */
    }
    return true;
  });
  actions = result.catch(() => undefined);
  return result;
}
export function subscribeReminderActions(
  onChange: () => void,
  onError: (error: unknown) => void,
) {
  let active = true;
  let remove = () => {};
  if (Platform.OS !== "web")
    void import("expo-notifications")
      .then((n) => {
        if (!active) return;
        const receive = (value: unknown) => {
          void handleReminderResponse(value)
            .then((changed) => {
              if (active && changed) onChange();
            })
            .catch((error) => {
              if (active) onError(error);
            });
        };
        const subscription = n.addNotificationResponseReceivedListener(receive);
        remove = () => subscription.remove();
        receive(n.getLastNotificationResponse());
      })
      .catch(onError);
  return () => {
    active = false;
    remove();
  };
}
