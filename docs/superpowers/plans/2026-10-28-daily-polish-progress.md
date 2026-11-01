# SDD ledger — plan: docs/superpowers/plans/2026-10-28-daily-polish.md

Pre-flight: Task 1 returns ordered snapshots consumed by Today in Task 3. Task 2 only consumes existing notification status. No conflicting interfaces.

Ruling: Work inline in the supplied Desktop folder, which has no Git metadata — preserves the user's explicit location and existing state; no commit-based recovery is available, so capture changed originals under .expo before editing.

Task 1: complete. Four new real-SQLite tests failed before implementation; npm test now passes 35/35. Ordering persists in settings.habitOrder, with no migration. The test adapter returns null-prototype rows, so the literal completion assertion normalizes row prototypes before comparing values.

Task 2: complete. The new reminder helper was missing in the initial test run; five new feedback tests now pass. Save and open Settings validates and stores the draft before navigating.

Task 3: in progress. Compact Today is implemented; npm run check passed. Native visual verification, exports, review, and updated APK remain.

Final review: independent read-only review found no critical/data-loss issue. The reported date-change append edge case was reproduced in a failing SQLite test and fixed by persisting the normalized order plus each new ID in its creation transaction; suite now 36/36.

Ruling: Treat the append edge case as required ordering correctness despite its minor review label — ordinary travel must not unexpectedly reorder new habits; leaving it would violate the promised append behavior.

Native review evidence: Save and open Settings stayed in the form on invalid input, then saved Polish QA Read and navigated to Settings on valid input. At 320 dp / 1.5 font scale its label wrapped within the button already; add explicit shrink/center constraints for consistent wrapping across platforms. The smaller ring did visibly intersect the 100% text at this size; let the large-text ring grow within available card width and rerun the native check.

Review's declined-to-judge items are owned by native QA: first-create fit, reduced-ring large text, and save-to-settings navigation. First-create action is fully visible at [246,1538][834,1674] in the normal Pixel 7 viewport. No separate feature deferrals.

Native reorder passed: moving Polish QA Read down put Polish QA Walk first, with correctly disabled boundary controls. Final APK update preserved the saved QA habit/check-in. Ready/off feedback and invalid/valid save-to-settings were verified. Both large-text fixes were visually checked at 320 dp / 1.5 font scale.

New native finding: after rapid Android display/font recreation, navigation crashed with 'The imperative router is unavailable before the first render has finished.' The SDK 58 shared router bridge resets its global object on cleanup; useRouter builds a router bound to the current navigation context instead. The repeatable scripts/verify-android-navigation.ps1 check passed cycle 1 but FAILED on cycle 2 against the global-router APK before the fix.

Ruling: Replace the shared router import with the supported context-bound useRouter hook at all seven navigation call sites — the reproduced configuration-change crash affects any shared-router action, so fixing only the new Today button would leave the same failure elsewhere. Routing destinations and behavior remain unchanged; risk is bounded to API wiring and verified through native recreation plus normal navigation checks.

Task 3: complete. Final npm run check passes 36/36 plus TypeScript/lint; all-platform exports pass. The display-recreation regression passed both cycles on the navigation-fixed APK. Cold reopen preserved Walk-before-Read order and Read's completion. Native boundary controls, reminder guidance, save-to-settings validation, narrow/large-text layouts, and in-place update were checked. QA data was deleted and original display/reminder settings restored. Verification, README, development notes, evidence images, and the updated APK/download QR are saved.

Final review fixes: date-change append RED→GREEN with real SQLite; large-text ring visual RED→GREEN; display-recreation navigation RED (cycle 2)→GREEN (both cycles). Shared long button labels have explicit centered wrapping. No deferred findings.
