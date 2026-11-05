# Implementation phases

## Compact History and Settings — November 5, 2026

History now separates Calendar and Insights. The calendar retains comfortable date buttons and uses shorter habit rows with separate detail and check-in actions. Its selected date is controlled by the History route, while the habit-detail calendar keeps local selection. This also fixes repeated Today date links leaving an older browsed date selected, without remounting the calendar or losing keyboard focus.

Settings uses one shared choice control for appearance, compact reminder/vibration rows, and expandable Reminder help, archived habits, Android widget instructions, and About. Permission recovery and retry actions remain visible outside the help section. Browser accessibility exposes selected choices and expanded sections. Storage, notification scheduling, native dependencies and app version are unchanged.

See VERIFICATION.md for the actual checks and browser results. This is a source update; the existing APK does not include it.

## Icon and drag reordering — October 30, 2026 (source update)

The leaf is now a single centered silhouette with an internal vein. `assets/leaf.svg` is the editable master, and `scripts/generate-brand-assets.cjs` renders app/favicon PNGs, safe-zone Android foreground/monochrome PNGs, and transparent light/dark splash marks. The render tool is a pinned, temporary `@resvg/resvg-js@2.6.2` npm tool; it is not an app dependency. Pass its cached module directory to the script. The app's package/version and offline policy are unchanged. Native resources will be generated from `app.json` on the next requested build; no APK or native prebuild was run for this update.

Habits → Reorder uses `ReorderHabits.tsx`, built-in PanResponder and Animated transforms. A dedicated grip keeps normal scrolling separate. Actual row heights drive the pure insertion-slot calculation in `src/domain/reorder.ts`; surrounding rows animate only when the target slot changes. Edge scrolling accounts for scroll movement while the pointer stays still. Interrupted gestures reset, decorative motion respects reduced motion, and keyboard/screen-reader actions use the same save operation. The message region retains its largest measured height to avoid shifting the list while dragging. The web scrollbar gutter remains stable while scrolling is disabled during a drag.

On drop, `HabitRepository.reorderHabits(ids)` validates the complete active ID set and saves once in a serialized transaction, retaining archived slots. Stale orders fail explicitly and the UI restores saved state. This uses existing settings metadata and leaves schema 1, check-ins, schedules, and preferences intact. Browser tests and native checks still pending are recorded in VERIFICATION.md.

## Offline phone additions — October 30, 2026

Version 1.1 adds optional time-of-day groups in existing SQLite settings metadata, Done/Snooze notification actions with a module-level TaskManager entry point, and an Android widget using SDK 58's recommended Expo Widgets/Expo UI modules. A shared repository connection is used by app and background actions. Atomic Done receipts and persisted absolute snooze deadlines prevent replays from undoing a later manual uncheck or extending the same snooze. Receipts expire after two days. Scheduled and presented snoozes are reconciled without touching recurring/test requests. Android raw background payloads (`dataString`) and delayed late-night/weekly occurrences are normalized before date validation.

The widget displays a dated SQLite snapshot, including real completions, bounded names/list length, and an Open Still action. Android widget callbacks run in an isolated runtime; no checkbox pretends to save to SQLite there. A generated provider extension opens the host app. Register `./plugins/with-offline-android.cjs` before `expo-widgets` in the plugin list so its DangerousMod runs after Expo's provider generator.

The same config plugin generates backup/transfer exclusions, a no-data Android BackupAgent, and a release-only manifest overlay removing INTERNET/ACCESS_NETWORK_STATE while leaving debug development-server access available. No generated native file is edited by hand. SDK 58 prebuild recreates native folders by default; use `node .\node_modules\expo\bin\cli prebuild --platform android --no-install --no-clean` for subsequent configuration iterations to retain build outputs. Keep the same signing key/package and Android versionCode 2 (version 1.1.0) for this update. Native/runtime results are recorded in VERIFICATION.md.

All five implementation phases are present. A subsequent Android development build and Pixel 7 emulator verification cover persistence, navigation, the native time picker, notification permissions, foreground/background delivery, and cancellation. Physical devices, iOS, and the remaining lifecycle/accessibility checks are pending, as detailed in VERIFICATION.md.

## Custom habit emoji — October 29, 2026

Added 💊 to the preset grid and a shared-value “Your emoji” input to create/edit forms. The current selection appears in the input; typing or pasting another emoji updates the preview. Existing preset icons, saved records, schema version 1, and reminder behavior remain intact.

