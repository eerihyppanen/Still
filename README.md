# Still

A quiet, offline-only habit tracker, built with Expo SDK 58, React Native 0.88, strict TypeScript, Expo Router, and Expo SQLite. The Android release keeps your data on the phone, excludes it from automatic backup/transfer, and has no internet permission. There are no accounts, analytics, or cloud services in the app.

## Android 1.3.0

[Download Still 1.3.0 from the Android release](https://github.com/eerihyppanen/Still/releases/tag/v1.3.0). Sign in to GitHub on your phone to access the private repository's APK. This build includes clearer wording, usability fixes, compact History/Settings screens, faster check-ins, and the Android History recreation fix. The local copy is `releases/Still-1.3.0.apk`. See [the APK notes](./releases/README.md) and [verification record](./VERIFICATION.md).

Install the new APK over the existing Still installation. **Do not uninstall first:** uninstalling removes local history. Keep the same signing key/package for subsequent builds. Once installed, no computer, Wi-Fi, Expo Go, or development server is needed.

- Choose **Time of day** when creating/editing a habit: Anytime, Morning, Afternoon, Evening. Existing habits stay Anytime. Today shows sections when groups are assigned and preserves custom order within each section.
- Expand a habit notification to see **Done** and **Snooze 10 min**. Done saves the check-in locally; Snooze creates one quiet reminder. Phone battery restrictions can delay delivery. Stale occurrences are ignored; a snooze that would cross midnight is left for review in Still.
- Touch and hold the Android home screen, choose **Widgets**, and add **Still — Today**. It shows the saved date, progress, and up to three habits. **Open Still** refreshes the view and takes you to the app for actual check-ins. It is a dated snapshot, not an automatic midnight refresh or a separate check-in store.
- Automatic cloud backup and device transfer are disabled for this Android release. This prevents future app-data backups; it does not erase backups Android may have made before this update. Without a backup, losing/uninstalling the app can lose your history.

## Run it

Use Node.js 24 LTS and npm. From this folder:

```sh
npm install
npm run web
```

The browser preview supports tracking, SQLite persistence, history, statistics, and themes. Local notifications and the native time picker are mobile features. Keep `metro.config.js` in place: SQLite's browser worker needs its WebAssembly support and isolation headers. Browser storage belongs to that browser and origin; mobile devices each keep their own database.

For Android testing without a connected computer, install a standalone APK on your phone. Open the downloaded file, allow your browser to install apps if Android asks, and choose Install. Still then runs with its bundled code and local database; Expo Go, USB, and a development server are not needed. Code changes require a new APK.

The existing EAS `preview` profile creates this kind of APK:

```sh
npx eas-cli@latest build --profile preview --platform android
```

EAS provides a download link after the build. See [Expo's APK installation instructions](https://docs.expo.dev/build-reference/apk/).

For live updates while developing on your phone, use a development build:

```sh
npx eas-cli@latest build --profile development --platform android
# Or: --platform ios
npx expo start --dev-client
```

EAS requires your Expo account; signing an iOS device build also requires Apple developer credentials. Install the resulting build on your device and connect it to the development server. No cloud backend is required by the app. EAS only builds the native binary. Before publishing, replace the example bundle/package identifier `com.still.habits` with an identifier you own.

With Android Studio installed, `npx expo run:android` builds locally. On a Mac with Xcode, use `npx expo run:ios`. A Windows computer cannot compile a local iOS binary.

For this Windows machine, the Android SDK is installed but is not on PATH. In PowerShell, prepare the build terminal with:

```powershell
cd C:\Users\eehyp\Desktop\Still
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
${env:ORG_GRADLE_PROJECT_expo.android.cmakeObjectPathMax} = '240'
npx expo run:android --device Pixel_7
```

The object-path setting was verified with SDK 58 on this machine. It makes CMake shorten generated object filenames to avoid the installed Ninja tool's Windows path limit. It applies only to that terminal; it does not change Windows settings, native source, or EAS builds. The first build installs any missing SDK/compiler packages and takes longer than later builds.

For an already installed emulator build, start the Desktop server with the following command, then open Still and select the local project. The IPv4 option avoids an IPv6-only localhost listener that ADB cannot forward to on this machine:

```powershell
node --dns-result-order=ipv4first .\node_modules\expo\bin\cli start --dev-client --localhost --port 8081 --max-workers 2
adb reverse tcp:8081 tcp:8081
```

This localhost setup is for an emulator or USB-connected Android phone. A phone connecting over Wi-Fi needs `npx expo start --dev-client --lan` and access to the computer on the same network. See [VERIFICATION.md](./VERIFICATION.md) for the tested environment and remaining device checks.

For an installed Expo Go that supports SDK 58, `npx expo start --go` is also an option. Expo notes that local notifications remain available in Expo Go; remote push requires a development build. SDK 58's store rollout may lag the SDK release, so a development build is the reliable path. This app uses only local reminders. See [SDK 58 release notes](https://expo.dev/changelog/sdk-58) and [notification documentation](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/).

## What you can do

- Create habits by choosing a name and schedule first. Expand Appearance for emoji/color, Notes for optional details, or Reminder for a time. Appearance includes 💊 and an input for typing/pasting your own emoji.
- Use the Edit action at the top of habit details. Create/Save stays at the bottom of the form while you scroll, including above the phone keyboard. Closing an optional section keeps its values; invalid fields reopen their section on save.
- Check and uncheck today's scheduled habits. View individual scheduled-day streaks and daily progress.
- Choose Weekly goal in a habit’s schedule to track 1–7 days per week on any days. See progress on Today, in habit details, and in History → Insights.
- Open a habit and choose Pause until to pick its return date. You can change the date or resume early. Past check-ins stay saved.
- Optionally organize Today into Morning, Afternoon, Evening, and Anytime sections. Zero streaks say “Start today”; future week-strip dates are disabled.
- Edit, archive, restore, or permanently delete a habit with confirmation.
- Put routines in your preferred order: open Habits, choose Reorder, then drag a habit's grip. Other rows move as you drag; hold near the top/bottom to scroll a longer list. Let go to save, then choose Done. Keyboard arrows and screen-reader Move up/Move down actions are also available. The order stays saved after reopening and appears within Today's time-of-day groups.
- Browse History → Calendar, update check-ins in compact day rows, and use Back to today to return from another date or month. The selected date stays in place when switching views.
- Open History → Insights for the weekly recap, weekly/monthly progress, total check-ins, completion rate, and current/longest habit streaks.
- Choose light, dark, or device appearance in one row. Settings keeps reminder status visible and folds Reminder help, archived habits, and About Still into expandable sections.
- Leave an unfinished habit edit safely: Keep editing retains the draft; Discard changes leaves without saving. Invalid saves show errors beside the affected fields.
- Use your phone's preferred 12/24-hour time display in reminder controls. Times remain stored as local HH:MM values.
- Enable optional check-in vibration in Settings. It starts off and only plays after a new completion saves; unchecking stays quiet.
- Send a quiet test reminder from Settings after enabling gentle reminders. A test is scheduled for about five seconds later, with separate Cancel/Clear controls; phone restrictions can delay delivery.
- Use Done/Snooze on habit reminders and a dated Android home-screen widget; both use the same local SQLite history.

A fresh install has no sample data. Browser verification uses a manually created habit in the local preview; that data is not bundled into the app.

## Data and date rules

- SQLite schema version 2 adds a weekly target to schedule versions. The upgrade preserves existing schedules and check-ins. Unknown newer schemas fail safely.
- A primary key on `(habit_id, date)` prevents duplicate check-ins. Repository operations are serialized, and multi-step changes use transactions.
- Check-ins are local `YYYY-MM-DD` dates. Calendar arithmetic advances local dates at noon, rather than adding 24-hour millisecond intervals across DST changes.
- Weekday edits apply from today. Earlier schedule versions stay saved. Existing completed dates remain in your progress even if a schedule edit removes that weekday.
- Weekly goals start on Monday and count at most one check-in per day. A short week caps the target at the number of eligible days. Weekly goals have their own progress, separate from scheduled-day completion rates and streaks.
- A timed pause starts today and ends on the chosen resume date. Days in the pause are skipped by the schedule and scheduled-day streaks.
- Archive periods use an exclusive end date: archiving pauses today. Existing check-ins stay saved and count in history. Restore resumes today and preserves paused dates.
- Streaks count scheduled days. Rest days and archive pauses do not break a streak. An unfinished current day does not break a streak until that date has passed.
- Completion percentages include eligible dates through today, including today's unfinished scheduled habits; future dates are excluded. Overall streak cards show the best individual habit streak, as labeled.
- Habit deletion permanently removes that habit's schedules, periods, and check-ins. There is no cloud synchronization or recovery service.
- Custom order is stored in the SQLite settings table. New habits append to the end, including after a local-date/time-zone change. Archived habits retain their place for restoration.
- Optional time-of-day assignments and short-lived notification action receipts also use settings metadata.

## Reminder behavior

Set a reminder time in a habit, then enable notifications in Settings. Permission is requested only after that explicit action. Denial leaves tracking functional and offers a link to device settings.

The habit form shows whether reminders are off, allowed, blocked, unavailable in the browser, or need a retry. Its enabled-state message explains that saving applies the reminder. When settings need attention, Save and open Settings validates and saves the habit before navigating, so the draft is retained on validation failure.

Daily routines use one repeating daily notification; selected-day routines use weekly notifications for their selected weekdays. The app reconciles its own scheduled notifications after saves, edits, archive/restore, deletion, settings changes, and foreground/resume. It includes the current time zone in each schedule signature so travel triggers reconciliation. An incomplete schedule is cleaned up after failure and can be retried from Settings or on reopening.

Weekly goals use a daily reminder when a time is set and reminders are enabled. Pausing replaces the recurring reminders with one reminder for the first scheduled day back. Opening Still after the pause restores recurring reminders.

To stay within pending notification capacity, the app allows up to 60 notification slots. It reports an error and cancels its reminder set if the configuration exceeds that limit; it never silently drops some habits. Each every-day habit uses one slot; a selected-day habit uses one per selected weekday. Delivery is a gentle, best-effort reminder, not an exact alarm. The OS can delay it under Focus, battery saving, or background restrictions. Reopen the app after changing device time zones. OS delivery across DST and time zone changes still needs device verification.

## Project structure

```text
src/app/             Expo Router tabs, habit detail, and form
src/components/      Shared accessible controls, calendars, charts, dialogs
src/theme/           Light/dark tokens and reduced-motion preference
src/state/           App lifecycle and persistent state coordination
src/domain/          Pure local-date, scheduling, streak, history calculations
src/data/            Versioned migrations and serialized SQLite repository
src/notifications/   Reminder planning, reconciliation, and Expo adapter
tests/               Domain tests and real SQLite integration tests
```

The UI depends on the application provider; SQL stays in the repository. The pure domain functions do not depend on React Native or Expo. All habits, settings and history are stored locally.

## Checks

```sh
npm run check
npm run test:timezones
npx expo install --check
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

`npm test` uses Node's test runner through `tsx`. SQLite integration tests use Node's real SQLite engine through a small adapter; they test persistence across close/reopen, migrations, uniqueness, pause/restore boundaries, validation, and cascading deletion. They do not emulate the native Expo SQLite bridge. Reminder tests exercise reconciliation with a controlled OS adapter; they do not prove notification delivery on a phone.

To check navigation after display/font recreation on the Android emulator, run `scripts/verify-android-navigation.ps1 -Serial emulator-5554` with `adb` on PATH. This opens and cancels an empty form twice and restores the previous display settings. It does not create or delete habits.

With a habit text field focused and the Android keyboard open, `scripts/verify-android-keyboard.ps1 -Serial emulator-5554` checks that both the focused field and fixed Create/Save action remain visible above the keyboard.

See [VERIFICATION.md](./VERIFICATION.md) for the commands actually run and remaining device checks.
