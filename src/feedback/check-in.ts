import { Platform } from "react-native";

export async function playCheckInFeedback(): Promise<void> {
  if (Platform.OS === "web") return;
  const haptics = await import("expo-haptics");
  if (Platform.OS === "android")
    await haptics.performAndroidHapticsAsync(haptics.AndroidHaptics.Clock_Tick);
  else await haptics.selectionAsync();
}