The small JavaScript-only `emoji-regex` 11 package was installed through Expo. Shared draft validation accepts exactly one full emoji match, including skin tones, flags, keycaps, and joined sequences, trims surrounding whitespace, and rejects invalid or multiple emoji inline. The input permits 64 UTF-16 units so it does not split complex emoji. Invalid drafts remain editable and use a safe preview fallback. Dirty-state comparison uses the same trimming, and invalid saves focus the custom input. SQLite round-trip tests cover edit/reopen, check-in preservation, and rejection without partial writes. TypeScript, lint, 56 tests, and all-platform bundle exports pass. The subsequent form-usability work below rebuilt the standalone APK and verified the Android emoji input/keyboard flow; see VERIFICATION.md.

## Form usability — October 29, 2026

Implemented the three selected follow-ups. Habit details has an Edit header action; the old action below the calendar was removed. The habit form shows name and schedule first, then controlled Appearance, Your reason, and Reminder disclosures with current-value summaries. Narrow screens use balanced weekday rows while retaining the existing touch-target minimums. Preset/custom emoji, colors, descriptions, reminder guidance/recovery, and schedules retain their existing behavior.

Draft values stay in the form parent when a section closes. Validation opens sections containing errors, scrolls to the first invalid section in visible order, and focuses text input after expansion. The reminder field accepts an optional web input ref for this focus behavior. Native testing found that the emoji error could fall below the keyboard; its message now appears above the input and is included in the accessibility hint. Disclosure accessible labels include their summaries.

The single primary Create/Save action and storage-error text sit in a bottom safe-area footer outside the scroll content, inside the existing keyboard-avoiding container. The keyboard regression script now checks the primary action as well as the focused input. The existing normalized dirty guard and both save destinations remain intact. No database, dependency, native configuration, SDK, backend, or backup change was added. Final browser/Android evidence and the updated APK are recorded in VERIFICATION.md.

## 1. Foundation

Initialized the Expo TypeScript project. Added `app.json`, `tsconfig.json`, `metro.config.js`, `eslint.config.js`, Router layouts in `src/app/`, `src/theme/ThemeProvider.tsx`, and shared controls in `src/components/ui.tsx`. Created Today, Habits, History, and Settings tabs. Added light, dark, and system appearance.

Validation: TypeScript, Expo lint, Android Hermes export. Fixed the navigation/icon color type mismatch discovered by TypeScript. The first Hermes export hit the sandbox temporary-directory restriction; moving compiler temporary files into the workspace resolved it.

## 2. Tracking

Added `src/domain/models.ts`, `dates.ts`, `habits.ts`; `src/data/migrations.ts`, `repository.ts`; `src/state/AppProvider.tsx`; `AppGate.tsx`, `HabitRow.tsx`, `ProgressRing.tsx`; and the habit form/detail routes. Connected habit CRUD, unique daily check-ins, daily progress, and scheduled-day streaks to SQLite. Added real SQLite tests in `tests/repository.test.ts` and the Node SQLite adapter.

Validation: 17 relevant tests passed, TypeScript and lint passed, Android Hermes export passed. The startup effect was revised to satisfy React's state-in-effect lint rule.

## 3. History and statistics

Added `src/domain/history.ts`, `CalendarHistory.tsx`, `ProgressChart.tsx`, `Statistics.tsx`, and history tests. Extended the history tab and habit detail route with actual calendar records and weekly/monthly charts. Historical check-ins can be corrected. Percentages count eligible schedules and deduplicate stored completions.

Validation: 20 tests, TypeScript and lint passed. Android Hermes export passed. No synthetic chart values were introduced.

## 4. Polish

Added persistent settings, archived-habit management, `ConfirmDialog.tsx`, `useReducedMotion.ts`, and the missing-route screen. Added checkbox accessibility states for web and native, a reduced-motion-aware check-in animation, visual contrast, responsive meter sizing, and custom app/splash icons.

Validation: TypeScript/lint/tests and Android export passed. Browser tests verified real creation, checking, SQLite reload persistence, theme persistence, history, editing, archive/restore, and light/dark layouts at phone widths. Corrected a web SVG warning and a crowded 320-pixel progress card discovered during inspection.

## 5. Notifications

Added `src/notifications/reminders.ts` and `expo-reminders.ts`, `ReminderTimeField.tsx`, `NotificationSettings.tsx`, and `tests/reminders.test.ts`. Added Expo Notifications, native date/time picker, development-client support, `eas.json`, and setup documentation. Reminders request permission only when explicitly enabled, reconcile after mutations/resume, handle denial/failure/capacity, and cancel stale requests.

