# 🎶 Amai Lyrics

![Amai Theme Preview](./previews/amai_theme_3.jpg)

**Amai Lyrics** is a [Spicetify](https://spicetify.app/) extension that rebuilds Spotify's lyrics into a full, synced experience: a reimagined lyrics page with active-line highlighting and auto-scroll, the current line in the playbar, a fullscreen mode with playback controls, and an optional **Amai Theme** dynamic background generated from the current album artwork.

For language learners, it adds **Furigana** readings above Kanji, **Romaji** for Japanese and **Romanization** for Korean, plus **line-by-line translations** into 11 languages. Readings and translations work out of the box through Amai's free hosted backend — add your own Gemini API key and Google's Gemini takes over as the primary AI, with automatic fallback if a request fails.

---

## ✨ Features

### Lyrics Plus

The full lyrics page, reimagined for language learners:

- **Furigana** above Japanese Kanji so you can always read them
- **Romaji** readings for Japanese lines
- **Romanization** for Korean lines
- **Line-by-line translations** synced with the music

![Furigana Preview](./previews/preview_furigana.jpg)
![Romaja Preview](./previews/preview_romaja.jpg)

### Playbar Lyrics

Keep the current line in view without leaving your playlist — the active lyric (with Furigana/Romaji) renders right in the Spotify playbar.

![Playbar Lyrics Preview 1](./previews/playbar_lyrics_preview_1.png)
![Playbar Lyrics Preview 2](./previews/playbar_lyrics_preview_2.png)
![Playbar Lyrics Preview 3](./previews/playbar_lyrics_preview_3.png)

### Amai Theme

A dynamic background generated from the current song's album artwork. Off by default — flip the toggle in settings to turn your whole client into the vibe of whatever you're playing.

![Amai Theme Preview 1](./previews/amai-theme_1.jpg)
![Amai Theme Preview 2](./previews/amai-theme_2.jpg)

---

## 🌍 Translation Languages

Translate lyrics into any of:

English · Spanish · French · German · Portuguese · Chinese (Simplified) · Thai · Indonesian · Malay · Japanese · Korean

Switch the target language anytime from Spotify's settings — no reinstall needed.

## 💻 Supported Platforms

Works everywhere Spicetify runs: **Windows**, **Linux**, and **macOS**.

---

## 🚀 Installation

### 1. Install Spicetify

If you don't have it yet, follow the [official Spicetify guide](https://spicetify.app/docs/getting-started/).

### 2. Download the extension

Grab the latest build: [amai-lyrics-main.js](https://github.com/hudzax/amai-lyrics/releases/latest/download/amai-lyrics-main.js)

### 3. Open Spicetify's config folder

```bash
spicetify config-dir
```

This opens a folder — inside it you'll find an **Extensions** folder.

### 4. Move the file in

Copy or move the downloaded `amai-lyrics-main.js` into that **Extensions** folder.

![Config Folder Screenshot](./previews/config-dir.jpg)

### 5. Enable and restart

Run these one at a time:

```bash
spicetify config extensions amai-lyrics-main.js
spicetify apply
```

Then **restart Spotify** (quit it fully and reopen). That's it — you only do this once. Future updates are fetched automatically.

---

## 🔑 Optional: Use Your Own Gemini API Key

Amai Lyrics works out of the box — Furigana, Romaji, Romanization and translations are served by Amai's free hosted backend, so **no API key is required**. If you'd rather have Google's Gemini power them, add your own free key: it becomes the primary AI, and the hosted backend takes over automatically if a request fails.

1. **Create a key** — visit [Google AI Studio](https://aistudio.google.com/app/apikey), sign in, and generate an API key.
2. **Open the settings** — click your profile picture → **Settings**, or hit the settings button on the lyrics page.
3. **Paste the key** — find the **Amai - Settings** section and drop it into the **Gemini API Key** field.

   ![Settings Screenshot](./previews/settings.jpg)

   Your key is stored locally on your machine and used only by this extension — it never leaves your computer except to talk directly to Google's API.

4. **Play a song** — hit the lyrics icon at the bottom of Spotify and wait a few seconds. The synced lyrics, readings and translations appear as the song plays.

   ![Lyrics Toggle Screenshot](./previews/toggle-lyrics-page.jpg)

> **Tip:** The **Get Free API Key** button in the settings section takes you straight to Google AI Studio.

---

## 🛠️ Development

Built with [`spicetify-creator`](https://github.com/spicetify/spicetify-creator) (esbuild under the hood — no Vite).

```bash
npm install            # also patches @hudzax/web-modules DOM types (postinstall)

npm run build-local    # build to dist/ for local inspection
npm run build          # build into Spicetify's config-dir extension folder
npm run watch          # rebuild on file change
npm run spicetify-watch # live reload via `spicetify watch`
```

Verify your changes before committing — there's no CI, so these are the only checks:

```bash
npm run lint           # eslint .
npm run typecheck      # tsc --noEmit
npm test               # vitest run
```

---

## 🤝 Credits & License

```text
Copyright (C) 2024-2025 Spikerko (Original Spicy Lyrics)
Copyright (C) 2025-2026 hudzax (Modifications)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```

Licensed under [AGPLv3](./LICENSE). Bug reports and feature requests are welcome over at [the issues page](https://github.com/hudzax/amai-lyrics/issues).
