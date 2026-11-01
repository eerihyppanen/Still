# Daily-use polish

The user approved compact Today, clearer reminder status, and habit reordering on October 28, 2026. Routine implementation decisions are delegated; execute these three changes inline in the requested Desktop folder.

- Today: preserve Still's palette and calm tone; shorten the greeting/week/progress area, omit a meaningless 0-of-0 progress card, and keep an accessible New habit action near the top. First-time creation must fit on a normal phone screen. Large text must remain readable.
- Reminders: explain the actual global state (off, ready, blocked, unsupported, or error). Drafts must never be described as already scheduled. When settings need attention, offer Save and open Settings so navigating cannot discard the draft. Archived habits remain explicitly inactive.
- Ordering: a Reorder mode on Habits exposes labeled Up/Down controls, disabled at the boundaries or while saving. Order applies to Today and survives restarting. New habits append; archived habits retain their place for restoration. Preserve all tracking data.

Approaches considered: drag handles add interaction/dependency complexity; explicit movement controls reuse existing native components and support accessibility. Store an ordered ID list in the existing SQLite settings table rather than changing the habit schema. Missing or malformed order metadata must leave every habit accessible in its original order. Keep the current notification scheduling engine and permission flow.

No authentication, backend, new dependencies, backup feature, or unrelated navigation changes. Verify behavior with real SQLite integration tests and Android UI checks, then update the verification record and produce an updated standalone APK for phone testing.
