import type { HabitDraft } from "./models";

export function isDraftDirty(
  initial: HabitDraft,
  current: HabitDraft,
): boolean {
  const normalized = (draft: HabitDraft) =>
    JSON.stringify({
      name: draft.name.trim(),
      description: draft.description.trim(),
      emoji: draft.emoji.trim(),
      color: draft.color,
      weekdays: [...new Set(draft.weekdays)].sort((a, b) => a - b),
      reminderTime: draft.reminderTime,
      timeOfDay: draft.timeOfDay ?? "anytime",
    });
  return normalized(initial) !== normalized(current);
}
