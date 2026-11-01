import emojiRegex from "emoji-regex";

export function isHabitEmoji(value: string): boolean {
  const emoji = value.trim();
  if (!emoji || emoji.length > 64) return false;
  return emojiRegex().exec(emoji)?.[0] === emoji;
}
