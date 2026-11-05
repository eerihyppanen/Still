# Compact History and Settings

The user approved the three proposed layout changes and requested a GitHub push.

- History opens on Calendar, with a Calendar / Insights selector. Calendar retains the month grid, editing past check-ins, future-date restrictions, and Back to today. Insights contains the existing weekly recap and statistics. Selected-day habit rows become shorter while retaining separate detail and checkbox actions.
- Settings puts Light / Dark / System in one row, keeps reminder status and permission/error recovery visible, and uses a short vibration row. Reminder help contains explanations and the existing test reminder controls.
- Archived habits (with count), Android widget instructions, and About Still become expandable sections. The widget no longer sits beneath the archived-habits heading. The offline/data-loss explanation remains available inside About.
- Keep Still's existing purple palette, typography, themes, SQLite schema, data, and notification behavior. No dependencies or APK are needed. Controls remain comfortably tappable and support wrapping text.

## Approaches

The approved approach separates Calendar and Insights and folds occasional settings away. Keeping one long page with smaller text would save less scrolling and harm readability. Collapsing the calendar itself would make the main History interaction harder to reach.

## Implementation decisions

Reuse Disclosure and add one shared choice control for History and appearance. Keep the calendar mounted across view switches to retain the browsed date. History controls its calendar's selected date through Expo Router parameters; Today date links explicitly open Calendar. Derive the displayed month from the selected date. The habit-detail calendar retains local selection. Compact HabitRow is opt-in so existing Today and habit lists retain their layout.

## Verification

Run the existing checks and Android bundle export. Verify layouts, date links, check/undo persistence, Insights, themes and disclosures in an isolated browser origin at phone widths. Browser verification cannot prove native notification delivery; the notification scheduling implementation is unchanged.
