# Form usability execution record

Scope: approved items 1–3 only. Preserve offline schema/data, custom emoji, notifications, and existing dirty guard. No Git metadata; originals in .expo/form-usability-originals.

UI baseline observed before implementation: Edit top 1024px and Create bottom 1346px in a 551px browser viewport. After implementation Edit is at 10–54px, Save/Create at 487–539px; name/schedule precede collapsed Appearance/Your reason/Reminder. Shared controlled Disclosure keeps draft values in the form parent.

Browser complete: invalid hidden emoji expands/focuses at236–302px; invalid hidden time initially failed focus, then optional inputRef correction focuses at243–295px. Collapsed emoji/reason/reminder save and reopen, summaries include saved values, Keep editing/Discard protect collapsed changes. Temporary Form QA was deleted; personal go for a walk and g preserved. Pristine create form is left open in IAB tab2. Final screenshot verification/form-usability-web.png includes balanced weekday rows; Desktop roots verified in both manifest fields.

Review complete: P2 inaccessible summary fixed by including summary in accessibilityLabel. Reviewer approved all final UI corrections: optional reminder ref, balanced 4+3 weekdays below420px, emoji error above the focused field with an error hint, and wrapping the schedule header for large text. The script's focused-input check now rejects inverted bounds and respects the scroll viewport as well as the IME; the reviewer approved this correction too.

Automated complete: final TypeScript/lint/56 tests pass in .expo/form-usability-check.log. Final Android/iOS Hermes and web exports pass in .expo/form-usability-delivery-export.log. Existing SDK patch recommendations remain outside scope.

Native complete: launched Pixel_7 headless and resolved boot System UI ANR with Wait. Final APK installed in place with matching certificate; all four UI source-map contents match current source. Header Edit, normal/recovery saves, collapsed value retention, and both display recreation cycles pass. Emoji error999–1047, input1074–1252, Save1287–1424 all above keyboard1517. At320dp/font1.5, schedule labels stay inside card and stronger keyboard check passes (viewport843, keyboard1117). One-tap Create with keyboard open succeeds. Waited for deletion completion before cold checks; Usability QA and Footer QA removed, empty state persists, reminders/vibration off, no pending alarm or new Still crash. Display1080x2400/font1 restored, final evidence copied to verification/, owned headless emulator stopped.

Delivery complete: .expo/phone-apk/Still-1.0.0-usability.apk, 60,701,323 bytes, SHA256 d3a1b2f45606b1775ea8459e7d51e2e7dc65215da41d23d514409cb1ed86949a. Older APKs retained. README/DEVELOPMENT/VERIFICATION updated with actual evidence, resolved QA timing failure, and physical-phone/iOS limits. No work remains for the approved scope.
