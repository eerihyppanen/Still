import { ActivityIndicator, View } from "react-native";
import { Button, Empty, Screen, Txt } from "./ui";
import { useApp } from "../state/AppProvider";
import { useTheme } from "../theme/ThemeProvider";
export function AppGate({ children }: React.PropsWithChildren) {
  const { loading, error, initialized, reload, clearError } = useApp();
  const { colors } = useTheme();
  if (loading)
    return (
      <Screen>
        <View style={{ paddingVertical: 100, alignItems: "center", gap: 16 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Txt muted>Opening your space…</Txt>
        </View>
      </Screen>
    );
  if (error && !initialized)
    return (
      <Screen>
        <Empty
          icon="cloud-offline-outline"
          title="Your habits couldn’t open"
          message={error}
          action={<Button title="Try again" onPress={() => void reload()} />}
        />
      </Screen>
    );
  return (
    <>
      {error && (
        <View
          accessibilityRole="alert"
          style={{ padding: 16, backgroundColor: colors.surface, gap: 8 }}
        >
          <Txt style={{ color: colors.danger }}>{error}</Txt>
          <Button variant="secondary" title="Dismiss" onPress={clearError} />
        </View>
      )}
      {children}
    </>
  );
}
