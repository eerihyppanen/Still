# Comfort polish

The user approved all remaining proposed polish except backup/restore: unsaved-edit protection, field-level validation, calendar return to today from any month, a test reminder, optional check-in vibration, and device time-format support. Routine decisions are delegated; implement inline in the Desktop project.

- Use SDK 58's usePreventRemove for Cancel, native back/gesture, and browser unload. A shared confirmation lets the user keep editing or discard. Successful saves explicitly disable prevention; invalid/failed saves retain the draft. Compare normalized persisted values so undoing edits makes the form clean again. Show errors beside their fields and scroll to the first problem.
- Back to today resets both displayed month and selected day, from any historical month.
- Use SDK-compatible expo-localization to honor the system clock preference and refresh when it changes. Keep HH:MM storage and scheduling unchanged. The browser editor keeps an explicit HH:MM input with a localized preview.
- Add SDK-compatible expo-haptics. Persist an optional setting defaulting off. Provide a gentle effect only after a new completion is saved; failure of the haptics engine must not undo a check-in. Mobile-only controls explain browser limits.
- Test reminder: one silent, nonrepeating notification after about five seconds, available after enabling reminders/permission. Give it a separate identifier outside the repeating habit namespace. Repeated tests replace only the prior test. Offer cancellation, report delivery while open, refresh pending/delivered state on foreground, and cancel the test when global reminders are disabled or permission is blocked. Preserve all habit schedules.

Alternatives: reuse platform vibration APIs vs Expo Haptics (choose Expo for gentler cross-platform effects); custom back/unload listeners vs SDK 58 usePreventRemove (choose the documented hook, including its repeat/disable API). Keep the existing notification queue to serialize native operations. No backup, authentication, backend, public tunnel, or unrelated feature changes.

Verify with domain/SQLite tests, real browser navigation without touching the user's existing habit, and native Android permission/delivery/cancellation/time-format/navigation checks. Update verification notes and produce an updated APK. Physical haptic feel and iOS runtime remain device checks.
