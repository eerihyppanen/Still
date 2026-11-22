import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { Button, Txt } from "./ui";
import {
  sendTestNotification,
  cancelTestNotification,
  getTestNotificationState,
  subscribeToTestNotification,
  type TestNotificationState,
} from "../notifications/expo-reminders";

export function TestReminder({ busy }: { busy: boolean }) {
  const [status, setStatus] = useState<TestNotificationState>("idle");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
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
  }, []);

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
  const statusMessage =
    notice ||
    (status === "pending"
      ? "Test reminder scheduled. Your phone may delay delivery."
      : status === "delivered"
        ? "Test reminder received."
        : "");
  return (
    <View style={{ gap: 8, alignItems: "flex-start" }}>
      <Button
        title="Send test reminder"
        variant="secondary"
        disabled={busy || status === "pending"}
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
      {statusMessage ? (
        <Txt size={13} muted accessibilityLiveRegion="polite">
          {statusMessage}
        </Txt>
      ) : null}
    </View>
  );
}
