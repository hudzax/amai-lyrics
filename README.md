# 🎶 Amai Lyrics

Hey there! Amai Lyrics is a Spicetify extension, forked from [Spicy Lyrics](https://spicylyrics.org/), that enhances your Spotify experience by adding Furigana, Romaji for Japanese, and Romanization for Korean lyrics.

## 🌟 Awesome things

- **Furigana Support:** Annotate Kanji with phonetic guides to aid reading.
- **Romaji Support:** Display lyrics in Japanese with Romaji.
- **Korean Romanization:** Display lyrics in Korean with Romanization.
- **Line-by-line Translation:** Display translations for each lyrics line.
- **Improved visuals:** Enhanced UI/UX for better readability and aesthetics.
- **Gemini Integration:** Utilizes the Gemini Flash 2.0 to generate annotations.
- **Easy Setup:** Obtain the API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and configure it within the Spotify settings as described below.

## 👀 Preview

![Extension Preview](./previews/preview-romaji.jpg)

![Extension Preview](./previews/preview-furigana.jpg)

![Extension Preview](./previews/preview-romaja.jpg)

## 🚀 Installation

### 🛒 Via Marketplace (Currently not available 😭)

It is currently blacklisted from the marketplace, so you'll have to do it the old-fashioned way for now. But don't worry, it's super easy!

### 🔧 Manual Installation

> **Note:** If you haven't installed Spicetify, run the appropriate command for your OS:
>
> **Windows (PowerShell):**
>
> ```powershell
> iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex
> ```
>
> **Linux / macOS:**
>
> ```bash
> curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
> ```

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

> **Note:** You only need to apply this once. The extension will automatically check for and install any new updates.

## ⚙️ Configuration

Follow these steps to set up your Gemini API key:

1. **Open Spotify Settings:**
   - Launch Spotify and go to your settings.
2. **Locate the API Key Field:**
   - Scroll to the bottom of the settings page until you find the API key field.
3. **Paste Your Gemini API Key:**
   - Insert the API key into the field.
     ![Settings Screenshot](./previews/settings.jpg)
   - (Don't worry, the key is stored locally and only used to make API requests from this extension. 😉)
4. **Access the Lyrics Page:**
   - Click the lyrics icon at the bottom of the Spotify window.
   - Wait a few moments as the page loads—the Furigana annotations will appear automatically.
     ![Toggle lyrics](./previews/toggle-lyrics-page.jpg)

## 🙏 Credits

Special thanks to Spikerko, creator of the original Spicy Lyrics extension.

And a special thanks to you for using Amai Lyrics! We hope you enjoy it! 🎉
