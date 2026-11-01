import * as TaskManager from "expo-task-manager";
import type { NotificationTaskPayload } from "expo-notifications";
import { NOTIFICATION_TASK } from "../notifications/actions";
import { handleReminderResponse } from "../notifications/response-handler";

TaskManager.defineTask<NotificationTaskPayload>(
  NOTIFICATION_TASK,
  async ({ data, error }) => {
    if (error) throw error;
    if (data && "actionIdentifier" in data) await handleReminderResponse(data);
  },
);
