import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import {
  useRouter,
  Stack,
  useLocalSearchParams,
  usePreventRemove,
} from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Disclosure } from "../components/Disclosure";
import { ChoiceControl } from "../components/ChoiceControl";
import { useHeaderHeight } from "expo-router/react-navigation";
import { Button, Card, FieldError, Screen, Txt, s } from "../components/ui";
import { useApp } from "../state/AppProvider";
import { useTheme } from "../theme/ThemeProvider";
import {
  HABIT_COLORS,
  HABIT_EMOJIS,
  WEEKDAYS,
  type Weekday,
  type HabitDraft,
  type TimeOfDay,
} from "../domain/models";
import { TIME_GROUPS } from "../domain/groups";
import { getDraftErrors, scheduleOn, validateDraft } from "../domain/habits";
import { isDraftDirty } from "../domain/drafts";
import { isHabitEmoji } from "../domain/emoji";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ReminderTimeField } from "../components/ReminderTimeField";
import { getHabitReminderFeedback } from "../notifications/habit-reminder-status";
export default function HabitForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const app = useApp();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const { width } = useWindowDimensions();
  const habit = app.habits.find((h) => h.id === id);
  const schedule = habit && scheduleOn(habit, app.today);
  const [name, setName] = useState(habit?.name ?? ""),
    [description, setDescription] = useState(habit?.description ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? HABIT_EMOJIS[0]!),
    [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0]!);
  const [weekdays, setWeekdays] = useState<Weekday[]>(
    schedule && schedule.weekdays.length
      ? schedule.weekdays
      : [0, 1, 2, 3, 4, 5, 6],
  );
  const [flexible, setFlexible] = useState(schedule?.weeklyTarget !== undefined);
  const [weeklyTarget, setWeeklyTarget] = useState(schedule?.weeklyTarget ?? 3);
  const [reminder, setReminder] = useState(!!habit?.reminderTime),
    [time, setTime] = useState(habit?.reminderTime ?? "09:00");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(
    habit?.timeOfDay ?? "anytime",
  );
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const descriptionRef = useRef<ComponentRef<typeof TextInput>>(null);
  const reminderRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [expanded, setExpanded] = useState({
    appearance: false,
    reason: false,
    reminder: false,
  });
  const [invalidField, setInvalidField] = useState<keyof HabitDraft | null>(
    null,
  );
  const emojiRef = useRef<ComponentRef<typeof TextInput>>(null);
  const fieldY = useRef<Partial<Record<keyof HabitDraft, number>>>({});
  const draft: HabitDraft = {
    name,
    description,
    emoji,
    color,
    weekdays,
    weeklyTarget: flexible ? weeklyTarget : undefined,
    reminderTime: reminder ? time : null,
    timeOfDay,
  };
  const [initialDraft] = useState(() => draft);
  const errors = submitted ? getDraftErrors(draft) : {};
  const previewEmoji = isHabitEmoji(emoji) ? emoji.trim() : HABIT_EMOJIS[0]!;
  const disablePrevention = usePreventRemove(
    isDraftDirty(initialDraft, draft) && !allowLeave && (!id || !!habit),
    ({ repeat }) => setPendingLeave(() => repeat),
  );
  const reminderFeedback = getHabitReminderFeedback(
    app.notificationStatus,
    app.settings.remindersEnabled,
    habit?.archived,
  );
  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
  ];
  useEffect(() => {
    if (!invalidField) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, (fieldY.current[invalidField] ?? 0) - 12),
        animated: true,
      });
      if (invalidField === "name") nameRef.current?.focus();
      if (invalidField === "emoji") emojiRef.current?.focus();
      if (invalidField === "description") descriptionRef.current?.focus();
      if (invalidField === "reminderTime") reminderRef.current?.focus();
      setInvalidField(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [invalidField, expanded]);
  async function save(openSettings = false) {
    setSubmitted(true);
    setError("");
    const fieldErrors = getDraftErrors(draft);
    const first = (
      [
        "name",
        "weekdays",
        "weeklyTarget",
        "emoji",
        "color",
        "description",
        "reminderTime",
      ] as const
    ).find((field) => fieldErrors[field]);
    if (first) {
      setExpanded((value) => ({
        appearance:
          value.appearance || !!(fieldErrors.emoji || fieldErrors.color),
        reason: value.reason || !!fieldErrors.description,
        reminder: value.reminder || !!fieldErrors.reminderTime,
      }));
      setInvalidField(first);
      return;
    }
    try {
      await app.saveHabit(validateDraft(draft), id);
      setAllowLeave(true);
      disablePrevention();
      if (openSettings) router.replace("/(tabs)/settings");
      else router.back();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save your habit. Try again.",
      );
    }
  }
  if (id && !habit)
    return (
      <Screen>
        <Txt>This habit no longer exists.</Txt>
        <Button title="Close" onPress={() => router.back()} />
      </Screen>
    );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : Platform.OS === "android"
            ? "height"
            : undefined
      }
      keyboardVerticalOffset={Platform.OS === "android" ? headerHeight : 0}
    >
      <Stack.Screen
        options={{
          title: id ? "Edit habit" : "New habit",
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              disabled={app.busy}
              onPress={() => router.back()}
              style={{ padding: 12 }}
            >
              <Txt style={{ color: colors.primary }}>Cancel</Txt>
            </Pressable>
          ),
        }}
      />
      <Screen
        scrollRef={scrollRef}
        contentContainerStyle={{ gap: 16, paddingTop: 20, paddingBottom: 24 }}
      >
        <View
          style={{ gap: 9 }}
          onLayout={(event) => {
            fieldY.current.name = event.nativeEvent.layout.y;
          }}
        >
          <Txt weight="600">Habit name</Txt>
          <TextInput
            ref={nameRef}
            accessibilityLabel="Habit name"
            accessibilityHint={errors.name}
            placeholder="e.g. Read a few pages"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            maxLength={80}
            style={[inputStyle, errors.name && { borderColor: colors.danger }]}
            autoCapitalize="sentences"
            returnKeyType="done"
          />
          <FieldError message={errors.name} />
        </View>
        <View
          onLayout={(event) => {
            fieldY.current.weekdays = fieldY.current.weeklyTarget =
              event.nativeEvent.layout.y;
          }}
        >
          <Card>
            <Txt weight="600">Schedule</Txt>
            <ChoiceControl
              options={[
                { value: "fixed", label: "Specific days" },
                { value: "flexible", label: "Weekly goal" },
              ]}
              value={flexible ? "flexible" : "fixed"}
              onChange={(value) => setFlexible(value === "flexible")}
            />
            {flexible ? (
              <>
                <View style={[s.row, { gap: 8 }]}>
                  <Button
                    title="−"
                    accessibilityLabel="Decrease days per week"
                    variant="secondary"
                    disabled={weeklyTarget === 1}
                    onPress={() => setWeeklyTarget((days) => Math.max(1, days - 1))}
                  />
                  <Txt
                    weight="600"
                    style={{ flexShrink: 1, textAlign: "center" }}
                    accessibilityLiveRegion="polite"
                  >
                    {weeklyTarget} {weeklyTarget === 1 ? "day" : "days"} per week
                  </Txt>
                  <Button
                    title="+"
                    accessibilityLabel="Increase days per week"
                    variant="secondary"
                    disabled={weeklyTarget === 7}
                    onPress={() => setWeeklyTarget((days) => Math.min(7, days + 1))}
                  />
                </View>
                <Txt size={13} muted>
                  Check in on any days. Weeks start on Monday.
                  {id ? " Changes apply from today." : ""}
                </Txt>
                <FieldError message={errors.weeklyTarget} />
              </>
            ) : (
              <>
                <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
                  <Txt size={14} muted>Pick the days you plan to check in.</Txt>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setWeekdays([0, 1, 2, 3, 4, 5, 6])}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Txt size={14} style={{ color: colors.primary }}>
                      Every day
                    </Txt>
                  </Pressable>
                </View>
                <View style={[s.row, { gap: 3, flexWrap: "wrap" }]}>
                  {WEEKDAYS.map((day) => (
                    <Pressable
                      key={day.value}
                      accessibilityRole="checkbox"
                      accessibilityLabel={day.label}
                      accessibilityState={{ checked: weekdays.includes(day.value) }}
                      aria-checked={weekdays.includes(day.value)}
                      onPress={() =>
                        setWeekdays((days) =>
                          days.includes(day.value)
                            ? days.filter((d) => d !== day.value)
                            : [...days, day.value],
                        )
                      }
                      style={{
                        minWidth: 44,
                        minHeight: 46,
                        flex: 1,
                        flexBasis: width < 420 ? "22%" : undefined,
                        borderRadius: 14,
                        backgroundColor: weekdays.includes(day.value)
                          ? colors.primary
                          : colors.background,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Txt
                        weight="600"
                        style={{
                          color: weekdays.includes(day.value)
                            ? colors.onPrimary
                            : colors.muted,
                        }}
                      >
                        {day.short}
                      </Txt>
                    </Pressable>
                  ))}
                </View>
                {id && <Txt size={13} muted>Changes apply from today.</Txt>}
                <FieldError message={errors.weekdays} />
              </>
            )}
          </Card>
        </View>
        <Card>
          <Txt weight="600">Time of day</Txt>
          <Txt size={13} muted>
            Optional: group this habit on Today.
          </Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[TIME_GROUPS[3]!, ...TIME_GROUPS.slice(0, 3)].map((group) => (
              <Pressable
                key={group.key}
                accessibilityRole="radio"
                accessibilityLabel={`${group.title} group`}
                accessibilityState={{ checked: timeOfDay === group.key }}
                aria-checked={timeOfDay === group.key}
                onPress={() => setTimeOfDay(group.key)}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor:
                    timeOfDay === group.key
                      ? colors.primary
                      : colors.background,
                }}
              >
                <Txt
                  size={14}
                  style={{
                    color:
                      timeOfDay === group.key ? colors.onPrimary : colors.text,
                  }}
                >
                  {group.title}
                </Txt>
              </Pressable>
            ))}
          </View>
        </Card>
        <Disclosure
          title="Appearance"
          summary={
            previewEmoji +
            " · " +
            (["Lavender", "Teal", "Rose", "Ochre", "Blue", "Olive"][
              HABIT_COLORS.indexOf(color)
            ] ?? "Custom color")
          }
          expanded={expanded.appearance}
          disabled={app.busy}
          onToggle={() =>
            setExpanded((value) => ({
              ...value,
              appearance: !value.appearance,
            }))
          }
          onLayout={(event) => {
            fieldY.current.emoji = fieldY.current.color =
              event.nativeEvent.layout.y;
          }}
        >
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 24,
                backgroundColor: color + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt size={36}>{previewEmoji}</Txt>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            <Txt weight="600">Choose an icon</Txt>
            <View style={styles.wrap}>
              {HABIT_EMOJIS.map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`Icon ${value}`}
                  accessibilityState={{ selected: emoji.trim() === value }}
                  {...(Platform.OS === "web"
                    ? { "aria-pressed": emoji.trim() === value }
                    : {})}
                  onPress={() => setEmoji(value)}
                  style={[
                    styles.choice,
                    {
                      backgroundColor:
                        emoji.trim() === value ? colors.tint : colors.surface,
                      borderColor:
                        emoji.trim() === value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Txt size={25}>{value}</Txt>
                </Pressable>
              ))}
            </View>
            <Txt size={14} weight="600">
              Or use your own emoji
            </Txt>
            <FieldError message={errors.emoji} />
            <TextInput
              ref={emojiRef}
              accessibilityLabel="Your emoji"
              accessibilityHint={
                errors.emoji || "Type or paste one emoji using your keyboard."
              }
              value={emoji}
              onChangeText={setEmoji}
              maxLength={64}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
              placeholder="e.g. 🦋"
              placeholderTextColor={colors.muted}
              style={[
                inputStyle,
                { fontSize: 25 },
                errors.emoji && { borderColor: colors.danger },
              ]}
            />
            <Txt size={13} muted>
              Use your keyboard’s emoji picker, or paste one emoji here.
            </Txt>
          </View>
          <View style={{ gap: 10 }}>
            <Txt weight="600">Color</Txt>
            <View style={styles.wrap}>
              {HABIT_COLORS.map((value, i) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={
                    ["Lavender", "Teal", "Rose", "Ochre", "Blue", "Olive"][i]
                  }
                  accessibilityState={{ selected: color === value }}
                  {...(Platform.OS === "web"
                    ? { "aria-pressed": color === value }
                    : {})}
                  onPress={() => setColor(value)}
                  style={[
                    styles.choice,
                    {
                      borderColor:
                        color === value ? colors.primary : "transparent",
                      borderWidth: 2,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: value,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {color === value && (
                      <Txt style={{ color: "#FFFFFF" }}>✓</Txt>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
            <FieldError message={errors.color} />
          </View>
        </Disclosure>
        <Disclosure
          title="Notes"
          summary={description.trim() || "Optional details"}
          expanded={expanded.reason}
          disabled={app.busy}
          onToggle={() =>
            setExpanded((value) => ({ ...value, reason: !value.reason }))
          }
          onLayout={(event) => {
            fieldY.current.description = event.nativeEvent.layout.y;
          }}
        >
          <View style={{ gap: 9 }}>
            <Txt weight="600">
              Notes{" "}
              <Txt muted size={13}>
                (optional)
              </Txt>
            </Txt>
            <TextInput
              ref={descriptionRef}
              accessibilityLabel="Description"
              accessibilityHint={errors.description}
              placeholder="Add a note about this habit"
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              style={[inputStyle, { minHeight: 92, textAlignVertical: "top" }]}
            />
            <FieldError message={errors.description} />
          </View>
        </Disclosure>
        <Disclosure
          title="Reminder"
          summary={reminder ? "Time selected" : "No reminder"}
          expanded={expanded.reminder}
          disabled={app.busy}
          onToggle={() =>
            setExpanded((value) => ({ ...value, reminder: !value.reminder }))
          }
          onLayout={(event) => {
            fieldY.current.reminderTime = event.nativeEvent.layout.y;
          }}
        >
          <View>
            <View style={{ gap: 12 }}>
              <View style={s.row}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt weight="600">Reminder</Txt>
                  <Txt size={13} muted>
                    Optional, in your local time.
                  </Txt>
                </View>
                <Switch
                  accessibilityLabel="Habit reminder"
                  value={reminder}
                  onValueChange={setReminder}
                  trackColor={{ true: colors.primary }}
                />
              </View>
              {reminder && (
                <>
                  <ReminderTimeField
                    value={time}
                    onChange={setTime}
                    inputRef={reminderRef}
                  />
                  <FieldError message={errors.reminderTime} />
                  {flexible && (
                    <Txt size={13} muted>
                      Reminds you daily until you meet your weekly goal.
                    </Txt>
                  )}
                  <Txt size={13} muted accessibilityLiveRegion="polite">
                    {reminderFeedback.message}
                  </Txt>
                  {reminderFeedback.needsSettings && (
                    <Button
                      title="Save and open Settings"
                      variant="secondary"
                      loading={app.busy}
                      onPress={() => void save(true)}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </Disclosure>
      </Screen>
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 680,
            alignSelf: "center",
            paddingHorizontal: 24,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          {!!error && (
            <Txt accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Txt>
          )}
          <Button
            title={id ? "Save changes" : "Create habit"}
            onPress={() => void save()}
            loading={app.busy}
          />
        </View>
      </SafeAreaView>
      <ConfirmDialog
        visible={!!pendingLeave}
        title="Discard your changes?"
        message="Your changes to this habit haven’t been saved."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        busy={app.busy}
        onCancel={() => setPendingLeave(null)}
        onConfirm={() => {
          setAllowLeave(true);
          const repeat = pendingLeave;
          setPendingLeave(null);
          repeat?.();
        }}
      />
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  input: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
