# Verification record

Dates: October 27–November 6, 2026.

## Three-pass review and Still 1.3.0 APK — November 6, 2026

The APK is `releases/Still-1.3.0.apk` (Android code 5), including the earlier compact-screen and fast-check-in source updates. Download and update instructions are in the [Android release](https://github.com/eerihyppanen/Still/releases/tag/v1.3.0). The tested binary's checksum and signing identity are recorded below.

### Pass 1 — wording

Replaced motivational filler with direct labels/instructions across Today, Habits, History, forms, loading, About, notification content and the error page. Removed Today's greeting paragraph and repeated slogan. Browser creation, optional notes, check-in/completed expansion and Insights were exercised using disposable data.

### Pass 2 — usability and correctness

- Reproduced Today reporting “No habits yet” while all habits were archived. It now explains the archived state and links to Settings, while keeping New habit in the header.
- Habits has a header add action for active lists; it is hidden during reorder. The empty list retains a full-size New habit action. Browser tests covered this action, restore, Morning/pill selection semantics and keyboard reorder with reload persistence at 320-pixel width.
- Form choices expose checked/pressed states in the browser. Recap/progress accessibility wording handles one check-in/habit correctly. Archived or unscheduled zero-streak details no longer suggest starting today. About reads the app version from Expo config. Calendar filtering reuses the day's completion Set instead of scanning all records for every habit.

### Pass 3 — Android runtime and fixes

- Built and installed an APK over the existing 1.2.1/code 4 app on Pixel 7 / Android 16. A disposable habit and saved check-in survived the upgrade and a cold reopen. Check/undo, completed expansion, compact Settings, About version 1.3.0 and widget instructions worked.
- Native time picker: changed the hour and cancelled, confirming 9:00 AM stayed selected; then entered and saved 10:30 AM. The app reconciled one real recurring Android alarm.
- Denied the actual notification permission prompt; recovery stayed visible outside collapsed help and opened Android App info. Restored the emulator's original permission grant, enabled reminders, cancelled one pending test and delivered another. Reopening Reminder help recovered “received”; Android's notification record contained the new test body. Cleared it and disabled reminders: zero active Still RTC/ELAPSED alarms remained.
- Keyboard clearance passed after fixing the verification script's outdated form-title check. The navigation script now distinguishes the New habit action from the identically named form title.
- **Found and fixed a native crash during 150% text/display recreation.** The pre-fix APK threw “Attempted to navigate before mounting the Root Layout” from History's `router.setParams`. SDK 58 still routes that method through a global navigation reference. History now uses the current screen's typed Expo Router navigation object for both view/date updates. The expanded `-IncludeHistory` regression failed against the old APK, then passed view/date changes and form open/cancel through two recreation cycles on the rebuilt APK. Logs: `.expo/three-pass-history-red.log`, `.expo/three-pass-history-green.log`, `.expo/three-pass-router-crash.log`.
- The same walkthrough exposed a clipped calendar status glyph. It now uses fixed icon-sized text metrics while dates and readable labels continue to scale. Inspected the rebuilt calendar at 150%; the full checkmark is visible and Settings navigation succeeds. The fresh crash buffer remained empty. Screenshot: [large-text Calendar](./verification/large-calendar-android.png).
- Final browser regression confirmed date/view URL updates, selected-date retention, keyboard focus, and returning from Today's date link after switching views. Temporary browser habits were deleted and the viewport reset.
- Used the new native Habits header action to create a second disposable habit and assign Morning. Dragged the original habit from first to second, asserted its new position, then confirmed that position after a force-stop/cold reopen. Screenshot: [Today on Android](./verification/plain-today-android.png).
- Native archive recovery also passed: archiving the last remaining habit showed “All habits are archived”; Open Settings led to its archived row. Both disposable habits were then deleted through the app, and a cold reopen showed the empty state. Font size was restored to 1.0, notification permission to its original granted state, and app reminders to off. Test notifications were cleared; temporary preview servers/tabs and the emulator were closed.

### Build and checks

- `npm run check`: strict TypeScript, Expo lint and **90/90 tests** passed after the product fixes. Log: `.expo/three-pass-final-check.log`.
- `npm run test:timezones`: **18/18 tests in each** of Helsinki, New York, Kolkata and Honolulu passed. Log: `.expo/three-pass-timezones.log`.
- Final local Gradle release assembly passed. Generated native configuration was updated through Expo prebuild with `--no-clean`; no generated native source was edited by hand.
- APK identity is `com.still.habits`, version 1.3.0/code 5, arm64-v8a and x86_64. Its certificate matches 1.2.1 (`fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`). Packaged internet/network-state permissions are absent; Android backup remains disabled with the existing backup agent. No dependencies, schema or notification trigger/action logic changed.
- Final APK: **64,529,743 bytes**, SHA-256 **`e4899dcd5a177b9e29891ae725c4b6d9725cf4ce27b57eee90702db734ced9a6`**.
- Independent source review, including the native navigation fix, found no remaining actionable issues. Physical-phone installation, iOS runtime, manufacturer-specific delivery behavior and full TalkBack/VoiceOver testing remain unverified by this pass.

## Compact History and Settings — November 5, 2026

Source update from `C:\Users\eehyp\Desktop\Still`; no new APK or version bump. The existing 1.2.1 APK does not contain this update.

- History opens on Calendar, with compact day rows and a separate Insights view for the weekly recap and statistics. Calendar cells retain a 44-pixel minimum height, and checkboxes retain their 48-pixel touch area. Long habit names wrap.
- Settings has one-row appearance choices, shorter reminder/vibration rows, and expandable Reminder help, archived habits, Android widget instructions, and About. Permission recovery and retry remain outside the collapsed help. Web accessibility exposes choice state and section expansion.
- `npm run check` passed strict TypeScript, Expo lint and all **90 tests**, zero failures, after the final product change. Log: `.expo/compact-final-check.log`.
- Final Android Metro/Hermes bundle export passed to `.expo/compact-android-export`. Log: `.expo/compact-export.log`.
- Actual browser checks used isolated `localhost:8084` at 390 × 844 and 320 × 740. Created disposable habits, checked/unchecked through Calendar, confirmed check-in persistence after reload, switched Calendar/Insights, retained the selected date, checked the recap/statistics values, verified future dates are disabled, and navigated through the compact row to habit details.
- Browser verification covered Light/Dark/System, saved theme after reload, keyboard activation of appearance choices, expanded reminder help and About, and archive/restore through the archived-habits disclosure. The 320-pixel page had no horizontal overflow. Screenshots: [Calendar](./verification/compact-history-web.png), [Settings](./verification/compact-settings-web.png).
- Review found an older repeated-date-link issue. Reproduced Today → November 5 → browse November 4 → Today → November 5 still showing November 4. History now controls the selected calendar date through the route. Repeating the flow opens November 5; selection also survives view switching and browser reload. Keyboard activation keeps focus on the date button. Month follows the selected date without remounting the calendar. Habit-detail calendars retain local selection.
- Independent review of the final source found no remaining actionable issues. Native notification scheduling, schema, dependencies and offline configuration are unchanged. This update's native reminder-help controls, permission recovery, TalkBack/VoiceOver and large device text have not been rerun on a phone/emulator.
- All disposable habits were removed, the QA theme was restored to System, the temporary viewport was reset, and verification tabs/server were closed. No personal habits or existing preview-origin storage were changed. The preview manifest confirmed the Desktop folder as both developer and internal project root.

## Still 1.2.1 Android APK — November 4, 2026

- The leaf stem is present in the regenerated launcher and splash artwork. The Android adaptive foreground fits within a 295-pixel radius on the 1024-pixel canvas. The loading view and Today header use the same leaf asset.
- `npm run check` passed strict TypeScript, Expo lint, and all 89 tests. Gradle assembly and Android release lint passed.
- Verified the APK signature matches 1.2.0 and installed it as an update on the Pixel 7 emulator. Cold-launch recordings show the stem in both the Android splash and the in-app loading view. The launch completed on Today. The APK is version code 4 and excludes Android internet and network-state permissions.

## Still 1.2.0 Android APK — November 4, 2026

- `npm run check` passed strict TypeScript, Expo lint, and all 89 tests. The local release build passed Gradle assembly and Android release lint.
- Verified the APK signature matches Still 1.1.0. The APK is `com.still.habits`, version code 3, with arm64-v8a and x86_64 support. The packaged manifest excludes Android internet and network-state permissions.
- Installed 1.2.0 over 1.1.0 on the Pixel 7 emulator. Two test habits and their saved check-in survived the update. Today started with the completed habit folded away, then showed the saved state on expansion. Undo moved it back to the unfinished list. History showed 1 of 2 planned check-ins and identified the completed routine as most consistent.
- Dragged a habit from first to second on Android and observed the saved position. Browser and emulator tests cover these flows. Physical phone testing remains pending.
- The release APK and checksum are available from the private [Still 1.2.0 release](https://github.com/eerihyppanen/Still/releases/tag/v1.2.0).

## Verified so far

- TypeScript strict checks, including tests.
- Expo ESLint.
- 90 automated local-date, scheduling, streak, label, history, SQLite, habit-order, drag-geometry, time-of-day-group, draft-validation, custom-emoji, time-format, check-in-feedback, reminder-action, widget-snapshot, and offline-policy tests passed, zero failures.
- Calendar/streak/history/reminder-action/widget suite passed in four time zones: Europe/Helsinki, America/New_York, Asia/Kolkata, Pacific/Honolulu (30 tests per time zone on October 30).
- Android Metro/Hermes exports after each implementation phase.
- Browser UI: empty start, real habit creation, completed state, completion persistence after reload, light theme preference persistence, history calendar and actual chart statistics, detail screen, edited description/weekdays/reminder time, confirmed archive and restore, browser reminder limitation message.
- Phone viewport review at 390 × 844 and 320 × 740. Light and dark rendering reviewed. The compact progress meter was resized after inspection.
- `npx expo install --check`: passed on October 28. The October 29 check lists newer SDK patch releases; see the custom-emoji section.
- `npx expo-doctor`: 20/20 checks passed on October 28. October 30's result is 19/20 because ten existing Expo/RN packages have newer SDK 58 patch versions available; see the 1.1 section. New widget/task modules match the SDK's requirements.
- Final `npx expo export --platform all`: Android Hermes, iOS Hermes, and web exports passed.
- Independent source review completed. Archive boundary defect was fixed with a regression test; no remaining important/critical review findings. A further westward-travel archive regression test also passes.

The final source was formatted with Prettier 3. No seed routines or check-ins are bundled. `still-preview.png` shows a real habit entered into the local browser during verification.

## Icon and live drag reordering — October 30, 2026

Source-only update requested by the user: no new APK, version bump, dependency, native prebuild or native installation. The delivered `releases/Still-1.1.0.apk` remains the earlier offline-phone build; it does not contain this section's changes.

- Refreshed the editable vector leaf, app/favicon assets, Android adaptive foreground/monochrome, and light/dark splash images. Visual review checked small icons, circular/rounded masks, and both splash backgrounds. App/background PNGs are opaque; foreground/monochrome/splash PNGs have transparency. All platform assets are 1024 × 1024 except the 64 × 64 favicon. Foreground/monochrome painted pixels stay within a 294-pixel radius on the 1024 canvas, inside the Android safe circle. [Asset preview](./verification/icon-refresh.png) is a design review sheet, not a native launcher/splash capture.
- Replaced visible Up/Down buttons with drag grips in Habits → Reorder. Rows follow the pointer and neighbors animate into projected positions. Drop saves once; keyboard arrows and native accessibility actions provide alternatives. Measured heights handle wrapped names. Edge scrolling, interruption cleanup, saving feedback, and failure rollback are implemented.
- Observed new geometry/persistence regressions failing before implementation, then passing. Tests cover upward/downward insertion, unequal heights, endpoints, invalid measurements, bounded edge scrolling, complete-order reopen, archived-slot restoration, preserved history/settings/schema, invalid/stale orders and serialized requests.
- `npm run check`: strict TypeScript, Expo lint and **87/87 tests**, zero failures. Log: `.expo/icon-drag-final-check.log`. Android Hermes, iOS Hermes and web exports passed to `.expo/icon-drag-export`; log `.expo/icon-drag-export.log`.
- Actual browser QA on isolated `localhost:8082` created eight disposable habits. At 390 × 844 and 320 × 740, dragged in both directions, moved a five-line/taller name above shorter rows, and verified keyboard ArrowDown. An edge drag scrolled from 0 to 9.33 px while held near the viewport bottom. An interrupted drag was cancelled with Escape without saving. A reload retained the dropped order, and Today displayed the same order. Both light and dark layouts were inspected. [Final light reorder screen](./verification/drag-reorder-web.png).
- Browser QA initially reproduced cancellation because disabling scrolling removed the scrollbar and widened the list from 327 to 342 px. A stable web scrollbar gutter fixed the same drag. Status text retains its measured height so a shorter drag instruction cannot shift rows. Projected positions also update for displaced neighbors. Temporary diagnostic logs were removed. The independent read-only review reports no remaining findings.
- Removed all eight QA habits through the app and verified the empty list after reload. Restored the QA theme to System and reset the temporary browser viewport. Existing personal data on port 8081 was not changed. The running port-8081 manifest reports `C:\Users\eehyp\Desktop\Still` as both developer and internal project root.
- The APK SHA-256 remains `958c8ab9246e9b1dfc87d65ab16c97adf7e2d858a100b77ac8832d2f2bfbbd6c`. Package/lockfile are unchanged. Existing SDK patch recommendations remain as documented below; no unrelated dependency upgrade was applied.

Native launcher/splash appearance, Android/iOS touch dragging and edge scrolling, system large text/reduced motion, and TalkBack/VoiceOver remain for the next requested build. Bundle exports and browser QA do not substitute for these device checks. Expo's [SDK 58 splash documentation](https://docs.expo.dev/versions/v58.0.0/sdk/splash-screen/) explains that asset/config changes require a new binary and that Expo Go/development builds cannot fully reproduce the release splash.

## Android 1.1 — offline phone additions, October 30, 2026

Implemented the approved device-only release policy, optional Morning/Afternoon/Evening/Anytime groups, Done and ten-minute Snooze reminder actions, and an Android home-screen widget. All data remains in schema 1. Time-of-day metadata and short-lived action receipts use the existing settings table; existing habit order, schedules, active periods and check-ins remain intact.

Automated verification:

- `npm run check`: strict TypeScript, Expo lint and 80/80 tests passed. New behavior tests were observed failing before implementation/fixes, then passing. SQLite tests cover reopen and history/order/schema preservation, group validation, idempotent Done after a later manual uncheck, and stable snooze deadlines under replay.
- Thirty date/history/streak/action/widget tests passed in each of Helsinki, New York, Kolkata and Honolulu.
- Android, iOS and web Expo exports passed in `.expo/offline-phone-export`.
- One independent whole-change source review identified three defects: raw Android headless `dataString` payloads, after-midnight delayed occurrences, and already-presented snoozes left behind after app changes. All three were reproduced in tests and fixed. Recurring actions derive the last matching local scheduled time/day; snoozes retain an explicit occurrence date. Old actions cannot cancel a valid new-day snooze.
- Expo Doctor: 19/20. Only the existing patch-version mismatch check fails: Expo 58.0.20 vs 58.0.21, RN 0.88.0 vs 0.88.1, plus eight existing Expo package patches. No forced dependency downgrade or unrelated SDK upgrade was applied. The nine previously documented npm audit entries remain; offline lockfile output is not treated as a fresh network audit.

Native verification on the existing Pixel 7 / Android 16 emulator:

- Started with the previously delivered 1.0.0 / versionCode 1 APK. Created disposable `UpgradeRead`, saved a check-in, force-stopped/reopened and verified persistence. Installed the new APK with `adb install -r`; the habit and check-in remained, showing 100% and a one-day streak. The package is unchanged and signing certificate matches the previous APK.
- Saved Morning on that old habit. Created disposable `EveningStretch` in Evening. Both sections appeared correctly with real 50% progress. Screenshot: [time groups in airplane mode](./verification/offline-groups-android.png).
- Selected a real reminder with the native Android picker and enabled reminders. A quiet notification arrived with Done / Snooze 10 min buttons. After killing the cached app process (PID absent), tapped Done; reopening showed the saved check-in and 100% progress. This exercises the actual Android background payload, not just the foreground listener.
- With airplane mode on and PID absent, tapped Snooze on a second real reminder. Android reported exactly one additional alarm ten minutes ahead (`1793377088477`), alongside the normal next-day recurring alarm (`1793462760000`). Snooze did not mark the habit complete. Completing it in Still removed the snooze alarm while preserving the normal recurring alarm; disabling reminders then left no Still RTC alarms. The ten-minute snooze was cancelled for cleanup rather than waiting for its delivery. Presented-snooze cancellation is covered by regression tests.
- Added the actual launcher widget. It displayed the saved date, progress and habit name, updated after an in-app check-in change, and opened Still with the app process stopped. The widget reads a dated SQLite snapshot and opens Still for actual check-ins. Android SDK 58 widgets have no iOS-style timelines, so automatic midnight refresh is not claimed. The final layout uses the module's compact minimum dimensions and a purple Open Still button.
- Opened and used Still without internet in airplane mode. The release APK has no INTERNET or ACCESS_NETWORK_STATE permission. Compiled manifest shows `allowBackup=false`, the no-data BackupAgent, and backup/extraction rule resource references; compiled XML excludes all app storage domains from cloud backup and device transfer.
- Deleted only the two QA habits after awaiting navigation/persistence. A cold reopen returned to the empty start. Reminders are off. Temporary widget cleanup and emulator restoration are recorded in the task ledger.

Build notes: Expo SDK 58 prebuild now recreates native directories by default; later iterations used `--no-clean`. Native lint rejected a cross-platform transfer XML section that required Apple matching metadata. The config plugin now generates valid cloud/device exclusions and a no-data BackupAgent instead. Native builds and lint then passed. Native files are generated, not manually patched. The developer-only network permission remains in debug manifests; the release overlay removes it.

Final launcher verification reports **4 wide by 2 high** after using Expo's compact minimum dimensions (180 × 110 dp). The previous larger minimum overrode the requested grid size on this launcher. The test widget was removed, the app cold-reopened empty, airplane mode returned to off, and Wi-Fi/Bluetooth returned to their previously enabled state. No QA habits or scheduled reminders remain.

Delivery artifact: `releases/Still-1.1.0.apk` (also under `.expo/phone-apk/Still-1.1.0-offline.apk`), **64,429,611 bytes**, SHA-256 `958c8ab9246e9b1dfc87d65ab16c97adf7e2d858a100b77ac8832d2f2bfbbd6c`, Android versionCode 2, package `com.still.habits`. Its certificate SHA-256 is `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, matching the previous test APKs. Final APK signature/permissions were checked after the last build; strict checks and all-platform exports were rerun after the last configuration change. Install over the existing app; do not uninstall first. This is the locally signed test APK, not a Play Store release. Physical-phone installation, iOS runtime behavior, manufacturer-specific backup/transfer behavior and VoiceOver/TalkBack remain pending. This update prevents future automatic backups; it does not delete any backups Android may already have made before the update.

## Streak wording and future dates — October 29, 2026

Today rows and habit details share the same streak label: zero is “Start today,” and positive counts read “1-day streak,” “7-day streak,” etc. Detail statistics use “1 check-in” and “1 scheduled day,” with plural wording for other counts. Today's progress card also uses “1 habit” rather than “1 habits.” Streak calculations and stored records are unchanged.

Future dates in Today's week strip are dimmed, disabled, and labeled “Future date, not available yet” for accessibility. Today and past dates still navigate to History; its defensive future-date clamp is retained.

Verification from `C:\Users\eehyp\Desktop\Still`:

- `npm run check`: strict TypeScript, Expo lint, and 58/58 tests passed. The two new label tests were run before implementation (missing-module failure) and passed afterward.
- All-platform Expo exports passed in `.expo/streak-date-export`. The first attempt could not write Hermes output in the sandbox temporary directory; retrying with `TEMP`/`TMP` set to the project's existing `.expo/tmp` succeeded.
- A focused independent source review found no actionable issues.
- The running port-8081 Expo manifest reported the Desktop project as both developer and internal project root. Browser interaction verification was blocked at “Opening your space…” on both the existing origin and a separate localhost origin. Temporary verification tabs were closed; no browser storage or user habits were changed. Web interaction verification remains pending.
- An APK containing the streak/date changes was installed over the existing Pixel 7 emulator app without clearing its data. Friday–Sunday reported `enabled=false`; tapping Friday left Today open, while Wednesday opened History with October 28 selected. A temporary habit displayed “Start today,” then “1-day streak” after completion; its details displayed “1 check-in · 100% completion” and “Longest streak: 1 scheduled day.” Unchecking restored “Start today.” The temporary habit was deleted, a cold reopen confirmed the empty state, and the emulator was stopped. Screenshot: [Android Today](./verification/streak-date-today-android.png).
- The progress-card “1 habit” copy correction was made after that runtime screenshot. The final APK was rebuilt, and TypeScript, lint, 58 tests, and all-platform exports were rerun after that last source change.

Updated APK: `.expo/phone-apk/Still-1.0.0-streak-dates.apk`, 60,701,747 bytes, SHA-256 `a9708648837275970cda3149411ec9b45a7692e0f47b126b3de204473c1ae6af`. Its signing certificate matches the previous test APKs. Physical-phone and iOS runtime verification remain pending.

## Desktop rerun and Android runtime verification

The following checks were rerun from `C:\Users\eehyp\Desktop\Still` on October 27, 2026:

- `npm run check`: strict TypeScript, Expo lint, and 26/26 tests passed after the keyboard fix.
- `npm run test:timezones`: 16/16 tests passed in each of the four documented time zones.
- Online `npx expo install --check`: dependencies up to date. The earlier sandbox-only attempt used an offline dependency map; the successful online rerun is the result used here.
- Online `npx expo-doctor`: 20/20 checks passed.
- `npx expo export --platform all --max-workers 2`: Android Hermes, iOS Hermes, and web exports passed after both the Metro configuration fix and the final keyboard change.
- Online `npm audit --json`: the same three high-severity tooling entries remain; see the audit note below.

The previous Metro listener on port 8081 belonged to the original `Documents\Codex\...\outputs\still` folder. It was stopped and replaced with the Desktop project. The new Android manifest reported `C:\Users\eehyp\Desktop\Still` as both the developer project root and the internal project root. The unrelated project on port 8082 was left alone.

Two Windows development issues were reproduced and addressed:

1. Metro crashed while trying to stat a temporary Java socket in `.expo/tmp`. `metro.config.js` now excludes that directory while retaining Expo's existing exclusions. A real Java Unix-domain socket was recreated after the change; Metro remained available and served the correct project manifest.
2. The first native build failed in Ninja 1.10.2 with a generated C++ filename longer than 260 characters. The installed Expo Gradle plugin supports `expo.android.cmakeObjectPathMax`; setting the process environment variable `ORG_GRADLE_PROJECT_expo.android.cmakeObjectPathMax=240` made CMake shorten generated object paths. The retry succeeded in 3m 29s, with 505 tasks. No Windows registry setting or generated native source was edited.

The native development build was generated by Expo and installed as `com.still.habits` on the existing Pixel 7 emulator (`emulator-5554`, x86_64, Android 16/API 36). Build tools: JDK 21, Gradle 9.4.1, Android compile SDK/build tools 37, NDK 27.1.12297006, and CMake 3.22.1. Missing SDK/compiler packages were installed by Gradle under the existing SDK licenses. The emulator's existing GMT time zone was preserved. All reminder times in this section are GMT.

Native checks completed using the actual UI and Android state:

- Clean first launch with no sample habits and no automatic notification permission prompt.
- Created the temporary `QA Read` habit with a name, book icon, description, and daily schedule.
- Checked and unchecked it; force-stopped the app, reopened the project through the development client, and confirmed the saved habit, completion, 100% daily progress, and one scheduled-day streak.
- Navigated Today, Habits, Settings, History, habit detail, and the edit form. History showed the real calendar check-in, one total check-in, 100% completion, and actual weekly/monthly bars.
- Opened the native Android time picker; selected a different hour and cancelled; the original `09:00` value remained. Confirmed a new time using the native keyboard entry mode and saved it successfully.
- Denied the Android notification permission prompt. Still kept the switch off and displayed recovery guidance. Its device-settings action opened Still's app settings. Allowed notifications there, returned to Still, and enabled reminders; Android reported `POST_NOTIFICATIONS: granted=true`.
- Confirmed a real daily request in Expo's native notification store and a matching OS alarm. A foreground reminder scheduled for 12:51 arrived at approximately 12:52:07.884. The notification shade showed the habit name and reminder body; Android recorded `SILENT`, `mSound=null`, and `mVibration=null`. The OS scheduled the next daily occurrence for the following day. This delivery was delayed by about 68 seconds, consistent with best-effort scheduling.
- Edited that reminder to 13:17 and verified the OS alarm used the new time. With Still backgrounded and the Android launcher in front, it delivered again at approximately 13:17:53.877; the OS notification update timestamp changed, with sound and vibration still null.
- Archived the habit through its confirmation dialog. Both the native pending-request store and pending Android alarm list became empty. Restored it, then changed its schedule to Monday-Friday: the daily identifier disappeared and exactly five weekly requests were present, with weekday suffixes 2-6.
- Disabled reminders in Settings: all five requests were cancelled. Re-enabled them and confirmed five pending requests, then permanently deleted the QA habit through confirmation. Its requests and pending Android alarms both became empty. The app returned to an empty habit list; notifications were switched off again, and the delivered QA notification was cleared through its tap action. A final cold reopen preserved the empty state and reminders-off preference. No QA habits remain.
- Reproduced Android keyboard overlap: the form extended to 2400 px while the keyboard began at 1517 px. The form now uses Android height adjustment and the actual Expo Router header height. The native regression check passed with the form ending at 1517 px and the focused description field visible. The check measures the focused field's own scroll ancestor, excluding the development client's separate full-screen scroll view.
- A focused independent review of the keyboard change, Metro exclusion, native regression check, and Windows setup notes found no actionable issues.

Evidence: [native time picker](verification/android-time-picker.png), [foreground notification](verification/android-notification-foreground.png), [background notification](verification/android-notification-background.png), [keyboard fix](verification/android-keyboard-fixed.png). Cancellation checks concern pending reminders; an already delivered notification stays in the notification shade until cleared.

To repeat the keyboard regression check, open the habit form, focus the description field, let the keyboard finish appearing, and run the following from a terminal with `adb` on PATH:

```powershell
.\scripts\verify-android-keyboard.ps1 -Serial emulator-5554
```

For the current emulator connection, Metro runs from the Desktop folder with:

```powershell
node --dns-result-order=ipv4first .\node_modules\expo\bin\cli start --dev-client --localhost --port 8081 --max-workers 2
adb reverse tcp:8081 tcp:8081
```

The IPv4 option is necessary on this machine: plain `--localhost` bound only to `::1`, while ADB forwarded to `127.0.0.1`. The initial LAN development session also stalled a bundle request; a clean localhost session downloaded the bundle and attached the native runtime. A development-client relaunch can show its project launcher; select the saved local project to reopen Still. Build preparation commands are in README.md.

The Desktop web preview was also opened successfully at `http://127.0.0.1:8081`. After the final keyboard change, the web habit form loaded successfully at `/habit-form`, including its name/description fields, weekday choices, reminder switch, and create button. The older `localhost` browser database reported an exclusive storage-handle conflict, consistent with another preview holding that origin open; no browser storage was cleared. These hostnames have separate browser data.

## Standalone Android APK

A standalone test APK was built locally from the Desktop project on October 27, 2026. TypeScript and lint were rerun successfully before this build. With the JDK/SDK environment from README.md and `NODE_ENV=production`, the following command ran from the generated `android` folder:

```powershell
.\gradlew.bat --% app:assembleRelease -x lint -x test --configure-on-demand --build-cache -PreactNativeArchitectures=arm64-v8a,x86_64 -Pexpo.android.cmakeObjectPathMax=255
```

The release build's longer generated C++ paths did not fit the development build's 240-character object-path budget. Using 255 let CMake shorten those paths successfully without changing Windows settings or generated native source. The final build completed successfully in 10m 45s, with 873 tasks (79 executed, 794 up-to-date).

- Download copy: `.expo/phone-apk/Still-1.0.0-test.apk` (60,582,959 bytes).
- Package `com.still.habits`, version 1.0.0 / version code 1; Android minimum API 24, target API 36; ARM64 phones and x86_64 emulators.
- APK signature verification passed. This local test build uses the generated development signing key; it is not a Play Store release.
- SHA-256: `cb46c8c22a8396f0f67bdd8fcbd15a8c024d5c3d6ccad6d1b64479b1254b4ebe`.
- The APK contains its 2,493,480-byte Hermes bundle at `assets/index.android.bundle`.
- Installed that exact APK over the existing emulator app without clearing its data. Stopped Still's Metro process and confirmed port 8081 refused connections. Still launched directly into the tracker without a development-client project screen.
- Created `APK smoke test`, confirmed its checkbox changed to completed, force-stopped Still, and reopened it. The habit and checked state persisted with Metro stopped. Evidence: [standalone APK persistence](verification/android-apk-offline-persistence.png).
- Deleted the temporary habit through confirmation and cold-reopened the app; the empty state persisted. No APK QA habit remains.
- A local Wi-Fi download server serves only this APK. Downloaded its complete response and verified HTTP 200, the Android APK content type, matching size and SHA-256; other paths return 404. Existing Windows firewall rules already allow this Node runtime; no firewall settings were changed. Access from the physical phone still needs the user's check.
- Restored the development preview after the standalone check. Its Android manifest again reports `C:\Users\eehyp\Desktop\Still` as both project roots; the unrelated preview on port 8082 was left alone.

The installed APK runs independently of Expo Go, USB, Metro, and the download server. The computer and download server are needed only to transfer the file. Physical Android hardware verification remains pending.

## Daily-use polish — October 28, 2026

Implemented the three approved improvements: compact Today, accurate form reminder guidance, and persistent habit reordering. No dependency or schema migration was added. Custom order uses the existing settings table; new habits append transactionally, archived habits retain their relative place, and bad/stale metadata cannot hide records.

Final automated checks:

- `npm run check`: strict TypeScript, Expo lint, and 36/36 tests passed after the final navigation fix.
- Four new SQLite ordering cases were observed failing before implementation; a fifth regression reproduced new habits being inserted out of order after a backward local-date change. All now pass, including persistence, settings/history preservation, concurrent moves, boundaries, archive/restore, creation/deletion, and malformed metadata.
- Five reminder-feedback tests cover ready-but-unsaved drafts, global-off overriding stale ready status, blocked/error recovery, browser limitations, checking, and archived states.
- `npm run test:timezones`: 16/16 date/history tests passed in each of the four documented time zones.
- Final `expo export --platform all --max-workers 2`: Android, iOS, and web exports passed after the context-bound navigation change.
- A focused independent source review found no critical/data-loss issue. Its append-order finding was reproduced and fixed. Button labels now explicitly shrink/wrap and center; native inspection confirmed the longer recovery action fits.

Android checks used the same Pixel 7 API 36 emulator and the actual standalone APK, installed over the previous app without clearing data:

- The first-create action is fully visible on Today without scrolling. The populated layout shows two QA habits and daily progress in the initial viewport; New habit is available in the header.
- With reminders off, the form explains that reminders are off in Still and offers Save and open Settings. An empty name leaves the form open with its validation error. A valid `Polish QA Read` draft was saved before Settings opened.
- Enabled notifications in Settings using the existing granted permission. Reopened the saved habit's form: it displayed “Notifications are enabled. Save this habit to apply its reminder.” The off-state recovery action was absent. The notification scheduling engine was not changed; delivery/cancellation evidence from October 27 remains above.
- Added `Polish QA Walk`, entered Reorder mode, and moved Read down. Walk appeared first on Habits and Today. The first Up and last Down controls were disabled. The order and Read's existing check-in both survived a cold launch and the final APK update.
- Tested a 320 dp viewport (`840x1860` at density 420) with font scale 1.5. The original smaller ring intersected its 100% text; the corrected layout grows the ring within available width. The final percentage and wrapped reminder-button labels were visually verified. Restored physical `1080x2400` and font scale `1.0` afterward.
- Display/font recreation exposed a native crash: “The imperative router is unavailable before the first render has finished.” SDK 58's shared router binding can be reset during old-root cleanup. Navigation now uses the documented context-bound `useRouter` hook in all seven call sites, preserving their destinations. The native regression script failed on cycle 2 with the old APK, then passed both cycles with the fixed APK. Subsequent habit/detail/delete navigation also succeeded.
- Removed both temporary QA habits through confirmation, cold-reopened Still, and confirmed the empty state persisted. Reminders are off again. The final app process has no crash-buffer entries. No QA habits are bundled or left in the emulator.
- No Metro listener was running on port 8081 during the final standalone checks. The APK works independently of Metro; the APK download helper runs from the Desktop project and serves only that file.

Repeat the display recreation regression on an emulator with:

```powershell
.\scripts\verify-android-navigation.ps1 -Serial emulator-5554
```

It temporarily changes display/font settings, opens and cancels an empty form twice, and restores the prior settings. No habits are created or deleted by this script.

Evidence: [compact empty Today](verification/polish-today-empty.png), [populated Today](verification/polish-today-populated.png), [reordering](verification/polish-reorder.png), [ready reminder guidance](verification/polish-reminders-ready.png), [large-text reminder button](verification/polish-recovery-large-text-fixed.png), [large-text progress ring](verification/polish-ring-large-text-fixed.png).

Updated phone APK: `.expo/phone-apk/Still-1.0.0-polish.apk`, 60,588,823 bytes; SHA-256 `bf6e3ecdf2c6f8b0d52e156f32edcf52cfc065d3adafd5ab2f6b888e705f9943`. Signature verification passed and its signing certificate matches the earlier APK, allowing an in-place update. The earlier test APK is retained separately. The full Wi-Fi download response returned HTTP 200, the APK content type, and exactly this size/checksum. Physical-phone installation remains for the user to verify.

## Comfort polish — October 28, 2026

Implemented all six approved follow-ups: unsaved-edit protection, inline field errors, calendar Back to today, a test reminder, optional check-in vibration, and device-preferred time formatting. Backup/restore remains excluded. Schema version 1 and existing offline storage are preserved.

Final checks from `C:\Users\eehyp\Desktop\Still`:

- `npm run check`: strict TypeScript, Expo lint, and 52/52 tests passed after the review corrections.
- `npm run test:timezones`: 16/16 tests passed in each of Europe/Helsinki, America/New_York, Asia/Kolkata, and Pacific/Honolulu.
- `expo install --check`: dependencies up to date after Expo's compatible patches to Expo 58.0.20, Expo Router 58.0.27, and Expo Dev Client 58.0.16. Added Expo Haptics 58.0.7 and Expo Localization 58.0.5 through Expo's installer.
- `expo-doctor`: 20/20 passed. Final Android, iOS, and web exports succeeded after both review corrections.
- Independent review approved the final source. It identified an Android 14-only haptic effect, corrected to Clock_Tick, and a potentially stale clock preference in an already mounted editor, corrected by fresh preference reads on foreground. No important or critical finding remains.
- Regenerated Android through Expo CNG, then built the standalone release APK with the documented JDK/SDK settings, both ARM64 and x86_64 architectures, two Gradle workers, and `expo.android.cmakeObjectPathMax=255`. A PowerShell redirection error in the first invocation was corrected; the final build exited successfully. No generated native source was edited by hand.

Browser checks:

- Invalid create shows the name error and focuses that field. Keep editing retains an unsaved draft; Discard changes returns home. A pristine form cancels without a prompt.
- Opened September 15 through the History date link, then used Back to today. The visible month changed to October 2026, October 28 became selected, and the shortcut disappeared. Existing habits/check-ins were left unchanged.
- Recovered a suspended preview tab by closing/reopening it and reloading after restarting Metro. No browser storage was cleared. The final preview is open on Today at `http://127.0.0.1:8081/`; both manifest project-root fields report the Desktop folder.

Android checks used the actual updated APK on the Pixel 7 API 36 emulator, installed over the previous app without clearing data:

- Clean Cancel returns home. Android Back on an edited draft shows the discard dialog. Keep editing retains the name; explicit discard leaves. Both Save and open Settings and a normal edited Save changes persist before navigating, without becoming trapped by the guard.
- An invalid name is scrolled into view and focused. Clearing every weekday and saving shows “Choose at least one day.” beside the schedule, within the visible viewport; that invalid edit was discarded.
- With an editor and modified name still mounted, changed the OS preference to 24-hour time, foregrounded Still, and observed `Remind me at 09:00`. The native picker showed `09:00` without AM/PM. Changed to 12-hour time and returned to the same draft: the label showed `9:00 AM`, and the picker exposed AM/PM. Cancelling either picker kept the saved local time unchanged; the draft name survived. The original automatic OS time-format setting was restored afterward.
- Vibration initially defaults off. Enabled it, cold-reopened Still, and verified the enabled preference persisted. Completing the temporary habit produced Android's recorded TOUCH effect for `com.still.habits`, `performHapticFeedback(constant=4)`, with a TEXTURE_TICK effect. Unchecking added no vibration-history entry. Physical haptic feel cannot be assessed in an emulator.
- The test action is disabled while gentle reminders are off. Enabling reminders with existing permission scheduled the QA habit's daily alarm. A foreground test arrived with the expected title/body and the UI acknowledged receipt; Android reported SILENT, sound null, and vibration null.
- Clearing the delivered test removed its presented notification. Sending and immediately cancelling another test produced the cancellation acknowledgement, removed its test alarm, and preserved the daily habit alarm.
- A further test delivered while the Android launcher was the resumed activity. Returning to Still refreshed the test state to received. Sending a new test and turning gentle reminders off cancelled both pending test and daily alarms; the UI returned to the off-state guidance.
- Notification/vibration settings and the QA check-in survived cold launch. Removed the temporary QA habit through confirmation, restored vibration/reminders to off, and confirmed the empty habit state after another cold launch. No QA habit is bundled into the APK or retained in the emulator. Personal browser habits were preserved.
- The display/font recreation regression passed both navigation cycles with the final APK. Its first attempt found a test-script limitation: the empty-state create action sits below the viewport at 320 dp/font scale 1.5. Reproduced absence before scrolling and presence afterward, then updated only the script's New habit search to scroll the current container. The independent reviewer approved this correction; the script still creates no data and restores display/font settings in `finally`.

Evidence: [inline name error](verification/comfort-inline-android.png), [weekday error](verification/comfort-weekday-error-android.png), [unsaved changes](verification/comfort-unsaved-android.png), [24-hour picker](verification/comfort-time-24-picker-android.png), [12-hour picker](verification/comfort-time-12-picker-android.png), [received test](verification/comfort-test-received-android.png), [background test](verification/comfort-test-background-android.png), [native haptic record](verification/comfort-haptics.txt), [restored web preview](verification/comfort-today-web.png).

Updated APK: `.expo/phone-apk/Still-1.0.0-comfort.apk`, 60,664,311 bytes, SHA-256 `02d40a98ebd66df05724f1ea9b05cead68480f9769c4a9a14be28bcd4409cdb8`. Signature verification passed; its certificate matches the earlier APKs, which are retained. The build's source map matches the final haptic, time-field, and test-control source files. This remains a locally signed test build, not a Play Store release. Physical-phone installation and iOS runtime checks remain pending.

The earlier LAN APK helper was stopped because its bound network address is no longer assigned to this computer. The updated APK is available as a local file; no new phone-accessible download URL or public tunnel is claimed.

## Custom habit emoji — October 29, 2026

- Added the 💊 preset and a labeled “Your emoji” input to create/edit forms, using the existing stored emoji field. Input and presets share the selection, with a live preview. No schema/native configuration change was needed.
- Added `emoji-regex` 11.0.0 through Expo's installer to validate full emoji sequences without depending on runtime grapheme APIs. Validation accepts flags, skin tones, keycaps, and joined sequences, trims surrounding whitespace, and rejects text, incomplete sequences, or multiple emoji. Existing presets remain accepted. Invalid input stays editable, focuses on failed save, and cannot overflow the preview.
- New validation/normalization tests and the SQLite normalization case were observed failing before implementation. The final `npm run check` passed strict TypeScript, lint, and 56/56 tests. SQLite tests verify custom emoji through creation, editing and reopening, unchanged check-ins, and rejection without partially updating saved data.
- `expo export --platform all --max-workers 2 --output-dir .expo/emoji-export` succeeded for Android Hermes, iOS Hermes, and web. A focused independent review approved the source without findings.
- Browser QA in the existing preview verified pill selection updating both preview/input, rejection and focus for `💊💊`, saving a temporary pill habit, editing it to `👩🏽‍⚕️`, and custom emoji persistence after reload. The temporary QA habit is removed afterward; existing personal habits/check-ins are preserved. Evidence: [custom emoji field](verification/custom-emoji-web.png).
- At this stage the earlier `Still-1.0.0-comfort.apk` did not contain the emoji change. The later usability APK below includes it and subsequent Android form checks. System fonts determine how an emoji looks on each device.
- The online dependency check now recommends Expo 58.0.21, React Native 0.88.1, and newer patches for Constants, Dev Client, Font, Linking, Notifications, Router, Splash Screen, and System UI. These SDK updates were not applied as part of the emoji change. This check reports outdated packages; it is not recorded as passing. Existing automated checks and exports above pass with the installed versions. Installer audit totals remain nine (six low, three high), as documented above.

## Form usability — October 29, 2026

Implemented only the three selected improvements: Edit in the habit-detail header, a persistent form Create/Save footer, and name/schedule first with expandable Appearance, Your reason, and Reminder sections. Existing values, custom emoji, reminder recovery, dirty protection, SQLite schema, and offline behavior are preserved. No dependency or SDK change was added.

Validation and review:

- Browser baseline before implementation: the Edit action began at 1024px and Create ended at 1346px in a 551px viewport, both below the screen. The new header Edit is at 10–54px and Create/Save stays at 487–539px, including after expanding/scrolling optional sections.
- Final `npm run check` passed strict TypeScript, Expo lint, and all 56 regression tests. The UI layout was checked through real before/after browser and native interactions rather than source-text/style assertions. Final Android/iOS Hermes and web exports succeeded to `.expo/form-usability-delivery-export`.
- Focused independent review approved the final source. Its inaccessible disclosure-summary finding was fixed by including summaries in accessible names. A follow-up verification finding was fixed: the keyboard script now rejects inverted focused-input bounds and checks the input against the scroll viewport, as well as checking the fixed action above the keyboard.
- Hidden invalid emoji and reminder time reopen their sections and focus the affected input. The browser's invalid reminder input was observed not focusing before the optional input-ref fix; it now focuses at 243–295px. Collapsing sections preserves their values, which survive save/reopen. Keep editing and Discard continue to protect unsaved changes made within collapsed sections.
- Browser QA created only temporary `Form QA`, saved emoji/reason/reminder values with sections closed, reopened them, then removed that QA habit. Existing personal habits and check-ins were preserved. The final Desktop preview is a pristine create form with the new controls; no QA habit is bundled.

Android runtime checks used the Pixel 7 API 36 emulator and signed standalone APKs installed in place, without clearing app data:

- The header Edit action appears near the top (bounds 903,151–1038,267), opens the shorter form, and no longer requires scrolling past the calendar. The optional reason and pill emoji persisted through the final APK update and cold launch.
- Both a normal edited save and Save and open Settings persist before navigating without an unwanted discard prompt. Reminder recovery still explains that notifications are off. Global reminders and check-in vibration remained off during this task.
- Native name and custom-emoji keyboard checks pass. The focused emoji input is at 1074–1252px, its inline error at 999–1047px, and Save at 1287–1424px, all above the keyboard at 1517px. Before correction the emoji error was clipped below the viewport; it now appears above the input and is also included in the accessibility hint.
- At 320dp width (`840x1860`, density 420) and font scale 1.5, weekdays form balanced rows while retaining minimum touch targets. Visual inspection found the Every day shortcut outside its card; wrapping the schedule header moved it below the title, within the card. The final settled capture shows title bounds 118,773–551,845 and shortcut bounds 118,889–362,957.
- The stronger large-text keyboard check passed with scroll bottom 843px and keyboard top 1117px; the focused input and Create footer remain visible. Both display-recreation navigation cycles also pass. The emulator's physical `1080x2400` size and font scale `1.0` were restored afterward.
- On the final APK, typed a name and pressed the footer Create button once while the Android keyboard remained open. The habit saved and the app returned to Today on that first tap. The temporary `Footer QA` habit was then removed and the empty state verified after cold launch.
- Removed only the native `Usability QA` habit through confirmation and cold-reopened the app to verify cleanup. No new Still crash or pending habit alarm remained. The first emulator boot showed a System UI wait prompt, resolved with Wait; it was not a Still crash.
- An initial cleanup attempt force-stopped the app before the asynchronous deletion completed, so its cold-reopen assertion failed. The repeat waited for the empty-state UI before restarting and passed; final QA cleanup also passed. No personal browser data was changed.

Evidence: [compact web form](verification/form-usability-web.png), [header Edit](verification/form-usability-header-android.png), [compact native form](verification/form-usability-initial-final-android.png), [native keyboard/footer](verification/form-usability-keyboard-android.png), [visible error and Save](verification/form-usability-error-final-android.png), [large-text form](verification/form-usability-large-text-android.png), [large-text keyboard](verification/form-usability-large-keyboard-android.png).

Final APK: `.expo/phone-apk/Still-1.0.0-usability.apk`, 60,701,323 bytes, SHA-256 `d3a1b2f45606b1775ea8459e7d51e2e7dc65215da41d23d514409cb1ed86949a`. Signature verification passed and the certificate matches the previous APKs, which are retained. The release source map matches all four final UI source files, including the disclosure, footer, reminder ref, and large-text fixes. This APK also includes the pill/custom-emoji work. It is a locally signed test build. Physical-phone installation and iOS keyboard/safe-area runtime checks remain pending. Existing SDK patch recommendations are unchanged and recorded in the previous section; no public tunnel was started.

## Device checks still required

- [ ] Install and launch an iOS development build.
- [x] Install and launch an Android development build on the Pixel 7 emulator.
- [ ] Complete create, edit, check/uncheck, archive/restore, deletion, and persistence checks on iOS and physical Android hardware.
- [x] Verify the Android native time picker and keyboard avoidance on the Pixel 7 emulator; smaller devices and iOS remain pending.
- [x] Enable and deny Android notification permission and verify Settings recovery on the emulator; iOS remains pending.
- [x] Verify silent foreground/background delivery and cancellation on the Android emulator; physical devices and iOS remain pending.
- [x] Edit time/weekdays, archive/restore, disable reminders, and delete; verify pending native requests and Android alarms are replaced or cancelled.
- [ ] Restart the device, cross a day boundary, change time zones, and verify local scheduling.
- [ ] Complete VoiceOver/TalkBack, reduced motion, safe areas and Android gesture navigation checks. Large text at scale 1.5 was reviewed on the Android emulator; other devices and iOS remain pending.

Android emulator installation, the runtime checks above, actual foreground/background notification delivery, and native schedule cancellation are verified. No iOS installation or physical-device test is claimed. A Metro export confirms JavaScript/Hermes bundling; it does not substitute for native runtime verification.

## Dependency audit note

The network npm audit during initialization reported three high-severity entries in the Expo → Expo CLI → Zod dependency chain (one underlying advisory, GHSA-mrhx-c7xc-m3w5). Its suggested automatic fix downgrades Expo to SDK 54. That incompatible downgrade was not applied. Zod is used by Expo tooling, not the habit calculation/storage code. Recheck the audit and Expo's compatible releases before distribution. An offline lockfile update reporting zero vulnerabilities is not a replacement for the network audit.

The October 28 comfort-polish network audit reports nine entries: the same three high-severity Zod/Expo tooling entries and six low-severity entries arising from deepmerge (GHSA-gcqx-w48m-w2h4) and dependent configuration packages, including the date/time picker's configuration dependency. The current automatic suggestions downgrade Expo to SDK 51 and the picker to 8.4.0; these incompatible changes were not applied. No forced audit fix was run.
