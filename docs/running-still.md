# Running and testing Still

Use Node.js 24 and npm. Install dependencies with `npm ci` from the repository root.

## Browser preview

Run `npm run web` to try habit tracking, history, and themes. Keep `metro.config.js` in place so the browser’s SQLite WebAssembly worker receives the required isolation headers. Browser data belongs to its origin. Each native installation has its own database.

## Android

Start an Android Studio emulator and run `npm run android` to install a local development build. A native build includes Still’s reminder module, the home-screen widget, and the native time picker.

The EAS `preview` profile builds a standalone APK. The `development` profile builds a client that connects to Metro. EAS requires an Expo account.

```sh
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile development --platform android
npx expo start --dev-client
```

Keep the Android package name and signing key when distributing updates. Install an update over the current app to keep its local history. A standalone build runs with its bundled code and data on the device.

On Windows, make sure the JDK and Android SDK are available to Gradle. For the 1.4.1 release build, passing `-Pexpo.android.cmakeObjectPathMax=255` to Gradle resolved Ninja’s object-file path error. To connect an emulator to an existing localhost Metro server over IPv4, run the following commands.

```powershell
node --dns-result-order=ipv4first .\node_modules\expo\bin\cli start --dev-client --localhost --port 8081 --max-workers 2
adb reverse tcp:8081 tcp:8081
```

The project can also export an iOS bundle. iOS runtime checks are pending. On iOS and in Expo Go, a deferred reminder fires once and the regular schedule resumes when you open Still.

## Checks

```sh
npm run check
npm run test:timezones
npx expo install --check
npx expo-doctor
```

`npm run check` runs TypeScript, Expo lint, and the Node test runner. The SQLite integration tests open a real temporary database and cover migrations, persistence, and transactions. Reminder tests use a controlled adapter. Android delivery and upgrades are checked separately on the emulator.

With `adb` on PATH, `scripts/verify-android-navigation.ps1 -Serial emulator-5554` exercises navigation after Android recreates the screen. `scripts/verify-android-keyboard.ps1 -Serial emulator-5554` checks that the focused field and the save button stay above the keyboard while the habit form is open.

## Source map

| Area | Location |
| --- | --- |
| Screens | [`src/app`](../src/app) |
| Local dates, schedule rules, and streaks | [`src/domain`](../src/domain) |
| SQLite migrations and repository | [`src/data`](../src/data) |
| Reminder planning and action handlers | [`src/notifications`](../src/notifications) |
| Native background task entry point | [`src/background`](../src/background) |
| Android deferred reminder trigger | [`modules/still-reminders`](../modules/still-reminders) |
| Widget snapshots | [`src/widgets`](../src/widgets) |

See the [implementation notes](../DEVELOPMENT.md) for earlier decisions and the [verification record](../VERIFICATION.md) for runtime results and remaining device checks.
