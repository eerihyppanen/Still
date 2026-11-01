# Custom habit emoji

Add 💊 to the existing presets and a labeled input underneath for typing/pasting one emoji using the device keyboard. Presets and input edit the same value; the preview updates immediately, and existing create/edit/unsaved-change behavior remains in place.

Use the existing SQLite emoji text column; no schema, account, backend, or native module change. Accept one full emoji sequence, including flags, skin tones, keycaps, and joined families. Trim surrounding spaces, reject empty/text/multiple emoji inline, and keep invalid drafts editable without overflowing the icon preview.

Approaches: a large in-app emoji picker adds UI and maintenance; Unicode segmenting depends on runtime support; a small emoji-regex validator plus the existing device keyboard gives full sequence support across native and web. Choose the last approach as a routine implementation decision under the user's existing delegation. No additional design question is needed for this clear request.
