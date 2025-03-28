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

Follow these simple steps:

1. Install [Spicetify Marketplace](https://github.com/spicetify/spicetify-marketplace) if you haven't already
2. Open Spotify and navigate to Marketplace → Extensions
3. Search for "Amai Lyrics"
4. Click **Install** to add it to Spicetify

### 🔧 Manual Installation

For manual setup:

1. Download [amai-lyrics-main.js](./builds/amai-lyrics-main.js)
2. Copy it to your Spicetify extensions folder
   - Use `spicetify config-dir` to find the correct location
3. Run these commands in terminal:
   ```bash
   spicetify config extensions amai-lyrics-main.js
   spicetify apply
   ```

### ⚙️ Configuration

1. Open Spotify Settings
2. Scroll to the bottom
3. Look for the API key field
4. Paste your Gemini API key
5. Wait for lyrics to load - you'll see Furigana appear automatically

![Settings Screenshot](./previews/settings.jpg)

## 🙏 Credits

Special thanks to Spikerko, creator of the original Spicy Lyrics extension.
