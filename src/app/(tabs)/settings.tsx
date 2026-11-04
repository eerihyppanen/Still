import { Platform, Switch, View } from "react-native";
import {
  Button,
  Card,
  Heading,
  Screen,
  Section,
  Txt,
} from "../../components/ui";
import { useTheme, type ThemeMode } from "../../theme/ThemeProvider";
import { useApp } from "../../state/AppProvider";
import { HabitRow } from "../../components/HabitRow";
import { NotificationSettings } from "../../components/NotificationSettings";
export default function Settings() {
  const { mode, colors } = useTheme();
  const app = useApp();
  const archived = app.habits.filter((h) => h.archived);
  return (
    <Screen>
      <Heading
        title="Make it yours"
        subtitle="A little space for your preferences."
      />
      <Card>
        <Txt size={20} weight="600">
          Appearance
        </Txt>
        <View style={{ gap: 8 }}>
          {(["light", "dark", "system"] as ThemeMode[]).map((value) => (
            <Button
              key={value}
              title={`${value[0]?.toUpperCase()}${value.slice(1)}${mode === value ? " ✓" : ""}`}
              variant={mode === value ? "primary" : "secondary"}
              disabled={app.busy}
              onPress={() =>
                void app
                  .saveSettings({ ...app.settings, theme: value })
                  .catch(() => undefined)
              }
            />
          ))}
        </View>
      </Card>
      <NotificationSettings />
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt size={20} weight="600">
              Check-in feedback
            </Txt>
            <Txt size={13} muted>
              A gentle vibration after a check-in saves.
            </Txt>
          </View>
          <Switch
            accessibilityLabel="Check-in vibration"
            value={!!app.settings.hapticsEnabled}
            disabled={app.busy || Platform.OS === "web"}
            trackColor={{ true: colors.primary }}
            onValueChange={(value) =>
              void app
                .saveSettings({ ...app.settings, hapticsEnabled: value })
                .catch(() => undefined)
            }
          />
        </View>
        {Platform.OS === "web" && (
          <Txt size={13} muted>
            Vibration is available in the Android and iOS app.
          </Txt>
        )}
      </Card>
      <Section title="Archived habits" aside={`${archived.length}`} />
      {Platform.OS === "android" && (
        <Card>
          <Txt size={20} weight="600">
            Home-screen widget
          </Txt>
          <Txt size={13} muted>
            Touch and hold your home screen, choose Widgets, then add Still —
            Today. It shows the saved date and progress. Open Still from the
            widget to refresh or check in.
          </Txt>
        </Card>
      )}
      {archived.length ? (
        <View style={{ gap: 12 }}>
          {archived.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              subtitle="Open to restore or delete"
            />
          ))}
        </View>
      ) : (
        <Card>
          <Txt muted>
            No archived habits. Taking a break is always an option.
          </Txt>
        </Card>
      )}
      <Card>
        <Txt size={22} weight="600">
          Still
        </Txt>
        <Txt muted>One small step, every day.</Txt>
        <Txt size={13} muted>
          Your habits stay on this device. Version 1.2.0
        </Txt>
        <Txt size={13} muted>
          Works without internet. No account or cloud sync. The Android update
          excludes your app data from automatic backup and phone transfers.
          Uninstalling or losing this phone can lose your history.
        </Txt>
      </Card>
    </Screen>
  );
}
