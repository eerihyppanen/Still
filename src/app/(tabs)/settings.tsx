import { useState } from "react";
import { Platform, Switch, View } from "react-native";
import { Card, Heading, Screen, Txt } from "../../components/ui";
import { useTheme, type ThemeMode } from "../../theme/ThemeProvider";
import { useApp } from "../../state/AppProvider";
import { HabitRow } from "../../components/HabitRow";
import { NotificationSettings } from "../../components/NotificationSettings";
import { ChoiceControl } from "../../components/ChoiceControl";
import { Disclosure } from "../../components/Disclosure";

const appearanceOptions: readonly { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function Settings() {
  const { mode, colors } = useTheme();
  const app = useApp();
  const archived = app.habits.filter((h) => h.archived);
  const [archivesExpanded, setArchivesExpanded] = useState(false);
  const [widgetExpanded, setWidgetExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  return (
    <Screen contentContainerStyle={{ gap: 14 }}>
      <Heading title="Settings" />
      <Card style={{ padding: 16 }}>
        <Txt weight="600">Appearance</Txt>
        <ChoiceControl
          options={appearanceOptions}
          value={mode}
          disabled={app.busy}
          onChange={(value) =>
            void app
              .saveSettings({ ...app.settings, theme: value })
              .catch(() => undefined)
          }
        />
      </Card>
      <NotificationSettings />
      <Card style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt weight="600">Check-in vibration</Txt>
            <Txt size={13} muted>
              {Platform.OS === "web"
                ? "Available on your phone."
                : "After a check-in saves."}
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
      </Card>
      <Disclosure
        title={`Archived habits (${archived.length})`}
        summary={
          archived.length ? "Restore or delete a habit" : "No archived habits"
        }
        expanded={archivesExpanded}
        onToggle={() => setArchivesExpanded((value) => !value)}
      >
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
          <Txt size={14} muted>
            Archive a habit from its details whenever you need a break.
          </Txt>
        )}
      </Disclosure>
      {Platform.OS === "android" && (
        <Disclosure
          title="Home-screen widget"
          summary="See Today on your home screen"
          expanded={widgetExpanded}
          onToggle={() => setWidgetExpanded((value) => !value)}
        >
          <Txt size={14} muted>
            Touch and hold your home screen, choose Widgets, then add Still —
            Today. It shows the saved date and progress. Open Still from the
            widget to refresh or check in.
          </Txt>
        </Disclosure>
      )}
      <Disclosure
        title="About Still"
        summary="Version 1.2.1 · Stored on this device"
        expanded={aboutExpanded}
        onToggle={() => setAboutExpanded((value) => !value)}
      >
        <Txt size={14} muted>
          One small step, every day.
        </Txt>
        <Txt size={14} muted>
          Works without internet. No account or cloud sync. The Android update
          excludes your app data from automatic backup and phone transfers.
          Uninstalling or losing this phone can lose your history.
        </Txt>
      </Disclosure>
    </Screen>
  );
}
