// A test is separate from the repeating `still:` habit-reminder namespace.
export const TEST_REMINDER_ID = "still-test-reminder";
export interface TestReminderDriver {
  cancel(id: string): Promise<void>;
  schedule(id: string, seconds: number): Promise<void>;
}
export async function cancelTestReminder(driver: TestReminderDriver) {
  await driver.cancel(TEST_REMINDER_ID);
}
export async function sendTestReminder(
  driver: TestReminderDriver,
  permitted: boolean,
) {
  await cancelTestReminder(driver);
  if (!permitted)
    throw new Error(
      "Notifications are not allowed. Open device settings to allow them.",
    );
  try {
    await driver.schedule(TEST_REMINDER_ID, 5);
  } catch (error) {
    await cancelTestReminder(driver);
    throw error;
  }
}
