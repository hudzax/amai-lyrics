# 🎶 Amai Lyrics

Amai Lyrics is a Spicetify extension, forked from [Spicy Lyrics](https://spicylyrics.org/), that enhances your Spotify experience by adding Furigana and Romaja support for Japanese and Korean lyrics.

## 🌟 Features

- **Furigana Support:** Annotate Kanji with phonetic guides to aid reading.
- **Romaja Support:** Display lyrics in Korean with Romaja.
- **Improved visuals:** Enhanced UI/UX for better readability and aesthetics.
- **Gemini Integration:** Utilizes the Gemini Flash 2.0 to generate annotations.
- **Easy Setup:** Obtain the API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and configure it within the Spotify settings as described below.

## 👀 Preview

![Extension Preview](./previews/preview-large-romaji.jpg)

![Extension Preview](./previews/preview-large-jp2.jpg)

![Extension Preview](./previews/preview-large-kr.jpg)

## 🚀 Installation

### 🛒 Via Marketplace (Currently not available 😭)

Follow these simple steps:

1. Install [Spicetify Marketplace](https://github.com/spicetify/spicetify-marketplace) if you haven't already
2. Open Spotify and navigate to Marketplace → Extensions
3. Search for "Amai Lyrics"
4. Click **Install** to add it to Spicetify

### 🔧 Manual Installation

For manual setup:

1. Download [amai-lyrics-main.js](https://github.com/hudzax/amai-lyrics/releases/latest/download/amai-lyrics-main.js)
2. Open terminal and run this command to open/show Spicetify config directory:
   ```bash
   spicetify config-dir
   ```
3. Copy the downloaded file inside the Extensions directory:

   ![Config Screenshot](./previews/config-dir.jpg)

4. finally, run these commands in terminal:
   ```bash
   spicetify config extensions amai-lyrics-main.js
   spicetify apply
   ```
5. Restart Spotify

## ⚙️ Configuration

Follow these steps to set up your Gemini API key:

1. **Open Spotify Settings:**
   - Launch Spotify and go to your settings.
2. **Locate the API Key Field:**
   - Scroll to the bottom of the settings page until you find the API key field.
3. **Paste Your Gemini API Key:**
   - Insert the API key into the field.
     ![Settings Screenshot](./previews/settings.jpg)
4. **Access the Lyrics Page:**
   - Click the lyrics icon at the bottom of the Spotify window.
   - Wait a few moments as the page loads—the Furigana annotations will appear automatically.
     ![Toggle lyrics](./previews/toggle-lyrics-page.jpg)

## 🌟 Future Plans

- **Line-by-Line Translation:** Add support for displaying translations for each line of lyrics.

## 🙏 Credits

Special thanks to Spikerko, creator of the original Spicy Lyrics extension.
