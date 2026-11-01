export async function saveCheckIn(
  save: () => Promise<boolean>,
  feedback: () => Promise<void>,
  feedbackEnabled: boolean,
  complete: boolean,
): Promise<void> {
  const changed = await save();
  if (changed && complete && feedbackEnabled) {
    try {
      await feedback();
    } catch {
      /* Feedback must never undo a saved check-in. */
    }
  }
}
