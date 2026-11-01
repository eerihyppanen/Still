# Faster editing and a shorter habit form

The user approved improvements 1–3: top-level Edit in habit details, a persistent Create/Save action, and name/schedule first with expandable optional sections. Preserve all existing behavior and data, including custom emoji, reminders, normalization, keyboard avoidance, validation, and unsaved-change protection.

Use an Edit text action in the detail navigation header. Keep the primary form action in a bottom safe-area footer outside the scroll content, within the existing keyboard-avoiding container. The default form shows name and schedule first, followed by collapsed Appearance, Your reason, and Reminder cards with summaries. Store all draft values in the parent so collapsing never discards them. Open sections with validation errors and reveal/focus the first invalid field in the new visible order. Keep reminder recovery actions within Reminder.

Approaches considered: sticky positioning inside the scroll view is inconsistent across native/web; a header Save action competes with Cancel and has less space; a sibling footer within KeyboardAvoidingView works across platforms and preserves one primary action. Choose the sibling footer and controlled disclosure cards as routine decisions within the approved scope.

No new dependency, schema/native configuration change, SDK upgrade, backup/restore, backend, or public sharing. Recommendations 4–6 remain outside this task. Validate layout and behavior in the browser and Android emulator, including keyboard and narrow/large-text layouts. Keep user habits intact; use only disposable QA habits for runtime checks.
