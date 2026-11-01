# Offline Phone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task by task. One final independent read-only review.

**Goal:** Deliver device-only privacy, reminder actions, optional day groups, and an Android widget in an update APK.

**Architecture:** Keep schema 1 and its serialized SQLite repository authoritative. Share one repository connection between app and background actions. Put SDK-specific notification/widget code behind platform integration modules; generate native policy through config plugins.

**Tech Stack:** Expo SDK 58, strict TypeScript, React Native, Expo SQLite/Notifications/TaskManager/Widgets, Android config plugins.

**Spec:** `docs/superpowers/specs/2026-10-30-offline-phone-design.md`

## Global constraints

- Offline only; no accounts, backend, analytics, or backup/restore UI.
- Preserve existing data, schema 1, package and signing key; never hand-edit generated native files.
- Existing habits are Anytime; Snooze is ten minutes. Do not mark stale reminders complete today.
- Keep Android/iOS/web bundles compiling; widget is Android only for this delivery.

## Review focus

- Cold/background action replay must not create duplicate check-ins or snoozes.
- Snoozes for a deleted/archived/disabled habit must be cancelled.
- Day changes must not silently apply yesterday's notification to today.
- Upgrade must retain schedules, check-ins, order, and settings.
- Widget display must not silently replace authoritative SQLite state or imply stale data is current.

### Task 1: Groups and persistence

- [x] Add failing tests for group ordering/defaults, validation/dirty state, SQLite reopen/archive/delete preservation.
- [x] Add optional timeOfDay model/draft field and pure grouping helper. Store `habitTimeOfDay:<id>` metadata in the existing habit-save transaction; remove on delete.
- [x] Add form choice, grouped Today sections, detail label. Run tests and check.

### Task 2: Reminder actions

- [x] Add failing pure action tests for current vs stale days, idempotent completion, snooze delay, disabled/archived/deleted/completed rejection, cancellation ownership.
- [x] Extract shared repository connection; add module-level background task entry point using SDK 58 docs.
- [x] Register Done/Snooze category; reconcile owned snoozes alongside recurring reminders without touching test requests. Subscribe/refresh app UI; surface errors without marking failed writes complete.
- [x] Run tests and check.

### Task 3: Android widget and standalone privacy

- [x] Install SDK-compatible recommended native dependencies through Expo; inspect current source/type contracts.
- [x] Implement dated widget snapshot from real scheduled habits/completions, native interaction/opening, and platform fallback. Verify empty/long-name/truncated list handling with pure snapshot tests.
- [x] Add tested config plugin for backup/transfer exclusions and release-only network-permission removal. Apply with prebuild; inspect resulting release manifest.
- [x] Bump to 1.1.0 / Android versionCode 2; keep previous package and signing certificate. Run tests, check, exports.

### Task 4: Phone delivery and verification

- [x] Seed disposable habit/check-in with the previous APK on the emulator. Install the new APK over it, verify retained data and new groups, notification Done/Snooze/cancellation, widget add/open/update, and offline launch.
- [x] Run final independent source review; fix important findings; rerun affected checks.
- [x] Await QA deletion, cold-reopen, restore emulator settings and stop the emulator started for QA.
- [x] Save final APK under `.expo/phone-apk/Still-1.1.0-offline.apk`; verify signing/hash. Update README, DEVELOPMENT, VERIFICATION with actual results and phone installation instructions.
