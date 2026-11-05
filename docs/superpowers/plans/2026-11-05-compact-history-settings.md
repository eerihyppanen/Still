# Compact History and Settings Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this approved change in the existing checkout. Track the steps below.

**Goal:** Reduce scrolling in History and text in Settings, then commit and push to GitHub.

**Architecture:** Reuse the current screens, theme and Disclosure component. Add a shared choice control and an opt-in compact habit row; preserve all storage and reminder behavior.

**Tech Stack:** Expo SDK 58, React Native 0.88, strict TypeScript, Expo Router.

**Spec:** `docs/superpowers/specs/2026-11-05-compact-history-settings-design.md`

## Global constraints

- Preserve the offline-only app, existing user data and SQLite schema.
- Add no dependencies; preserve current native notification behavior.
- Keep the existing palette and comfortable touch targets; allow text to wrap.
- Use the requested Desktop checkout. The user's approval covers implementation and a GitHub push.

## Review focus

- Today links must show Calendar even after visiting Insights.
- Calendar date/month selection must survive switching views.
- Calendar checkboxes and habit-detail actions must remain distinct.
- Reminder denial/errors must stay visible with recovery actions outside collapsed help.
- Narrow widths, large text, dark theme, and archived habits must remain usable.

## Task 1: Compact layouts

**Files:** `src/components/ChoiceControl.tsx`, `src/components/Disclosure.tsx`, `src/components/HabitRow.tsx`, `src/components/CalendarHistory.tsx`, `src/app/(tabs)/history.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/settings.tsx`, `src/components/NotificationSettings.tsx`.

**Interfaces:** ChoiceControl accepts readonly labeled choices, current value, change callback, and disabled state. HabitRow gains an optional compact flag. CalendarHistory accepts optional controlled `selectedDate` and `onDateChange`; the displayed month derives from the date. History uses `date` and `view` search parameters; Today supplies `view: calendar` with date links.

- [x] Confirm baseline checks and current layouts.
- [x] Add the shared selector, compact calendar rows, and Calendar / Insights views.
- [x] Simplify Settings and fold help, archives, widget instructions and About into disclosures.
- [x] Run `npm run check` (strict TypeScript, lint, 90 tests passing).
- [x] Verify browser-supported review-focus flows at phone widths, plus reload persistence and expanded help. Native permission/delivery and large device text remain runtime checks.
- [x] Export the Android bundle (passed), update README, DEVELOPMENT and VERIFICATION with observed results.
- [x] Review the final diff and resolve the review findings.

**Delivery:** Commit the verified changes, push to origin/main as requested, and compare the remote and local commit IDs.

## Execution notes

This is a reversible UI change. Following the project guidance, use functional browser checks and the existing suite instead of adding tests that mirror JSX. Work in the clean existing checkout; preserve the established main-branch delivery flow. No new APK is requested.

Ruling: fix the repeated Today date-link issue found during review. Reproduced the wrong day in the browser before changing it. Route-controlled selection fixes the link while preserving keyboard focus; observed focus remains on the date button after keyboard activation. Removed the former duplicate month state because month navigation always selects a date within its target month.
