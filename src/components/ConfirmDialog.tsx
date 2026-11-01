import { Modal, View } from "react-native";
import { Button, Card, Txt } from "./ui";
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  busy,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#14102088",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          accessibilityViewIsModal
          aria-modal
          style={{ maxWidth: 420, width: "100%", alignSelf: "center" }}
        >
          <Card style={{ gap: 18 }}>
            <Txt accessibilityRole="header" size={23} weight="600">
              {title}
            </Txt>
            <Txt muted>{message}</Txt>
            <Button
              title={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              onPress={onConfirm}
              loading={busy}
            />
            <Button
              title={cancelLabel}
              variant="secondary"
              disabled={busy}
              onPress={onCancel}
            />
          </Card>
        </View>
      </View>
    </Modal>
  );
}
