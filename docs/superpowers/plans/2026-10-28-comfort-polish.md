# Comfort polish Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; the user approved implementation and delegated routine choices.

**Goal:** Implement the six approved comfort improvements, excluding backup/restore.
**Architecture:** Pure draft/format helpers, existing SQLite settings and notification queue, SDK 58 navigation/localization/haptics APIs, shared form/dialog controls.
**Tech Stack:** Expo SDK 58, React Native, strict TypeScript, Expo Router, SQLite, local notifications.
**Spec:** ../specs/2026-10-28-comfort-polish-design.md

## Global Constraints

- Preserve the Desktop project, user data, version-1 schema, offline behavior, and prior ordering/navigation fixes.
- Use expo install for SDK-compatible dependencies and CNG for native generation; no hand edits in android/ios.
- No backup/restore, backend, account, or public tunnel. The earlier public-tunnel rejection remains in effect without explicit approval.
- Vibration starts off; test notifications require existing reminder consent and never alter repeating schedules.

## Review Focus

- Pristine/reverted drafts leave freely; failed saves and native/web navigation keep dirty drafts until explicit discard.
- A successful save/Save and open Settings does not become trapped by the guard.
- Midnight/noon, 12/24-hour changes, and malformed browser input preserve HH:MM storage.
- Haptic failures and disabled preference never break persistence or play on unchecking.
- Retesting, cancellation, foreground/background transitions, revocation and global-off never leave stale test requests or cancel habit reminders.

## Tasks

### 1. Form safety and calendar
Files: domain/habits.ts, domain/drafts.ts, app/habit-form.tsx, components/ui.tsx, ConfirmDialog.tsx, CalendarHistory.tsx; tests/drafts.test.ts.
- [x] Write/run failing tests for simultaneous field errors, normalized dirty comparisons, invalid drafts, schedule-order changes and reverting edits.
- [x] Implement getDraftErrors and isDraftDirty; wire inline errors/first-error scrolling and SDK 58 repeat/disable removal prevention.
- [x] Make calendar return-to-today restore month and selection; verify browser/native flows.
- [x] Run the whole test suite.

### 2. Time format and optional haptics
Files: domain/time-format.ts, components/ReminderTimeField.tsx, state/AppProvider.tsx, data/repository.ts, models.ts, feedback/check-in.ts, settings.tsx; time-format and SQLite tests.
- [x] Write/run failing time-format and new-setting persistence tests.
- [x] Install expo-localization and expo-haptics via Expo; implement device-aware display/picker and default-off persisted feedback, firing after successful new check-ins.
- [x] Run the whole test suite.

### 3. Test reminder
Files: notifications/test-reminder.ts, expo-reminders.ts, components/TestReminder.tsx, NotificationSettings.tsx; tests/test-reminder.test.ts.
- [x] Write/run failing driver tests for single pending test, permission rejection, failure cleanup, cancellation isolation, and disable reconciliation.
- [x] Implement serialized native test scheduling/status/listener/cancellation and the Settings controls.
- [x] Run the whole test suite.

### 4. Verification and delivery
- [x] Run TypeScript/lint/tests, SDK dependency validation/Doctor, all-platform exports, and a native build with the new modules.
- [x] Verify web guard/validation/calendar without modifying the user's existing habit; native dirty/clean/save/back, 12/24-hour picker, settings persistence, test delivery/cancellation, and haptics bridge.
- [x] Obtain focused independent review; address material findings with regressions. Update README, DEVELOPMENT, VERIFICATION and evidence.
- [x] Save the updated APK with matching signing identity, keep the earlier build, and leave the local web preview open. No public sharing without explicit tunnel approval.

This supplied folder has no Git metadata. Use source snapshots in .expo/comfort-originals and the adjacent progress ledger instead of Git-based worktree/commit helpers.
