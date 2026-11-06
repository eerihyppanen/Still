import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Empty, Screen, Txt } from "./ui";
import { StillMark } from "./StillMark";
import { useApp } from "../state/AppProvider";
import { useTheme } from "../theme/ThemeProvider";
export function AppGate({ children }: React.PropsWithChildren) {
  const { loading, error, initialized, reload, clearError } = useApp();
  const { colors } = useTheme();
  if (loading)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: colors.background,
        }}
      >
        <StillMark size={96} />
        <View style={{ alignItems: "center", gap: 12, marginTop: 24 }}>
          <ActivityIndicator color={colors.primary} />
          <Txt
            muted
            accessibilityLiveRegion="polite"
            style={{ textAlign: "center" }}
          >
            Loading Still…
          </Txt>
        </View>
      </SafeAreaView>
    );
  if (error && !initialized)
    return (
      <Screen>
        <Empty
          icon="alert-circle-outline"
          title="Couldn’t load your habits"
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
