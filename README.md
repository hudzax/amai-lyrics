# 🎶 Amai Lyrics

An extension of Spicetify. A fork of [Spicy Lyrics](https://spicylyrics.org/) that extends the original project by adding Furigana support using the free Gemini API. This enhancement lets you display phonetic guides alongside Japanese lyrics.

## 🌟 Features

- **Furigana Support:** Annotate Kanji with phonetic guides to aid reading.
- **Gemini API Integration:** Leverages a free API to generate Furigana annotations.
- **Easy Setup:** Simply obtain your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and follow the configuration instructions.

## 👀 Preview

![Extension Preview](./previews/preview-large.jpg)

## 🚀 Installation

### 🛒 Via Marketplace

1. Refer to the [Spicetify Marketplace guide](https://github.com/spicetify/spicetify-marketplace).
2. Open Spotify → Marketplace → Extensions.
3. Find "Amai Lyrics" and click **Install**.

### 🛠️ Manual Install

1. Copy [amai-lyrics-main.js](./builds/amai-lyrics-main.js) to your Spicetify extensions directory (use `spicetify config-dir` to locate it).
2. Run the following commands:
   ```
   spicetify config extensions amai-lyrics-main.js
   spicetify apply
   ```

Credit to Spikerko, the creator of the original Spicy Lyrics.
