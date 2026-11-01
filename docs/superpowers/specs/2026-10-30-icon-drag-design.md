# Still icon and direct habit reordering

The user requests a better balanced home-screen/loading leaf and live drag reordering instead of repeated Up/Down taps. Routine decisions are delegated; no new APK is requested.

Keep the purple identity. Replace the existing vector leaf with one centered, continuous leaf with an internal vein. Generate matching opaque app/favicon assets, transparent adaptive foreground/monochrome assets within Android's safe zone, and separate light/dark transparent splash marks. Keep editable SVG sources and a repeatable render script. No package identity/version change.

Keep Habits → Reorder → Done. In Reorder, show compact non-navigating rows with a generous grip. Touching the grip lifts the row; it follows the finger while other rows animate into their prospective positions. Release saves the entire order once. Scroll near screen edges, support unequal row heights/large text, cancel interrupted gestures, and preserve normal scrolling away from grips. Expose screen-reader move actions and keyboard arrows without requiring drag. Respect reduced motion for decorative transitions. Show saving/error state and restore persisted order on failure.

Use built-in React Native PanResponder/Animated, avoiding another native dependency. Alternatives considered: a draggable-list package would add gesture/reanimation native dependencies; plain long-press move menus would not deliver the requested live motion. Existing settings metadata remains the persistence format, with atomic validation of all active IDs and archived slots preserved. Today keeps grouping and uses custom order within groups.

No APK/native regeneration in this task. Verify real browser interaction and persistence, geometry/SQLite regressions, strict types/lint, and bundle exports. Actual Android launcher/splash and touch behavior remain for the next requested build.
