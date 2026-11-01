# Still 1.1.0 for Android

Open `Still-1.1.0.apk` on your phone and choose Update/Install. **Keep the old app installed** so Android retains its local history. This build uses the same package and signing certificate as the previous test APKs.

- In a habit's edit form, choose Anytime, Morning, Afternoon or Evening.
- Expand a habit notification for Done and Snooze 10 min.
- Long-press your home screen → Widgets → Still → Still — Today to add the compact widget. It shows the saved date/progress; Open Still refreshes it and opens the app for check-ins.
- The installed app works without internet or a development server. This Android build has no internet permission and excludes app data from automatic backup/transfer. There is no account or cloud sync.

Uninstalling or losing the phone can lose local history. The update prevents future automatic backups; it cannot remove backups made by an earlier version.

SHA-256 is in `SHA256SUMS.txt`. Emulator upgrade/offline/action/widget checks, TypeScript, lint, 80 tests and all-platform exports passed. Expo Doctor's existing core SDK patch warnings and remaining physical-phone/iOS checks are recorded in `../VERIFICATION.md`.
