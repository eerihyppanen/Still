# Daily-use polish Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Steps use checkboxes for tracking.

**Goal:** Compact Today, explain reminder readiness accurately, and persist a user-selected habit order.

**Architecture:** Keep the existing Expo Router, SQLite repository, and reminder engine. Store habit ordering as private settings metadata, expose movement through AppProvider, and derive reminder feedback in a pure function.

**Tech Stack:** Expo SDK 58, React Native 0.88, strict TypeScript, Expo Router, Expo SQLite; no new dependencies.

**Spec:** ../specs/2026-10-28-daily-polish-design.md

## Global Constraints

- Work in C:\Users\eehyp\Desktop\Still; preserve existing data and offline operation.
- Keep palette, navigation, check-in calculations, notification scheduling, and database schema version 1.
- No generated native source edits or new dependencies.
- The user approved implementation; make routine decisions independently.

## Review Focus

- Saved order must not lose or duplicate habits, including stale IDs and corrupt metadata.
- Archive/restore, new habits, deletion, settings changes, and concurrent moves must preserve a sensible order and existing history.
- A ready notification system does not imply that an unsaved draft is already scheduled.
- Saving before opening Settings must preserve form data and respect validation failures.
- Narrow screens and large text must retain visible controls and readable labels.

## Task 1: Persistent order

Files: tests/repository.test.ts, src/data/repository.ts, src/state/AppProvider.tsx, src/app/(tabs)/habits.tsx.

Interface: HabitRepository.moveHabit(id: string, direction: "up" | "down"): Promise<void>; expose the same through useApp. Snapshot habits are returned in saved order.

- [x] Add integration tests for cold reopen, boundaries, unknown/archived IDs, metadata fallback, archive/restore, new/deleted habits, concurrent moves, and unrelated settings/history preservation.
- [x] Run the tests and confirm new movement cases fail because moveHabit is missing.
- [x] Implement ordered snapshots and transactional adjacent active-habit moves using settings.habitOrder; add accessible Reorder mode and Up/Down controls.
- [x] Run npm test; expect all tests to pass.

## Task 2: Reminder feedback

Files: tests/habit-reminder-status.test.ts, src/notifications/habit-reminder-status.ts, src/app/habit-form.tsx.

Interface: getHabitReminderFeedback(status: NotificationStatus, enabled: boolean, archived?: boolean) returns { message: string; needsSettings: boolean }.

- [x] Test off, ready, denied, unsupported, error, transient checking, archived, and stale ready/global-off combinations; ready copy must require saving.
- [x] Run the new tests; expect the missing helper to fail.
- [x] Implement the helper and live form feedback. A secondary Save and open Settings action validates and saves before router.replace to Settings; the normal save route remains unchanged.
- [x] Run npm test; expect all tests to pass.

## Task 3: Compact Today and verification

Files: src/components/ui.tsx, src/app/(tabs)/index.tsx, README.md, DEVELOPMENT.md, VERIFICATION.md.

- [x] Give Screen an optional contentContainerStyle; apply compact spacing only to Today. Reduce greeting/week/progress height, hide empty progress, and move New habit into an accessible header action.
- [x] Run npm run check, time-zone tests, and all-platform export; expect success.
- [x] Review Android first launch, populated Today, reorder/cold reopen, reminder off/ready feedback and save-to-settings; include narrow/large-text inspection where possible. Remove only QA-created data.
- [x] Obtain focused independent source review, address material findings, and update verification with actual evidence.
- [x] Build and test an updated standalone APK, retain the earlier APK as a backup, and provide the updated local Wi-Fi download.

No Git metadata is present in this supplied project folder, so worktree/commit helper scripts do not apply. Keep progress in the adjacent ledger and use saved source snapshots for review instead.
