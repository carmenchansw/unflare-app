# Unflare — MVP Spec

**Unflare** is a privacy-first mobile app for Malaysian women living with endometriosis. It helps you log pain on your phone, use a gentle piano-based body (somatic) relief tool, and read a small community feed — without sending health data to a server.

This spec is the product checklist for the first version (MVP). Keep the app simple, dark-mode friendly (OLED black `#000000`), and beginner-readable TypeScript in Expo React Native.

---

## Who it is for

- Malaysian women with endometriosis (or suspected endo) who want a private flare tracker.
- People who may not want a cloud account, email sign-up, or medical data leaving the device.
- Night-time / low-light use during pain flares.

Unflare is **not** a medical device. It does not diagnose, treat, or replace a clinician.

---

## MVP feature list

### 1. Local pain logger

A simple on-device log for one flare at a time.

- Date and time of the entry (default: now).
- Pain intensity: 0–10 scale (easy tap, not a tiny slider).
- Optional notes: location of pain, what helped, period/cycle flag (yes / no / unsure).
- List of past entries on one screen, newest first.
- Edit or delete an entry (your data, your control).

**Out of MVP:** charts, PDF export, reminders, wearable sync, doctor-sharing.

### 2. Somatic piano relief

A calm, full-screen tool to use during a flare — not a music production app.

- A small on-screen piano (about one octave is enough).
- Tapping a key plays a soft note and can pair with a short body prompt (e.g. “unclench your jaw”, “drop your shoulders”).
- Dark, low-glare UI; large hit targets for shaky or tired hands.
- Works **offline**. Sounds live in the app bundle.

**Out of MVP:** recording songs, MIDI files, streaming music, haptic-only mode as a separate product.

### 3. Community feed (local-first)

A feed that feels like community **without** a live social network in MVP.

- Bundled, read-only posts: short stories, coping tips, and Malaysia-relevant notes (language mix OK: English / Bahasa Melayu).
- Optional **My posts**: the user can write a private note that *looks* like a feed card but is stored only on this phone.
- No likes, comments, DMs, or public usernames in MVP.

**Out of MVP:** real-time social, accounts, moderation backend, push notifications.

### 4. App shell (needed so the three features work)

- Three tabs or a simple home: **Log**, **Piano**, **Community**.
- Dark theme by default (`#000000` background, high-contrast text).
- No login. Opening the app is enough.

---

## Local data privacy rules

Everything in MVP is stored **on this device only**. Treat these as hard rules, not nice-to-haves.

1. **No cloud for health data.** Pain logs, notes, and “My posts” never go to a server, analytics tool, or AI API.
2. **No account.** No email, Google/Apple login, or user ID in MVP.
3. **On-device storage only.** Use local storage (for example AsyncStorage or a local database). If the user uninstalls the app, that data is gone — say this clearly in the UI.
4. **No hidden tracking.** No crash reporters or marketing SDKs that upload usage or health text unless we add them later with an explicit opt-in (not MVP).
5. **Community content is static.** Bundled feed posts are shipped inside the app. They are not fetched from a live feed that could leak device info.
6. **Permissions stay minimal.** Microphone, contacts, location, and photos are **not** required for MVP. Audio for the piano should use bundled sound files, not the mic.
7. **User can wipe data.** Provide a Settings action: “Delete all local data” that clears logs and private posts.
8. **Sensitive copy.** Avoid storing IC numbers, clinic names, or photos in MVP fields. Keep the note box free-text but do not ask for identifying details.

When we add a real community later, it must be a **separate** opt-in product with its own consent screen — not a silent upload of existing logs.

---

## 3-step incremental development checklist

Build in this order so each step is a usable app, not a half-built pile of screens.

### Step 1 — App shell + local pain logger

- [ ] Expo app with a dark home screen and navigation to **Log**.
- [ ] Create / list / delete a pain entry stored **only on device**.
- [ ] Confirm: airplane mode still works; no network calls for logs.
- [ ] Confirm: “Delete all local data” clears the log.

**Done when:** you can record a flare, close the app, reopen, and still see it — with no login.

### Step 2 — Somatic piano relief

- [ ] A **Piano** screen with tappable keys and bundled notes.
- [ ] One short somatic prompt visible while playing (can be a simple rotating list).
- [ ] Same dark, large-tap UI as the logger.
- [ ] Confirm: works offline; no microphone permission.

**Done when:** during a fake flare, you can log pain, then open piano and play a few notes without leaving the app.

### Step 3 — Local community feed + polish

- [ ] A **Community** screen with a few bundled posts (Malaysia-aware, endo-aware, non-clinical).
- [ ] Optional private “My post” saved locally (same privacy rules as the logger).
- [ ] Light polish: empty states, contrast, Bahasa labels if you have them.
- [ ] Confirm: no new backend, no analytics, wipe-data still clears private posts.

**Done when:** a new user can open Unflare, log pain, use piano, and read the feed with zero sign-up.

---

## Success for this MVP

A woman in pain at 2 a.m. can open Unflare, tap a number, play a few quiet notes, and feel less alone — and her entries never leave her phone.

## Future Roadmap: On-Device Voice / Wake Word (Post-MVP)

When the core local pain logger, somatic piano, and community feed are fully working, we will add hands-free activation.

- **The Privacy Rule:** Just like our health logs, wake-word detection must run **100% offline and locally** on the device using bundled TensorFlow Lite (.tflite) models. No continuous audio streaming to external servers.
- **The Engine:** Using on-device tools like `onnxruntime-react-native` or `react-native-openwakeword` via an Expo Development Build.
- **Trigger Action:** Saying a custom phrase (e.g., "Hey Unflare" or "Steady") will instantly launch the Somatic Piano relief screen during a severe flare-up when hands are tired or shaky.
