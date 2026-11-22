import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { Button, Txt } from "./ui";
import {
  sendTestNotification,
  cancelTestNotification,
  getTestNotificationState,
  subscribeToTestNotification,
  type NotificationStatus,
  type TestNotificationState,
} from "../notifications/expo-reminders";

export function TestReminder({
  remindersEnabled,
  notificationStatus,
  busy,
}: {
  remindersEnabled: boolean;
  notificationStatus: NotificationStatus;
  busy: boolean;
}) {
  const canSend = remindersEnabled && notificationStatus.state === "ready";
  const [status, setStatus] = useState<TestNotificationState>("idle");
  const [pending, setPending] = useState(false);
  const [actionNotice, setActionNotice] = useState("");
  const [statusCheckFailed, setStatusCheckFailed] = useState(false);
  const [listenerSetupFailed, setListenerSetupFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let removeListener = () => {};
    const refresh = async () => {
      try {
        const state = await getTestNotificationState();
        if (active) {
          setStatus(state);
          setStatusCheckFailed(false);
        }
      } catch {
        if (active) setStatusCheckFailed(true);
      }
    };
    // A reminder sync can cancel a scheduled test while leaving a delivered one.
    void refresh();
    void subscribeToTestNotification(() => {
      if (active) {
        setActionNotice("");
        setStatus("delivered");
      }
    })
      .then((remove) => {
        if (active) {
          removeListener = remove;
          setListenerSetupFailed(false);
        } else {
          remove();
        }
      })
      .catch(() => {
        if (active) setListenerSetupFailed(true);
      });
    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      active = false;
      removeListener();
      foreground.remove();
    };
  }, [notificationStatus]);

  async function act(cancel: boolean) {
    setPending(true);
    setActionNotice("");
    try {
      if (cancel) {
        await cancelTestNotification();
        setActionNotice(
          status === "delivered"
            ? "Test notification cleared."
            : "Test reminder cancelled.",
        );
        setStatus("idle");
      } else {
        await sendTestNotification();
        setStatus("pending");
      }
    } catch (error) {
      setActionNotice(
        error instanceof Error
          ? error.message
          : "The test reminder could not be updated.",
      );
    } finally {
      setPending(false);
    }
  }
  const statusMessage =
    actionNotice ||
    (statusCheckFailed && "Could not check the test reminder.") ||
    (listenerSetupFailed && "Could not listen for the test reminder.") ||
    (status === "pending"
      ? "Test reminder scheduled. Your phone may delay delivery."
      : status === "delivered"
        ? "Test reminder received."
        : "");
  if (!canSend && !statusMessage) return null;

  return (
    <View style={{ gap: 8, alignItems: "flex-start" }}>
      {canSend && (
        <Button
          title="Send test reminder"
          variant="secondary"
          disabled={busy || status === "pending"}
          loading={pending}
          onPress={() => void act(false)}
        />
      )}
      {status !== "idle" && (
        <Button
          title={
            status === "pending"
              ? "Cancel test reminder"
              : "Clear test notification"
          }
          variant="secondary"
          disabled={busy || pending}
          onPress={() => void act(true)}
        />
      )}
      {statusMessage ? (
        <Txt size={13} muted accessibilityLiveRegion="polite">
          {statusMessage}
        </Txt>
      ) : null}
    </View>
  );
}
