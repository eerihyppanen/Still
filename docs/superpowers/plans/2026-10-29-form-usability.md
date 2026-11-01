# Habit Form Usability Implementation Plan

> Execute inline using superpowers:executing-plans and test-driven-development; obtain one focused final review.

**Goal:** Make editing easy to find and creating/saving a habit require less scrolling.
**Architecture:** Detail header action, a keyboard-aware safe-area form footer, and a reusable controlled disclosure component. Parent-owned drafts and existing persistence remain unchanged.
**Tech Stack:** Expo SDK 58 / Router, React Native, strict TypeScript, existing SQLite.
**Spec:** ../specs/2026-10-29-form-usability-design.md

## Review focus

- Hidden invalid fields reveal and focus in visible form order; a failed save keeps the whole draft.
- Collapsing, reopening, and unsaved navigation preserve emoji/reason/reminder values.
- Footer stays visible with keyboard, bottom insets, small screens, and large system text; scroll content remains reachable.
- Both normal save and Save and open Settings bypass the guard only after persistence succeeds.
- Header Edit appears only for an existing habit and uses the context-bound Router hook.

## Task 1 — layout and behavior

- [x] Record UI baseline: Edit below calendar, primary Save below viewport, and appearance preceding schedule. These are the failing interaction checks for the requested UI change; do not add source-text or style-mirroring unit tests.
- [x] Add components/Disclosure.tsx with controlled expanded state and accessible summaries; preserve children values in habit-form parent state.
- [x] Move Edit into habit detail's header, remove its old bottom action, and clear header actions for a missing habit.
- [x] Reorder habit form into name/schedule, collapsed optional sections; put primary action/error in a safe-area sibling footer inside keyboard avoidance. Reveal hidden invalid sections and focus/scroll after expansion.
- [x] Run strict TypeScript/lint/full 56-test suite. Verify default/collapsed/expanded/invalid/save/discard browser flows without modifying personal habits.

## Task 2 — verification and delivery

- [x] Export Android/iOS/web, build an updated standalone APK from the existing generated project without native hand edits, and verify matching signing identity.
- [x] Android: header Edit, essential form visibility, keyboard/CTA position, collapsed value retention/error reveal, save/recovery/discard, and display navigation regressions. Restore QA data/preferences/display.
- [x] Focused independent review, resolve findings, update README/DEVELOPMENT/VERIFICATION and ledger. Leave Desktop preview ready. Preserve older APKs.

The folder has no Git metadata; preserve originals in .expo/form-usability-originals, use a progress ledger instead of commits/worktrees, and keep unrelated previews untouched.
