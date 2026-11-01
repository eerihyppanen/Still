import { useEffect, useState } from "react";
import { AppState, Platform, View } from "react-native";
import { Button, Txt } from "./ui";
import {
  sendTestNotification,
  cancelTestNotification,
  getTestNotificationState,
  subscribeToTestNotification,
  type TestNotificationState,
} from "../notifications/expo-reminders";

export function TestReminder({
  enabled,
  busy,
}: {
  enabled: boolean;
  busy: boolean;
}) {
  const [status, setStatus] = useState<TestNotificationState>("idle");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    let removeListener = () => {};
    const refresh = async () => {
      try {
        const state = await getTestNotificationState();
        if (active) setStatus(state);
      } catch {
        if (active) setNotice("Could not check the test reminder. Try again.");
      }
    };
    void refresh();
    void subscribeToTestNotification(() => {
      if (active) {
        setNotice("");
        setStatus("delivered");
      }
    })
      .then((remove) => {
        if (active) removeListener = remove;
        else remove();
      })
      .catch(() => {
        if (active)
          setNotice(
            "Could not listen for the test reminder. Reopen Settings to retry.",
          );
      });
    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      active = false;
      removeListener();
      foreground.remove();
    };
  }, [enabled]);

  async function act(cancel: boolean) {
    setPending(true);
    setNotice("");
    try {
      if (cancel) {
        await cancelTestNotification();
        setNotice(
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
      setNotice(
        error instanceof Error
          ? error.message
          : "The test reminder could not be updated.",
      );
    } finally {
      setPending(false);
    }
  }
  if (Platform.OS === "web") return null;
  return (
    <View style={{ gap: 8 }}>
      <Button
        title="Send a test reminder"
        variant="secondary"
        disabled={!enabled || busy || status === "pending"}
        loading={pending}
        onPress={() => void act(false)}
      />
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
      <Txt size={13} muted accessibilityLiveRegion="polite">
        {notice ||
          (status === "pending"
            ? "Test reminder scheduled for about five seconds from now. Your phone may delay delivery."
            : status === "delivered"
              ? "Your test reminder was received."
              : enabled
                ? "Try a quiet test notification before relying on a habit reminder."
                : "Enable gentle reminders to send a test notification.")}
      </Txt>
    </View>
  );
}