Validation: final suite has 26 passing tests. Calendar logic also passed four time-zone runs. TypeScript and lint pass. Expo Doctor passes 20/20 checks; SDK dependency validation passes; Android, iOS and web exports succeed. Source review led to archive-pause fixes and regression tests for one-day pauses and westward time-zone changes. At phase completion, native time-picker behavior, OS permissions, and delivery were pending; subsequent Android results are recorded below.

## Android runtime follow-up

Built and installed the development client on the existing Pixel 7 Android 16/API 36 emulator. Confirmed SQLite persistence after force-close/reopen, tabs and habit routes, real calendar/statistics values, native time selection and cancellation, notification denial and Android Settings recovery, silent foreground/background delivery, and replacement/cancellation after editing weekdays, archive/restore, disabling reminders, and deletion. Temporary QA data was removed afterward.

Runtime inspection found Android keyboard overlap. The form now uses height adjustment with Expo Router's actual header height; `scripts/verify-android-keyboard.ps1` verifies the focused field and its scroll viewport stay above the OS keyboard. TypeScript, lint, 26 tests, all-platform exports, and focused source review passed after the fix.

Windows setup also required shorter generated CMake object paths and IPv4 localhost for ADB. Metro now excludes compiler temporary sockets from its file watcher. The tested commands and screenshots are in README.md and VERIFICATION.md. Generated Android files remain generated by Expo; no native source was edited by hand.

## Daily-use polish — October 28, 2026

Today now uses a shorter greeting, week strip, and progress card, omits 0-of-0 progress, and keeps New habit in the header once routines exist. Larger system text gets a larger progress ring so the percentage stays inside it.

The habit form derives its reminder guidance from the actual notification status. It distinguishes settings-off, ready-to-save, blocked, unsupported, error, and archived states. Save and open Settings validates and persists the draft before leaving the form. Shared button labels have explicit centered wrapping constraints.

Habits has a Reorder mode with accessible Up/Down controls. The repository saves ordered IDs in the existing settings table, serializes moves, preserves archived positions, and appends new IDs in the creation transaction. No schema migration or dependency was added. Real SQLite tests cover reopen, concurrent moves, settings/history preservation, archive/restore, deletion, malformed metadata, and a backward local-date change. The suite now has 36 tests; verification details are recorded separately.

Display/font recreation testing also reproduced a native navigation crash in the SDK 58 shared router binding. Screen/component navigation now uses the supported context-bound `useRouter` hook. `scripts/verify-android-navigation.ps1` exercises the same display changes and form navigation twice, restoring the emulator's display settings afterward. The pre-fix APK failed its second cycle.

## Comfort polish — October 28, 2026

Implemented the six approved follow-ups, excluding backup/restore. Habit forms compare normalized drafts and use SDK 58 Router removal prevention for Cancel, back navigation, and browser unload. Failed validation shows all field errors, scrolls to the first invalid field, and focuses the name when appropriate. Explicit discard and successful saves release the guard. Calendar Back to today now restores both the current month and selected date.

Installed SDK-compatible `expo-localization` and `expo-haptics` through Expo. Reminder controls follow the device clock preference, subscribe to configuration changes, and reread preferences on foreground without remounting the draft form. Storage remains HH:MM. Check-in vibration defaults off in the existing settings table. The repository reports actual completion changes, so duplicate check-ins and unchecking do not play feedback. Persistence finishes before feedback, and a haptic failure cannot undo a saved check-in. Android uses the broadly supported Clock_Tick effect; iOS uses selection feedback.

Test reminders use an isolated identifier outside the recurring-reminder namespace and share the native scheduling queue. Settings can send, cancel, and clear a quiet one-time test; foreground listeners and native pending/presented state update its status. Existing notification consent is required. Disabling reminders or detecting revoked permission cancels pending tests as well as routine reminders.

No database migration, backup/restore, account, backend, or public sharing was added. Expo, Expo Router, and the development client were aligned with SDK 58's compatible patch versions. Automated coverage grew from 36 to 52 tests, including normalized drafts, simultaneous errors, time display boundaries, actual SQLite settings/check-in changes, haptic failure isolation, and test-reminder cancellation isolation. Final runtime evidence is recorded in VERIFICATION.md.
