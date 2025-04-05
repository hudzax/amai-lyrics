(async function() {
        while (!Spicetify.React || !Spicetify.ReactDOM) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        var amaiDlyrics = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // external-global-plugin:react
  var require_react = __commonJS({
    "external-global-plugin:react"(exports, module) {
      module.exports = Spicetify.React;
    }
  });

  // external-global-plugin:react-dom
  var require_react_dom = __commonJS({
    "external-global-plugin:react-dom"(exports, module) {
      module.exports = Spicetify.ReactDOM;
    }
  });

  // node_modules/@hudzax/web-modules/SpikyCache.js
  var SpikyCache = class {
    cacheName;
    constructor(options) {
      this.cacheName = this.normalizeKey(options.name);
    }
    normalizeKey(key) {
      return key.replace(/[^a-zA-Z0-9-]/g, "").replace(/\s+/g, "-");
    }
    async set(key, value, expirationTTL) {
      const normalizedKey = this.normalizeKey(key);
      let body = null;
      let contentType = void 0;
      if (typeof value === "string") {
        body = value;
        contentType = "text/plain";
      } else if (typeof value === "number") {
        body = value.toString();
        contentType = "text/plain";
      } else if (typeof value === "object") {
        body = JSON.stringify(value);
        contentType = "application/json";
      } else if (typeof value === "boolean") {
        body = value.toString();
        contentType = "text/plain";
      }
      try {
        const cache = await caches.open(this.cacheName);
        let headers = {};
        if (contentType) {
          headers["Content-Type"] = contentType;
        }
        const response = new Response(body, {
          headers
        });
        if (expirationTTL) {
          response.headers.append("Cache-Control", `max-age=${expirationTTL}`);
        }
        await cache.put(normalizedKey, response);
      } catch (error) {
        console.error("Error setting cache:", error);
        throw error;
      }
    }
    async get(key) {
      const normalizedKey = this.normalizeKey(key);
      try {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(normalizedKey);
        if (response) {
          const contentType = response.headers.get("Content-Type");
          if (contentType === "application/json") {
            return await response.json();
          } else if (contentType?.startsWith("text/")) {
            const text = await response.text();
            const num = parseFloat(text);
            if (!isNaN(num)) {
              return num;
            }
            if (text === "true") {
              return true;
            } else if (text === "false") {
              return false;
            }
            return text;
          } else {
            return await response.blob();
          }
        }
      } catch (error) {
        console.error("Error getting cache:", error);
        throw error;
      }
    }
    async remove(key) {
      const normalizedKey = this.normalizeKey(key);
      try {
        const cache = await caches.open(this.cacheName);
        await cache.delete(normalizedKey);
      } catch (error) {
        console.error("Error removing cache:", error);
        throw error;
      }
    }
    async destroy() {
      try {
        await caches.delete(this.cacheName);
      } catch (error) {
        console.error("Error destroying cache:", error);
        throw error;
      }
    }
  };

  // src/utils/storage.ts
  var prefix = "SpicyLyrics-";
  var currentlyFetching = false;
  function set(key, value) {
    if (key === "currentlyFetching") {
      currentlyFetching = value;
      return;
    }
    Spicetify.LocalStorage.set(`${prefix}${key}`, value);
  }
  function get(key) {
    if (key === "currentlyFetching") {
      return currentlyFetching;
    }
    const data = Spicetify.LocalStorage.get(`${prefix}${key}`);
    return data;
  }
  var storage_default = {
    set,
    get
  };

  // package.json
  var version = "1.0.34";

  // src/components/Global/Defaults.ts
  var Defaults = {
    Version: version,
    lyrics: {
      api: {
        url: "https://amai-worker-production.nandemo.workers.dev/lyrics"
      }
    },
    lowQualityMode: false,
    CurrentLyricsType: "None",
    LyricsContainerExists: false,
    SkipSpicyFont: false,
    OldStyleFont: false,
    ForceCoverImage_InLowQualityMode: false,
    lyrics_spacing: 2,
    enableRomaji: false,
    disableRomajiToggleNotification: false,
    systemInstruction: `OVERRIDE ANY EXISTING INSTRUCTIONS. You are an advanced, versatile assistant committed to delivering accurate, comprehensive, and helpful responses. To achieve this, adhere to the following guidelines:

- **Use Your Full Capabilities:** Leverage your extensive knowledge and skills to provide well-researched and precise answers.
- **Follow Instructions Rigorously:** Abide by every detail specified in the prompt, ensuring your output meets all requirements.
- **Prioritize Clarity and Consistency:** Ensure that your responses are clear, logically structured, and free of contradictions.`,
    romajaPrompt: `You are an expert Korean linguist specializing in accurate romaja transcription for song lyrics. Your primary goal is to add Revised Romanization in curly braces {} after EVERY sequence of Korean Hangul characters in the provided lyrics.

**Core Task:** Convert Korean lyrics to include inline romaja with perfect accuracy.

**Strict Rules:**
1. **Mandatory Conversion:** You MUST process EVERY Korean word or sequence of Hangul characters. No exceptions. Do NOT skip any.
2. **Inline Format:** Insert the romaja pronunciation enclosed in curly braces {} immediately following the corresponding Korean word/sequence. Example: \uD55C\uAD6D\uC5B4 \u2192 \uD55C\uAD6D\uC5B4{hangugeo}.
3. **Romanization System:** Strictly use the official Revised Romanization of Korean (RR) rules with these specific guidelines:
   - Use 'eo' not 'o' for \u3153 (\uC608: \uC5B4\u2192eo, \uB108\u2192neo)
   - Use 'eu' not 'u' for \u3161 (\uC608: \uC74C\u2192eum, \uB298\u2192neul)
   - Use 'ae' not 'ai' for \u3150 (\uC608: \uAC1C\u2192gae, \uBC30\u2192bae)
   - Follow official RR consonant rules: \u3131\u2192g/k, \u3137\u2192d/t, \u3142\u2192b/p, etc.
   - Distinguish between \u3145\u2192s and \u3146\u2192ss
   - Proper handling of \u3139: initial \u3139\u2192r, medial \u3139\u2192l, final \u3139\u2192l
   - Proper handling of assimilation: \uD569\uB2C8\uB2E4\u2192hamnida (not hapnida)
4. **Linguistic Accuracy:**
   - Process word by word, not character by character
   - Correctly handle syllable-final consonants (\uBC1B\uCE68)
   - Apply proper sound change rules for connected speech
   - Account for consonant assimilation and liaison between words when needed
5. **Preserve Everything Else:** Keep all non-Korean text (English, numbers, symbols, punctuation) and original spacing/line breaks exactly as they are.
6. **Completeness Check:** Before outputting, methodically verify that every single Korean word/sequence has its romaja pair.

**Examples with Sound Change Rules:**
* \uC815\uB9D0 \u2192 \uC815\uB9D0{jeongmal}
* \uC88B\uC544\uD574 \u2192 \uC88B\uC544\uD574{joahae}
* \uAC19\uC774 \u2192 \uAC19\uC774{gachi} (Note assimilation)
* \uC77D\uB2E4 \u2192 \uC77D\uB2E4{ikda} (Note syllable-final consonant rule)
* \uBC25 \uBA39\uC5B4 \u2192 \uBC25{bap} \uBA39\uC5B4{meogeo} (Note final consonant pronunciation)
* \uAF43\uC78E \u2192 \uAF43\uC78E{kkonip} (Note assimilation at morpheme boundary)
* \uC5C6\uC5B4 \u2192 \uC5C6\uC5B4{eopseo} (Note complex consonant cluster)
* \uC549\uC544 \u2192 \uC549\uC544{anja} (Note complex consonant rules)
* \uAC14\uB2E4 \uC654\uB2E4 \u2192 \uAC14\uB2E4{gatda} \uC654\uB2E4{watda} (Note past tense pronunciation)
* \uC0AC\uB791\uD574\uC694 \u2192 \uC0AC\uB791\uD574\uC694{saranghaeyo} (Note aspirated consonant)

**Special Cases:**
* Numbers mixed with Korean: 2\uC0B4\uC774\uC5D0\uC694 \u2192 2\uC0B4\uC774\uC5D0\uC694{salieyo}
* Parentheses: (\uB0B4\uAC00 \uC544\uB2C8\uC796\uC544) \u2192 (\uB0B4\uAC00{naega} \uC544\uB2C8\uC796\uC544{anijana})
* Particles: \uCC45\uC774 \u2192 \uCC45\uC774{chaegi}, \uC9D1\uC5D0 \u2192 \uC9D1\uC5D0{jibe} (Note sound changes)
* Long words: \uAC00\uB098\uB2E4\uB77C\uB9C8\uBC14\uC0AC \u2192 \uAC00\uB098\uB2E4\uB77C\uB9C8\uBC14\uC0AC{ganadaramabasa}
* Words with suffixes: \uAF43\uC78E\uCC98\uB7FC \u2192 \uAF43\uC78E\uCC98\uB7FC{konnipcheorom}

**Input:** You will receive lines of song lyrics.
**Output:** Return the lyrics with romaja added inline according to the rules above. Ensure the output maintains the original line structure.`,
    furiganaPrompt: `You are an expert Japanese linguist specializing in accurate furigana transcription for song lyrics. Your primary goal is to add Hiragana readings in curly braces {} after EVERY Kanji character or compound Kanji sequence in the provided lyrics.

**Core Task:** Convert Japanese lyrics to include inline furigana for all Kanji.

**Strict Rules:**
1.  **Mandatory Conversion:** You MUST process EVERY Kanji character and compound Kanji sequence. No exceptions. Do NOT skip any.
2.  **Inline Format:** Insert the correct Hiragana reading enclosed in curly braces {} immediately following the corresponding Kanji character or sequence. Example: \u6F22\u5B57 \u2192 \u6F22\u5B57{\u304B\u3093\u3058}.
3.  **Contextual Readings:** Use the contextually appropriate reading (kun'yomi or on'yomi). For compound words (jukugo), provide the reading for the entire compound. Example: \u65E5\u672C\u8A9E \u2192 \u65E5\u672C\u8A9E{\u306B\u307B\u3093\u3054}. For single Kanji followed by okurigana, provide the reading for the Kanji part only. Example: \u98DF{\u305F}\u3079\u308B.
4.  **Preserve Everything Else:** Keep all non-Kanji text (Hiragana, Katakana, English, numbers, symbols, punctuation) and original spacing/line breaks exactly as they are.
5.  **Completeness Check:** Before outputting, double-check that every single Kanji character/sequence has its furigana pair.

**Examples:**
*   \u9858\u3044 \u2192 \u9858{\u306D\u304C}\u3044
*   \u53EF\u611B\u3044 \u2192 \u53EF\u611B{\u304B\u308F\u3044}\u3044
*   5\u4EBA \u2192 5\u4EBA{\u306B\u3093} (Number preserved, Kanji romanized)
*   \u660E\u5F8C\u65E5 \u2192 \u660E\u5F8C\u65E5{\u3042\u3055\u3063\u3066} (Compound word)
*   \u795E\u69D8 \u2192 \u795E\u69D8{\u304B\u307F\u3055\u307E} (Compound word)
*   \u805E\u304D \u2192 \u805E{\u304D}\u304D (Kanji with okurigana)
*   \u98DF\u3079\u308B \u2192 \u98DF{\u305F}\u3079\u308B
*   \u7F8E\u3057\u3044 \u2192 \u7F8E{\u3046\u3064\u304F}\u3057\u3044
*   \u6771\u4EAC\u30BF\u30EF\u30FC \u2192 \u6771\u4EAC{\u3068\u3046\u304D\u3087\u3046}\u30BF\u30EF\u30FC (Mixed script, Katakana preserved)
*   (\u5927\u4E08\u592B\u3060\u3088) \u2192 (\u5927\u4E08\u592B{\u3060\u3044\u3058\u3087\u3046\u3076}\u3060\u3088) (Parentheses and Hiragana preserved)

**Input:** You will receive lines of song lyrics.
**Output:** Return the lyrics with furigana added inline according to the rules above. Ensure the output maintains the original line structure.
`,
    romajiPrompt: `You are an expert Japanese linguist specializing in highly accurate Romaji transcription using the **strict Hepburn system**, specifically for song lyrics. Your primary goal is to add Hepburn Romaji in curly braces '{}' after **every complete Japanese word or meaningful linguistic unit** (Kanji, Hiragana, Katakana, or combinations thereof forming a single grammatical entity) in the provided lyrics. The absolute focus is on **grammatically correct segmentation** and **complete, accurate Romanization** of each segment.

#### Core Task
Accurately convert Japanese song lyrics to strict Hepburn Romaji, ensuring each word, particle, conjugated form, verb phrase, or katakana term (regardless of length) is treated as a single, indivisible unit for Romanization. The text within the braces '{}' must **always be the Hepburn Romaji conversion**, never the original Japanese script. Do not skip any Japanese text elements, especially long katakana words.

#### Strict Rules

1. **Unit-Level Conversion**
   - Identify and process each meaningful Japanese linguistic unit. A "unit" is defined as the smallest sequence of characters that functions as a single grammatical entity, including:
     - Nouns (e.g., \u65E5\u672C\u8A9E{Nihongo})
     - Verbs (including **all** conjugated forms and combinations with auxiliary verbs\u2014see Rule 2)
     - Adjectives (including **all** conjugated forms)
     - Adverbs
     - Particles (e.g., \u306F{wa}, \u3092{o}, \u304C{ga}, \u306E{no}, \u306B{ni}, \u3078{e}, \u3068{to})
     - Compound particles (e.g., \u306B\u306F{niwa}, \u3068\u306F{towa}, \u307E\u3067\u3082{mademo})
     - Katakana words of any length (e.g., \u30B3\u30FC\u30D2\u30FC{k\u014Dh\u012B}, \u30A4\u30F3\u30D5\u30A7\u30EB\u30CE\u30E9\u30D6\u30EC\u30BF\u30FC{inferuno raburet\u0101})
     - Numbers with counters (e.g., 5\u4EBA{go-nin})
     - Compound words (e.g., \u6771\u4EAC\u30BF\u30EF\u30FC{T\u014Dky\u014D Taw\u0101})
     - Interjections and short phrases (e.g., \u305B\u30FC\u306E{s\u0113 no}, \u3088\u30FC\u3044{y\u014D i}, \u3042\u3063{a'}, \u3048\u3063\u3068{etto})
   - Romanize each identified unit **as a whole**.

2. **CRITICAL: Correct Segmentation & Indivisibility**
   - **Do not split functional grammatical units:** This is the most critical rule. Any sequence of characters functioning together as a single word, conjugated form, or verb phrase **must** remain indivisible.
   - **Conjugated Verbs/Adjectives:** Treat the **entire** conjugated form (base + endings, okurigana, auxiliary verbs grammatically attached) as **indivisible**.
   - **Kanji + Okurigana Integrity:** A unit often includes Kanji followed by Hiragana (okurigana), forming a single word (e.g., \u98DF\u3079\u308B{taberu}, not \u98DF{tabe}\u3079\u308B{ru}).
   - **Verb (Te-form) + Auxiliary Verb Combinations:** Treat combinations like Verb-\u3066 + \u3044\u308B/\u3042\u308B/\u304A\u304F/\u3057\u307E\u3046/\u3044\u304F/\u304F\u308B and their conjugations or contractions (e.g., -te iru \u2192 -teru, -te ita \u2192 -teta, -te shimau \u2192 -chau) as **single verb phrases** that **must not be split**.
   - **Correct Examples:**
     - \u7B11\u3063\u3066{waratte}
     - \u5C4A\u3044\u3066{todoite}
     - \u5C45\u308C\u306A\u3044{irenai}
     - \u75C5\u3093\u3067\u304D\u305F{yandekita}
     - \u611B\u3057\u304D{itoshiki}
     - \u4E57\u3063\u304B\u3063\u3066{nokkatte}
     - \u8D70\u308A\u51FA\u3057\u305F{hashiridashita}
     - \u98DF\u3079\u3066\u3057\u307E\u3046{tabeteshimau}
     - \u7F8E\u3057\u3055{utsukushsa}
     - \u898B\u3066\u305F{miteta}
     - \u8AAD\u3093\u3067\u308B{yonderu}
     - \u77E5\u3063\u3066\u3044\u308B{shitteiru}
     - \u8A00\u3063\u3066\u304A\u304F{itteoku}
     - \u98DF\u3079\u3061\u3083\u3063\u305F{tabechatta}
     - \u62B1\u3048{kakae}
     - \u898B\u3066\u3082{mitemo}
     - \u30E1\u30ED\u30C7\u30A3\u30FC{merod\u012B}
     - \u30B5\u30FC\u30AD\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3{s\u0101kyur\u0113shon}

3. **Inline Format & Content**
   - Insert the **Hepburn Romaji pronunciation** in curly braces '{}' immediately following the **complete** Japanese unit, with **no space** between the unit and the opening brace.
   - The content inside the braces '{}' must be the **Hepburn Romaji result**, not the original Japanese script (e.g., \u62B1\u3048{kakae}, not \u62B1\u3048{\u62B1\u3048}).
   - Pay special attention to short, easily overlooked expressions like \u305B\u30FC\u306E{s\u0113 no} or \u306D\u3047{n\u0113} that might be missed despite being meaningful linguistic units.

4. **Romanization System: Strict Hepburn**
   - Adhere strictly to the Hepburn system:
     - Basic sounds: \u3057=shi, \u3061=chi, \u3064=tsu, \u3075=fu, \u3058=ji, \u3062=ji, \u3065=zu
     - **Long vowels:** Use macrons consistently: \u304A\u3046/\u304A\u304A \u2192 \u014D, \u3048\u3044/\u3048\u3048 \u2192 \u0113, \u3046\u3046 \u2192 \u016B, \u3044\u3044 \u2192 \u012B, \u3042\u3042 \u2192 \u0101 (e.g., \u6771\u4EAC{T\u014Dky\u014D}, \u3042\u308A\u304C\u3068\u3046{arigat\u014D}, \u7F8E\u5473\u3057\u3044{oishii})
     - **Extended vowels in casual speech**: Properly romanize extended vowels in casual expressions, including those marked with "\u30FC" (e.g., \u305B\u30FC\u306E{s\u0113 no}, \u3088\u30FC\u3044{y\u014D i})
     - Particles: \u306F \u2192 wa, \u3078 \u2192 e, \u3092 \u2192 o
     - Sokuon (\u3063): Double the following consonant (e.g., \u3061\u3087\u3063\u3068{chotto}, \u7B11\u3063\u3066{waratte})
     - N (\u3093): Use n before most consonants, m before b/m/p, and n' before vowels or y (e.g., \u6848\u5185{annai}, \u6563\u6B69{sampo}, \u539F\u56E0{gen'in}, \u672C\u5C4B{hon'ya})

5. **Completeness & Accuracy of Romanization**
   - Ensure **every** Japanese linguistic unit has its corresponding Hepburn Romaji in braces.
   - The Romaji must be **accurate and complete**, reflecting the pronunciation of the **entire** unit, with attention to long vowels, double consonants, and particle usage.
   - **Pay special attention to long katakana words**: Never skip romanization for long katakana sequences like "\u30A4\u30F3\u30D5\u30A7\u30EB\u30CE\u30E9\u30D6\u30EC\u30BF\u30FC{inferuno raburet\u0101}" or "\u30B5\u30FC\u30AD\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3{s\u0101kyur\u0113shon}", even if they appear complex. These should be fully romanized as single units.
   - **Do not overlook short expressions**: Be particularly vigilant about romanizing short expressions that might be overlooked, such as \u305B\u30FC\u306E{s\u0113 no}, \u3088\u3057{yoshi}, \u307B\u3089{hora}, etc. Even single kana or short utterances like \u3042\u3063{a'} or \u3048\u3063{e'} must be romanized.

6. **Preserve Non-Japanese Text and Punctuation**
   - Keep all non-Japanese text (English words, numbers, symbols) unchanged, with no Romaji added for these elements.
   - **Do not add Romaji transcription for any punctuation marks, including commas (,), periods (.), question marks (?), exclamation points (!), etc.**
   - Maintain original spaces and line breaks as they appear in the lyrics.

7. **Punctuation Handling**
   - Treat punctuation marks separately from Japanese text. For example:
     - "\u4ECA\u65E5\u306F{ky\u014D wa}, \u6674\u308C{hare}" (correct)
     - "\u4ECA\u65E5\u306F{ky\u014D wa}\u3001\u6674\u308C{hare}" (correct)
     - "\u4ECA\u65E5\u306F\u3001{ky\u014D wa,}\u6674\u308C{hare}" (incorrect - comma included in Romaji)

#### Input
Song lyrics containing Japanese text.

#### Output
The original lyrics with accurate, complete Hepburn Romaji in '{}' appended to every complete Japanese word, particle, conjugated form, or verb phrase, respecting the strict segmentation and indivisibility rules, ensuring **only Romaji appears within the braces**, and excluding all punctuation marks from Romanization. Respond in JSON.`
  };
  var Defaults_default = Defaults;

  // src/utils/Lyrics/SongProgressBar.ts
  var SongProgressBar = class {
    constructor() {
      this.destroyed = false;
      this.duration = 0;
      this.position = 0;
    }
    Update(params) {
      if (this.destroyed) {
        console.warn("This progress bar has been destroyed and cannot be used");
        return;
      }
      this.duration = params.duration;
      this.position = Math.min(params.position, this.duration);
    }
    Destroy() {
      if (this.destroyed)
        return;
      this.destroyed = true;
    }
    GetFormattedDuration() {
      return this.formatTime(this.duration);
    }
    GetFormattedPosition() {
      return this.formatTime(this.position);
    }
    GetProgressPercentage() {
      if (this.duration <= 0)
        return 0;
      return this.position / this.duration;
    }
    CalculatePositionFromClick(params) {
      const { sliderBar, event } = params;
      if (this.duration <= 0)
        return 0;
      const rect = sliderBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const positionMs = Math.floor(percentage * this.duration);
      return positionMs;
    }
    formatTime(timeInMs) {
      if (isNaN(timeInMs) || timeInMs < 0) {
        return "0:00";
      }
      const totalSeconds = Math.floor(timeInMs / 1e3);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  };

  // src/utils/Whentil.ts
  function Until(statement, callback, maxRepeats = Infinity) {
    let isCancelled = false;
    let hasReset = false;
    let executedCount = 0;
    const resolveStatement = () => typeof statement === "function" ? statement() : statement;
    const runner = () => {
      if (isCancelled || executedCount >= maxRepeats)
        return;
      const conditionMet = resolveStatement();
      if (!conditionMet) {
        callback();
        executedCount++;
        setTimeout(runner, 0);
      }
    };
    setTimeout(runner, 0);
    return {
      Cancel() {
        isCancelled = true;
      },
      Reset() {
        if (executedCount >= maxRepeats || isCancelled) {
          isCancelled = false;
          hasReset = true;
          executedCount = 0;
          runner();
        }
      }
    };
  }
  function When(statement, callback, repeater = 1) {
    let isCancelled = false;
    let hasReset = false;
    let executionsRemaining = repeater;
    const resolveStatement = () => typeof statement === "function" ? statement() : statement;
    const runner = () => {
      if (isCancelled || executionsRemaining <= 0)
        return;
      try {
        const conditionMet = resolveStatement();
        if (conditionMet) {
          callback(resolveStatement());
          executionsRemaining--;
          if (executionsRemaining > 0)
            setTimeout(runner, 0);
        } else {
          setTimeout(runner, 0);
        }
      } catch (error) {
        setTimeout(runner, 0);
      }
    };
    setTimeout(runner, 0);
    return {
      Cancel() {
        isCancelled = true;
      },
      Reset() {
        if (executionsRemaining <= 0 || isCancelled) {
          isCancelled = false;
          hasReset = true;
          executionsRemaining = repeater;
          runner();
        }
      }
    };
  }
  var Whentil = {
    When,
    Until
  };
  var Whentil_default = Whentil;

  // src/utils/EventManager.ts
  var eventRegistry = /* @__PURE__ */ new Map();
  var nextId = 1;
  var listen = (eventName, callback) => {
    if (!eventRegistry.has(eventName)) {
      eventRegistry.set(eventName, /* @__PURE__ */ new Map());
    }
    const id = nextId++;
    eventRegistry.get(eventName).set(id, callback);
    return id;
  };
  var unListen = (id) => {
    for (const [eventName, listeners] of eventRegistry) {
      if (listeners.has(id)) {
        listeners.delete(id);
        if (listeners.size === 0) {
          eventRegistry.delete(eventName);
        }
        return true;
      }
    }
    return false;
  };
  var evoke = (eventName, ...args) => {
    const listeners = eventRegistry.get(eventName);
    if (listeners) {
      for (const callback of listeners.values()) {
        callback(...args);
      }
    }
  };
  var Event = {
    listen,
    unListen,
    evoke
  };
  var EventManager_default = Event;

  // src/components/Global/Global.ts
  window._spicy_lyrics = {};
  var SCOPE_ROOT = window._spicy_lyrics;
  var Global = {
    Scope: SCOPE_ROOT,
    Event: EventManager_default,
    NonLocalTimeOffset: 340,
    SetScope: (key, value) => {
      const keys = key.split(".");
      let current = SCOPE_ROOT;
      for (let i = 0; i < keys.length; i++) {
        const part = keys[i];
        if (i === keys.length - 1) {
          current[part] = current[part] ?? value;
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          if (typeof current[part] !== "object" || Array.isArray(current[part])) {
            throw new TypeError(
              `Cannot set nested property: ${keys.slice(0, i + 1).join(".")} is not an object.`
            );
          }
          current = current[part];
        }
      }
    },
    GetScope: (key, fallback = void 0) => {
      const keys = key.split(".");
      let current = SCOPE_ROOT;
      for (const part of keys) {
        if (current === void 0 || current === null) {
          return fallback;
        }
        current = current[part];
      }
      return current === void 0 ? fallback : current;
    }
  };
  var Global_default = Global;

  // node_modules/@hudzax/web-modules/Scheduler.js
  var Cancel = (scheduled) => {
    if (scheduled[2]) {
      return;
    }
    scheduled[2] = true;
    switch (scheduled[0]) {
      case 0:
        globalThis.clearTimeout(scheduled[1]);
        break;
      case 1:
        globalThis.clearInterval(scheduled[1]);
        break;
      case 2:
        globalThis.cancelAnimationFrame(scheduled[1]);
        break;
    }
  };
  var Timeout = (seconds, callback) => {
    return [
      0,
      setTimeout(callback, seconds * 1e3)
    ];
  };
  var Defer = (callback) => {
    const scheduled = [
      2,
      0
    ];
    scheduled[1] = requestAnimationFrame(() => {
      scheduled[0] = 0;
      scheduled[1] = setTimeout(callback, 0);
    });
    return scheduled;
  };
  var IsScheduled = (value) => {
    return Array.isArray(value) && (value.length === 2 || value.length === 3) && typeof value[0] === "number" && typeof value[1] === "number" && (value[2] === void 0 || value[2] === true);
  };

  // src/components/Global/Platform.ts
  var Spotify = globalThis.Spicetify;
  var SpotifyPlatform;
  var SpotifyInternalFetch;
  var OnSpotifyReady = new Promise((resolve) => {
    const CheckForServices = () => {
      SpotifyPlatform = Spotify.Platform;
      SpotifyInternalFetch = Spotify.CosmosAsync;
      if (!SpotifyPlatform || !SpotifyInternalFetch) {
        Defer(CheckForServices);
        return;
      }
      resolve();
    };
    CheckForServices();
  });
  var tokenProviderResponse;
  var accessTokenPromise;
  var GetSpotifyAccessToken = () => {
    if (tokenProviderResponse) {
      const timeUntilRefresh = (tokenProviderResponse.expiresAtTime - Date.now()) / 1e3;
      if (timeUntilRefresh <= 2) {
        tokenProviderResponse = void 0;
        accessTokenPromise = new Promise(
          (resolve) => Timeout(timeUntilRefresh, resolve)
        ).then(() => {
          accessTokenPromise = void 0;
          return GetSpotifyAccessToken();
        });
        return accessTokenPromise;
      }
    }
    if (accessTokenPromise) {
      return accessTokenPromise;
    }
    accessTokenPromise = SpotifyInternalFetch.get("sp://oauth/v2/token").then((result) => {
      tokenProviderResponse = result;
      accessTokenPromise = Promise.resolve(result.accessToken);
      return GetSpotifyAccessToken();
    }).catch((error) => {
      if (error.message.includes("Resolver not found")) {
        if (!SpotifyPlatform.Session) {
          console.warn(
            "Failed to find SpotifyPlatform.Session for fetching token"
          );
        } else {
          tokenProviderResponse = {
            accessToken: SpotifyPlatform.Session.accessToken,
            expiresAtTime: SpotifyPlatform.Session.accessTokenExpirationTimestampMs,
            tokenType: "Bearer"
          };
          accessTokenPromise = Promise.resolve(
            tokenProviderResponse.accessToken
          );
        }
      }
      return GetSpotifyAccessToken();
    });
    return accessTokenPromise;
  };
  var Platform = {
    OnSpotifyReady,
    GetSpotifyAccessToken
  };
  var Platform_default = Platform;

  // src/utils/API/SpicyFetch.ts
  var SpicyFetchCache = new SpikyCache({
    name: "SpicyFetch__Cache"
  });
  async function SpicyFetch(path, IsExternal = false, cache = false, cosmos = false) {
    return new Promise(async (resolve, reject) => {
      const url = path;
      const CachedContent = await GetCachedContent(url);
      if (CachedContent) {
        if (Array.isArray(CachedContent)) {
          const content = typeof CachedContent[0] === "string" ? JSON.parse(CachedContent[0]) : CachedContent[0];
          resolve([content, CachedContent[1]]);
          return;
        }
        resolve([CachedContent, 200]);
        return;
      }
      const SpotifyAccessToken = await Platform_default.GetSpotifyAccessToken();
      if (cosmos) {
        Spicetify.CosmosAsync.get(url).then(async (res) => {
          let data;
          try {
            data = await res.json();
          } catch (error) {
            data = {};
          }
          const sentData = [data, res.status];
          resolve(sentData);
          if (cache) {
            await CacheContent(url, sentData, 6048e5);
          }
        }).catch((err) => {
          console.error("CosmosAsync Error:", err);
          reject(err);
        });
      } else {
        const SpicyLyricsAPI_Headers = IsExternal ? null : {};
        const SpotifyAPI_Headers = IsExternal ? {
          "Spotify-App-Version": Spicetify.Platform.version,
          "App-Platform": Spicetify.Platform.PlatformData.app_platform,
          Accept: "application/json",
          "Content-Type": "application/json"
        } : null;
        const headers = {
          Authorization: `Bearer ${SpotifyAccessToken}`,
          ...SpotifyAPI_Headers,
          ...SpicyLyricsAPI_Headers
        };
        fetch(url, {
          method: "GET",
          headers
        }).then(async (res) => {
          if (res === null) {
            resolve([null, 500]);
            return;
          }
          let data;
          try {
            data = await res.json();
          } catch (error) {
            data = {};
          }
          const sentData = [data, res.status];
          resolve(sentData);
          if (cache) {
            await CacheContent(url, sentData, 6048e5);
          }
        }).catch((err) => {
          console.error("Fetch Error:", err);
          reject(err);
        });
      }
    });
  }
  async function CacheContent(key, data, expirationTtl = 6048e5) {
    try {
      const expiresIn = Date.now() + expirationTtl;
      const processedKey = SpicyHasher.md5(key);
      const processedData = typeof data === "object" ? JSON.stringify(data) : data;
      const compressedData = pako.deflate(processedData, {
        to: "string",
        level: 1
      });
      const compressedString = String.fromCharCode(
        ...new Uint8Array(compressedData)
      );
      await SpicyFetchCache.set(processedKey, {
        Content: compressedString,
        expiresIn
      });
    } catch (error) {
      console.error("ERR CC", error);
      await SpicyFetchCache.destroy();
    }
  }
  async function GetCachedContent(key) {
    try {
      const processedKey = SpicyHasher.md5(key);
      const content = await SpicyFetchCache.get(processedKey);
      if (content) {
        if (content.expiresIn > Date.now()) {
          if (typeof content.Content !== "string") {
            await SpicyFetchCache.remove(key);
            return content.Content;
          }
          const compressedData = Uint8Array.from(
            content.Content,
            (c) => c.charCodeAt(0)
          );
          const decompressedData = pako.inflate(compressedData, { to: "string" });
          const data = JSON.parse(decompressedData);
          return data;
        } else {
          await SpicyFetchCache.remove(key);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("ERR CC", error);
    }
  }

  // src/utils/Gets/GetProgress.ts
  var syncedPosition;
  var syncTimings = [0.05, 0.1, 0.15, 0.75];
  var canSyncNonLocalTimestamp = Spicetify.Player.isPlaying() ? syncTimings.length : 0;
  var requestPositionSync = () => {
    try {
      const SpotifyPlatform2 = Spicetify.Platform;
      const startedAt = performance.now();
      const isLocallyPlaying = SpotifyPlatform2.PlaybackAPI._isLocal;
      const getLocalPosition = () => {
        return SpotifyPlatform2.PlayerAPI._contextPlayer.getPositionState({}).then(({ position }) => ({
          StartedSyncAt: startedAt,
          Position: Number(position)
        }));
      };
      const getNonLocalPosition = () => {
        return (canSyncNonLocalTimestamp > 0 ? SpotifyPlatform2.PlayerAPI._contextPlayer.resume({}) : Promise.resolve()).then(() => {
          canSyncNonLocalTimestamp = Math.max(0, canSyncNonLocalTimestamp - 1);
          return {
            StartedSyncAt: startedAt,
            Position: SpotifyPlatform2.PlayerAPI._state.positionAsOfTimestamp + (Date.now() - SpotifyPlatform2.PlayerAPI._state.timestamp)
          };
        });
      };
      const sync = isLocallyPlaying ? getLocalPosition() : getNonLocalPosition();
      sync.then((position) => {
        syncedPosition = position;
      }).then(() => {
        const delay = isLocallyPlaying ? 1 / 60 : canSyncNonLocalTimestamp === 0 ? 1 / 60 : syncTimings[syncTimings.length - canSyncNonLocalTimestamp];
        setTimeout(requestPositionSync, delay * 1e3);
      });
    } catch (error) {
      console.error("Sync Position: Fail, More Details:", error);
    }
  };
  function GetProgress() {
    if (!syncedPosition) {
      console.error("Synced Position: Unavailable");
      if (SpotifyPlayer?._DEPRECATED_?.GetTrackPosition) {
        console.warn("Synced Position: Skip, Using DEPRECATED Version");
        return SpotifyPlayer._DEPRECATED_.GetTrackPosition();
      }
      console.warn("Synced Position: Skip, Returning 0");
      return 0;
    }
    const SpotifyPlatform2 = Spicetify.Platform;
    const isLocallyPlaying = SpotifyPlatform2.PlaybackAPI._isLocal;
    const { StartedSyncAt, Position } = syncedPosition;
    const now2 = performance.now();
    const deltaTime = now2 - StartedSyncAt;
    if (!Spicetify.Player.isPlaying()) {
      return SpotifyPlatform2.PlayerAPI._state.positionAsOfTimestamp;
    }
    const FinalPosition = Position + deltaTime;
    return isLocallyPlaying ? FinalPosition : FinalPosition + Global_default.NonLocalTimeOffset;
  }
  function _DEPRECATED___GetProgress() {
    if (!Spicetify?.Player?.origin?._state) {
      console.error("Spicetify Player state is not available.");
      return 0;
    }
    const state = Spicetify.Player.origin._state;
    const positionAsOfTimestamp = state.positionAsOfTimestamp;
    const timestamp = state.timestamp;
    const isPaused = state.isPaused;
    if (positionAsOfTimestamp == null || timestamp == null) {
      console.error("Playback state is incomplete.");
      return null;
    }
    const now2 = Date.now();
    if (isPaused) {
      return positionAsOfTimestamp;
    } else {
      return positionAsOfTimestamp + (now2 - timestamp);
    }
  }

  // src/components/Global/SpotifyPlayer.ts
  var TrackData_Map = /* @__PURE__ */ new Map();
  var SpotifyPlayer = {
    IsPlaying: false,
    GetTrackPosition: GetProgress,
    GetTrackDuration: () => {
      if (Spicetify.Player.data.item.duration?.milliseconds) {
        return Spicetify.Player.data.item.duration.milliseconds;
      }
      return 0;
    },
    Track: {
      GetTrackInfo: async () => {
        const spotifyHexString = SpicyHasher.spotifyHex(
          SpotifyPlayer.GetSongId()
        );
        if (TrackData_Map.has(spotifyHexString))
          return TrackData_Map.get(spotifyHexString);
        const URL2 = `https://spclient.wg.spotify.com/metadata/4/track/${spotifyHexString}?market=from_token`;
        const [data, status] = await SpicyFetch(URL2, true, true, false);
        if (status !== 200)
          return null;
        TrackData_Map.set(spotifyHexString, data);
        return data;
      },
      SortImages: (images) => {
        const sizeMap = {
          s: "SMALL",
          l: "DEFAULT",
          xl: "LARGE"
        };
        const sortedImages = images.reduce(
          (acc, image) => {
            const { size } = image;
            if (size === sizeMap.s) {
              acc.s.push(image);
            } else if (size === sizeMap.l) {
              acc.l.push(image);
            } else if (size === sizeMap.xl) {
              acc.xl.push(image);
            }
            return acc;
          },
          { s: [], l: [], xl: [] }
        );
        return sortedImages;
      }
    },
    Seek: (position) => {
      Spicetify.Player.origin.seekTo(position);
    },
    Artwork: {
      Get: async (size) => {
        const psize = size === "d" ? null : size?.toLowerCase() ?? null;
        const Data = await SpotifyPlayer.Track.GetTrackInfo();
        const Images = SpotifyPlayer.Track.SortImages(
          Data.album.cover_group.image
        );
        switch (psize) {
          case "s":
            return `spotify:image:${Images.s[0].file_id}`;
          case "l":
            return `spotify:image:${Images.l[0].file_id}`;
          case "xl":
            return `spotify:image:${Images.xl[0].file_id}`;
          default:
            return `spotify:image:${Images.l[0].file_id}`;
        }
      }
    },
    GetSongName: async () => {
      const Data = await SpotifyPlayer.Track.GetTrackInfo();
      return Data.name;
    },
    GetAlbumName: () => {
      return Spicetify.Player.data.item.metadata.album_title;
    },
    GetSongId: () => {
      return Spicetify.Player.data.item.uri?.split(":")[2] ?? null;
    },
    GetArtists: async () => {
      const data = await SpotifyPlayer.Track.GetTrackInfo();
      return data?.artist?.map((a) => a.name) ?? [];
    },
    JoinArtists: (artists) => {
      return artists?.join(", ") ?? null;
    },
    IsPodcast: false,
    _DEPRECATED_: {
      GetTrackPosition: _DEPRECATED___GetProgress
    },
    Pause: Spicetify.Player.pause,
    Play: Spicetify.Player.play,
    Skip: {
      Next: Spicetify.Player.next,
      Prev: Spicetify.Player.back
    },
    LoopType: "none",
    ShuffleType: "none"
  };

  // node_modules/@hudzax/web-modules/UniqueId.js
  var GeneratedIds = /* @__PURE__ */ new Set();
  function GetUniqueId() {
    while (true) {
      const id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
      if (GeneratedIds.has(id) === false) {
        GeneratedIds.add(id);
        return id;
      }
    }
  }

  // node_modules/@hudzax/web-modules/FreeArray.js
  var FreeArray = class {
    Items;
    DestroyedState;
    constructor() {
      this.Items = /* @__PURE__ */ new Map();
      this.DestroyedState = false;
    }
    Push(item) {
      const key = GetUniqueId();
      this.Items.set(key, item);
      return key;
    }
    Get(key) {
      return this.Items.get(key);
    }
    Remove(key) {
      const item = this.Items.get(key);
      if (item !== void 0) {
        this.Items.delete(key);
        return item;
      }
    }
    GetIterator() {
      return this.Items.entries();
    }
    IsDestroyed() {
      return this.DestroyedState;
    }
    Destroy() {
      if (this.DestroyedState) {
        return;
      }
      this.DestroyedState = true;
    }
  };

  // node_modules/@hudzax/web-modules/Signal.js
  var Connection = class {
    ConnectionReferences;
    Location;
    Disconnected;
    constructor(connections, callback) {
      this.ConnectionReferences = connections;
      this.Disconnected = false;
      this.Location = connections.Push({
        Callback: callback,
        Connection: this
      });
    }
    Disconnect() {
      if (this.Disconnected) {
        return;
      }
      this.Disconnected = true;
      this.ConnectionReferences.Remove(this.Location);
    }
    IsDisconnected() {
      return this.Disconnected;
    }
  };
  var Event2 = class {
    Signal;
    constructor(signal) {
      this.Signal = signal;
    }
    Connect(callback) {
      return this.Signal.Connect(callback);
    }
    IsDestroyed() {
      return this.Signal.IsDestroyed();
    }
  };
  var Signal = class {
    ConnectionReferences;
    DestroyedState;
    constructor() {
      this.ConnectionReferences = new FreeArray();
      this.DestroyedState = false;
    }
    Connect(callback) {
      if (this.DestroyedState) {
        throw "Cannot connect to a Destroyed Signal";
      }
      return new Connection(this.ConnectionReferences, callback);
    }
    Fire(...args) {
      if (this.DestroyedState) {
        throw "Cannot fire a Destroyed Signal";
      }
      for (const [_, reference] of this.ConnectionReferences.GetIterator()) {
        reference.Callback(...args);
      }
    }
    GetEvent() {
      return new Event2(this);
    }
    IsDestroyed() {
      return this.DestroyedState;
    }
    Destroy() {
      if (this.DestroyedState) {
        return;
      }
      for (const [_, reference] of this.ConnectionReferences.GetIterator()) {
        reference.Connection.Disconnect();
      }
      this.DestroyedState = true;
    }
  };
  var IsConnection = (value) => {
    return value instanceof Connection;
  };

  // node_modules/@hudzax/web-modules/Maid.js
  var IsGiveable = (item) => {
    return "Destroy" in item;
  };
  var Maid = class {
    Items;
    DestroyedState;
    DestroyingSignal;
    CleanedSignal;
    DestroyedSignal;
    Destroying;
    Cleaned;
    Destroyed;
    constructor() {
      this.Items = /* @__PURE__ */ new Map();
      this.DestroyedState = false;
      {
        this.DestroyingSignal = new Signal();
        this.CleanedSignal = new Signal();
        this.DestroyedSignal = new Signal();
        this.Destroying = this.DestroyingSignal.GetEvent();
        this.Cleaned = this.CleanedSignal.GetEvent();
        this.Destroyed = this.DestroyedSignal.GetEvent();
      }
    }
    CleanItem(item) {
      if (IsGiveable(item)) {
        item.Destroy();
      } else if (IsScheduled(item)) {
        Cancel(item);
      } else if (item instanceof MutationObserver || item instanceof ResizeObserver) {
        item.disconnect();
      } else if (IsConnection(item)) {
        item.Disconnect();
      } else if (item instanceof Element) {
        item.remove();
      } else if (typeof item === "function") {
        item();
      } else {
        console.warn("UNSUPPORTED MAID ITEM", typeof item, item);
      }
    }
    Give(item, key) {
      if (this.DestroyedState) {
        this.CleanItem(item);
        return item;
      }
      const finalKey = key ?? GetUniqueId();
      if (this.Has(finalKey)) {
        this.Clean(finalKey);
      }
      this.Items.set(finalKey, item);
      return item;
    }
    GiveItems(...args) {
      for (const item of args) {
        this.Give(item);
      }
      return args;
    }
    Get(key) {
      return this.DestroyedState ? void 0 : this.Items.get(key);
    }
    Has(key) {
      return this.DestroyedState ? false : this.Items.has(key);
    }
    Clean(key) {
      if (this.DestroyedState) {
        return;
      }
      const item = this.Items.get(key);
      if (item !== void 0) {
        this.Items.delete(key);
        this.CleanItem(item);
      }
    }
    CleanUp() {
      if (this.DestroyedState) {
        return;
      }
      for (const [key, _] of this.Items) {
        this.Clean(key);
      }
      if (this.DestroyedState === false) {
        this.CleanedSignal.Fire();
      }
    }
    IsDestroyed() {
      return this.DestroyedState;
    }
    Destroy() {
      if (this.DestroyedState === false) {
        this.DestroyingSignal.Fire();
        this.CleanUp();
        this.DestroyedState = true;
        this.DestroyedSignal.Fire();
        this.DestroyingSignal.Destroy();
        this.CleanedSignal.Destroy();
        this.DestroyedSignal.Destroy();
      }
    }
  };

  // src/utils/IntervalManager.ts
  var IntervalManager = class {
    constructor(duration, callback) {
      if (isNaN(duration)) {
        throw new Error("Duration cannot be NaN.");
      }
      this.maid = new Maid();
      this.callback = callback;
      this.duration = duration === Infinity ? 0 : duration * 1e3;
      this.lastTimestamp = null;
      this.animationFrameId = null;
      this.Running = false;
      this.Destroyed = false;
    }
    Start() {
      if (this.Destroyed) {
        console.warn("Cannot start; IntervalManager has been destroyed.");
        return;
      }
      if (this.Running) {
        console.warn("Interval is already running.");
        return;
      }
      this.Running = true;
      this.lastTimestamp = null;
      const loop = (timestamp) => {
        if (!this.Running || this.Destroyed)
          return;
        if (this.lastTimestamp === null) {
          this.lastTimestamp = timestamp;
        }
        const elapsed = timestamp - this.lastTimestamp;
        if (this.duration === 0 || elapsed >= this.duration) {
          this.callback();
          this.lastTimestamp = this.duration === 0 ? null : timestamp;
        }
        this.animationFrameId = requestAnimationFrame(loop);
      };
      this.animationFrameId = requestAnimationFrame(loop);
      this.maid.Give(() => this.Stop());
    }
    Stop() {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
        this.Running = false;
        this.lastTimestamp = null;
      }
    }
    Restart() {
      if (this.Destroyed) {
        console.warn("Cannot restart; IntervalManager has been destroyed.");
        return;
      }
      this.Stop();
      this.Start();
    }
    Destroy() {
      if (this.Destroyed) {
        console.warn("IntervalManager is already destroyed.");
        return;
      }
      this.Stop();
      this.maid.CleanUp();
      this.Destroyed = true;
      this.Running = false;
    }
  };

  // src/utils/Lyrics/Animator/Shared.ts
  var IdleLyricsScale = 0.95;
  var IdleEmphasisLyricsScale = 0.95;
  var timeOffset = 0;
  var BlurMultiplier = 1;

  // src/utils/Lyrics/Animator/Lyrics/LyricsAnimator.ts
  var Blurring_LastLine = null;
  function setBlurringLastLine(c) {
    Blurring_LastLine = c;
  }
  function Animate(position) {
    const CurrentLyricsType = Defaults_default.CurrentLyricsType;
    const edtrackpos = position + timeOffset;
    if (!CurrentLyricsType || CurrentLyricsType === "None")
      return;
    const Credits = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits"
    );
    const applyBlur = (arr, activeIndex, BlurMultiplier2) => {
      for (let i = activeIndex + 1; i < arr.length; i++) {
        const blurAmount = BlurMultiplier2 * (i - activeIndex);
        if (arr[i].Status === "Active") {
          arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
        } else {
          if (!SpotifyPlayer.IsPlaying) {
            arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            arr[i].HTMLElement.style.setProperty(
              "--BlurAmount",
              `${blurAmount >= 5 ? 5 : blurAmount}px`
            );
          }
        }
      }
      for (let i = activeIndex - 1; i >= 0; i--) {
        const blurAmount = BlurMultiplier2 * (activeIndex - i);
        if (arr[i].Status === "Active") {
          arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
        } else {
          if (!SpotifyPlayer.IsPlaying) {
            arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            arr[i].HTMLElement.style.setProperty(
              "--BlurAmount",
              `${blurAmount >= 5 ? 5 : blurAmount}px`
            );
          }
        }
      }
    };
    const calculateOpacity = (percentage, word) => {
      if (word?.BGWord)
        return 0;
      if (percentage <= 0.5) {
        return percentage * 100;
      } else {
        return (1 - percentage) * 100;
      }
    };
    if (CurrentLyricsType === "Syllable") {
      const arr = LyricsObject.Types.Syllable.Lines;
      for (let index = 0; index < arr.length; index++) {
        const line = arr[index];
        if (line.Status === "Active") {
          if (!SpotifyPlayer.IsPlaying) {
            applyBlur(arr, index, BlurMultiplier);
          }
          if (Blurring_LastLine !== index) {
            applyBlur(arr, index, BlurMultiplier);
            Blurring_LastLine = index;
          }
          if (!line.HTMLElement.classList.contains("Active")) {
            line.HTMLElement.classList.add("Active");
          }
          if (line.HTMLElement.classList.contains("NotSung")) {
            line.HTMLElement.classList.remove("NotSung");
          }
          if (line.HTMLElement.classList.contains("Sung")) {
            line.HTMLElement.classList.remove("Sung");
          }
          if (line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("OverridenByScroller");
          }
          const words = line.Syllables.Lead;
          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            const isLetterGroup = word?.LetterGroup;
            const isDot = word?.Dot;
            if (word.Status === "Active") {
              const totalDuration = word.EndTime - word.StartTime;
              const elapsedDuration = edtrackpos - word.StartTime;
              const percentage = Math.max(
                0,
                Math.min(elapsedDuration / totalDuration, 1)
              );
              const blurRadius = 4 + (16 - 4) * percentage;
              const textShadowOpacity = calculateOpacity(percentage, word) * 0.4;
              const translateY = 0.01 + (-0.038 - 0.01) * percentage;
              const scale = IdleLyricsScale + (1.017 - IdleLyricsScale) * percentage;
              const gradientPosition = percentage * 100;
              if (isLetterGroup) {
                const emphasisBlurRadius = 6 + (18 - 6) * percentage;
                const emphasisTranslateY = 0.02 + (-0.065 - 0.02) * percentage;
                const emphasisScale = IdleEmphasisLyricsScale + (1.023 - IdleEmphasisLyricsScale) * percentage;
                const emphasisTextShadowOpacity = calculateOpacity(percentage, word) * 5;
                for (let k = 0; k < word.Letters.length; k++) {
                  const letter = word.Letters[k];
                  if (letter.Status === "Active") {
                    const totalDuration2 = letter.EndTime - letter.StartTime;
                    const elapsedDuration2 = edtrackpos - letter.StartTime;
                    const percentage2 = Math.max(
                      0,
                      Math.min(elapsedDuration2 / totalDuration2, 1)
                    );
                    let translateY2;
                    if (percentage2 <= 0.5) {
                      translateY2 = 0 + (-0.1 - 0) * (percentage2 / 0.5);
                    } else {
                      translateY2 = -0.1 + (0 - -0.1) * ((percentage2 - 0.5) / 0.5);
                    }
                    const letterGradientPosition = `${percentage2 * 100}%`;
                    letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY2}))`;
                    letter.HTMLElement.style.scale = `${emphasisScale * 1.04}`;
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      `${emphasisBlurRadius}px`
                    );
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      `${emphasisTextShadowOpacity}%`
                    );
                    letter.HTMLElement.style.setProperty(
                      "--gradient-position",
                      letterGradientPosition
                    );
                  } else if (letter.Status === "NotSung") {
                    if (letter.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0.02))") {
                      letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                    }
                    if (letter.HTMLElement.style.getPropertyValue("scale") !== IdleLyricsScale) {
                      letter.HTMLElement.style.scale = IdleLyricsScale;
                    }
                    if (letter.HTMLElement.style.getPropertyValue(
                      "--text-shadow-blur-radius"
                    ) !== "4px") {
                      letter.HTMLElement.style.setProperty(
                        "--text-shadow-blur-radius",
                        "4px"
                      );
                    }
                    if (letter.HTMLElement.style.getPropertyValue(
                      "--text-shadow-opacity"
                    ) !== "0%") {
                      letter.HTMLElement.style.setProperty(
                        "--text-shadow-opacity",
                        "0%"
                      );
                    }
                    if (letter.HTMLElement.style.getPropertyValue(
                      "--gradient-position"
                    ) !== "-20%") {
                      letter.HTMLElement.style.setProperty(
                        "--gradient-position",
                        "-20%"
                      );
                    }
                  } else if (letter.Status === "Sung") {
                    const NextLetter = word.Letters[k + 1] ?? null;
                    if (NextLetter) {
                      const totalDuration2 = NextLetter.EndTime - NextLetter.StartTime;
                      const elapsedDuration2 = edtrackpos - NextLetter.StartTime;
                      const percentage2 = Math.max(
                        0,
                        Math.min(elapsedDuration2 / totalDuration2, 1)
                      );
                      const translateY2 = 0.02 + (-0.065 - 0.02) * percentage2;
                      if (NextLetter.Status === "Active") {
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${Math.abs(
                          translateY2 * 0.8
                        )}))`;
                        letter.HTMLElement.style.setProperty(
                          "--text-shadow-opacity",
                          `${percentage2 * 100 * 0.85}%`
                        );
                      } else {
                        if (letter.HTMLElement.style.getPropertyValue(
                          "transform"
                        ) !== "translateY(calc(var(--DefaultLyricsSize) * 0))") {
                          letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                        }
                      }
                      if (letter.HTMLElement.style.getPropertyValue(
                        "--text-shadow-opacity"
                      ) !== "50%") {
                        letter.HTMLElement.style.setProperty(
                          "--text-shadow-opacity",
                          `50%`
                        );
                      }
                    } else {
                      if (letter.HTMLElement.style.getPropertyValue(
                        "--text-shadow-opacity"
                      ) !== "50%") {
                        letter.HTMLElement.style.setProperty(
                          "--text-shadow-opacity",
                          `50%`
                        );
                      }
                      if (letter.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0))") {
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                      }
                    }
                    if (letter.HTMLElement.style.getPropertyValue("scale") !== "1") {
                      letter.HTMLElement.style.scale = "1";
                    }
                    if (letter.HTMLElement.style.getPropertyValue(
                      "--gradient-position"
                    ) !== "100%") {
                      letter.HTMLElement.style.setProperty(
                        "--gradient-position",
                        "100%"
                      );
                    }
                  }
                }
                if (word.HTMLElement.style.getPropertyValue("scale") !== `${emphasisScale}`) {
                  word.HTMLElement.style.scale = `${emphasisScale}`;
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== `translateY(calc(var(--DefaultLyricsSize) * ${emphasisTranslateY}))`) {
                  word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${emphasisTranslateY}))`;
                }
                word.scale = emphasisScale;
                word.glow = 0;
              } else {
                if (isDot) {
                  word.HTMLElement.style.setProperty(
                    "--opacity-size",
                    `${0.2 + percentage}`
                  );
                  let translateY2;
                  if (percentage <= 0) {
                    translateY2 = 0 + (-0.07 - 0) * percentage;
                  } else if (percentage <= 0.88) {
                    translateY2 = -0.07 + (0.2 - -0.07) * ((percentage - 0.88) / 0.88);
                  } else {
                    translateY2 = 0.2 + (0 - 0.2) * ((percentage - 0.22) / 0.88);
                  }
                  word.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY2}))`;
                  const scale2 = 0.75 + (1 - 0.75) * percentage;
                  word.HTMLElement.style.scale = `${0.2 + scale2}`;
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-blur-radius",
                    `${blurRadius}px`
                  );
                  const textShadowOpacity2 = calculateOpacity(percentage, word) * 1.5;
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-opacity",
                    `${textShadowOpacity2}%`
                  );
                  word.scale = scale2;
                  word.glow = textShadowOpacity2 / 100;
                } else {
                  word.HTMLElement.style.setProperty(
                    "--gradient-position",
                    `${gradientPosition}%`
                  );
                  if (totalDuration > 230) {
                    word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`;
                    word.HTMLElement.style.scale = `${scale}`;
                    word.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      `${blurRadius}px`
                    );
                    word.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      `${textShadowOpacity}%`
                    );
                    word.scale = scale;
                    word.glow = textShadowOpacity / 100;
                  } else {
                    const blurRadius2 = 4 + (0 - 4) * percentage;
                    const textShadowOpacity2 = 0;
                    const translateY2 = 0.01 + (0 - 0.01) * percentage;
                    const scale2 = IdleLyricsScale + (1 - IdleLyricsScale) * percentage;
                    word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY2}))`;
                    word.HTMLElement.style.scale = `${scale2}`;
                    word.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      `${blurRadius2}px`
                    );
                    word.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      `${textShadowOpacity2}%`
                    );
                    word.scale = scale2;
                    word.glow = textShadowOpacity2;
                  }
                }
                if (totalDuration > 230) {
                  word.translateY = translateY;
                } else {
                  word.translateY = 0;
                }
                if (!isDot && !isLetterGroup) {
                  word.AnimatorStoreTime_glow = void 0;
                  word.AnimatorStoreTime_translateY = void 0;
                  word.AnimatorStoreTime_scale = void 0;
                }
              }
            } else if (word.Status === "NotSung") {
              if (isLetterGroup) {
                for (let k = 0; k < word.Letters.length; k++) {
                  const letter = word.Letters[k];
                  if (letter.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0.02))") {
                    letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                  }
                  if (letter.HTMLElement.style.getPropertyValue("scale") !== IdleEmphasisLyricsScale) {
                    letter.HTMLElement.style.scale = IdleEmphasisLyricsScale;
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--text-shadow-blur-radius"
                  ) !== "4px") {
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      "4px"
                    );
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--text-shadow-opacity"
                  ) !== "0%") {
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      "0%"
                    );
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--gradient-position"
                  ) !== "-20%") {
                    letter.HTMLElement.style.setProperty(
                      "--gradient-position",
                      "-20%"
                    );
                  }
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0.02))") {
                  word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                }
                word.translateY = 0.02;
              } else if (!isDot) {
                if (word.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0.01))") {
                  word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.01))";
                }
                word.translateY = 0.01;
              }
              if (isDot) {
                if (word.HTMLElement.style.getPropertyValue("--opacity-size") !== `${0.2}`) {
                  word.HTMLElement.style.setProperty("--opacity-size", `${0.2}`);
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--font-size) * 0.01))") {
                  word.HTMLElement.style.transform = "translateY(calc(var(--font-size) * 0.01))";
                }
                word.translateY = 0.01;
                if (word.HTMLElement.style.getPropertyValue("scale") !== "0.75") {
                  word.HTMLElement.style.scale = "0.75";
                }
              } else {
                if (word.HTMLElement.style.getPropertyValue("scale") !== (isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale)) {
                  word.HTMLElement.style.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                }
                word.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                if (word.HTMLElement.style.getPropertyValue(
                  "--gradient-position"
                ) !== "-20%") {
                  word.HTMLElement.style.setProperty(
                    "--gradient-position",
                    "-20%"
                  );
                }
              }
              if (!isDot && !isLetterGroup) {
                word.AnimatorStoreTime_glow = void 0;
                word.glow = 0;
                word.AnimatorStoreTime_translateY = void 0;
                word.translateY = 0.01;
                word.AnimatorStoreTime_scale = void 0;
                word.scale = IdleLyricsScale;
              }
              if (word.HTMLElement.style.getPropertyValue(
                "--text-shadow-blur-radius"
              ) !== "4px") {
                word.HTMLElement.style.setProperty(
                  "--text-shadow-blur-radius",
                  "4px"
                );
              }
              if (word.HTMLElement.style.getPropertyValue(
                "--text-shadow-opacity"
              ) !== "0%") {
                word.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
              }
              word.glow = 0;
            } else if (word.Status === "Sung") {
              if (isLetterGroup) {
                for (let k = 0; k < word.Letters.length; k++) {
                  const letter = word.Letters[k];
                  if (letter.HTMLElement.style.getPropertyValue("transform") !== `translateY(calc(var(--DefaultLyricsSize) * 0))`) {
                    letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                  }
                  if (letter.HTMLElement.style.getPropertyValue("scale") !== "1") {
                    letter.HTMLElement.style.scale = "1";
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--text-shadow-blur-radius"
                  ) !== "4px") {
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      "4px"
                    );
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--text-shadow-opacity"
                  ) !== "0%") {
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      "0%"
                    );
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--gradient-position"
                  ) !== "100%") {
                    letter.HTMLElement.style.setProperty(
                      "--gradient-position",
                      "100%"
                    );
                  }
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== `translateY(calc(var(--DefaultLyricsSize) * 0))`) {
                  word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                }
                if (word.HTMLElement.style.getPropertyValue("scale") !== "1") {
                  word.HTMLElement.style.scale = "1";
                }
              }
              if (isDot) {
                if (word.HTMLElement.style.getPropertyValue("--opacity-size") !== `${0.2 + 1}`) {
                  word.HTMLElement.style.setProperty(
                    "--opacity-size",
                    `${0.2 + 1}`
                  );
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== `translateY(calc(var(--font-size) * 0))`) {
                  word.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                }
                if (word.HTMLElement.style.getPropertyValue("scale") !== "1.2") {
                  word.HTMLElement.style.scale = "1.2";
                }
                if (word.HTMLElement.style.getPropertyValue(
                  "--text-shadow-opacity"
                ) !== `${50}%`) {
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-opacity",
                    `${50}%`
                  );
                }
                if (word.HTMLElement.style.getPropertyValue(
                  "--text-shadow-blur-radius"
                ) !== `${12}px`) {
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-blur-radius",
                    `${12}px`
                  );
                }
              } else if (!isLetterGroup) {
                if (word.HTMLElement.style.getPropertyValue(
                  "--text-shadow-blur-radius"
                ) !== "4px") {
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-blur-radius",
                    "4px"
                  );
                }
                const element = word.HTMLElement;
                const transform = word.translateY;
                const currentTranslateY = transform;
                const currentScale = word.scale;
                const currentGlow = word.glow;
                if (!word.AnimatorStoreTime_translateY) {
                  word.AnimatorStoreTime_translateY = performance.now();
                }
                if (!word.AnimatorStoreTime_scale) {
                  word.AnimatorStoreTime_scale = performance.now();
                }
                if (!word.AnimatorStoreTime_glow) {
                  word.AnimatorStoreTime_glow = performance.now();
                }
                const now2 = performance.now();
                const elapsed_translateY = now2 - word.AnimatorStoreTime_translateY;
                const elapsed_scale = now2 - word.AnimatorStoreTime_scale;
                const elapsed_glow = now2 - word.AnimatorStoreTime_glow;
                const duration_translateY = 550;
                const progress_translateY = Math.min(
                  elapsed_translateY / duration_translateY,
                  1
                );
                const duration_scale = 1100;
                const progress_scale = Math.min(
                  elapsed_scale / duration_scale,
                  1
                );
                const duration_glow = 250;
                const progress_glow = Math.min(elapsed_glow / duration_glow, 1);
                const targetTranslateY = 5e-4;
                const targetScale = 1;
                const targetGlow = 0;
                const interpolate = (start, end, progress) => start + (end - start) * progress;
                const newTranslateY = interpolate(
                  currentTranslateY,
                  targetTranslateY,
                  progress_translateY
                );
                const newScale = interpolate(
                  currentScale,
                  targetScale,
                  progress_scale
                );
                const newGlow = interpolate(
                  currentGlow,
                  targetGlow,
                  progress_glow
                );
                if (element.style.getPropertyValue("--text-shadow-opacity") !== `${newGlow * 100}%`) {
                  element.style.setProperty(
                    "--text-shadow-opacity",
                    `${newGlow * 100}%`
                  );
                }
                if (element.style.getPropertyValue("transform") !== `translateY(calc(var(--DefaultLyricsSize) * ${newTranslateY}))`) {
                  element.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${newTranslateY}))`;
                }
                if (element.style.getPropertyValue("scale") !== `${newScale}`) {
                  element.style.scale = `${newScale}`;
                }
                if (progress_glow === 1) {
                  word.AnimatorStoreTime_glow = void 0;
                  word.glow = 0;
                }
                if (progress_translateY === 1) {
                  word.AnimatorStoreTime_translateY = void 0;
                  word.translateY = 0;
                }
                if (progress_scale === 1) {
                  word.AnimatorStoreTime_scale = void 0;
                  word.scale = 1;
                }
              }
              if (word.HTMLElement.style.getPropertyValue("--gradient-position") !== "100%") {
                word.HTMLElement.style.setProperty("--gradient-position", "100%");
              }
            }
          }
          if (Credits) {
            Credits.classList.remove("Active");
          }
        } else if (line.Status === "NotSung") {
          line.HTMLElement.classList.add("NotSung");
          line.HTMLElement.classList.remove("Sung");
          if (line.HTMLElement.classList.contains("Active") && !line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("Active");
          }
        } else if (line.Status === "Sung") {
          line.HTMLElement.classList.add("Sung");
          line.HTMLElement.classList.remove("Active", "NotSung");
          if (arr.length === index + 1) {
            if (Credits) {
              Credits.classList.add("Active");
            }
          }
        }
      }
    } else if (CurrentLyricsType === "Line") {
      const arr = LyricsObject.Types.Line.Lines;
      for (let index = 0; index < arr.length; index++) {
        const line = arr[index];
        if (line.Status === "Active") {
          if (!SpotifyPlayer.IsPlaying) {
            applyBlur(arr, index, BlurMultiplier);
          }
          if (Blurring_LastLine !== index) {
            applyBlur(arr, index, BlurMultiplier);
            Blurring_LastLine = index;
          }
          if (!line.HTMLElement.classList.contains("Active")) {
            line.HTMLElement.classList.add("Active");
          }
          if (line.HTMLElement.classList.contains("NotSung")) {
            line.HTMLElement.classList.remove("NotSung");
          }
          if (line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("OverridenByScroller");
          }
          if (line.HTMLElement.classList.contains("Sung")) {
            line.HTMLElement.classList.remove("Sung");
          }
          const totalDuration = line.EndTime - line.StartTime;
          const elapsedDuration = edtrackpos - line.StartTime;
          const percentage = 1;
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i = 0; i < Array2.length; i++) {
              const dot = Array2[i];
              if (dot.Status === "Active") {
                const totalDuration2 = dot.EndTime - dot.StartTime;
                const elapsedDuration2 = edtrackpos - dot.StartTime;
                const percentage2 = Math.max(
                  0,
                  Math.min(elapsedDuration2 / totalDuration2, 1)
                );
                const blurRadius = 4 + (16 - 4) * percentage2;
                const textShadowOpacity = calculateOpacity(percentage2, dot) * 1.5;
                const scale = 0.75 + (1 - 0.75) * percentage2;
                let translateY;
                if (percentage2 <= 0) {
                  translateY = 0 + (-0.07 - 0) * percentage2;
                } else if (percentage2 <= 0.88) {
                  translateY = -0.07 + (0.2 - -0.07) * ((percentage2 - 0.88) / 0.88);
                } else {
                  translateY = 0.2 + (0 - 0.2) * ((percentage2 - 0.22) / 0.88);
                }
                dot.HTMLElement.style.setProperty(
                  "--opacity-size",
                  `${0.2 + percentage2}`
                );
                dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY}))`;
                dot.HTMLElement.style.scale = `${0.2 + scale}`;
                dot.HTMLElement.style.setProperty(
                  "--text-shadow-blur-radius",
                  `${blurRadius}px`
                );
                dot.HTMLElement.style.setProperty(
                  "--text-shadow-opacity",
                  `${textShadowOpacity}%`
                );
              } else if (dot.Status === "NotSung") {
                dot.HTMLElement.style.setProperty("--opacity-size", `${0.2}`);
                dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                dot.HTMLElement.style.scale = `0.75`;
                dot.HTMLElement.style.setProperty(
                  "--text-shadow-blur-radius",
                  `4px`
                );
                dot.HTMLElement.style.setProperty("--text-shadow-opacity", `0%`);
              } else if (dot.Status === "Sung") {
                dot.HTMLElement.style.setProperty("--opacity-size", `${0.2 + 1}`);
                dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                dot.HTMLElement.style.scale = `1.2`;
                dot.HTMLElement.style.setProperty(
                  "--text-shadow-blur-radius",
                  `12px`
                );
                dot.HTMLElement.style.setProperty("--text-shadow-opacity", `50%`);
              }
            }
          } else {
            line.HTMLElement.style.setProperty(
              "--gradient-position",
              `${percentage * 100}%`
            );
          }
        } else if (line.Status === "NotSung") {
          if (!line.HTMLElement.classList.contains("NotSung")) {
            line.HTMLElement.classList.add("NotSung");
          }
          line.HTMLElement.classList.remove("Sung");
          if (line.HTMLElement.classList.contains("Active") && !line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("Active");
          }
          line.HTMLElement.style.setProperty("--gradient-position", `0%`);
        } else if (line.Status === "Sung") {
          if (!line.HTMLElement.classList.contains("Sung")) {
            line.HTMLElement.classList.add("Sung");
          }
          line.HTMLElement.classList.remove("Active", "NotSung");
          line.HTMLElement.style.setProperty("--gradient-position", `100%`);
        }
      }
    }
  }

  // src/utils/Lyrics/Animator/Lyrics/LyricsSetter.ts
  function TimeSetter(PreCurrentPosition) {
    const CurrentPosition = PreCurrentPosition + timeOffset;
    const CurrentLyricsType = Defaults_default.CurrentLyricsType;
    if (CurrentLyricsType && CurrentLyricsType === "None")
      return;
    const lines = LyricsObject.Types[CurrentLyricsType].Lines;
    if (CurrentLyricsType === "Syllable") {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineTimes = {
          start: line.StartTime,
          end: line.EndTime,
          total: line.EndTime - line.StartTime
        };
        if (lineTimes.start <= CurrentPosition && CurrentPosition <= lineTimes.end) {
          line.Status = "Active";
          const words = line.Syllables.Lead;
          for (let j = 0; j < words.length; j++) {
            const word = words[j];
            if (word.StartTime <= CurrentPosition && CurrentPosition <= word.EndTime) {
              word.Status = "Active";
            } else if (word.StartTime >= CurrentPosition) {
              word.Status = "NotSung";
            } else if (word.EndTime <= CurrentPosition) {
              word.Status = "Sung";
            }
            if (word?.LetterGroup) {
              for (let k = 0; k < word.Letters.length; k++) {
                const letter = word.Letters[k];
                if (letter.StartTime <= CurrentPosition && CurrentPosition <= letter.EndTime) {
                  letter.Status = "Active";
                } else if (letter.StartTime >= CurrentPosition) {
                  letter.Status = "NotSung";
                } else if (letter.EndTime <= CurrentPosition) {
                  letter.Status = "Sung";
                }
              }
            }
          }
        } else if (lineTimes.start >= CurrentPosition) {
          line.Status = "NotSung";
          const words = line.Syllables.Lead;
          for (let j = 0; j < words.length; j++) {
            const word = words[j];
            word.Status = "NotSung";
            if (word?.LetterGroup) {
              for (let k = 0; k < word.Letters.length; k++) {
                const letter = word.Letters[k];
                letter.Status = "NotSung";
              }
            }
          }
        } else if (lineTimes.end <= CurrentPosition) {
          line.Status = "Sung";
          const words = line.Syllables.Lead;
          for (let j = 0; j < words.length; j++) {
            const word = words[j];
            word.Status = "Sung";
            if (word?.LetterGroup) {
              for (let k = 0; k < word.Letters.length; k++) {
                const letter = word.Letters[k];
                letter.Status = "Sung";
              }
            }
          }
        }
      }
    } else if (CurrentLyricsType === "Line") {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineTimes = {
          start: line.StartTime,
          end: line.EndTime,
          total: line.EndTime - line.StartTime
        };
        if (lineTimes.start <= CurrentPosition && CurrentPosition <= lineTimes.end) {
          line.Status = "Active";
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i2 = 0; i2 < Array2.length; i2++) {
              const dot = Array2[i2];
              if (dot.StartTime <= CurrentPosition && CurrentPosition <= dot.EndTime) {
                dot.Status = "Active";
              } else if (dot.StartTime >= CurrentPosition) {
                dot.Status = "NotSung";
              } else if (dot.EndTime <= CurrentPosition) {
                dot.Status = "Sung";
              }
            }
          }
        } else if (lineTimes.start >= CurrentPosition) {
          line.Status = "NotSung";
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i2 = 0; i2 < Array2.length; i2++) {
              const dot = Array2[i2];
              dot.Status = "NotSung";
            }
          }
        } else if (lineTimes.end <= CurrentPosition) {
          line.Status = "Sung";
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i2 = 0; i2 < Array2.length; i2++) {
              const dot = Array2[i2];
              dot.Status = "Sung";
            }
          }
        }
      }
    }
  }

  // src/utils/Lyrics/Animator/Main.ts
  var Lyrics = {
    Animate,
    TimeSetter
  };

  // src/utils/Lyrics/lyrics.ts
  var ScrollingIntervalTime = 0.1;
  var lyricsBetweenShow = 3;
  var LyricsObject = {
    Types: {
      Syllable: {
        Lines: []
      },
      Line: {
        Lines: []
      },
      Static: {
        Lines: []
      }
    }
  };
  var CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;
  var LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;
  function SetWordArrayInCurentLine() {
    CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;
    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables = {};
    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead = [];
  }
  function SetWordArrayInCurentLine_LINE_SYNCED() {
    LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;
    LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables = {};
    LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead = [];
  }
  function ClearLyricsContentArrays() {
    LyricsObject.Types.Syllable.Lines = [];
    LyricsObject.Types.Line.Lines = [];
    LyricsObject.Types.Static.Lines = [];
  }
  var THROTTLE_TIME = 0;
  var LyricsInterval = new IntervalManager(THROTTLE_TIME, () => {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const progress = SpotifyPlayer.GetTrackPosition();
    Lyrics.TimeSetter(progress);
    Lyrics.Animate(progress);
  }).Start();
  var LinesEvListenerMaid;
  var LinesEvListenerExists;
  function LinesEvListener(e) {
    if (e.target.classList.contains("line")) {
      let startTime;
      LyricsObject.Types.Line.Lines.forEach((line) => {
        if (line.HTMLElement === e.target) {
          startTime = line.StartTime;
        }
      });
      if (startTime) {
        Spicetify.Player.seek(startTime);
      }
    } else if (e.target.classList.contains("word")) {
      let startTime;
      LyricsObject.Types.Syllable.Lines.forEach((line) => {
        line.Syllables.Lead.forEach((word) => {
          if (word.HTMLElement === e.target) {
            startTime = line.StartTime;
          }
        });
      });
      if (startTime) {
        Spicetify.Player.seek(startTime);
      }
    } else if (e.target.classList.contains("Emphasis")) {
      let startTime;
      LyricsObject.Types.Syllable.Lines.forEach((line) => {
        line.Syllables.Lead.forEach((word) => {
          if (word?.Letters) {
            word.Letters.forEach((letter) => {
              if (letter.HTMLElement === e.target) {
                startTime = line.StartTime;
              }
            });
          }
        });
      });
      if (startTime) {
        Spicetify.Player.seek(startTime);
      }
    }
  }
  function addLinesEvListener() {
    if (LinesEvListenerExists)
      return;
    LinesEvListenerExists = true;
    LinesEvListenerMaid = new Maid();
    const el = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    if (!el)
      return;
    const evl = el.addEventListener("click", LinesEvListener);
    LinesEvListenerMaid.Give(evl);
  }
  function removeLinesEvListener() {
    if (!LinesEvListenerExists)
      return;
    LinesEvListenerExists = false;
    const el = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    if (!el)
      return;
    el.removeEventListener("click", LinesEvListener);
    LinesEvListenerMaid.Destroy();
  }

  // src/utils/Animator.ts
  var Animator = class {
    constructor(from, to, duration) {
      this.startTime = null;
      this.pausedTime = null;
      this.animationFrameId = null;
      this.events = {};
      this.isDestroyed = false;
      this.reversed = false;
      this.from = from;
      this.to = to;
      this.duration = duration * 1e3;
      this.currentProgress = from;
      this.maid = new Maid();
    }
    emit(event, progress) {
      if (this.events[event] && !this.isDestroyed) {
        const callback = this.events[event];
        callback?.(progress ?? this.currentProgress, this.from, this.to);
      }
    }
    on(event, callback) {
      this.events[event] = callback;
    }
    Start() {
      if (this.isDestroyed)
        return;
      this.startTime = performance.now();
      this.animate();
    }
    animate() {
      if (this.isDestroyed || this.startTime === null)
        return;
      const now2 = performance.now();
      const elapsed = now2 - this.startTime;
      const t = Math.min(elapsed / this.duration, 1);
      const startValue = this.reversed ? this.to : this.from;
      const endValue = this.reversed ? this.from : this.to;
      this.currentProgress = startValue + (endValue - startValue) * t;
      this.emit("progress", this.currentProgress);
      if (t < 1) {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.maid.Give(() => cancelAnimationFrame(this.animationFrameId));
      } else {
        this.emit("finish");
        this.reset();
      }
    }
    Pause() {
      if (this.isDestroyed || this.animationFrameId === null)
        return;
      cancelAnimationFrame(this.animationFrameId);
      this.pausedTime = performance.now();
      this.emit("pause", this.currentProgress);
    }
    Resume() {
      if (this.isDestroyed || this.pausedTime === null)
        return;
      const pausedDuration = performance.now() - this.pausedTime;
      if (this.startTime !== null)
        this.startTime += pausedDuration;
      this.pausedTime = null;
      this.emit("resume", this.currentProgress);
      this.animate();
    }
    Restart() {
      if (this.isDestroyed)
        return;
      this.reset();
      this.emit("restart", this.currentProgress);
      this.Start();
    }
    Reverse() {
      if (this.isDestroyed)
        return;
      this.reversed = !this.reversed;
      this.emit("reverse", this.currentProgress);
    }
    Destroy() {
      if (this.isDestroyed)
        return;
      this.emit("destroy");
      this.maid.Destroy();
      this.reset();
      this.isDestroyed = true;
    }
    reset() {
      this.startTime = null;
      this.pausedTime = null;
      this.animationFrameId = null;
    }
  };

  // src/utils/BlobURLMaker.ts
  async function BlobURLMaker(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching and converting to blob URL:", error);
      throw error;
    }
  }

  // src/components/DynamicBG/ArtistVisuals/Cache.ts
  var Cache = new SpikyCache({
    name: "SpicyLyrics-ArtistVisualsCache"
  });
  var Cache_default = Cache;

  // src/components/DynamicBG/ArtistVisuals/HeaderImage/GetHeaderUrl.ts
  function GetHeaderUrl(data) {
    if (!data)
      return Spicetify.Player.data?.item.metadata.image_xlarge_url || null;
    const HeaderImage = typeof data === "object" ? data?.Visuals?.headerImage?.sources[0]?.url : JSON.parse(data)?.Visuals?.headerImage?.sources[0]?.url;
    if (!HeaderImage)
      return Spicetify.Player.data?.item.metadata.image_xlarge_url || null;
    return `spotify:image:${HeaderImage.replace("https://i.scdn.co/image/", "")}`;
  }

  // src/components/DynamicBG/ArtistVisuals/HeaderImage/Main.ts
  var isFetching = /* @__PURE__ */ new Map();
  async function ApplyContent(CurrentSongArtist, CurrentSongUri) {
    if (!CurrentSongArtist)
      throw new Error("Invalid Song Artist");
    if (!CurrentSongUri)
      throw new Error("Invalid Song URI");
    const TrackId = CurrentSongUri.split(":")[2];
    const ArtistId = CurrentSongArtist.split(":")[2];
    if (!TrackId || !ArtistId)
      throw new Error("Invalid URIs");
    const Cached = await Main_default.Cache.get(ArtistId);
    if (Cached) {
      if (Cached.metadata.expiresIn <= Date.now()) {
        await Main_default.Cache.remove(ArtistId);
        return Continue();
      }
      if (Cached?.data) {
        return GetHeaderUrl(Cached?.data);
      }
      await Main_default.Cache.remove(ArtistId);
      return Continue();
    }
    return Continue();
    async function Continue() {
      if (isFetching.has(ArtistId)) {
        return isFetching.get(ArtistId);
      }
      const fetchPromise = (async () => {
        try {
          const [res, status] = await SpicyFetch(`artist/visuals?artist=${CurrentSongArtist}&track=${CurrentSongUri}`);
          if (status === 200) {
            await Main_default.Cache.set(ArtistId, {
              data: res ?? "",
              metadata: {
                expiresIn: Date.now() + 2592e5
              }
            });
            return GetHeaderUrl(res ?? "");
          } else {
            throw new Error(`Failed to fetch visuals: ${status}`);
          }
        } finally {
          isFetching.delete(ArtistId);
        }
      })();
      isFetching.set(ArtistId, fetchPromise);
      return fetchPromise;
    }
  }

  // src/components/DynamicBG/ArtistVisuals/Main.ts
  var ArtistVisuals = {
    Cache: Cache_default,
    ApplyContent
  };
  var Main_default = ArtistVisuals;

  // src/components/DynamicBG/dynamicBackground.ts
  async function ApplyDynamicBackground(element) {
    if (!element)
      return;
    let currentImgCover = await SpotifyPlayer.Artwork.Get("d");
    const lowQMode = storage_default.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";
    const IsEpisode = Spicetify.Player.data.item.type === "episode";
    const CurrentSongArtist = IsEpisode ? null : Spicetify.Player.data?.item.artists[0].uri;
    const CurrentSongUri = Spicetify.Player.data?.item.uri;
    if (lowQModeEnabled) {
      try {
        currentImgCover = IsEpisode ? null : storage_default.get("force-cover-bg_in-lowqmode") == "true" ? currentImgCover : await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
      } catch (error) {
        console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error);
      }
    }
    if (lowQModeEnabled) {
      if (IsEpisode)
        return;
      const dynamicBg = document.createElement("img");
      const prevBg = element.querySelector(".spicy-dynamic-bg.lowqmode");
      if (prevBg && prevBg.getAttribute("spotifyimageurl") === currentImgCover) {
        dynamicBg.remove();
        return;
      }
      dynamicBg.classList.add("spicy-dynamic-bg", "lowqmode");
      const processedCover = `https://i.scdn.co/image/${currentImgCover.replace("spotify:image:", "")}`;
      dynamicBg.src = await BlobURLMaker(processedCover) ?? currentImgCover;
      dynamicBg.setAttribute("spotifyimageurl", currentImgCover);
      element.appendChild(dynamicBg);
      const Animator1 = new Animator(0, 1, 0.3);
      const Animator2 = new Animator(1, 0, 0.3);
      Animator1.on("progress", (progress) => {
        dynamicBg.style.opacity = progress.toString();
      });
      Animator2.on("progress", (progress) => {
        if (!prevBg)
          return;
        prevBg.style.opacity = progress.toString();
      });
      Animator1.on("finish", () => {
        dynamicBg.style.opacity = "1";
        Animator1.Destroy();
      });
      Animator2.on("finish", () => {
        prevBg?.remove();
        Animator2.Destroy();
      });
      Animator2.Start();
      Animator1.Start();
    } else {
      if (element?.querySelector(".spicy-dynamic-bg")) {
        if (element.querySelector(".spicy-dynamic-bg").getAttribute("current_tag") === currentImgCover)
          return;
        const e = element.querySelector(".spicy-dynamic-bg");
        e.setAttribute("current_tag", currentImgCover);
        e.innerHTML = `
                <img class="Front" src="${currentImgCover}" />
                <img class="Back" src="${currentImgCover}" />
                <img class="BackCenter" src="${currentImgCover}" />
            `;
        return;
      }
      const dynamicBg = document.createElement("div");
      dynamicBg.classList.add("spicy-dynamic-bg");
      dynamicBg.classList.remove("lowqmode");
      dynamicBg.setAttribute("current_tag", currentImgCover);
      dynamicBg.innerHTML = `
            <img class="Front" src="${currentImgCover}" />
            <img class="Back" src="${currentImgCover}" />
            <img class="BackCenter" src="${currentImgCover}" />
        `;
      element.appendChild(dynamicBg);
    }
  }
  async function LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri) {
    if (storage_default.get("force-cover-bg_in-lowqmode") == "true")
      return;
    try {
      return await Main_default.ApplyContent(CurrentSongArtist, CurrentSongUri);
    } catch (error) {
      console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error);
    }
  }

  // src/components/Styling/Icons.ts
  var TrackSkip = `
	<div class="PlaybackControl TrackSkip REPLACEME">
		<svg viewBox="0 0 35 20" xmlns="http://www.w3.org/2000/svg">
			<path d="M 19.467 19.905 C 20.008 19.905 20.463 19.746 21.005 19.426 L 33.61 12.023 C 34.533 11.482 35 10.817 35 9.993 C 35 9.158 34.545 8.53 33.61 7.977 L 21.005 0.574 C 20.463 0.254 19.998 0.094 19.456 0.094 C 18.374 0.094 17.475 0.917 17.475 2.418 L 17.475 9.49 C 17.315 8.898 16.873 8.408 16.135 7.977 L 3.529 0.574 C 3 0.254 2.533 0.094 1.993 0.094 C 0.911 0.094 0 0.917 0 2.418 L 0 17.582 C 0 19.083 0.91 19.906 1.993 19.906 C 2.533 19.906 3 19.746 3.529 19.426 L 16.135 12.023 C 16.861 11.593 17.315 11.088 17.475 10.485 L 17.475 17.582 C 17.475 19.083 18.386 19.906 19.467 19.906 L 19.467 19.905 Z" fill-rule="nonzero"/>
		</svg>
	</div>
`;
  var Icons = {
    LyricsPage: `
        <svg class="Svg-sc-ytk21e-0 Svg-img-16-icon" id="SpicyLyricsPageSvg" version="1.0" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <g clip-path="url(#clip0_1_2)">
                <g clip-path="url(#clip1_1_2)">
                    <path d="M167.664 32.175C163.033 27.5654 157.213 24.3179 150.845 22.7905C144.477 21.2632 137.809 21.5155 131.576 23.5194C125.343 25.5234 119.788 29.2012 115.522 34.1473C111.256 39.0935 108.446 45.1157 107.402 51.55L148.192 92.1375C154.659 91.0982 160.711 88.3022 165.682 84.0577C170.653 79.8132 174.349 74.2852 176.363 68.0832C178.377 61.8813 178.63 55.2464 177.096 48.9102C175.561 42.5741 172.297 36.7828 167.664 32.175ZM130.906 101.475L98.0051 68.725C84.8516 83.6287 71.6986 98.5328 58.5462 113.438L24.9416 151.5C22.243 154.572 20.8182 158.549 20.9557 162.627C21.0932 166.705 22.7827 170.578 25.6821 173.463C28.5815 176.348 32.4743 178.029 36.5724 178.166C40.6705 178.303 44.6678 176.885 47.7551 174.2L86.1963 140.6L130.919 101.488L130.906 101.475ZM88.445 51.175C89.5849 41.0445 93.5761 31.44 99.9594 23.4668C106.343 15.4936 114.859 9.47565 124.527 6.10546C134.196 2.73527 144.625 2.14979 154.613 4.41638C164.601 6.68297 173.744 11.7095 180.988 18.9177C188.232 26.1258 193.284 35.2226 195.562 45.1612C197.839 55.0999 197.251 65.4765 193.864 75.0971C190.477 84.7177 184.429 93.1913 176.416 99.5429C168.403 105.894 158.75 109.866 148.569 111L98.6458 154.663L60.2045 188.275C53.5213 194.108 44.8584 197.193 35.9733 196.904C27.0881 196.615 18.6462 192.974 12.3601 186.719C6.07397 180.464 2.41449 172.064 2.12407 163.223C1.83364 154.382 4.93401 145.762 10.7962 139.113L44.4134 101.05L88.445 51.175Z" />
                    <path d="M14.4253 71.9866L24.7716 82.7005L38.1583 76.1714L31.166 89.3221L41.5123 100.036L26.8445 97.4497L19.8521 110.6L17.7792 95.8513L3.11139 93.2649L16.4981 86.7358L14.4253 71.9866Z" />
                    <path d="M116.417 140.835L133.497 158.522L155.597 147.744L144.053 169.454L161.134 187.141L136.919 182.871L125.376 204.581L121.954 180.232L97.7398 175.963L119.839 165.184L116.417 140.835Z" />
                    <path d="M81.5977 24.9164L63.3254 41.3689L73.3262 63.831L52.0325 51.5371L33.7602 67.9896L38.8723 43.939L17.5786 31.6451L42.0317 29.075L47.1438 5.02446L57.1446 27.4866L81.5977 24.9164Z" />
                    <path d="M169.688 110.558L166.338 125.071L179.105 132.742L164.267 134.04L160.917 148.552L155.097 134.842L140.26 136.14L151.501 126.369L145.681 112.659L158.448 120.33L169.688 110.558Z" />
                </g>
            </g>
            <defs>
                <clipPath id="clip0_1_2">
                    <rect width="200" height="200" />
                </clipPath>
                <clipPath id="clip1_1_2">
                    <rect width="201" height="200" transform="translate(-1)"/>
                </clipPath>
            </defs>
        </svg>
    `,
    LyricsLargeIcon: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 200 200" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon" id="SpicyLyricsPageSvg">
            <g clip-path="url(#clip0_1_2)">
                <g clip-path="url(#clip1_1_2)">
                    <path d="M167.664 32.175C163.033 27.5654 157.213 24.3179 150.845 22.7905C144.477 21.2632 137.809 21.5155 131.576 23.5194C125.343 25.5234 119.788 29.2012 115.522 34.1473C111.256 39.0935 108.446 45.1157 107.402 51.55L148.192 92.1375C154.659 91.0982 160.711 88.3022 165.682 84.0577C170.653 79.8132 174.349 74.2852 176.363 68.0832C178.377 61.8813 178.63 55.2464 177.096 48.9102C175.561 42.5741 172.297 36.7828 167.664 32.175ZM130.906 101.475L98.0051 68.725C84.8516 83.6287 71.6986 98.5328 58.5462 113.438L24.9416 151.5C22.243 154.572 20.8182 158.549 20.9557 162.627C21.0932 166.705 22.7827 170.578 25.6821 173.463C28.5815 176.348 32.4743 178.029 36.5724 178.166C40.6705 178.303 44.6678 176.885 47.7551 174.2L86.1963 140.6L130.919 101.488L130.906 101.475ZM88.445 51.175C89.5849 41.0445 93.5761 31.44 99.9594 23.4668C106.343 15.4936 114.859 9.47565 124.527 6.10546C134.196 2.73527 144.625 2.14979 154.613 4.41638C164.601 6.68297 173.744 11.7095 180.988 18.9177C188.232 26.1258 193.284 35.2226 195.562 45.1612C197.839 55.0999 197.251 65.4765 193.864 75.0971C190.477 84.7177 184.429 93.1913 176.416 99.5429C168.403 105.894 158.75 109.866 148.569 111L98.6458 154.663L60.2045 188.275C53.5213 194.108 44.8584 197.193 35.9733 196.904C27.0881 196.615 18.6462 192.974 12.3601 186.719C6.07397 180.464 2.41449 172.064 2.12407 163.223C1.83364 154.382 4.93401 145.762 10.7962 139.113L44.4134 101.05L88.445 51.175Z" />
                    <path d="M14.4253 71.9866L24.7716 82.7005L38.1583 76.1714L31.166 89.3221L41.5123 100.036L26.8445 97.4497L19.8521 110.6L17.7792 95.8513L3.11139 93.2649L16.4981 86.7358L14.4253 71.9866Z" />
                    <path d="M116.417 140.835L133.497 158.522L155.597 147.744L144.053 169.454L161.134 187.141L136.919 182.871L125.376 204.581L121.954 180.232L97.7398 175.963L119.839 165.184L116.417 140.835Z" />
                    <path d="M81.5977 24.9164L63.3254 41.3689L73.3262 63.831L52.0325 51.5371L33.7602 67.9896L38.8723 43.939L17.5786 31.6451L42.0317 29.075L47.1438 5.02446L57.1446 27.4866L81.5977 24.9164Z" />
                    <path d="M169.688 110.558L166.338 125.071L179.105 132.742L164.267 134.04L160.917 148.552L155.097 134.842L140.26 136.14L151.501 126.369L145.681 112.659L158.448 120.33L169.688 110.558Z" />
                </g>
            </g>
            <defs>
                <clipPath id="clip0_1_2">
                    <rect width="200" height="200" />
                </clipPath>
                <clipPath id="clip1_1_2">
                    <rect width="201" height="200" transform="translate(-1)"/>
                </clipPath>
            </defs>
        </svg>
    `,
    Close: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon">
            <path d="M1.47 1.47a.75.75 0 0 1 1.06 0L8 6.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L9.06 8l5.47 5.47a.75.75 0 1 1-1.06 1.06L8 9.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L6.94 8 1.47 2.53a.75.75 0 0 1 0-1.06z"></path>
        </svg>
    `,
    Kofi: `
        <img height="16" loading="eager" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUEAAAECCAMAAABXHJXBAAAASFBMVEVMaXH///8gICD/////////////////+PX59/f/////WhY1NTXLy8vl4+NwcHCUlJRUVFSrq6v/bDD/rIqCgoL/jl//zLe5ubkCLxQzAAAACnRSTlMAOv//GGKF5/mwCIDTfQAAAAlwSFlzAAALEwAACxMBAJqcGAAAD91JREFUeJztnemS4joMRgnZHJzE2YD3f9NboXtourFkyXZsJ9zv31QNNBy0xYt0Om2uoiiyrFxVVVXzo/pFIifq9UV1/fJuTVVV1fpHsiwriuK0ZxXFyusBi4HGux58V6hZtg+eRVGWVVxmBpwrzDRZZmXVpMlNI1E3VZmdklFRVnW+R9VNAhiLstmL4eklmioixaJs8iNINGWM0HgUfN+qQ5tidih8X6qbYBCLcp+Zw6w6iDsX1b5zh0GbG+LB+a2qy//5pcswO2r8C8SwOGD+Dcqw/AgH3o5h8TEO/KLGY23zcQb4rcoTv8+KgL9UeykPPycF61QVSXlw13Vd27b3cZX60tL/1aDV23/r+/77LZR6vOG9XdV1fkNO7Yqwsv/bXdfexweiYZBSngNKSrkyX5Qa29YVqVs0ZIdAsVLr+yEsMZNWnkrd2y50UubkkO6ulj4tbjrJYVGtCOXJ5CqwVX3y6H5JDurOwSjKDQEKNeyL3lNDz6BYbQRQqOG8aw2q3QwhAWC7M9/VSy7dNgiNSaTdufm9aBgp7tz4rQPHI5jfj2TfeUZYfYz9PTW0PhGW6Bt1B+S3ahi9IcSziDqWA7PskJpO6g80wG+Z4mHlHAQPlkE0UjjC0jEILufjS6JmKDKXIHhwD6aZoXmZAS6lu8N7MMkMG2sfbj8G4PksR+tsAvvwJwE8456cWeXhDwN4PvfCKhQW0Is+JwZSgmHFTyMfCPCMIQT9OANeINwBSvm1Zbk8dycfm5Pr9uSb3n9Arb7f4HX7dN07XfdG/WzYwAhBP4ZMsLdk1i9qJeV5C5eoFfFjt3Ww3oeAEVa8Skbx/uzQqzESNVCibdUyDP4Q6o0QqGQ6OrtlZG8lBpVoVc/CKAWnrs5cgqDsld1+dniJ+0KnOHCSSWO9miAX6pZXKupGKsSFboRALdiaf6Y236OoEEfyOhdggiYf7vfJ76Gud8gmNdEEDXl42EvwA9QR9iwGQYuEpcXDiNyx/T1lZrjQIqG+lEHNfEm6cvHoyy3FCDN2KYiuoe1Lpsf+gWKE+jzSH9yDqeFeER5MaqYJ4vsx+5Mh4Avj03HGNMGjAcwN0VCfTERhWpuWnwMwN3hyZ8olWicewfe75/mHIewNuURfTg+W+/qHRNjhblyy8ojM889DuOAPxw3r7Y4YBM25U6BuLDh5RB8SjiEBr9cozI0z1rLWgU0wR+pCiWXjkuPERzbBHAuFLVJUa8Pg8IkmmCMVyIKsEuqqQfGZJpjDfqzPJQVYDUJh8FALCjw/bsF6JmNsMO2zFhSP0xHU/yw5btyAiWQ4jBOL5yr0QLtHBxmhBAOhdllBbuDEdV1bdG0QVq+Czu1J89YYaIQtFAgbRhi0+xb1bb5O0+WhabrON9r+QPfzqst0nefOT2Iwrq4vnKJ6rQh1X+fO3MJHdJv/UXjR9VZbvGy6EtkbntMMW4yQ+WhDWAmk4sXTqozQ4fuGWNu8bMJeppH+e0j8iwyMQNgAqbj3sjBYXyF8KEME+5f90j8B+GyqbHKJznRrgCDwK7AikcBBrJp1r7sZX0a3Q/jQCoYQWtjTBVABFDMeqsGbEcTqlG8sxEx4mR4979gPhlAyKsJCW8wI50QiSCDeWdQU7lr07INTSFnTM1JJpiXYutbTNRHEX4Qd+XXTzZUgYg8jwwdLTjmoNgB4eUVI8nwt+tzi8J7iBkIGwdGNYMcB8YLixnoZBWFrdcYXDIS6TFppCSqnYqbmAXyiYAKkIMQPkMIPJwM9dDba1UHl8lRccwF+o7B9nT3BgZtKRjLB3oGg4IO4XDorgJeLKZ0YDjGDbqw4BAWdIKmgvlqAuEwitwFoLGoMBMHAzkgE9Sn3S3C2AXG5zJavm5wIguXZnV5S+yZYW5mSg2YXguBDFqMg1hMEUtFWPuwk1I9NlzmYBaHWZv0SvF2C6+pCsEuO4BSeIJqPTQTb1AjeIgBEjdBE8M4jOLgS7FI0wQtmhCaCY2IEb1EAYka4N4LXOATXJ5rUCFrWg1MkgnOoTLI1wVskgMiDyc4IXmMRhHNJtHrQjuAUjeCc3DOJFcEuGkA4GxsIDh6eiwVnfbBLMwxe4EBouzbTctZmvBGc4xEElxcMBO/M1S21LcFrRIK3mGvU3lb5p4gEZyuC8P4349yQR4KXS3qpBCd4T2uvTuyOIHIMiOH1lTeC9e4IwtvFLevMgi+CXUyCkwVB5BSQYpSPmbczC7edEcQu6g+M028sguOBbFAiDiU428v6o/yjBcF6V3FQYv4E9UfQQa8PTrCzsED4orbu/zYnf6ffLgkSBI6x4dchIOzaRFJ5JDhFJAgubyn+XQjQibWJpGRdadohwfzNI6Uy3eph3QrLTv7OUV8jEkQ2PBW34Slkgtp6Wpw8EpwjEsTiWjc+2nz3C3FaJ6tFRwMQ5CxyJ1FS5/4EtnoaoRvapeNWVQrljOEUIUtgt48OutrJuNM07G6nyWOTgB4Kgx5vhV2jEWTcVTQI7rk4gk0CMropGwjO0Qi6XIKnfHHwu8ONKoA3ytMMhFO+fcMefRaFm6XYHT2a9h4GkcWwDu5c5pHgvHMnRrqx9lj3vNzblZzbvp0YG4Oh/+bfrd8cb0XFz8a+MjEy6kBfx/1rP8jYKDFd7pz37MRYN+AWbYHpkaCIkUvQ6xB+AOqj4LMNK2OB0HjJfd6rCSLdL8EM+uwhylggNBKsd2qC+Fxc4Gs/21EzFmfMzT6uu8wj+FBNYF/0pxs1o9mHmWC9RxM0DDYYTXOGtEsLwI8ikjPC2pmfabK1NI4Z4hA0r5GLaWcmaBqSA51teBl1VXgsqfPQ6djVBFvjxDBlnnTFIUjolyKm/awpmPmB5cevaWuCHlwpXY9ue3kiJvAjDlur6SU1qfPWdQ8+TBm0hqxG/R74xyipSd3fxJS6D7eKOHUSilp/5v01jP0C0o7rLWEf7u5LTx5oDIb9PzMn/ZYzwfIxpYFe27+KOwwajPp/p/1xGlLTmpeJKREf5k2vpgb91xFXD3E6sULTaMO3nSEFwcEFoCAPIS9cD2PHCIW0ICi3APg2NlZfztwdW7HOGwMkFTLtFgB1Q9w5yZjcV/4aH6BDGEQeHd58mNmZnzzwVEzxFwUpI565CVPjw1tNhxBT9FJabgBQ48ObTSipt0LooRs1JvSg//v8djAZQycRRXSEM/XvA9nQIPSgvy4IQskY+gE5vfnrKerTsE0YxA/6/30YQZMxq7V6QISM5QSLehq/aaIPgmAy5syYCIeQARAbog58N/yh9e1pzpCMoVExIibCmfGn4fHBgHrD2bSXecWkVALFYXJFuAFC1uYwMwwOpocFfRo+bT/0r/aGkDbNwK4aNPID0zCSSqBAyJ2VJDw9I0+8UVetV34GgLxAyB+5NnsByNwVITuxVISfxgCQN4CXVc9YjM3Q68o1fZoTy6GlvLEJoH7HEzoVazN6sp5C7ypRnFj2I+13MQPkTeC1mZworgFzCMWJJW0GpTkLn4JNgZ4dAPI3hpFyWsp+GRlZSSB1oCEQgl0KuCHJ0ZNni78H3hLuuG8GP8r9luC4MXt2oktZY+HB3FvCmBoiQH0ghNzYZn6nbU5mjpk05RFuDCfkECwQevsc1EGU7wZoebIDyiPMOkJQcgj2aAz6gkVJaGWGdgaI5JF+Gw9+qGbNk7bLJUwztDVApJRpt/FgeI0Q/C0tcwnLDG0NEPnYHCeuSUWMqZ4Bs7HNcwnPDO0NEDFB+g8vmAa4SrD2rJmrhGwztDdArJrutomAmBuDN0atCxqSGboYIGKC/VYOjLnx4r2gITyi2DyEUEyw9V7C/JZglYSuRpjnOTBk2+4hhGCCtDPMlY0DI24Mbxk6G2GudWU3B0Y3mMZt+UFuDLeRzD3oLaO4ZBCrhievaqz9F3s2hj+RU0341O3FDqfZ/aamsjVBUdnlD+OzMfyRXB5MXiVu8/V6vc4zbyeJ268Da/67mp+L+/5TIXgtMPwYoV/BS9Nqa3ywG8N+0eWpCU4jkAkKf/jAXAIb4ZAnJqTnjnJagN7MCFW+Fx8GErHF069NLhGW0Tm4kJPnQCL2bYJALkE+2ZAnJGx/jnmi8uT5uQTZ/1f5HoJgMBMEjRA5ANDmqQjZY++DmSBohPCBWplKKMSu33TBTBDaccJCzJAnD1AFNEGooME+4JInIOygEbSksIkJgkaItTdUedJZBEojG5kgaITYj6zylAH2YU0QNEL0ONmYpwsQSnWbmSCYjjE/Po/JAgTLrc1MEKwJ8fsZY54oQCjCeH8iJhghfixU5ZFkaB4IvMr7ogzJCFE/PkdCONp0X6Qd7PW+RGMcxSry8LLrvqi/qR6gojF8Xhn8AU8YzpuDfrGpD8OL1cYLp3JMKQQiD5wbVjKmZIKHwvN5CenJtu0rN04jeDIx/uwy2GqXqX8qElQ2TiN4MjHf2u3DRENz/0Cwn0EAH8aSibkNjgwQDQn9K8EsEsKHUT+GD8TRJrN6UEe4twmXp0F8GPVjyr3TYcNwKCgNQGGAgXwY9WN8DMC3hntEfsiqbygfxv2YhPAsiVdPOWoX0rVh5LhvQICYH+PLIU/J3qszi3HYpHNbhLqajPBMu4Lv0/zwjZuAQfChoravZ380EEbeGiTo+Cw6t22KEI5ktFj4LdnTL5S/qVWsHr7KqmlRhFDI7ogjh+XOxdjdF2YHZHSxPFglSAuFdk06h16Nrbm9RteOqufCMz2WB84ixqrQrd2zHIa+79VfLWvjbWndwhddoQydRQjZxLxSE1joKnn4LEJC2KWEEN2piQfwdMrQqLWcExG+MhkTIJ6Qc8NmWTDh+1wx6hg6ws6l+70nmbpXul9X2rCmySnrxRsLb58aqRBkIeysu48HMMAkABoR5hGjoXF/MAmAZoRdpKRsXA23v7IeGmEew5XNOzLxkwgDYU6ZAOeVn/m0U0oAKQjzkAylMu8ixC2kuXXhl9pAvjwQ+CUH8HTKKF0QugAMabupVn13Yi4zPNVtW9tI4oJ3pPVALwjzvKVPJmSK1v44nTLQKp986b4BRFL0c+n8FEQlfSO99QmR3D061RDI9+SHWuWFIqN7dLoh8EcF2ZO/1I69Q524bpUyh6Ik7MH/VLKbO4lWsXcu5dCrO//MQ9oe/E8FtocHS7R3tZjG4Eo59OumqN15kXRWEjwmFK26rtWoY/cs36UBOpnhptqPAdpGw43l1D1wF0l5WzU7SMEpu7LYmQOn5spifw6cFEOxa37xGe6fX1yGx+C3qoySU47DL05edm5/nJyKkM7so/1xisqaMBC9NqBNTWWz9U33Q+P7UrmhJX4Avi9l1QaJxW/36PRVlJVHU/w0ev9UZJV7WBR19Zn0niqysrHkWDdVecyqxUJFVlZNU9NI1iu6svhsyztBKrIsK8vqS81Tj3+WZZllewL3H/2YOVHv+BUaAAAAAElFTkSuQmCC" />
    `,
    NowBar: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon">
            <path d="M11.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M1.75 3A1.75 1.75 0 000 4.75v6.5C0 12.216.784 13 1.75 13H2v1.25a.75.75 0 001.5 0V13h9v1.25a.75.75 0 001.5 0V13h.25A1.75 1.75 0 0016 11.25v-6.5A1.75 1.75 0 0014.25 3H1.75zM1.5 4.75a.25.25 0 01.25-.25h12.5a.25.25 0 01.25.25v6.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25v-6.5z"/>
        </svg>
    `,
    Fullscreen: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon">
            <path d="M6.064 10.229l-2.418 2.418L2 11v4h4l-1.647-1.646 2.418-2.418-.707-.707zM11 2l1.647 1.647-2.418 2.418.707.707 2.418-2.418L15 6V2h-4z"/>
        </svg>
    `,
    CloseFullscreen: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 24 24" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon">
            <path d="M21.707 2.293a1 1 0 0 1 0 1.414L17.414 8h1.829a1 1 0 0 1 0 2H14V4.757a1 1 0 1 1 2 0v1.829l4.293-4.293a1 1 0 0 1 1.414 0zM2.293 21.707a1 1 0 0 1 0-1.414L6.586 16H4.757a1 1 0 0 1 0-2H10v5.243a1 1 0 0 1-2 0v-1.829l-4.293 4.293a1 1 0 0 1-1.414 0z" />
        </svg>
    `,
    PrevTrack: TrackSkip.replace("REPLACEME", "PrevTrack"),
    Play: `
		<svg viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg" class="Play">
			<path d="M 1.558 20 C 2.006 20 2.381 19.838 2.874 19.561 L 16.622 11.572 C 17.527 11.053 17.894 10.65 17.894 9.997 C 17.894 9.35 17.527 8.948 16.622 8.419 L 2.874 0.439 C 2.381 0.153 2.006 0 1.558 0 C 0.706 0 0.106 0.654 0.106 1.694 L 0.106 18.298 C 0.106 19.346 0.706 20 1.558 20 L 1.558 20 Z" fill-rule="nonzero" transform="matrix(1, 0, 0, 1, 0, 8.881784197001252e-16)"/>
		</svg>
	`,
    Pause: `
		<svg viewBox="0 0 15 20" xmlns="http://www.w3.org/2000/svg" class="Pause">
			<path d="M 4.427 19.963 C 5.513 19.963 6.06 19.416 6.06 18.33 L 6.06 1.66 C 6.06 0.545 5.513 0.037 4.427 0.037 L 1.633 0.037 C 0.548 0.037 0 0.575 0 1.66 L 0 18.331 C -0.009 19.416 0.538 19.963 1.633 19.963 L 4.427 19.963 Z M 13.377 19.963 C 14.462 19.963 15 19.416 15 18.33 L 15 1.66 C 15 0.545 14.462 0.037 13.376 0.037 L 10.573 0.037 C 9.487 0.037 8.949 0.575 8.949 1.66 L 8.949 18.331 C 8.949 19.416 9.487 19.963 10.573 19.963 L 13.376 19.963 L 13.377 19.963 Z" fill-rule="nonzero"/>
		</svg>
	`,
    NextTrack: TrackSkip.replace("REPLACEME", "NextTrack"),
    Shuffle: `
        <svg viewBox="0 0 25 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M 19.857 19.948 C 20.135 19.94 20.403 19.841 20.62 19.663 L 24.632 16.281 C 25.123 15.868 25.123 15.223 24.632 14.797 L 20.62 11.402 C 20.403 11.224 20.135 11.125 19.857 11.117 C 19.212 11.117 18.81 11.518 18.81 12.164 L 18.81 14.1 L 17.003 14.1 C 15.853 14.1 15.144 13.738 14.33 12.782 L 11.956 9.981 L 14.33 7.167 C 15.17 6.186 15.802 5.849 16.939 5.849 L 18.81 5.849 L 18.81 7.838 C 18.81 8.471 19.212 8.871 19.857 8.871 C 20.133 8.868 20.403 8.773 20.62 8.6 L 24.632 5.216 C 25.123 4.803 25.123 4.145 24.632 3.732 L 20.62 0.337 C 20.406 0.154 20.136 0.053 19.857 0.052 C 19.212 0.052 18.81 0.453 18.81 1.087 L 18.81 3.241 L 16.925 3.241 C 15.015 3.241 13.827 3.771 12.472 5.398 L 10.277 7.992 L 7.992 5.269 C 6.738 3.798 5.55 3.241 3.719 3.241 L 1.393 3.241 C 0.569 3.241 0 3.784 0 4.546 C 0 5.308 0.567 5.849 1.393 5.849 L 3.628 5.849 C 4.712 5.849 5.436 6.199 6.249 7.167 L 8.611 9.967 L 6.247 12.782 C 5.423 13.752 4.763 14.1 3.691 14.1 L 1.393 14.1 C 0.569 14.1 0 14.641 0 15.403 C 0 16.165 0.567 16.707 1.393 16.707 L 3.783 16.707 C 5.617 16.707 6.738 16.153 7.992 14.68 L 10.29 11.956 L 12.537 14.629 C 13.815 16.153 15.066 16.707 16.925 16.707 L 18.81 16.707 L 18.81 18.902 C 18.81 19.548 19.212 19.948 19.857 19.948 Z"/>
        </svg>
	`,
    Loop: `
		<svg viewBox="0 0 20 17" xmlns="http://www.w3.org/2000/svg" class="Loop">
			<path d="M 1.148 8.951 C 1.786 8.956 2.307 8.441 2.307 7.803 L 2.307 7.201 C 2.307 5.853 3.255 4.949 4.705 4.949 L 11.426 4.949 L 11.426 6.778 C 11.426 7.325 11.773 7.67 12.33 7.67 C 12.572 7.67 12.806 7.583 12.988 7.424 L 16.454 4.515 C 16.879 4.158 16.879 3.589 16.454 3.233 L 12.988 0.301 C 12.806 0.142 12.572 0.055 12.33 0.055 C 11.773 0.055 11.428 0.402 11.428 0.948 L 11.428 2.686 L 4.872 2.686 C 1.895 2.686 0 4.37 0 7.001 L 0 7.803 C 0 8.44 0.513 8.951 1.148 8.951 L 1.148 8.951 Z M 7.681 16.945 C 8.227 16.945 8.572 16.6 8.572 16.053 L 8.572 14.303 L 15.128 14.303 C 18.116 14.303 20 12.619 20 9.988 L 20 9.186 C 20 8.302 19.043 7.75 18.278 8.192 C 17.922 8.397 17.703 8.776 17.703 9.186 L 17.703 9.788 C 17.703 11.136 16.745 12.04 15.295 12.04 L 8.572 12.04 L 8.572 10.223 C 8.572 9.676 8.227 9.331 7.681 9.331 C 7.436 9.331 7.199 9.417 7.012 9.576 L 3.556 12.497 C 3.121 12.842 3.133 13.41 3.556 13.767 L 7.012 16.711 C 7.202 16.862 7.438 16.944 7.681 16.945 L 7.681 16.945 Z" fill-rule="nonzero"/>
		</svg>
	`,
    LoopTrack: `
		<svg viewBox="0 0 20 17" xmlns="http://www.w3.org/2000/svg" class="LoopTrack">
			<path d="M 18.885 6.353 C 19.52 6.353 19.888 6.008 19.888 5.318 L 19.888 1.236 C 19.888 0.511 19.409 0.022 18.696 0.022 C 18.105 0.022 17.758 0.21 17.302 0.556 L 16.176 1.437 C 15.907 1.639 15.819 1.839 15.819 2.073 C 15.819 2.418 16.074 2.697 16.488 2.697 C 16.666 2.697 16.81 2.641 16.956 2.529 L 17.781 1.839 L 17.859 1.839 L 17.859 5.318 C 17.859 6.008 18.227 6.353 18.885 6.353 L 18.885 6.353 Z M 1.147 8.986 C 1.791 9.003 2.319 8.48 2.306 7.836 L 2.306 7.234 C 2.306 5.886 3.254 4.982 4.703 4.982 L 9.274 4.982 L 9.274 6.811 C 9.274 7.358 9.62 7.703 10.178 7.703 C 10.42 7.703 10.653 7.616 10.836 7.457 L 14.302 4.548 C 14.727 4.191 14.727 3.621 14.302 3.265 L 10.837 0.333 C 10.655 0.175 10.421 0.087 10.179 0.088 C 9.622 0.088 9.275 0.434 9.275 0.981 L 9.275 2.719 L 4.873 2.719 C 1.895 2.719 0 4.403 0 7.034 L 0 7.836 C 0 8.494 0.502 8.984 1.148 8.984 L 1.147 8.986 Z M 7.68 16.978 C 8.226 16.978 8.572 16.633 8.572 16.086 L 8.572 14.336 L 15.127 14.336 C 18.115 14.336 20 12.652 20 10.021 L 20 9.219 C 20.013 8.58 19.491 8.058 18.851 8.071 C 18.21 8.054 17.686 8.578 17.703 9.219 L 17.703 9.821 C 17.703 11.169 16.744 12.073 15.295 12.073 L 8.572 12.073 L 8.572 10.256 C 8.572 9.709 8.226 9.364 7.68 9.364 C 7.435 9.364 7.198 9.45 7.011 9.609 L 3.555 12.53 C 3.12 12.875 3.132 13.443 3.555 13.8 L 7.011 16.744 C 7.201 16.895 7.437 16.977 7.68 16.978 L 7.68 16.978 Z" fill-rule="nonzero" transform="matrix(1, 0, 0, 1, 0, -8.881784197001252e-16)"/>
		</svg>
	`
  };

  // node_modules/lodash-es/_freeGlobal.js
  var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
  var freeGlobal_default = freeGlobal;

  // node_modules/lodash-es/_root.js
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root = freeGlobal_default || freeSelf || Function("return this")();
  var root_default = root;

  // node_modules/lodash-es/_Symbol.js
  var Symbol2 = root_default.Symbol;
  var Symbol_default = Symbol2;

  // node_modules/lodash-es/_getRawTag.js
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  var nativeObjectToString = objectProto.toString;
  var symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
    try {
      value[symToStringTag] = void 0;
      var unmasked = true;
    } catch (e) {
    }
    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  var getRawTag_default = getRawTag;

  // node_modules/lodash-es/_objectToString.js
  var objectProto2 = Object.prototype;
  var nativeObjectToString2 = objectProto2.toString;
  function objectToString(value) {
    return nativeObjectToString2.call(value);
  }
  var objectToString_default = objectToString;

  // node_modules/lodash-es/_baseGetTag.js
  var nullTag = "[object Null]";
  var undefinedTag = "[object Undefined]";
  var symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
  function baseGetTag(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
  }
  var baseGetTag_default = baseGetTag;

  // node_modules/lodash-es/isObjectLike.js
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  var isObjectLike_default = isObjectLike;

  // node_modules/lodash-es/isSymbol.js
  var symbolTag = "[object Symbol]";
  function isSymbol(value) {
    return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
  }
  var isSymbol_default = isSymbol;

  // node_modules/lodash-es/_trimmedEndIndex.js
  var reWhitespace = /\s/;
  function trimmedEndIndex(string) {
    var index = string.length;
    while (index-- && reWhitespace.test(string.charAt(index))) {
    }
    return index;
  }
  var trimmedEndIndex_default = trimmedEndIndex;

  // node_modules/lodash-es/_baseTrim.js
  var reTrimStart = /^\s+/;
  function baseTrim(string) {
    return string ? string.slice(0, trimmedEndIndex_default(string) + 1).replace(reTrimStart, "") : string;
  }
  var baseTrim_default = baseTrim;

  // node_modules/lodash-es/isObject.js
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }
  var isObject_default = isObject;

  // node_modules/lodash-es/toNumber.js
  var NAN = 0 / 0;
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
  var reIsBinary = /^0b[01]+$/i;
  var reIsOctal = /^0o[0-7]+$/i;
  var freeParseInt = parseInt;
  function toNumber(value) {
    if (typeof value == "number") {
      return value;
    }
    if (isSymbol_default(value)) {
      return NAN;
    }
    if (isObject_default(value)) {
      var other = typeof value.valueOf == "function" ? value.valueOf() : value;
      value = isObject_default(other) ? other + "" : other;
    }
    if (typeof value != "string") {
      return value === 0 ? value : +value;
    }
    value = baseTrim_default(value);
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
  }
  var toNumber_default = toNumber;

  // node_modules/lodash-es/now.js
  var now = function() {
    return root_default.Date.now();
  };
  var now_default = now;

  // node_modules/lodash-es/debounce.js
  var FUNC_ERROR_TEXT = "Expected a function";
  var nativeMax = Math.max;
  var nativeMin = Math.min;
  function debounce(func, wait, options) {
    var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
    if (typeof func != "function") {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = toNumber_default(wait) || 0;
    if (isObject_default(options)) {
      leading = !!options.leading;
      maxing = "maxWait" in options;
      maxWait = maxing ? nativeMax(toNumber_default(options.maxWait) || 0, wait) : maxWait;
      trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    function invokeFunc(time) {
      var args = lastArgs, thisArg = lastThis;
      lastArgs = lastThis = void 0;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }
    function leadingEdge(time) {
      lastInvokeTime = time;
      timerId = setTimeout(timerExpired, wait);
      return leading ? invokeFunc(time) : result;
    }
    function remainingWait(time) {
      var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
      return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
    }
    function shouldInvoke(time) {
      var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
      return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
    }
    function timerExpired() {
      var time = now_default();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      timerId = setTimeout(timerExpired, remainingWait(time));
    }
    function trailingEdge(time) {
      timerId = void 0;
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = void 0;
      return result;
    }
    function cancel() {
      if (timerId !== void 0) {
        clearTimeout(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = void 0;
    }
    function flush() {
      return timerId === void 0 ? result : trailingEdge(now_default());
    }
    function debounced() {
      var time = now_default(), isInvoking = shouldInvoke(time);
      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;
      if (isInvoking) {
        if (timerId === void 0) {
          return leadingEdge(lastCallTime);
        }
        if (maxing) {
          clearTimeout(timerId);
          timerId = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === void 0) {
        timerId = setTimeout(timerExpired, wait);
      }
      return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }
  var debounce_default = debounce;

  // node_modules/lodash-es/throttle.js
  var FUNC_ERROR_TEXT2 = "Expected a function";
  function throttle(func, wait, options) {
    var leading = true, trailing = true;
    if (typeof func != "function") {
      throw new TypeError(FUNC_ERROR_TEXT2);
    }
    if (isObject_default(options)) {
      leading = "leading" in options ? !!options.leading : leading;
      trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    return debounce_default(func, wait, {
      "leading": leading,
      "maxWait": wait,
      "trailing": trailing
    });
  }
  var throttle_default = throttle;

  // node_modules/simplebar-core/dist/index.mjs
  var __assign = function() {
    __assign = Object.assign || function __assign2(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  function getElementWindow$1(element) {
    if (!element || !element.ownerDocument || !element.ownerDocument.defaultView) {
      return window;
    }
    return element.ownerDocument.defaultView;
  }
  function getElementDocument$1(element) {
    if (!element || !element.ownerDocument) {
      return document;
    }
    return element.ownerDocument;
  }
  var getOptions$1 = function(obj) {
    var initialObj = {};
    var options = Array.prototype.reduce.call(obj, function(acc, attribute) {
      var option = attribute.name.match(/data-simplebar-(.+)/);
      if (option) {
        var key = option[1].replace(/\W+(.)/g, function(_, chr) {
          return chr.toUpperCase();
        });
        switch (attribute.value) {
          case "true":
            acc[key] = true;
            break;
          case "false":
            acc[key] = false;
            break;
          case void 0:
            acc[key] = true;
            break;
          default:
            acc[key] = attribute.value;
        }
      }
      return acc;
    }, initialObj);
    return options;
  };
  function addClasses$1(el, classes) {
    var _a2;
    if (!el)
      return;
    (_a2 = el.classList).add.apply(_a2, classes.split(" "));
  }
  function removeClasses$1(el, classes) {
    if (!el)
      return;
    classes.split(" ").forEach(function(className) {
      el.classList.remove(className);
    });
  }
  function classNamesToQuery$1(classNames) {
    return ".".concat(classNames.split(" ").join("."));
  }
  var canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);
  var helpers = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    addClasses: addClasses$1,
    canUseDOM,
    classNamesToQuery: classNamesToQuery$1,
    getElementDocument: getElementDocument$1,
    getElementWindow: getElementWindow$1,
    getOptions: getOptions$1,
    removeClasses: removeClasses$1
  });
  var cachedScrollbarWidth = null;
  var cachedDevicePixelRatio = null;
  if (canUseDOM) {
    window.addEventListener("resize", function() {
      if (cachedDevicePixelRatio !== window.devicePixelRatio) {
        cachedDevicePixelRatio = window.devicePixelRatio;
        cachedScrollbarWidth = null;
      }
    });
  }
  function scrollbarWidth() {
    if (cachedScrollbarWidth === null) {
      if (typeof document === "undefined") {
        cachedScrollbarWidth = 0;
        return cachedScrollbarWidth;
      }
      var body = document.body;
      var box = document.createElement("div");
      box.classList.add("simplebar-hide-scrollbar");
      body.appendChild(box);
      var width = box.getBoundingClientRect().right;
      body.removeChild(box);
      cachedScrollbarWidth = width;
    }
    return cachedScrollbarWidth;
  }
  var getElementWindow = getElementWindow$1;
  var getElementDocument = getElementDocument$1;
  var getOptions = getOptions$1;
  var addClasses = addClasses$1;
  var removeClasses = removeClasses$1;
  var classNamesToQuery = classNamesToQuery$1;
  var SimpleBarCore = function() {
    function SimpleBarCore2(element, options) {
      if (options === void 0) {
        options = {};
      }
      var _this = this;
      this.removePreventClickId = null;
      this.minScrollbarWidth = 20;
      this.stopScrollDelay = 175;
      this.isScrolling = false;
      this.isMouseEntering = false;
      this.isDragging = false;
      this.scrollXTicking = false;
      this.scrollYTicking = false;
      this.wrapperEl = null;
      this.contentWrapperEl = null;
      this.contentEl = null;
      this.offsetEl = null;
      this.maskEl = null;
      this.placeholderEl = null;
      this.heightAutoObserverWrapperEl = null;
      this.heightAutoObserverEl = null;
      this.rtlHelpers = null;
      this.scrollbarWidth = 0;
      this.resizeObserver = null;
      this.mutationObserver = null;
      this.elStyles = null;
      this.isRtl = null;
      this.mouseX = 0;
      this.mouseY = 0;
      this.onMouseMove = function() {
      };
      this.onWindowResize = function() {
      };
      this.onStopScrolling = function() {
      };
      this.onMouseEntered = function() {
      };
      this.onScroll = function() {
        var elWindow = getElementWindow(_this.el);
        if (!_this.scrollXTicking) {
          elWindow.requestAnimationFrame(_this.scrollX);
          _this.scrollXTicking = true;
        }
        if (!_this.scrollYTicking) {
          elWindow.requestAnimationFrame(_this.scrollY);
          _this.scrollYTicking = true;
        }
        if (!_this.isScrolling) {
          _this.isScrolling = true;
          addClasses(_this.el, _this.classNames.scrolling);
        }
        _this.showScrollbar("x");
        _this.showScrollbar("y");
        _this.onStopScrolling();
      };
      this.scrollX = function() {
        if (_this.axis.x.isOverflowing) {
          _this.positionScrollbar("x");
        }
        _this.scrollXTicking = false;
      };
      this.scrollY = function() {
        if (_this.axis.y.isOverflowing) {
          _this.positionScrollbar("y");
        }
        _this.scrollYTicking = false;
      };
      this._onStopScrolling = function() {
        removeClasses(_this.el, _this.classNames.scrolling);
        if (_this.options.autoHide) {
          _this.hideScrollbar("x");
          _this.hideScrollbar("y");
        }
        _this.isScrolling = false;
      };
      this.onMouseEnter = function() {
        if (!_this.isMouseEntering) {
          addClasses(_this.el, _this.classNames.mouseEntered);
          _this.showScrollbar("x");
          _this.showScrollbar("y");
          _this.isMouseEntering = true;
        }
        _this.onMouseEntered();
      };
      this._onMouseEntered = function() {
        removeClasses(_this.el, _this.classNames.mouseEntered);
        if (_this.options.autoHide) {
          _this.hideScrollbar("x");
          _this.hideScrollbar("y");
        }
        _this.isMouseEntering = false;
      };
      this._onMouseMove = function(e) {
        _this.mouseX = e.clientX;
        _this.mouseY = e.clientY;
        if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
          _this.onMouseMoveForAxis("x");
        }
        if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
          _this.onMouseMoveForAxis("y");
        }
      };
      this.onMouseLeave = function() {
        _this.onMouseMove.cancel();
        if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
          _this.onMouseLeaveForAxis("x");
        }
        if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
          _this.onMouseLeaveForAxis("y");
        }
        _this.mouseX = -1;
        _this.mouseY = -1;
      };
      this._onWindowResize = function() {
        _this.scrollbarWidth = _this.getScrollbarWidth();
        _this.hideNativeScrollbar();
      };
      this.onPointerEvent = function(e) {
        if (!_this.axis.x.track.el || !_this.axis.y.track.el || !_this.axis.x.scrollbar.el || !_this.axis.y.scrollbar.el)
          return;
        var isWithinTrackXBounds, isWithinTrackYBounds;
        _this.axis.x.track.rect = _this.axis.x.track.el.getBoundingClientRect();
        _this.axis.y.track.rect = _this.axis.y.track.el.getBoundingClientRect();
        if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
          isWithinTrackXBounds = _this.isWithinBounds(_this.axis.x.track.rect);
        }
        if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
          isWithinTrackYBounds = _this.isWithinBounds(_this.axis.y.track.rect);
        }
        if (isWithinTrackXBounds || isWithinTrackYBounds) {
          e.stopPropagation();
          if (e.type === "pointerdown" && e.pointerType !== "touch") {
            if (isWithinTrackXBounds) {
              _this.axis.x.scrollbar.rect = _this.axis.x.scrollbar.el.getBoundingClientRect();
              if (_this.isWithinBounds(_this.axis.x.scrollbar.rect)) {
                _this.onDragStart(e, "x");
              } else {
                _this.onTrackClick(e, "x");
              }
            }
            if (isWithinTrackYBounds) {
              _this.axis.y.scrollbar.rect = _this.axis.y.scrollbar.el.getBoundingClientRect();
              if (_this.isWithinBounds(_this.axis.y.scrollbar.rect)) {
                _this.onDragStart(e, "y");
              } else {
                _this.onTrackClick(e, "y");
              }
            }
          }
        }
      };
      this.drag = function(e) {
        var _a2, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (!_this.draggedAxis || !_this.contentWrapperEl)
          return;
        var eventOffset;
        var track = _this.axis[_this.draggedAxis].track;
        var trackSize = (_b = (_a2 = track.rect) === null || _a2 === void 0 ? void 0 : _a2[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _b !== void 0 ? _b : 0;
        var scrollbar = _this.axis[_this.draggedAxis].scrollbar;
        var contentSize = (_d = (_c = _this.contentWrapperEl) === null || _c === void 0 ? void 0 : _c[_this.axis[_this.draggedAxis].scrollSizeAttr]) !== null && _d !== void 0 ? _d : 0;
        var hostSize = parseInt((_f = (_e = _this.elStyles) === null || _e === void 0 ? void 0 : _e[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _f !== void 0 ? _f : "0px", 10);
        e.preventDefault();
        e.stopPropagation();
        if (_this.draggedAxis === "y") {
          eventOffset = e.pageY;
        } else {
          eventOffset = e.pageX;
        }
        var dragPos = eventOffset - ((_h = (_g = track.rect) === null || _g === void 0 ? void 0 : _g[_this.axis[_this.draggedAxis].offsetAttr]) !== null && _h !== void 0 ? _h : 0) - _this.axis[_this.draggedAxis].dragOffset;
        dragPos = _this.draggedAxis === "x" && _this.isRtl ? ((_k = (_j = track.rect) === null || _j === void 0 ? void 0 : _j[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _k !== void 0 ? _k : 0) - scrollbar.size - dragPos : dragPos;
        var dragPerc = dragPos / (trackSize - scrollbar.size);
        var scrollPos = dragPerc * (contentSize - hostSize);
        if (_this.draggedAxis === "x" && _this.isRtl) {
          scrollPos = ((_l = SimpleBarCore2.getRtlHelpers()) === null || _l === void 0 ? void 0 : _l.isScrollingToNegative) ? -scrollPos : scrollPos;
        }
        _this.contentWrapperEl[_this.axis[_this.draggedAxis].scrollOffsetAttr] = scrollPos;
      };
      this.onEndDrag = function(e) {
        _this.isDragging = false;
        var elDocument = getElementDocument(_this.el);
        var elWindow = getElementWindow(_this.el);
        e.preventDefault();
        e.stopPropagation();
        removeClasses(_this.el, _this.classNames.dragging);
        _this.onStopScrolling();
        elDocument.removeEventListener("mousemove", _this.drag, true);
        elDocument.removeEventListener("mouseup", _this.onEndDrag, true);
        _this.removePreventClickId = elWindow.setTimeout(function() {
          elDocument.removeEventListener("click", _this.preventClick, true);
          elDocument.removeEventListener("dblclick", _this.preventClick, true);
          _this.removePreventClickId = null;
        });
      };
      this.preventClick = function(e) {
        e.preventDefault();
        e.stopPropagation();
      };
      this.el = element;
      this.options = __assign(__assign({}, SimpleBarCore2.defaultOptions), options);
      this.classNames = __assign(__assign({}, SimpleBarCore2.defaultOptions.classNames), options.classNames);
      this.axis = {
        x: {
          scrollOffsetAttr: "scrollLeft",
          sizeAttr: "width",
          scrollSizeAttr: "scrollWidth",
          offsetSizeAttr: "offsetWidth",
          offsetAttr: "left",
          overflowAttr: "overflowX",
          dragOffset: 0,
          isOverflowing: true,
          forceVisible: false,
          track: { size: null, el: null, rect: null, isVisible: false },
          scrollbar: { size: null, el: null, rect: null, isVisible: false }
        },
        y: {
          scrollOffsetAttr: "scrollTop",
          sizeAttr: "height",
          scrollSizeAttr: "scrollHeight",
          offsetSizeAttr: "offsetHeight",
          offsetAttr: "top",
          overflowAttr: "overflowY",
          dragOffset: 0,
          isOverflowing: true,
          forceVisible: false,
          track: { size: null, el: null, rect: null, isVisible: false },
          scrollbar: { size: null, el: null, rect: null, isVisible: false }
        }
      };
      if (typeof this.el !== "object" || !this.el.nodeName) {
        throw new Error("Argument passed to SimpleBar must be an HTML element instead of ".concat(this.el));
      }
      this.onMouseMove = throttle_default(this._onMouseMove, 64);
      this.onWindowResize = debounce_default(this._onWindowResize, 64, { leading: true });
      this.onStopScrolling = debounce_default(this._onStopScrolling, this.stopScrollDelay);
      this.onMouseEntered = debounce_default(this._onMouseEntered, this.stopScrollDelay);
      this.init();
    }
    SimpleBarCore2.getRtlHelpers = function() {
      if (SimpleBarCore2.rtlHelpers) {
        return SimpleBarCore2.rtlHelpers;
      }
      var dummyDiv = document.createElement("div");
      dummyDiv.innerHTML = '<div class="simplebar-dummy-scrollbar-size"><div></div></div>';
      var scrollbarDummyEl = dummyDiv.firstElementChild;
      var dummyChild = scrollbarDummyEl === null || scrollbarDummyEl === void 0 ? void 0 : scrollbarDummyEl.firstElementChild;
      if (!dummyChild)
        return null;
      document.body.appendChild(scrollbarDummyEl);
      scrollbarDummyEl.scrollLeft = 0;
      var dummyContainerOffset = SimpleBarCore2.getOffset(scrollbarDummyEl);
      var dummyChildOffset = SimpleBarCore2.getOffset(dummyChild);
      scrollbarDummyEl.scrollLeft = -999;
      var dummyChildOffsetAfterScroll = SimpleBarCore2.getOffset(dummyChild);
      document.body.removeChild(scrollbarDummyEl);
      SimpleBarCore2.rtlHelpers = {
        isScrollOriginAtZero: dummyContainerOffset.left !== dummyChildOffset.left,
        isScrollingToNegative: dummyChildOffset.left !== dummyChildOffsetAfterScroll.left
      };
      return SimpleBarCore2.rtlHelpers;
    };
    SimpleBarCore2.prototype.getScrollbarWidth = function() {
      try {
        if (this.contentWrapperEl && getComputedStyle(this.contentWrapperEl, "::-webkit-scrollbar").display === "none" || "scrollbarWidth" in document.documentElement.style || "-ms-overflow-style" in document.documentElement.style) {
          return 0;
        } else {
          return scrollbarWidth();
        }
      } catch (e) {
        return scrollbarWidth();
      }
    };
    SimpleBarCore2.getOffset = function(el) {
      var rect = el.getBoundingClientRect();
      var elDocument = getElementDocument(el);
      var elWindow = getElementWindow(el);
      return {
        top: rect.top + (elWindow.pageYOffset || elDocument.documentElement.scrollTop),
        left: rect.left + (elWindow.pageXOffset || elDocument.documentElement.scrollLeft)
      };
    };
    SimpleBarCore2.prototype.init = function() {
      if (canUseDOM) {
        this.initDOM();
        this.rtlHelpers = SimpleBarCore2.getRtlHelpers();
        this.scrollbarWidth = this.getScrollbarWidth();
        this.recalculate();
        this.initListeners();
      }
    };
    SimpleBarCore2.prototype.initDOM = function() {
      var _a2, _b;
      this.wrapperEl = this.el.querySelector(classNamesToQuery(this.classNames.wrapper));
      this.contentWrapperEl = this.options.scrollableNode || this.el.querySelector(classNamesToQuery(this.classNames.contentWrapper));
      this.contentEl = this.options.contentNode || this.el.querySelector(classNamesToQuery(this.classNames.contentEl));
      this.offsetEl = this.el.querySelector(classNamesToQuery(this.classNames.offset));
      this.maskEl = this.el.querySelector(classNamesToQuery(this.classNames.mask));
      this.placeholderEl = this.findChild(this.wrapperEl, classNamesToQuery(this.classNames.placeholder));
      this.heightAutoObserverWrapperEl = this.el.querySelector(classNamesToQuery(this.classNames.heightAutoObserverWrapperEl));
      this.heightAutoObserverEl = this.el.querySelector(classNamesToQuery(this.classNames.heightAutoObserverEl));
      this.axis.x.track.el = this.findChild(this.el, "".concat(classNamesToQuery(this.classNames.track)).concat(classNamesToQuery(this.classNames.horizontal)));
      this.axis.y.track.el = this.findChild(this.el, "".concat(classNamesToQuery(this.classNames.track)).concat(classNamesToQuery(this.classNames.vertical)));
      this.axis.x.scrollbar.el = ((_a2 = this.axis.x.track.el) === null || _a2 === void 0 ? void 0 : _a2.querySelector(classNamesToQuery(this.classNames.scrollbar))) || null;
      this.axis.y.scrollbar.el = ((_b = this.axis.y.track.el) === null || _b === void 0 ? void 0 : _b.querySelector(classNamesToQuery(this.classNames.scrollbar))) || null;
      if (!this.options.autoHide) {
        addClasses(this.axis.x.scrollbar.el, this.classNames.visible);
        addClasses(this.axis.y.scrollbar.el, this.classNames.visible);
      }
    };
    SimpleBarCore2.prototype.initListeners = function() {
      var _this = this;
      var _a2;
      var elWindow = getElementWindow(this.el);
      this.el.addEventListener("mouseenter", this.onMouseEnter);
      this.el.addEventListener("pointerdown", this.onPointerEvent, true);
      this.el.addEventListener("mousemove", this.onMouseMove);
      this.el.addEventListener("mouseleave", this.onMouseLeave);
      (_a2 = this.contentWrapperEl) === null || _a2 === void 0 ? void 0 : _a2.addEventListener("scroll", this.onScroll);
      elWindow.addEventListener("resize", this.onWindowResize);
      if (!this.contentEl)
        return;
      if (window.ResizeObserver) {
        var resizeObserverStarted_1 = false;
        var resizeObserver = elWindow.ResizeObserver || ResizeObserver;
        this.resizeObserver = new resizeObserver(function() {
          if (!resizeObserverStarted_1)
            return;
          elWindow.requestAnimationFrame(function() {
            _this.recalculate();
          });
        });
        this.resizeObserver.observe(this.el);
        this.resizeObserver.observe(this.contentEl);
        elWindow.requestAnimationFrame(function() {
          resizeObserverStarted_1 = true;
        });
      }
      this.mutationObserver = new elWindow.MutationObserver(function() {
        elWindow.requestAnimationFrame(function() {
          _this.recalculate();
        });
      });
      this.mutationObserver.observe(this.contentEl, {
        childList: true,
        subtree: true,
        characterData: true
      });
    };
    SimpleBarCore2.prototype.recalculate = function() {
      if (!this.heightAutoObserverEl || !this.contentEl || !this.contentWrapperEl || !this.wrapperEl || !this.placeholderEl)
        return;
      var elWindow = getElementWindow(this.el);
      this.elStyles = elWindow.getComputedStyle(this.el);
      this.isRtl = this.elStyles.direction === "rtl";
      var contentElOffsetWidth = this.contentEl.offsetWidth;
      var isHeightAuto = this.heightAutoObserverEl.offsetHeight <= 1;
      var isWidthAuto = this.heightAutoObserverEl.offsetWidth <= 1 || contentElOffsetWidth > 0;
      var contentWrapperElOffsetWidth = this.contentWrapperEl.offsetWidth;
      var elOverflowX = this.elStyles.overflowX;
      var elOverflowY = this.elStyles.overflowY;
      this.contentEl.style.padding = "".concat(this.elStyles.paddingTop, " ").concat(this.elStyles.paddingRight, " ").concat(this.elStyles.paddingBottom, " ").concat(this.elStyles.paddingLeft);
      this.wrapperEl.style.margin = "-".concat(this.elStyles.paddingTop, " -").concat(this.elStyles.paddingRight, " -").concat(this.elStyles.paddingBottom, " -").concat(this.elStyles.paddingLeft);
      var contentElScrollHeight = this.contentEl.scrollHeight;
      var contentElScrollWidth = this.contentEl.scrollWidth;
      this.contentWrapperEl.style.height = isHeightAuto ? "auto" : "100%";
      this.placeholderEl.style.width = isWidthAuto ? "".concat(contentElOffsetWidth || contentElScrollWidth, "px") : "auto";
      this.placeholderEl.style.height = "".concat(contentElScrollHeight, "px");
      var contentWrapperElOffsetHeight = this.contentWrapperEl.offsetHeight;
      this.axis.x.isOverflowing = contentElOffsetWidth !== 0 && contentElScrollWidth > contentElOffsetWidth;
      this.axis.y.isOverflowing = contentElScrollHeight > contentWrapperElOffsetHeight;
      this.axis.x.isOverflowing = elOverflowX === "hidden" ? false : this.axis.x.isOverflowing;
      this.axis.y.isOverflowing = elOverflowY === "hidden" ? false : this.axis.y.isOverflowing;
      this.axis.x.forceVisible = this.options.forceVisible === "x" || this.options.forceVisible === true;
      this.axis.y.forceVisible = this.options.forceVisible === "y" || this.options.forceVisible === true;
      this.hideNativeScrollbar();
      var offsetForXScrollbar = this.axis.x.isOverflowing ? this.scrollbarWidth : 0;
      var offsetForYScrollbar = this.axis.y.isOverflowing ? this.scrollbarWidth : 0;
      this.axis.x.isOverflowing = this.axis.x.isOverflowing && contentElScrollWidth > contentWrapperElOffsetWidth - offsetForYScrollbar;
      this.axis.y.isOverflowing = this.axis.y.isOverflowing && contentElScrollHeight > contentWrapperElOffsetHeight - offsetForXScrollbar;
      this.axis.x.scrollbar.size = this.getScrollbarSize("x");
      this.axis.y.scrollbar.size = this.getScrollbarSize("y");
      if (this.axis.x.scrollbar.el)
        this.axis.x.scrollbar.el.style.width = "".concat(this.axis.x.scrollbar.size, "px");
      if (this.axis.y.scrollbar.el)
        this.axis.y.scrollbar.el.style.height = "".concat(this.axis.y.scrollbar.size, "px");
      this.positionScrollbar("x");
      this.positionScrollbar("y");
      this.toggleTrackVisibility("x");
      this.toggleTrackVisibility("y");
    };
    SimpleBarCore2.prototype.getScrollbarSize = function(axis) {
      var _a2, _b;
      if (axis === void 0) {
        axis = "y";
      }
      if (!this.axis[axis].isOverflowing || !this.contentEl) {
        return 0;
      }
      var contentSize = this.contentEl[this.axis[axis].scrollSizeAttr];
      var trackSize = (_b = (_a2 = this.axis[axis].track.el) === null || _a2 === void 0 ? void 0 : _a2[this.axis[axis].offsetSizeAttr]) !== null && _b !== void 0 ? _b : 0;
      var scrollbarRatio = trackSize / contentSize;
      var scrollbarSize;
      scrollbarSize = Math.max(~~(scrollbarRatio * trackSize), this.options.scrollbarMinSize);
      if (this.options.scrollbarMaxSize) {
        scrollbarSize = Math.min(scrollbarSize, this.options.scrollbarMaxSize);
      }
      return scrollbarSize;
    };
    SimpleBarCore2.prototype.positionScrollbar = function(axis) {
      var _a2, _b, _c;
      if (axis === void 0) {
        axis = "y";
      }
      var scrollbar = this.axis[axis].scrollbar;
      if (!this.axis[axis].isOverflowing || !this.contentWrapperEl || !scrollbar.el || !this.elStyles) {
        return;
      }
      var contentSize = this.contentWrapperEl[this.axis[axis].scrollSizeAttr];
      var trackSize = ((_a2 = this.axis[axis].track.el) === null || _a2 === void 0 ? void 0 : _a2[this.axis[axis].offsetSizeAttr]) || 0;
      var hostSize = parseInt(this.elStyles[this.axis[axis].sizeAttr], 10);
      var scrollOffset = this.contentWrapperEl[this.axis[axis].scrollOffsetAttr];
      scrollOffset = axis === "x" && this.isRtl && ((_b = SimpleBarCore2.getRtlHelpers()) === null || _b === void 0 ? void 0 : _b.isScrollOriginAtZero) ? -scrollOffset : scrollOffset;
      if (axis === "x" && this.isRtl) {
        scrollOffset = ((_c = SimpleBarCore2.getRtlHelpers()) === null || _c === void 0 ? void 0 : _c.isScrollingToNegative) ? scrollOffset : -scrollOffset;
      }
      var scrollPourcent = scrollOffset / (contentSize - hostSize);
      var handleOffset = ~~((trackSize - scrollbar.size) * scrollPourcent);
      handleOffset = axis === "x" && this.isRtl ? -handleOffset + (trackSize - scrollbar.size) : handleOffset;
      scrollbar.el.style.transform = axis === "x" ? "translate3d(".concat(handleOffset, "px, 0, 0)") : "translate3d(0, ".concat(handleOffset, "px, 0)");
    };
    SimpleBarCore2.prototype.toggleTrackVisibility = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      var track = this.axis[axis].track.el;
      var scrollbar = this.axis[axis].scrollbar.el;
      if (!track || !scrollbar || !this.contentWrapperEl)
        return;
      if (this.axis[axis].isOverflowing || this.axis[axis].forceVisible) {
        track.style.visibility = "visible";
        this.contentWrapperEl.style[this.axis[axis].overflowAttr] = "scroll";
        this.el.classList.add("".concat(this.classNames.scrollable, "-").concat(axis));
      } else {
        track.style.visibility = "hidden";
        this.contentWrapperEl.style[this.axis[axis].overflowAttr] = "hidden";
        this.el.classList.remove("".concat(this.classNames.scrollable, "-").concat(axis));
      }
      if (this.axis[axis].isOverflowing) {
        scrollbar.style.display = "block";
      } else {
        scrollbar.style.display = "none";
      }
    };
    SimpleBarCore2.prototype.showScrollbar = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      if (this.axis[axis].isOverflowing && !this.axis[axis].scrollbar.isVisible) {
        addClasses(this.axis[axis].scrollbar.el, this.classNames.visible);
        this.axis[axis].scrollbar.isVisible = true;
      }
    };
    SimpleBarCore2.prototype.hideScrollbar = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      if (this.isDragging)
        return;
      if (this.axis[axis].isOverflowing && this.axis[axis].scrollbar.isVisible) {
        removeClasses(this.axis[axis].scrollbar.el, this.classNames.visible);
        this.axis[axis].scrollbar.isVisible = false;
      }
    };
    SimpleBarCore2.prototype.hideNativeScrollbar = function() {
      if (!this.offsetEl)
        return;
      this.offsetEl.style[this.isRtl ? "left" : "right"] = this.axis.y.isOverflowing || this.axis.y.forceVisible ? "-".concat(this.scrollbarWidth, "px") : "0px";
      this.offsetEl.style.bottom = this.axis.x.isOverflowing || this.axis.x.forceVisible ? "-".concat(this.scrollbarWidth, "px") : "0px";
    };
    SimpleBarCore2.prototype.onMouseMoveForAxis = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      var currentAxis = this.axis[axis];
      if (!currentAxis.track.el || !currentAxis.scrollbar.el)
        return;
      currentAxis.track.rect = currentAxis.track.el.getBoundingClientRect();
      currentAxis.scrollbar.rect = currentAxis.scrollbar.el.getBoundingClientRect();
      if (this.isWithinBounds(currentAxis.track.rect)) {
        this.showScrollbar(axis);
        addClasses(currentAxis.track.el, this.classNames.hover);
        if (this.isWithinBounds(currentAxis.scrollbar.rect)) {
          addClasses(currentAxis.scrollbar.el, this.classNames.hover);
        } else {
          removeClasses(currentAxis.scrollbar.el, this.classNames.hover);
        }
      } else {
        removeClasses(currentAxis.track.el, this.classNames.hover);
        if (this.options.autoHide) {
          this.hideScrollbar(axis);
        }
      }
    };
    SimpleBarCore2.prototype.onMouseLeaveForAxis = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      removeClasses(this.axis[axis].track.el, this.classNames.hover);
      removeClasses(this.axis[axis].scrollbar.el, this.classNames.hover);
      if (this.options.autoHide) {
        this.hideScrollbar(axis);
      }
    };
    SimpleBarCore2.prototype.onDragStart = function(e, axis) {
      var _a2;
      if (axis === void 0) {
        axis = "y";
      }
      this.isDragging = true;
      var elDocument = getElementDocument(this.el);
      var elWindow = getElementWindow(this.el);
      var scrollbar = this.axis[axis].scrollbar;
      var eventOffset = axis === "y" ? e.pageY : e.pageX;
      this.axis[axis].dragOffset = eventOffset - (((_a2 = scrollbar.rect) === null || _a2 === void 0 ? void 0 : _a2[this.axis[axis].offsetAttr]) || 0);
      this.draggedAxis = axis;
      addClasses(this.el, this.classNames.dragging);
      elDocument.addEventListener("mousemove", this.drag, true);
      elDocument.addEventListener("mouseup", this.onEndDrag, true);
      if (this.removePreventClickId === null) {
        elDocument.addEventListener("click", this.preventClick, true);
        elDocument.addEventListener("dblclick", this.preventClick, true);
      } else {
        elWindow.clearTimeout(this.removePreventClickId);
        this.removePreventClickId = null;
      }
    };
    SimpleBarCore2.prototype.onTrackClick = function(e, axis) {
      var _this = this;
      var _a2, _b, _c, _d;
      if (axis === void 0) {
        axis = "y";
      }
      var currentAxis = this.axis[axis];
      if (!this.options.clickOnTrack || !currentAxis.scrollbar.el || !this.contentWrapperEl)
        return;
      e.preventDefault();
      var elWindow = getElementWindow(this.el);
      this.axis[axis].scrollbar.rect = currentAxis.scrollbar.el.getBoundingClientRect();
      var scrollbar = this.axis[axis].scrollbar;
      var scrollbarOffset = (_b = (_a2 = scrollbar.rect) === null || _a2 === void 0 ? void 0 : _a2[this.axis[axis].offsetAttr]) !== null && _b !== void 0 ? _b : 0;
      var hostSize = parseInt((_d = (_c = this.elStyles) === null || _c === void 0 ? void 0 : _c[this.axis[axis].sizeAttr]) !== null && _d !== void 0 ? _d : "0px", 10);
      var scrolled = this.contentWrapperEl[this.axis[axis].scrollOffsetAttr];
      var t = axis === "y" ? this.mouseY - scrollbarOffset : this.mouseX - scrollbarOffset;
      var dir = t < 0 ? -1 : 1;
      var scrollSize = dir === -1 ? scrolled - hostSize : scrolled + hostSize;
      var speed = 40;
      var scrollTo = function() {
        if (!_this.contentWrapperEl)
          return;
        if (dir === -1) {
          if (scrolled > scrollSize) {
            scrolled -= speed;
            _this.contentWrapperEl[_this.axis[axis].scrollOffsetAttr] = scrolled;
            elWindow.requestAnimationFrame(scrollTo);
          }
        } else {
          if (scrolled < scrollSize) {
            scrolled += speed;
            _this.contentWrapperEl[_this.axis[axis].scrollOffsetAttr] = scrolled;
            elWindow.requestAnimationFrame(scrollTo);
          }
        }
      };
      scrollTo();
    };
    SimpleBarCore2.prototype.getContentElement = function() {
      return this.contentEl;
    };
    SimpleBarCore2.prototype.getScrollElement = function() {
      return this.contentWrapperEl;
    };
    SimpleBarCore2.prototype.removeListeners = function() {
      var elWindow = getElementWindow(this.el);
      this.el.removeEventListener("mouseenter", this.onMouseEnter);
      this.el.removeEventListener("pointerdown", this.onPointerEvent, true);
      this.el.removeEventListener("mousemove", this.onMouseMove);
      this.el.removeEventListener("mouseleave", this.onMouseLeave);
      if (this.contentWrapperEl) {
        this.contentWrapperEl.removeEventListener("scroll", this.onScroll);
      }
      elWindow.removeEventListener("resize", this.onWindowResize);
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      this.onMouseMove.cancel();
      this.onWindowResize.cancel();
      this.onStopScrolling.cancel();
      this.onMouseEntered.cancel();
    };
    SimpleBarCore2.prototype.unMount = function() {
      this.removeListeners();
    };
    SimpleBarCore2.prototype.isWithinBounds = function(bbox) {
      return this.mouseX >= bbox.left && this.mouseX <= bbox.left + bbox.width && this.mouseY >= bbox.top && this.mouseY <= bbox.top + bbox.height;
    };
    SimpleBarCore2.prototype.findChild = function(el, query) {
      var matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;
      return Array.prototype.filter.call(el.children, function(child) {
        return matches.call(child, query);
      })[0];
    };
    SimpleBarCore2.rtlHelpers = null;
    SimpleBarCore2.defaultOptions = {
      forceVisible: false,
      clickOnTrack: true,
      scrollbarMinSize: 25,
      scrollbarMaxSize: 0,
      ariaLabel: "scrollable content",
      tabIndex: 0,
      classNames: {
        contentEl: "simplebar-content",
        contentWrapper: "simplebar-content-wrapper",
        offset: "simplebar-offset",
        mask: "simplebar-mask",
        wrapper: "simplebar-wrapper",
        placeholder: "simplebar-placeholder",
        scrollbar: "simplebar-scrollbar",
        track: "simplebar-track",
        heightAutoObserverWrapperEl: "simplebar-height-auto-observer-wrapper",
        heightAutoObserverEl: "simplebar-height-auto-observer",
        visible: "simplebar-visible",
        horizontal: "simplebar-horizontal",
        vertical: "simplebar-vertical",
        hover: "simplebar-hover",
        dragging: "simplebar-dragging",
        scrolling: "simplebar-scrolling",
        scrollable: "simplebar-scrollable",
        mouseEntered: "simplebar-mouse-entered"
      },
      scrollableNode: null,
      contentNode: null,
      autoHide: true
    };
    SimpleBarCore2.getOptions = getOptions;
    SimpleBarCore2.helpers = helpers;
    return SimpleBarCore2;
  }();

  // node_modules/simplebar/dist/index.mjs
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var _a = SimpleBarCore.helpers;
  var getOptions2 = _a.getOptions;
  var addClasses2 = _a.addClasses;
  var canUseDOM2 = _a.canUseDOM;
  var SimpleBar = function(_super) {
    __extends(SimpleBar2, _super);
    function SimpleBar2() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var _this = _super.apply(this, args) || this;
      SimpleBar2.instances.set(args[0], _this);
      return _this;
    }
    SimpleBar2.initDOMLoadedElements = function() {
      document.removeEventListener("DOMContentLoaded", this.initDOMLoadedElements);
      window.removeEventListener("load", this.initDOMLoadedElements);
      Array.prototype.forEach.call(document.querySelectorAll("[data-simplebar]"), function(el) {
        if (el.getAttribute("data-simplebar") !== "init" && !SimpleBar2.instances.has(el))
          new SimpleBar2(el, getOptions2(el.attributes));
      });
    };
    SimpleBar2.removeObserver = function() {
      var _a2;
      (_a2 = SimpleBar2.globalObserver) === null || _a2 === void 0 ? void 0 : _a2.disconnect();
    };
    SimpleBar2.prototype.initDOM = function() {
      var _this = this;
      var _a2, _b, _c;
      if (!Array.prototype.filter.call(this.el.children, function(child) {
        return child.classList.contains(_this.classNames.wrapper);
      }).length) {
        this.wrapperEl = document.createElement("div");
        this.contentWrapperEl = document.createElement("div");
        this.offsetEl = document.createElement("div");
        this.maskEl = document.createElement("div");
        this.contentEl = document.createElement("div");
        this.placeholderEl = document.createElement("div");
        this.heightAutoObserverWrapperEl = document.createElement("div");
        this.heightAutoObserverEl = document.createElement("div");
        addClasses2(this.wrapperEl, this.classNames.wrapper);
        addClasses2(this.contentWrapperEl, this.classNames.contentWrapper);
        addClasses2(this.offsetEl, this.classNames.offset);
        addClasses2(this.maskEl, this.classNames.mask);
        addClasses2(this.contentEl, this.classNames.contentEl);
        addClasses2(this.placeholderEl, this.classNames.placeholder);
        addClasses2(this.heightAutoObserverWrapperEl, this.classNames.heightAutoObserverWrapperEl);
        addClasses2(this.heightAutoObserverEl, this.classNames.heightAutoObserverEl);
        while (this.el.firstChild) {
          this.contentEl.appendChild(this.el.firstChild);
        }
        this.contentWrapperEl.appendChild(this.contentEl);
        this.offsetEl.appendChild(this.contentWrapperEl);
        this.maskEl.appendChild(this.offsetEl);
        this.heightAutoObserverWrapperEl.appendChild(this.heightAutoObserverEl);
        this.wrapperEl.appendChild(this.heightAutoObserverWrapperEl);
        this.wrapperEl.appendChild(this.maskEl);
        this.wrapperEl.appendChild(this.placeholderEl);
        this.el.appendChild(this.wrapperEl);
        (_a2 = this.contentWrapperEl) === null || _a2 === void 0 ? void 0 : _a2.setAttribute("tabindex", this.options.tabIndex.toString());
        (_b = this.contentWrapperEl) === null || _b === void 0 ? void 0 : _b.setAttribute("role", "region");
        (_c = this.contentWrapperEl) === null || _c === void 0 ? void 0 : _c.setAttribute("aria-label", this.options.ariaLabel);
      }
      if (!this.axis.x.track.el || !this.axis.y.track.el) {
        var track = document.createElement("div");
        var scrollbar = document.createElement("div");
        addClasses2(track, this.classNames.track);
        addClasses2(scrollbar, this.classNames.scrollbar);
        track.appendChild(scrollbar);
        this.axis.x.track.el = track.cloneNode(true);
        addClasses2(this.axis.x.track.el, this.classNames.horizontal);
        this.axis.y.track.el = track.cloneNode(true);
        addClasses2(this.axis.y.track.el, this.classNames.vertical);
        this.el.appendChild(this.axis.x.track.el);
        this.el.appendChild(this.axis.y.track.el);
      }
      SimpleBarCore.prototype.initDOM.call(this);
      this.el.setAttribute("data-simplebar", "init");
    };
    SimpleBar2.prototype.unMount = function() {
      SimpleBarCore.prototype.unMount.call(this);
      SimpleBar2.instances["delete"](this.el);
    };
    SimpleBar2.initHtmlApi = function() {
      this.initDOMLoadedElements = this.initDOMLoadedElements.bind(this);
      if (typeof MutationObserver !== "undefined") {
        this.globalObserver = new MutationObserver(SimpleBar2.handleMutations);
        this.globalObserver.observe(document, { childList: true, subtree: true });
      }
      if (document.readyState === "complete" || document.readyState !== "loading" && !document.documentElement.doScroll) {
        window.setTimeout(this.initDOMLoadedElements);
      } else {
        document.addEventListener("DOMContentLoaded", this.initDOMLoadedElements);
        window.addEventListener("load", this.initDOMLoadedElements);
      }
    };
    SimpleBar2.handleMutations = function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(addedNode) {
          if (addedNode.nodeType === 1) {
            if (addedNode.hasAttribute("data-simplebar")) {
              !SimpleBar2.instances.has(addedNode) && document.documentElement.contains(addedNode) && new SimpleBar2(addedNode, getOptions2(addedNode.attributes));
            } else {
              addedNode.querySelectorAll("[data-simplebar]").forEach(function(el) {
                if (el.getAttribute("data-simplebar") !== "init" && !SimpleBar2.instances.has(el) && document.documentElement.contains(el))
                  new SimpleBar2(el, getOptions2(el.attributes));
              });
            }
          }
        });
        mutation.removedNodes.forEach(function(removedNode) {
          var _a2;
          if (removedNode.nodeType === 1) {
            if (removedNode.getAttribute("data-simplebar") === "init") {
              !document.documentElement.contains(removedNode) && ((_a2 = SimpleBar2.instances.get(removedNode)) === null || _a2 === void 0 ? void 0 : _a2.unMount());
            } else {
              Array.prototype.forEach.call(removedNode.querySelectorAll('[data-simplebar="init"]'), function(el) {
                var _a3;
                !document.documentElement.contains(el) && ((_a3 = SimpleBar2.instances.get(el)) === null || _a3 === void 0 ? void 0 : _a3.unMount());
              });
            }
          }
        });
      });
    };
    SimpleBar2.instances = /* @__PURE__ */ new WeakMap();
    return SimpleBar2;
  }(SimpleBarCore);
  if (canUseDOM2) {
    SimpleBar.initHtmlApi();
  }

  // src/utils/Gets/GetElementHeight.ts
  function GetElementHeight(element) {
    const beforeStyles = getComputedStyle(element, "::before");
    const afterStyles = getComputedStyle(element, "::after");
    return element.offsetHeight + beforeStyles.height + afterStyles.height;
  }

  // src/utils/Scrolling/Page/IsHovering.ts
  var IsMouseInLyricsPage = false;
  function LyricsPageMouseEnter() {
    IsMouseInLyricsPage = true;
  }
  function LyricsPageMouseLeave() {
    IsMouseInLyricsPage = false;
  }
  function SetIsMouseInLyricsPage(value) {
    IsMouseInLyricsPage = value;
  }

  // src/utils/Scrolling/Simplebar/ScrollSimplebar.ts
  var ScrollSimplebar;
  var ElementEventQuery = "#SpicyLyricsPage .ContentBox .LyricsContainer";
  function MountScrollSimplebar() {
    const LyricsContainer = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    LyricsContainer.style.height = `${GetElementHeight(LyricsContainer)}px`;
    ScrollSimplebar = new SimpleBar(LyricsContainer, { autoHide: false });
    document.querySelector(ElementEventQuery)?.addEventListener("mouseenter", LyricsPageMouseEnter);
    document.querySelector(ElementEventQuery)?.addEventListener("mouseleave", LyricsPageMouseLeave);
  }
  function ClearScrollSimplebar() {
    ScrollSimplebar?.unMount();
    ScrollSimplebar = null;
    SetIsMouseInLyricsPage(false);
    document.querySelector(ElementEventQuery)?.removeEventListener("mouseenter", LyricsPageMouseEnter);
    document.querySelector(ElementEventQuery)?.removeEventListener("mouseleave", LyricsPageMouseLeave);
  }
  function RecalculateScrollSimplebar() {
    ScrollSimplebar?.recalculate();
  }
  new IntervalManager(Infinity, () => {
    const LyricsContainer = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (!LyricsContainer || !ScrollSimplebar)
      return;
    if (IsMouseInLyricsPage) {
      LyricsContainer.classList.remove("hide-scrollbar");
    } else {
      if (ScrollSimplebar.isDragging) {
        LyricsContainer.classList.remove("hide-scrollbar");
      } else {
        LyricsContainer.classList.add("hide-scrollbar");
      }
    }
  }).Start();

  // src/utils/Addons.ts
  function DeepFreeze(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    const clone = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      clone[key] = DeepFreeze(value);
    });
    return Object.freeze(clone);
  }
  function IsPlaying() {
    const state = Spicetify?.Player?.data?.isPaused;
    return !state;
  }
  function TOP_ApplyLyricsSpacer(Container) {
    const div = document.createElement("div");
    div.classList.add("TopSpacer");
    Container.appendChild(div);
  }
  function BOTTOM_ApplyLyricsSpacer(Container) {
    const div = document.createElement("div");
    div.classList.add("BottomSpacer");
    Container.appendChild(div);
  }
  var ArabicPersianRegex = /[\u0600-\u06FF]/;

  // src/utils/CSS/Styles.ts
  function applyStyles(element, styles) {
    if (element) {
      Object.entries(styles).forEach(([key, value]) => {
        element.style[key] = value;
      });
    } else {
      console.warn("Element not found");
    }
  }
  function removeAllStyles(element) {
    if (element) {
      element.style = null;
    } else {
      console.warn("Element not found");
    }
  }

  // src/utils/Lyrics/Applyer/Credits/ApplyLyricsCredits.ts
  function ApplyLyricsCredits(data) {
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    if (!data?.SongWriters)
      return;
    const CreditsElement = document.createElement("div");
    CreditsElement.classList.add("Credits");
    const SongWriters = data.SongWriters.join(", ");
    CreditsElement.textContent = `Credits: ${SongWriters}`;
    LyricsContainer.appendChild(CreditsElement);
  }

  // src/utils/Lyrics/Applyer/Info/ApplyInfo.ts
  function ApplyInfo(data) {
    const TopBarContainer = document.querySelector(
      "header.main-topBar-container"
    );
    if (!data?.Info || !TopBarContainer)
      return;
    const infoElement = document.createElement("a");
    infoElement.className = "amai-info";
    infoElement.textContent = data.Info;
    infoElement.role = "menuitem";
    infoElement.href = "/preferences";
    infoElement.addEventListener("click", (event) => {
      event.preventDefault();
      Spicetify.Platform.History.push({
        pathname: "/preferences",
        hash: "#amai-settings"
      });
    });
    TopBarContainer.appendChild(infoElement);
    const words = data.Info.split(/\s+/).length;
    const wpm = 200;
    const readingTimeSeconds = words / wpm * 60;
    const duration = readingTimeSeconds * 1e3;
    setTimeout(() => {
      TopBarContainer.removeChild(infoElement);
    }, duration);
  }

  // src/utils/Lyrics/isRtl.ts
  function isRtl(text) {
    if (!text || text.length === 0)
      return false;
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFB4F\uFB50-\uFDFF\uFE70-\uFEFF]/;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[\d\s,.;:?!()[\]{}"'\\/<>@#$%^&*_=+\-]/.test(char)) {
        continue;
      }
      return rtlRegex.test(char);
    }
    return false;
  }
  var isRtl_default = isRtl;

  // src/utils/Lyrics/Applyer/Static.ts
  function ApplyStaticLyrics(data) {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    LyricsContainer.setAttribute("data-lyrics-type", "Static");
    ClearLyricsContentArrays();
    ClearScrollSimplebar();
    TOP_ApplyLyricsSpacer(LyricsContainer);
    data.Lines.forEach((line) => {
      const lineElem = document.createElement("div");
      const JapaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々]/g;
      if (JapaneseRegex.test(line.Text)) {
        if (!data.Info && (!storage_default.get("disable_romaji_toggle_notification") || storage_default.get("disable_romaji_toggle_notification") === "false")) {
          data.Info = "Toggle between Romaji or Furigana in settings. Disable this notification there as well.";
        }
        if (storage_default.get("enable_romaji") === "true") {
          line.Text = line.Text?.replace(
            /(([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)|[(\uFF08]([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)[)\uFF09])(?:{|\uFF5B)([^}\uFF5D]+)(?:}|\uFF5D)/g,
            (match, p1, p2, p3, p4) => {
              const text = p2 || p3;
              return `<ruby>${text}<rt>${p4}</rt></ruby>`;
            }
          );
        } else {
          line.Text = line.Text?.replace(
            /([\u4E00-\u9FFF々]+[\u3040-\u30FF]*){([^\}]+)}/g,
            "<ruby>$1<rt>$2</rt></ruby>"
          );
        }
      } else {
        line.Text = line.Text?.replace(
          /((?:\([0-9\uAC00-\uD7AF\u1100-\u11FF]+\)|[\uAC00-\uD7AF\u1100-\u11FF]+)[?.!,"']?){([^\}]+)}/g,
          '<ruby class="romaja">$1<rt>$2</rt></ruby>'
        );
      }
      if (line.Text?.includes("[DEF=font_size:small]")) {
        lineElem.style.fontSize = "35px";
        lineElem.innerHTML = line.Text.replace("[DEF=font_size:small]", "");
      } else {
        lineElem.innerHTML = line.Text;
      }
      if (isRtl_default(line.Text) && !lineElem.classList.contains("rtl")) {
        lineElem.classList.add("rtl");
      }
      lineElem.classList.add("line");
      lineElem.classList.add("static");
      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn");
      }
      LyricsObject.Types.Static.Lines.push({
        HTMLElement: lineElem
      });
      LyricsContainer.appendChild(lineElem);
    });
    ApplyInfo(data);
    ApplyLyricsCredits(data);
    BOTTOM_ApplyLyricsSpacer(LyricsContainer);
    if (ScrollSimplebar)
      RecalculateScrollSimplebar();
    else
      MountScrollSimplebar();
    const LyricsStylingContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content"
    );
    if (data.offline) {
      LyricsStylingContainer.classList.add("offline");
    }
    removeAllStyles(LyricsStylingContainer);
    if (data.classes) {
      LyricsStylingContainer.className = data.classes;
    }
    if (data.styles) {
      applyStyles(LyricsStylingContainer, data.styles);
    }
  }

  // src/utils/Lyrics/ConvertTime.ts
  function ConvertTime(time) {
    return time * 1e3;
  }

  // src/utils/Lyrics/Applyer/Synced/Line.ts
  function ApplyLineLyrics(data) {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    LyricsContainer.setAttribute("data-lyrics-type", "Line");
    ClearLyricsContentArrays();
    ClearScrollSimplebar();
    TOP_ApplyLyricsSpacer(LyricsContainer);
    if (data.StartTime >= lyricsBetweenShow) {
      const musicalLine = document.createElement("div");
      musicalLine.classList.add("line");
      musicalLine.classList.add("musical-line");
      LyricsObject.Types.Line.Lines.push({
        HTMLElement: musicalLine,
        StartTime: 0,
        EndTime: ConvertTime(data.StartTime),
        TotalTime: ConvertTime(data.StartTime),
        DotLine: true
      });
      SetWordArrayInCurentLine_LINE_SYNCED();
      if (data.Content[0].OppositeAligned) {
        musicalLine.classList.add("OppositeAligned");
      }
      const dotGroup = document.createElement("div");
      dotGroup.classList.add("dotGroup");
      const musicalDots1 = document.createElement("span");
      const musicalDots2 = document.createElement("span");
      const musicalDots3 = document.createElement("span");
      const totalTime = ConvertTime(data.StartTime);
      const dotTime = totalTime / 3;
      musicalDots1.classList.add("word");
      musicalDots1.classList.add("dot");
      musicalDots1.textContent = "\u2022";
      LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots1,
        StartTime: 0,
        EndTime: dotTime,
        TotalTime: dotTime,
        Dot: true
      });
      musicalDots2.classList.add("word");
      musicalDots2.classList.add("dot");
      musicalDots2.textContent = "\u2022";
      LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots2,
        StartTime: dotTime,
        EndTime: dotTime * 2,
        TotalTime: dotTime,
        Dot: true
      });
      musicalDots3.classList.add("word");
      musicalDots3.classList.add("dot");
      musicalDots3.textContent = "\u2022";
      LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots3,
        StartTime: dotTime * 2,
        EndTime: ConvertTime(data.StartTime) - 400,
        TotalTime: dotTime,
        Dot: true
      });
      dotGroup.appendChild(musicalDots1);
      dotGroup.appendChild(musicalDots2);
      dotGroup.appendChild(musicalDots3);
      musicalLine.appendChild(dotGroup);
      LyricsContainer.appendChild(musicalLine);
    }
    data.Content.forEach((line, index, arr) => {
      const lineElem = document.createElement("div");
      const JapaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々]/g;
      if (JapaneseRegex.test(line.Text)) {
        if (!data.Info && (!storage_default.get("disable_romaji_toggle_notification") || storage_default.get("disable_romaji_toggle_notification") === "false")) {
          data.Info = "Toggle between Romaji or Furigana in settings. Disable this notification there as well.";
        }
        if (storage_default.get("enable_romaji") === "true") {
          line.Text = line.Text?.replace(
            /(([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)|[(\uFF08]([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)[)\uFF09])(?:{|\uFF5B)([^}\uFF5D]+)(?:}|\uFF5D)/g,
            (match, p1, p2, p3, p4) => {
              const text = p2 || p3;
              return `<ruby>${text}<rt>${p4}</rt></ruby>`;
            }
          );
        } else {
          line.Text = line.Text?.replace(
            /([\u4E00-\u9FFF々]+[\u3040-\u30FF]*){([^\}]+)}/g,
            "<ruby>$1<rt>$2</rt></ruby>"
          );
        }
      } else {
        line.Text = line.Text?.replace(
          /((?:\([0-9\uAC00-\uD7AF\u1100-\u11FF]+\)|[\uAC00-\uD7AF\u1100-\u11FF]+)[?.!,"']?){([^\}]+)}/g,
          '<ruby class="romaja">$1<rt>$2</rt></ruby>'
        );
      }
      lineElem.innerHTML = line.Text;
      lineElem.classList.add("line");
      if (isRtl_default(line.Text) && !lineElem.classList.contains("rtl")) {
        lineElem.classList.add("rtl");
      }
      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn");
      }
      LyricsObject.Types.Line.Lines.push({
        HTMLElement: lineElem,
        StartTime: ConvertTime(line.StartTime),
        EndTime: ConvertTime(line.EndTime),
        TotalTime: ConvertTime(line.EndTime) - ConvertTime(line.StartTime)
      });
      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned");
      }
      LyricsContainer.appendChild(lineElem);
      if (arr[index + 1] && arr[index + 1].StartTime - line.EndTime >= lyricsBetweenShow) {
        const musicalLine = document.createElement("div");
        musicalLine.classList.add("line");
        musicalLine.classList.add("musical-line");
        LyricsObject.Types.Line.Lines.push({
          HTMLElement: musicalLine,
          StartTime: ConvertTime(line.EndTime),
          EndTime: ConvertTime(arr[index + 1].StartTime),
          TotalTime: ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime),
          DotLine: true
        });
        SetWordArrayInCurentLine_LINE_SYNCED();
        if (arr[index + 1].OppositeAligned) {
          musicalLine.classList.add("OppositeAligned");
        }
        const dotGroup = document.createElement("div");
        dotGroup.classList.add("dotGroup");
        const musicalDots1 = document.createElement("span");
        const musicalDots2 = document.createElement("span");
        const musicalDots3 = document.createElement("span");
        const totalTime = ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime);
        const dotTime = totalTime / 3;
        musicalDots1.classList.add("word");
        musicalDots1.classList.add("dot");
        musicalDots1.textContent = "\u2022";
        LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots1,
          StartTime: ConvertTime(line.EndTime),
          EndTime: ConvertTime(line.EndTime) + dotTime,
          TotalTime: dotTime,
          Dot: true
        });
        musicalDots2.classList.add("word");
        musicalDots2.classList.add("dot");
        musicalDots2.textContent = "\u2022";
        LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots2,
          StartTime: ConvertTime(line.EndTime) + dotTime,
          EndTime: ConvertTime(line.EndTime) + dotTime * 2,
          TotalTime: dotTime,
          Dot: true
        });
        musicalDots3.classList.add("word");
        musicalDots3.classList.add("dot");
        musicalDots3.textContent = "\u2022";
        LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots3,
          StartTime: ConvertTime(line.EndTime) + dotTime * 2,
          EndTime: ConvertTime(arr[index + 1].StartTime) - 400,
          TotalTime: dotTime,
          Dot: true
        });
        dotGroup.appendChild(musicalDots1);
        dotGroup.appendChild(musicalDots2);
        dotGroup.appendChild(musicalDots3);
        musicalLine.appendChild(dotGroup);
        LyricsContainer.appendChild(musicalLine);
      }
    });
    ApplyInfo(data);
    ApplyLyricsCredits(data);
    BOTTOM_ApplyLyricsSpacer(LyricsContainer);
    if (ScrollSimplebar)
      RecalculateScrollSimplebar();
    else
      MountScrollSimplebar();
    const LyricsStylingContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content"
    );
    removeAllStyles(LyricsStylingContainer);
    if (data.classes) {
      LyricsStylingContainer.className = data.classes;
    }
    if (data.styles) {
      applyStyles(LyricsStylingContainer, data.styles);
    }
  }

  // src/utils/Lyrics/Applyer/Utils/IsLetterCapable.ts
  function IsLetterCapable(letterLength, totalDuration) {
    if (letterLength > 12) {
      return false;
    }
    const minDuration = 1500 + (letterLength - 1) / 1 * 25;
    return totalDuration >= minDuration;
  }

  // src/utils/Lyrics/Applyer/Utils/Emphasize.ts
  function Emphasize(letters, applyTo, lead, isBgWord = false) {
    const totalDuration = ConvertTime(lead.EndTime) - ConvertTime(lead.StartTime);
    const letterDuration = totalDuration / letters.length;
    const word = applyTo;
    let Letters = [];
    letters.forEach((letter, index, lA) => {
      const letterElem = document.createElement("span");
      letterElem.textContent = letter;
      letterElem.classList.add("letter");
      letterElem.classList.add("Emphasis");
      const letterStartTime = ConvertTime(lead.StartTime) + index * letterDuration;
      const letterEndTime = letterStartTime + letterDuration;
      const contentDuration = letterDuration > 150 ? letterDuration : 150;
      letterElem.style.setProperty("--content-duration", `${contentDuration}ms`);
      if (index === lA.length - 1) {
        letterElem.classList.add("LastLetterInWord");
      }
      if (ArabicPersianRegex.test(lead.Text)) {
        word.setAttribute("font", "Vazirmatn");
      }
      const mcont2 = isBgWord ? {
        BGLetter: true
      } : {};
      Letters.push({
        HTMLElement: letterElem,
        StartTime: letterStartTime,
        EndTime: letterEndTime,
        TotalTime: letterDuration,
        Emphasis: true,
        ...mcont2
      });
      letterElem.style.setProperty("--gradient-position", `-20%`);
      letterElem.style.setProperty("--text-shadow-opacity", `0%`);
      letterElem.style.setProperty("--text-shadow-blur-radius", `4px`);
      letterElem.style.scale = IdleEmphasisLyricsScale.toString();
      letterElem.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0.02))`;
      word.appendChild(letterElem);
    });
    word.classList.add("letterGroup");
    const mcont = isBgWord ? {
      BGWord: true
    } : {};
    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
      HTMLElement: word,
      StartTime: ConvertTime(lead.StartTime),
      EndTime: ConvertTime(lead.EndTime),
      TotalTime: totalDuration,
      LetterGroup: true,
      Letters,
      ...mcont
    });
    Letters = [];
  }

  // src/utils/Lyrics/Applyer/Synced/Syllable.ts
  function ApplySyllableLyrics(data) {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    LyricsContainer.setAttribute("data-lyrics-type", "Syllable");
    ClearLyricsContentArrays();
    ClearScrollSimplebar();
    TOP_ApplyLyricsSpacer(LyricsContainer);
    if (data.StartTime >= lyricsBetweenShow && !SpotifyPlayer.IsPodcast) {
      const musicalLine = document.createElement("div");
      musicalLine.classList.add("line");
      musicalLine.classList.add("musical-line");
      LyricsObject.Types.Syllable.Lines.push({
        HTMLElement: musicalLine,
        StartTime: 0,
        EndTime: ConvertTime(data.StartTime),
        TotalTime: ConvertTime(data.StartTime),
        DotLine: true
      });
      SetWordArrayInCurentLine();
      if (data.Content[0].OppositeAligned) {
        musicalLine.classList.add("OppositeAligned");
      }
      const dotGroup = document.createElement("div");
      dotGroup.classList.add("dotGroup");
      const musicalDots1 = document.createElement("span");
      const musicalDots2 = document.createElement("span");
      const musicalDots3 = document.createElement("span");
      const totalTime = ConvertTime(data.StartTime);
      const dotTime = totalTime / 3;
      musicalDots1.classList.add("word");
      musicalDots1.classList.add("dot");
      musicalDots1.textContent = "\u2022";
      LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots1,
        StartTime: 0,
        EndTime: dotTime,
        TotalTime: dotTime,
        Dot: true
      });
      musicalDots2.classList.add("word");
      musicalDots2.classList.add("dot");
      musicalDots2.textContent = "\u2022";
      LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots2,
        StartTime: dotTime,
        EndTime: dotTime * 2,
        TotalTime: dotTime,
        Dot: true
      });
      musicalDots3.classList.add("word");
      musicalDots3.classList.add("dot");
      musicalDots3.textContent = "\u2022";
      LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots3,
        StartTime: dotTime * 2,
        EndTime: ConvertTime(data.StartTime) - 400,
        TotalTime: dotTime,
        Dot: true
      });
      dotGroup.appendChild(musicalDots1);
      dotGroup.appendChild(musicalDots2);
      dotGroup.appendChild(musicalDots3);
      musicalLine.appendChild(dotGroup);
      LyricsContainer.appendChild(musicalLine);
    }
    data.Content.forEach((line, index, arr) => {
      const lineElem = document.createElement("div");
      lineElem.classList.add("line");
      LyricsObject.Types.Syllable.Lines.push({
        HTMLElement: lineElem,
        StartTime: ConvertTime(line.Lead.StartTime),
        EndTime: ConvertTime(line.Lead.EndTime),
        TotalTime: ConvertTime(line.Lead.EndTime) - ConvertTime(line.Lead.StartTime)
      });
      SetWordArrayInCurentLine();
      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned");
      }
      LyricsContainer.appendChild(lineElem);
      line.Lead.Syllables.forEach((lead, iL, aL) => {
        let word = document.createElement("span");
        if (isRtl_default(lead.Text) && !lineElem.classList.contains("rtl")) {
          lineElem.classList.add("rtl");
        }
        const totalDuration = ConvertTime(lead.EndTime) - ConvertTime(lead.StartTime);
        const letterLength = lead.Text.split("").length;
        const IfLetterCapable = IsLetterCapable(letterLength, totalDuration) && !SpotifyPlayer.IsPodcast;
        if (IfLetterCapable) {
          word = document.createElement("div");
          const letters = lead.Text.split("");
          Emphasize(letters, word, lead);
          iL === aL.length - 1 ? word.classList.add("LastWordInLine") : lead.IsPartOfWord ? word.classList.add("PartOfWord") : null;
          word.style.setProperty("--text-shadow-opacity", `0%`);
          word.style.setProperty("--text-shadow-blur-radius", `4px`);
          word.style.scale = IdleEmphasisLyricsScale.toString();
          word.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0.02))`;
          const contentDuration = totalDuration > 200 ? totalDuration : 200;
          word.style.setProperty("--content-duration", `${contentDuration}ms`);
          lineElem.appendChild(word);
        } else {
          word.textContent = lead.Text;
          word.style.setProperty("--gradient-position", `-20%`);
          word.style.setProperty("--text-shadow-opacity", `0%`);
          word.style.setProperty("--text-shadow-blur-radius", `4px`);
          word.style.scale = SpotifyPlayer.IsPodcast ? "1" : IdleLyricsScale.toString();
          word.style.transform = SpotifyPlayer.IsPodcast ? null : `translateY(calc(var(--DefaultLyricsSize) * 0.01))`;
          if (ArabicPersianRegex.test(lead.Text)) {
            word.setAttribute("font", "Vazirmatn");
          }
          word.classList.add("word");
          iL === aL.length - 1 ? word.classList.add("LastWordInLine") : lead.IsPartOfWord ? word.classList.add("PartOfWord") : null;
          lineElem.appendChild(word);
          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: word,
            StartTime: ConvertTime(lead.StartTime),
            EndTime: ConvertTime(lead.EndTime),
            TotalTime: totalDuration
          });
        }
      });
      if (line.Background) {
        line.Background.forEach((bg) => {
          const lineE = document.createElement("div");
          lineE.classList.add("line", "bg-line");
          LyricsObject.Types.Syllable.Lines.push({
            HTMLElement: lineE,
            StartTime: ConvertTime(bg.StartTime),
            EndTime: ConvertTime(bg.EndTime),
            TotalTime: ConvertTime(bg.EndTime) - ConvertTime(bg.StartTime),
            BGLine: true
          });
          SetWordArrayInCurentLine();
          if (line.OppositeAligned) {
            lineE.classList.add("OppositeAligned");
          }
          LyricsContainer.appendChild(lineE);
          bg.Syllables.forEach((bw, bI, bA) => {
            let bwE = document.createElement("span");
            if (isRtl_default(bw.Text) && !lineE.classList.contains("rtl")) {
              lineE.classList.add("rtl");
            }
            const totalDuration = ConvertTime(bw.EndTime) - ConvertTime(bw.StartTime);
            const letterLength = bw.Text.split("").length;
            const IfLetterCapable = IsLetterCapable(letterLength, totalDuration);
            if (IfLetterCapable) {
              bwE = document.createElement("div");
              const letters = bw.Text.split("");
              Emphasize(letters, bwE, bw, true);
              bI === bA.length - 1 ? bwE.classList.add("LastWordInLine") : bw.IsPartOfWord ? bwE.classList.add("PartOfWord") : null;
              bwE.style.setProperty("--text-shadow-opacity", `0%`);
              bwE.style.setProperty("--text-shadow-blur-radius", `4px`);
              bwE.style.scale = IdleEmphasisLyricsScale.toString();
              bwE.style.transform = `translateY(calc(var(--font-size) * 0.02))`;
              const contentDuration = totalDuration > 200 ? totalDuration : 200;
              bwE.style.setProperty("--content-duration", `${contentDuration}ms`);
              lineE.appendChild(bwE);
            } else {
              bwE.textContent = bw.Text;
              bwE.style.setProperty("--gradient-position", `0%`);
              bwE.style.setProperty("--text-shadow-opacity", `0%`);
              bwE.style.setProperty("--text-shadow-blur-radius", `4px`);
              bwE.style.scale = IdleLyricsScale.toString();
              bwE.style.transform = `translateY(calc(var(--font-size) * 0.01))`;
              if (ArabicPersianRegex.test(bw.Text)) {
                bwE.setAttribute("font", "Vazirmatn");
              }
              LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
                HTMLElement: bwE,
                StartTime: ConvertTime(bw.StartTime),
                EndTime: ConvertTime(bw.EndTime),
                TotalTime: ConvertTime(bw.EndTime) - ConvertTime(bw.StartTime),
                BGWord: true
              });
              bwE.classList.add("bg-word");
              bwE.classList.add("word");
              bI === bA.length - 1 ? bwE.classList.add("LastWordInLine") : bw.IsPartOfWord ? bwE.classList.add("PartOfWord") : null;
              lineE.appendChild(bwE);
            }
          });
        });
      }
      if (arr[index + 1] && arr[index + 1].Lead.StartTime - line.Lead.EndTime >= lyricsBetweenShow && !SpotifyPlayer.IsPodcast) {
        const musicalLine = document.createElement("div");
        musicalLine.classList.add("line");
        musicalLine.classList.add("musical-line");
        LyricsObject.Types.Syllable.Lines.push({
          HTMLElement: musicalLine,
          StartTime: ConvertTime(line.Lead.EndTime),
          EndTime: ConvertTime(arr[index + 1].Lead.StartTime),
          TotalTime: ConvertTime(arr[index + 1].Lead.StartTime) - ConvertTime(line.Lead.EndTime),
          DotLine: true
        });
        SetWordArrayInCurentLine();
        if (arr[index + 1].OppositeAligned) {
          musicalLine.classList.add("OppositeAligned");
        }
        const dotGroup = document.createElement("div");
        dotGroup.classList.add("dotGroup");
        const musicalDots1 = document.createElement("span");
        const musicalDots2 = document.createElement("span");
        const musicalDots3 = document.createElement("span");
        const totalTime = ConvertTime(arr[index + 1].Lead.StartTime) - ConvertTime(line.Lead.EndTime);
        const dotTime = totalTime / 3;
        musicalDots1.classList.add("word");
        musicalDots1.classList.add("dot");
        musicalDots1.textContent = "\u2022";
        LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots1,
          StartTime: ConvertTime(line.Lead.EndTime),
          EndTime: ConvertTime(line.Lead.EndTime) + dotTime,
          TotalTime: dotTime,
          Dot: true
        });
        musicalDots2.classList.add("word");
        musicalDots2.classList.add("dot");
        musicalDots2.textContent = "\u2022";
        LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots2,
          StartTime: ConvertTime(line.Lead.EndTime) + dotTime,
          EndTime: ConvertTime(line.Lead.EndTime) + dotTime * 2,
          TotalTime: dotTime,
          Dot: true
        });
        musicalDots3.classList.add("word");
        musicalDots3.classList.add("dot");
        musicalDots3.textContent = "\u2022";
        LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots3,
          StartTime: ConvertTime(line.Lead.EndTime) + dotTime * 2,
          EndTime: ConvertTime(arr[index + 1].Lead.StartTime) - 400,
          TotalTime: dotTime,
          Dot: true
        });
        dotGroup.appendChild(musicalDots1);
        dotGroup.appendChild(musicalDots2);
        dotGroup.appendChild(musicalDots3);
        musicalLine.appendChild(dotGroup);
        LyricsContainer.appendChild(musicalLine);
      }
    });
    ApplyInfo(data);
    ApplyLyricsCredits(data);
    BOTTOM_ApplyLyricsSpacer(LyricsContainer);
    if (ScrollSimplebar)
      RecalculateScrollSimplebar();
    else
      MountScrollSimplebar();
    const LyricsStylingContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content"
    );
    removeAllStyles(LyricsStylingContainer);
    if (data.classes) {
      LyricsStylingContainer.className = data.classes;
    }
    if (data.styles) {
      applyStyles(LyricsStylingContainer, data.styles);
    }
  }

  // src/utils/Lyrics/Global/Applyer.ts
  function ApplyLyrics(lyrics) {
    if (!document.querySelector("#SpicyLyricsPage"))
      return;
    setBlurringLastLine(null);
    if (!lyrics)
      return;
    if (lyrics?.Type === "Syllable") {
      ApplySyllableLyrics(lyrics);
    } else if (lyrics?.Type === "Line") {
      ApplyLineLyrics(lyrics);
    } else if (lyrics?.Type === "Static") {
      ApplyStaticLyrics(lyrics);
    }
  }

  // src/utils/ScrollIntoView/Center.ts
  var containerRects = /* @__PURE__ */ new WeakMap();
  function ScrollIntoCenterView(container, element, duration = 150, offset = 0) {
    function resetContainerData(container2) {
      containerRects.delete(container2);
    }
    const observer = new MutationObserver(() => {
      resetContainerData(container);
    });
    observer.observe(container, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(() => {
      resetContainerData(container);
    });
    resizeObserver.observe(container);
    let containerData = containerRects.get(container);
    if (!containerData) {
      containerData = {
        container: container.getBoundingClientRect(),
        elements: /* @__PURE__ */ new Map()
      };
      containerRects.set(container, containerData);
    }
    const containerRect = containerData.container;
    let elementRect = containerData.elements.get(element);
    if (!elementRect) {
      elementRect = element.getBoundingClientRect();
      containerData.elements.set(element, elementRect);
    }
    const targetScrollTop = elementRect.top - containerRect.top + container.scrollTop - (container.clientHeight / 2 - element.clientHeight / 2) - offset;
    const startScrollTop = container.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const startTime = performance.now();
    function smoothScroll(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easing = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const newScrollTop = startScrollTop + distance * easing;
      container.scrollTop = newScrollTop;
      if (progress < 1) {
        requestAnimationFrame(smoothScroll);
      }
    }
    requestAnimationFrame(smoothScroll);
    setTimeout(() => {
      observer.disconnect();
      resizeObserver.disconnect();
    }, duration);
  }

  // src/utils/Scrolling/ScrollToActiveLine.ts
  var lastLine = null;
  function ScrollToActiveLine(ScrollSimplebar2) {
    if (!SpotifyPlayer.IsPlaying)
      return;
    if (!Defaults_default.LyricsContainerExists)
      return;
    if (Spicetify.Platform.History.location.pathname === "/AmaiLyrics") {
      let Continue = function(currentLine) {
        if (currentLine) {
          const LineElem = currentLine.HTMLElement;
          const container = ScrollSimplebar2?.getScrollElement();
          if (!container)
            return;
          if (lastLine && lastLine === LineElem)
            return;
          lastLine = LineElem;
          setTimeout(
            () => LineElem.classList.add("Active", "OverridenByScroller"),
            PositionOffset / 2
          );
          ScrollIntoCenterView(container, LineElem, 270, -50);
        }
      };
      const Lines = LyricsObject.Types[Defaults_default.CurrentLyricsType]?.Lines;
      const Position = SpotifyPlayer.GetTrackPosition();
      const PositionOffset = 370;
      const ProcessedPosition = Position + PositionOffset;
      if (!Lines)
        return;
      for (let i = 0; i < Lines.length; i++) {
        const line = Lines[i];
        if (line.StartTime <= ProcessedPosition && line.EndTime >= ProcessedPosition) {
          const currentLine = line;
          Continue(currentLine);
          return;
        }
      }
    }
  }
  function ResetLastLine() {
    lastLine = null;
  }

  // src/components/Utils/TransferElement.ts
  function TransferElement(element, targetContainer, index = -1) {
    if (!element || !targetContainer) {
      console.error("Both element and target container must be provided.");
      return;
    }
    try {
      if (index < 0 || index >= targetContainer.children.length) {
        targetContainer.appendChild(element);
      } else {
        targetContainer.insertBefore(element, targetContainer.children[index]);
      }
    } catch (error) {
      console.error("Error transferring element:", error);
    }
  }

  // src/components/Utils/Fullscreen.ts
  var Fullscreen = {
    Open,
    Close,
    Toggle,
    IsOpen: false
  };
  var MediaBox_Data = {
    Eventified: false,
    Functions: {
      MouseIn: () => {
        if (MediaBox_Data.Animators.brightness.reversed)
          MediaBox_Data.Animators.brightness.Reverse();
        if (MediaBox_Data.Animators.blur.reversed)
          MediaBox_Data.Animators.blur.Reverse();
        MediaBox_Data.Animators.brightness.Start();
        MediaBox_Data.Animators.blur.Start();
      },
      MouseOut: () => {
        if (!MediaBox_Data.Animators.brightness.reversed)
          MediaBox_Data.Animators.brightness.Reverse();
        if (!MediaBox_Data.Animators.blur.reversed)
          MediaBox_Data.Animators.blur.Reverse();
        MediaBox_Data.Animators.brightness.Start();
        MediaBox_Data.Animators.blur.Start();
      },
      Reset: (MediaImage) => {
        MediaImage.style.removeProperty("--ArtworkBrightness");
        MediaImage.style.removeProperty("--ArtworkBlur");
      },
      Eventify: (MediaImage) => {
        MediaBox_Data.Animators.brightness.on("progress", (progress) => {
          MediaImage.style.setProperty("--ArtworkBrightness", `${progress}`);
        });
        MediaBox_Data.Animators.blur.on("progress", (progress) => {
          MediaImage.style.setProperty("--ArtworkBlur", `${progress}px`);
        });
        MediaBox_Data.Eventified = true;
      }
    },
    Animators: {
      brightness: new Animator(1, 0.5, 0.25),
      blur: new Animator(0, 0.2, 0.25)
    }
  };
  function Open() {
    const SpicyPage = document.querySelector(
      ".Root__main-view #SpicyLyricsPage"
    );
    const Root = document.body;
    if (SpicyPage) {
      TransferElement(SpicyPage, Root);
      SpicyPage.classList.add("Fullscreen");
      Fullscreen.IsOpen = true;
      PageView_default.AppendViewControls(true);
      Tooltips.NowBarToggle?.destroy();
      const NowBarToggle = document.querySelector(
        "#SpicyLyricsPage .ViewControls #NowBarToggle"
      );
      if (NowBarToggle) {
        NowBarToggle.remove();
      }
      OpenNowBar();
      if (!document.fullscreenElement) {
        Root.querySelector("#SpicyLyricsPage").requestFullscreen().catch((err) => {
          alert(
            `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
          );
        });
      } else {
        document.exitFullscreen();
      }
      ResetLastLine();
      const MediaBox = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox"
      );
      const MediaImage = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage"
      );
      MediaBox_Data.Functions.Eventify(MediaImage);
      MediaBox.addEventListener("mouseenter", MediaBox_Data.Functions.MouseIn);
      MediaBox.addEventListener("mouseleave", MediaBox_Data.Functions.MouseOut);
      Global_default.Event.evoke("fullscreen:open", null);
    }
  }
  function Close() {
    const SpicyPage = document.querySelector("#SpicyLyricsPage");
    if (SpicyPage) {
      TransferElement(SpicyPage, PageRoot);
      SpicyPage.classList.remove("Fullscreen");
      Fullscreen.IsOpen = false;
      PageView_default.AppendViewControls(true);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      const NoLyrics = storage_default.get("currentLyricsData")?.includes("NO_LYRICS");
      if (NoLyrics) {
        OpenNowBar();
        document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer").classList.add("Hidden");
        DeregisterNowBarBtn();
      }
      ResetLastLine();
      const MediaBox = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox"
      );
      const MediaImage = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage"
      );
      MediaBox.removeEventListener("mouseenter", MediaBox_Data.Functions.MouseIn);
      MediaBox.removeEventListener(
        "mouseleave",
        MediaBox_Data.Functions.MouseOut
      );
      MediaBox_Data.Functions.Reset(MediaImage);
      Global_default.Event.evoke("fullscreen:exit", null);
    }
  }
  function Toggle() {
    const SpicyPage = document.querySelector("#SpicyLyricsPage");
    if (SpicyPage) {
      if (Fullscreen.IsOpen) {
        Close();
      } else {
        Open();
      }
    }
  }
  var Fullscreen_default = Fullscreen;

  // src/components/Global/Session.ts
  var sessionHistory = [];
  var Session = {
    Navigate: (data) => {
      Spicetify.Platform.History.push(data);
    },
    GoBack: () => {
      if (sessionHistory.length > 1) {
        Session.Navigate(sessionHistory[sessionHistory.length - 2]);
      } else {
        Session.Navigate({ pathname: "/" });
      }
    },
    GetPreviousLocation: () => {
      if (sessionHistory.length > 1) {
        return sessionHistory[sessionHistory.length - 2];
      }
      return null;
    },
    RecordNavigation: (data) => {
      Session.PushToHistory(data);
      Global_default.Event.evoke("session:navigation", data);
    },
    FilterOutTheSameLocation: (data) => {
      const filtered = sessionHistory.filter(
        (location) => location.pathname !== data.pathname && location.search !== data?.search && location.hash !== data?.hash
      );
      sessionHistory = filtered;
    },
    PushToHistory: (data) => {
      sessionHistory.push(data);
    }
  };
  window._spicy_lyrics_session = Session;
  var Session_default = Session;

  // src/components/Pages/PageView.ts
  var Tooltips = {
    Close: null,
    Kofi: null,
    NowBarToggle: null,
    FullscreenToggle: null,
    LyricsToggle: null
  };
  var PageView = {
    Open: OpenPage,
    Destroy: DestroyPage,
    AppendViewControls,
    IsOpened: false
  };
  var PageRoot = document.querySelector(
    ".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"
  );
  function OpenPage() {
    if (PageView.IsOpened)
      return;
    const elem = document.createElement("div");
    elem.id = "SpicyLyricsPage";
    elem.innerHTML = `
        <div class="NotificationContainer">
            <div class="NotificationIcon"></div>
            <div class="NotificationText">
                <div class="NotificationTitle"></div>
                <div class="NotificationDescription"></div>
            </div>
            <div class="NotificationCloseButton">X</div>
        </div>
        <div class="ContentBox">
            <div class="NowBar">
                <div class="CenteredView">
                    <div class="Header">
                        <div class="MediaBox">
                            <div class="MediaContent" draggable="true"></div>
                            <img class="MediaImage" src="${SpotifyPlayer.Artwork.Get(
      "xl"
    )}" draggable="true" />
                        </div>
                        <div class="Metadata">
                            <div class="SongName">
                                <span>
                                    ${SpotifyPlayer.GetSongName()}
                                </span>
                            </div>
                            <div class="Artists">
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="LyricsContainer">
                <div class="loaderContainer">
                    <div id="DotLoader"></div>
                </div>
                <div class="LyricsContent ScrollbarScrollable"></div>
            </div>
            <div class="ViewControls"></div>
            <div class="DropZone LeftSide">
                <span>Switch Sides</span>
            </div>
            <div class="DropZone RightSide">
                <span>Switch Sides</span>
            </div>
        </div>
    `;
    const SkipSpicyFont = storage_default.get("skip-spicy-font");
    if (SkipSpicyFont != "true") {
      elem.classList.add("UseSpicyFont");
    }
    PageRoot.appendChild(elem);
    const lowQMode = storage_default.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";
    if (lowQModeEnabled) {
      elem.querySelector(".LyricsContainer .LyricsContent").classList.add("lowqmode");
    }
    Defaults_default.LyricsContainerExists = true;
    ApplyDynamicBackground(
      document.querySelector("#SpicyLyricsPage .ContentBox")
    );
    addLinesEvListener();
    {
      if (!Spicetify.Player.data?.item?.uri)
        return;
      const currentUri = Spicetify.Player.data.item.uri;
      fetchLyrics(currentUri).then(ApplyLyrics);
    }
    Session_OpenNowBar();
    Session_NowBar_SetSide();
    AppendViewControls();
    PageView.IsOpened = true;
  }
  function DestroyPage() {
    if (!PageView.IsOpened)
      return;
    if (Fullscreen_default.IsOpen)
      Fullscreen_default.Close();
    if (!document.querySelector("#SpicyLyricsPage"))
      return;
    document.querySelector("#SpicyLyricsPage")?.remove();
    Defaults_default.LyricsContainerExists = false;
    removeLinesEvListener();
    Object.values(Tooltips).forEach((a) => a?.destroy());
    ResetLastLine();
    ScrollSimplebar?.unMount();
    PageView.IsOpened = false;
  }
  function AppendViewControls(ReAppend = false) {
    const elem = document.querySelector(
      "#SpicyLyricsPage .ContentBox .ViewControls"
    );
    if (!elem)
      return;
    if (ReAppend)
      elem.innerHTML = "";
    elem.innerHTML = `
        <button id="Close" class="ViewControl">${Icons.Close}</button>
        <button id="NowBarToggle" class="ViewControl">${Icons.NowBar}</button>
        <button id="FullscreenToggle" class="ViewControl">${Fullscreen_default.IsOpen ? Icons.CloseFullscreen : Icons.Fullscreen}</button>
    `;
    if (Fullscreen_default.IsOpen) {
      TransferElement(
        elem,
        document.querySelector(
          "#SpicyLyricsPage .ContentBox .NowBar .Header"
        ),
        0
      );
      Object.values(Tooltips).forEach((a) => a?.destroy());
      SetupTippy(
        document.querySelector(
          "#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls"
        )
      );
    } else {
      if (document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls"
      )) {
        TransferElement(
          elem,
          document.querySelector("#SpicyLyricsPage .ContentBox")
        );
      }
      Object.values(Tooltips).forEach((a) => a?.destroy());
      SetupTippy(elem);
    }
    function SetupTippy(elem2) {
      {
        const closeButton = elem2.querySelector("#Close");
        Tooltips.Close = Spicetify.Tippy(closeButton, {
          ...Spicetify.TippyProps,
          content: `Close Page`
        });
        closeButton.addEventListener("click", () => Session_default.GoBack());
        const nowBarButton = elem2.querySelector("#NowBarToggle");
        Tooltips.NowBarToggle = Spicetify.Tippy(nowBarButton, {
          ...Spicetify.TippyProps,
          content: `NowBar`
        });
        nowBarButton.addEventListener("click", () => ToggleNowBar());
        const fullscreenBtn = elem2.querySelector("#FullscreenToggle");
        Tooltips.FullscreenToggle = Spicetify.Tippy(fullscreenBtn, {
          ...Spicetify.TippyProps,
          content: `Toggle Fullscreen`
        });
        fullscreenBtn.addEventListener("click", () => Fullscreen_default.Toggle());
      }
    }
  }
  var PageView_default = PageView;

  // src/components/Utils/NowBar.ts
  var ActivePlaybackControlsInstance = null;
  var ActiveSongProgressBarInstance_Map = /* @__PURE__ */ new Map();
  var ActiveSetupSongProgressBarInstance = null;
  function OpenNowBar() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    UpdateNowBar(true);
    NowBar.classList.add("Active");
    storage_default.set("IsNowBarOpen", "true");
    if (Fullscreen_default.IsOpen) {
      const MediaBox = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent"
      );
      const existingAlbumData = MediaBox.querySelector(".AlbumData");
      if (existingAlbumData) {
        MediaBox.removeChild(existingAlbumData);
      }
      const existingPlaybackControls = MediaBox.querySelector(".PlaybackControls");
      if (existingPlaybackControls) {
        MediaBox.removeChild(existingPlaybackControls);
      }
      {
        const AppendQueue = [];
        {
          const AlbumNameElement = document.createElement("div");
          AlbumNameElement.classList.add("AlbumData");
          AlbumNameElement.innerHTML = `<span>${SpotifyPlayer.GetAlbumName()}</span>`;
          AppendQueue.push(AlbumNameElement);
        }
        const SetupPlaybackControls = () => {
          const ControlsElement = document.createElement("div");
          ControlsElement.classList.add("PlaybackControls");
          ControlsElement.innerHTML = `
                    <div class="PlaybackControl ShuffleToggle">
                        ${Icons.Shuffle} 
                    </div>
                    ${Icons.PrevTrack}
                    <div class="PlaybackControl PlayStateToggle ${SpotifyPlayer.IsPlaying ? "Playing" : "Paused"}">
                        ${SpotifyPlayer.IsPlaying ? Icons.Pause : Icons.Play}
                    </div>
                    ${Icons.NextTrack}
                    <div class="PlaybackControl LoopToggle">
                        ${SpotifyPlayer.LoopType === "track" ? Icons.LoopTrack : Icons.Loop}
                    </div>
                `;
          if (SpotifyPlayer.LoopType !== "none") {
            ControlsElement.querySelector(".LoopToggle").classList.add("Enabled");
            ControlsElement.querySelector(
              ".LoopToggle svg"
            ).style.filter = "drop-shadow(0 0 5px white)";
          }
          if (SpotifyPlayer.ShuffleType !== "none") {
            ControlsElement.querySelector(".ShuffleToggle").classList.add(
              "Enabled"
            );
            ControlsElement.querySelector(
              ".ShuffleToggle svg"
            ).style.filter = "drop-shadow(0 0 5px white)";
          }
          const eventHandlers = {
            pressHandlers: /* @__PURE__ */ new Map(),
            releaseHandlers: /* @__PURE__ */ new Map(),
            clickHandlers: /* @__PURE__ */ new Map()
          };
          const playbackControls = ControlsElement.querySelectorAll(".PlaybackControl");
          playbackControls.forEach((control) => {
            const pressHandler = () => {
              control.classList.add("Pressed");
            };
            const releaseHandler = () => {
              control.classList.remove("Pressed");
            };
            eventHandlers.pressHandlers.set(control, pressHandler);
            eventHandlers.releaseHandlers.set(control, releaseHandler);
            control.addEventListener("mousedown", pressHandler);
            control.addEventListener("touchstart", pressHandler);
            control.addEventListener("mouseup", releaseHandler);
            control.addEventListener("mouseleave", releaseHandler);
            control.addEventListener("touchend", releaseHandler);
          });
          const PlayPauseControl = ControlsElement.querySelector(".PlayStateToggle");
          const PrevTrackControl = ControlsElement.querySelector(".PrevTrack");
          const NextTrackControl = ControlsElement.querySelector(".NextTrack");
          const ShuffleControl = ControlsElement.querySelector(".ShuffleToggle");
          const LoopControl = ControlsElement.querySelector(".LoopToggle");
          const playPauseHandler = () => {
            if (SpotifyPlayer.IsPlaying) {
              SpotifyPlayer.Pause();
            } else {
              SpotifyPlayer.Play();
            }
          };
          const prevTrackHandler = () => {
            SpotifyPlayer.Skip.Prev();
          };
          const nextTrackHandler = () => {
            SpotifyPlayer.Skip.Next();
          };
          const shuffleHandler = () => {
            if (SpotifyPlayer.ShuffleType === "none") {
              SpotifyPlayer.ShuffleType = "normal";
              ShuffleControl.classList.add("Enabled");
              Spicetify.Player.setShuffle(true);
            } else if (SpotifyPlayer.ShuffleType === "normal") {
              SpotifyPlayer.ShuffleType = "none";
              ShuffleControl.classList.remove("Enabled");
              Spicetify.Player.setShuffle(false);
            }
          };
          const loopHandler = () => {
            if (SpotifyPlayer.LoopType === "none") {
              LoopControl.classList.add("Enabled");
            } else {
              LoopControl.classList.remove("Enabled");
            }
            if (SpotifyPlayer.LoopType === "none") {
              SpotifyPlayer.LoopType = "context";
              Spicetify.Player.setRepeat(1);
            } else if (SpotifyPlayer.LoopType === "context") {
              SpotifyPlayer.LoopType = "track";
              Spicetify.Player.setRepeat(2);
            } else if (SpotifyPlayer.LoopType === "track") {
              SpotifyPlayer.LoopType = "none";
              Spicetify.Player.setRepeat(0);
            }
          };
          eventHandlers.clickHandlers.set(PlayPauseControl, playPauseHandler);
          eventHandlers.clickHandlers.set(PrevTrackControl, prevTrackHandler);
          eventHandlers.clickHandlers.set(NextTrackControl, nextTrackHandler);
          eventHandlers.clickHandlers.set(ShuffleControl, shuffleHandler);
          eventHandlers.clickHandlers.set(LoopControl, loopHandler);
          PlayPauseControl.addEventListener("click", playPauseHandler);
          PrevTrackControl.addEventListener("click", prevTrackHandler);
          NextTrackControl.addEventListener("click", nextTrackHandler);
          ShuffleControl.addEventListener("click", shuffleHandler);
          LoopControl.addEventListener("click", loopHandler);
          const cleanup = () => {
            playbackControls.forEach((control) => {
              const pressHandler = eventHandlers.pressHandlers.get(control);
              const releaseHandler = eventHandlers.releaseHandlers.get(control);
              control.removeEventListener("mousedown", pressHandler);
              control.removeEventListener("touchstart", pressHandler);
              control.removeEventListener("mouseup", releaseHandler);
              control.removeEventListener("mouseleave", releaseHandler);
              control.removeEventListener("touchend", releaseHandler);
            });
            PlayPauseControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(PlayPauseControl)
            );
            PrevTrackControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(PrevTrackControl)
            );
            NextTrackControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(NextTrackControl)
            );
            ShuffleControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(ShuffleControl)
            );
            LoopControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(LoopControl)
            );
            eventHandlers.pressHandlers.clear();
            eventHandlers.releaseHandlers.clear();
            eventHandlers.clickHandlers.clear();
            if (ControlsElement.parentNode) {
              ControlsElement.parentNode.removeChild(ControlsElement);
            }
          };
          return {
            Apply: () => {
              AppendQueue.push(ControlsElement);
            },
            CleanUp: cleanup,
            GetElement: () => ControlsElement
          };
        };
        const SetupSongProgressBar = () => {
          const songProgressBar = new SongProgressBar();
          ActiveSongProgressBarInstance_Map.set(
            "SongProgressBar_ClassInstance",
            songProgressBar
          );
          songProgressBar.Update({
            duration: SpotifyPlayer.GetTrackDuration() ?? 0,
            position: SpotifyPlayer.GetTrackPosition() ?? 0
          });
          const TimelineElem = document.createElement("div");
          ActiveSongProgressBarInstance_Map.set("TimeLineElement", TimelineElem);
          TimelineElem.classList.add("Timeline");
          TimelineElem.innerHTML = `
                    <span class="Time Position">${songProgressBar.GetFormattedPosition() ?? "0:00"}</span>
                    <div class="SliderBar" style="--SliderProgress: ${songProgressBar.GetProgressPercentage() ?? 0}">
                        <div class="Handle"></div>
                    </div>
                    <span class="Time Duration">${songProgressBar.GetFormattedDuration() ?? "0:00"}</span>
                `;
          const SliderBar = TimelineElem.querySelector(".SliderBar");
          if (!SliderBar) {
            console.error("Could not find SliderBar element");
            return null;
          }
          const updateTimelineState = (e = null) => {
            const PositionElem = TimelineElem.querySelector(".Time.Position");
            const DurationElem = TimelineElem.querySelector(".Time.Duration");
            if (!PositionElem || !DurationElem || !SliderBar) {
              console.error("Missing required elements for timeline update");
              return;
            }
            songProgressBar.Update({
              duration: SpotifyPlayer.GetTrackDuration() ?? 0,
              position: e ?? SpotifyPlayer.GetTrackPosition() ?? 0
            });
            const sliderPercentage = songProgressBar.GetProgressPercentage();
            const formattedPosition = songProgressBar.GetFormattedPosition();
            const formattedDuration = songProgressBar.GetFormattedDuration();
            SliderBar.style.setProperty(
              "--SliderProgress",
              sliderPercentage.toString()
            );
            DurationElem.textContent = formattedDuration;
            PositionElem.textContent = formattedPosition;
          };
          const sliderBarHandler = (event) => {
            const positionMs = songProgressBar.CalculatePositionFromClick({
              sliderBar: SliderBar,
              event
            });
            if (typeof SpotifyPlayer !== "undefined" && SpotifyPlayer.Seek) {
              SpotifyPlayer.Seek(positionMs);
            }
          };
          SliderBar.addEventListener("click", sliderBarHandler);
          updateTimelineState();
          ActiveSongProgressBarInstance_Map.set(
            "updateTimelineState_Function",
            updateTimelineState
          );
          const cleanup = () => {
            if (SliderBar) {
              SliderBar.removeEventListener("click", sliderBarHandler);
            }
            const progressBar = ActiveSongProgressBarInstance_Map.get(
              "SongProgressBar_ClassInstance"
            );
            if (progressBar) {
              progressBar.Destroy();
            }
            if (TimelineElem.parentNode) {
              TimelineElem.parentNode.removeChild(TimelineElem);
            }
            ActiveSongProgressBarInstance_Map.clear();
          };
          return {
            Apply: () => {
              AppendQueue.push(TimelineElem);
            },
            GetElement: () => TimelineElem,
            CleanUp: cleanup
          };
        };
        ActivePlaybackControlsInstance = SetupPlaybackControls();
        ActivePlaybackControlsInstance.Apply();
        ActiveSetupSongProgressBarInstance = SetupSongProgressBar();
        ActiveSetupSongProgressBarInstance.Apply();
        Whentil_default.When(
          () => document.querySelector(
            "#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls"
          ),
          () => {
            const viewControls = MediaBox.querySelector(".ViewControls");
            const fragment = document.createDocumentFragment();
            AppendQueue.forEach((element) => {
              fragment.appendChild(element);
            });
            MediaBox.innerHTML = "";
            if (viewControls)
              MediaBox.appendChild(viewControls);
            MediaBox.appendChild(fragment);
          }
        );
      }
    }
    const DragBox = Fullscreen_default.IsOpen ? document.querySelector(
      "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent"
    ) : document.querySelector(
      "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage"
    );
    const dropZones = document.querySelectorAll(
      "#SpicyLyricsPage .ContentBox .DropZone"
    );
    DragBox.addEventListener("dragstart", (e) => {
      setTimeout(() => {
        document.querySelector("#SpicyLyricsPage").classList.add("SomethingDragging");
        if (NowBar.classList.contains("LeftSide")) {
          dropZones.forEach((zone) => {
            if (zone.classList.contains("LeftSide")) {
              zone.classList.add("Hidden");
            } else {
              zone.classList.remove("Hidden");
            }
          });
        } else if (NowBar.classList.contains("RightSide")) {
          dropZones.forEach((zone) => {
            if (zone.classList.contains("RightSide")) {
              zone.classList.add("Hidden");
            } else {
              zone.classList.remove("Hidden");
            }
          });
        }
        DragBox.classList.add("Dragging");
      }, 0);
    });
    DragBox.addEventListener("dragend", () => {
      document.querySelector("#SpicyLyricsPage").classList.remove("SomethingDragging");
      dropZones.forEach((zone) => zone.classList.remove("Hidden"));
      DragBox.classList.remove("Dragging");
    });
    dropZones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("DraggingOver");
      });
      zone.addEventListener("dragleave", () => {
        zone.classList.remove("DraggingOver");
      });
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("DraggingOver");
        const currentClass = NowBar.classList.contains("LeftSide") ? "LeftSide" : "RightSide";
        const newClass = zone.classList.contains("RightSide") ? "RightSide" : "LeftSide";
        NowBar.classList.remove(currentClass);
        NowBar.classList.add(newClass);
        const side = zone.classList.contains("RightSide") ? "right" : "left";
        storage_default.set("NowBarSide", side);
      });
    });
  }
  function CleanUpActiveComponents() {
    if (ActivePlaybackControlsInstance) {
      ActivePlaybackControlsInstance?.CleanUp();
      ActivePlaybackControlsInstance = null;
    }
    if (ActiveSetupSongProgressBarInstance) {
      ActiveSetupSongProgressBarInstance?.CleanUp();
      ActiveSetupSongProgressBarInstance = null;
    }
    if (ActiveSongProgressBarInstance_Map.size > 0) {
      ActiveSongProgressBarInstance_Map?.clear();
    }
    const MediaBox = document.querySelector(
      "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent"
    );
    if (MediaBox) {
      const albumData = MediaBox.querySelector(".AlbumData");
      if (albumData)
        MediaBox.removeChild(albumData);
      const playbackControls = MediaBox.querySelector(".PlaybackControls");
      if (playbackControls)
        MediaBox.removeChild(playbackControls);
      const songProgressBar = MediaBox.querySelector(".SongProgressBar");
      if (songProgressBar)
        MediaBox.removeChild(songProgressBar);
    }
  }
  function CloseNowBar() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    NowBar.classList.remove("Active");
    storage_default.set("IsNowBarOpen", "false");
    CleanUpActiveComponents();
  }
  function ToggleNowBar() {
    const IsNowBarOpen = storage_default.get("IsNowBarOpen");
    if (IsNowBarOpen === "true") {
      CloseNowBar();
    } else {
      OpenNowBar();
    }
  }
  function Session_OpenNowBar() {
    const IsNowBarOpen = storage_default.get("IsNowBarOpen");
    if (IsNowBarOpen === "true") {
      OpenNowBar();
    } else {
      CloseNowBar();
    }
  }
  function UpdateNowBar(force = false) {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    const ArtistsDiv = NowBar.querySelector(".Header .Metadata .Artists");
    const ArtistsSpan = NowBar.querySelector(".Header .Metadata .Artists span");
    const MediaImage = NowBar.querySelector(
      ".Header .MediaBox .MediaImage"
    );
    const SongNameSpan = NowBar.querySelector(".Header .Metadata .SongName span");
    const MediaBox = NowBar.querySelector(".Header .MediaBox");
    const SongName = NowBar.querySelector(".Header .Metadata .SongName");
    ArtistsDiv.classList.add("Skeletoned");
    MediaBox.classList.add("Skeletoned");
    SongName.classList.add("Skeletoned");
    const IsNowBarOpen = storage_default.get("IsNowBarOpen");
    if (IsNowBarOpen == "false" && !force)
      return;
    SpotifyPlayer.Artwork.Get("xl").then((artwork) => {
      MediaImage.src = artwork;
      MediaBox.classList.remove("Skeletoned");
    });
    SpotifyPlayer.GetSongName().then((title) => {
      SongNameSpan.textContent = title;
      SongName.classList.remove("Skeletoned");
    });
    SpotifyPlayer.GetArtists().then((artists) => {
      const JoinedArtists = SpotifyPlayer.JoinArtists(artists);
      ArtistsSpan.textContent = JoinedArtists;
      ArtistsDiv.classList.remove("Skeletoned");
    });
    if (Fullscreen_default.IsOpen) {
      const NowBarAlbum = NowBar.querySelector(
        ".Header .MediaBox .AlbumData"
      );
      if (NowBarAlbum) {
        NowBarAlbum.classList.add("Skeletoned");
        const AlbumSpan = NowBarAlbum.querySelector("span");
        AlbumSpan.textContent = SpotifyPlayer.GetAlbumName();
        NowBarAlbum.classList.remove("Skeletoned");
      }
    }
  }
  function Session_NowBar_SetSide() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    const CurrentSide = storage_default.get("NowBarSide");
    if (CurrentSide === "left") {
      storage_default.set("NowBarSide", "left");
      NowBar.classList.remove("RightSide");
      NowBar.classList.add("LeftSide");
    } else if (CurrentSide === "right") {
      storage_default.set("NowBarSide", "right");
      NowBar.classList.remove("LeftSide");
      NowBar.classList.add("RightSide");
    } else {
      storage_default.set("NowBarSide", "left");
      NowBar.classList.remove("RightSide");
      NowBar.classList.add("LeftSide");
    }
  }
  function DeregisterNowBarBtn() {
    Tooltips.NowBarToggle?.destroy();
    Tooltips.NowBarToggle = null;
    const nowBarButton = document.querySelector(
      "#SpicyLyricsPage .ContentBox .ViewControls #NowBarToggle"
    );
    nowBarButton?.remove();
  }
  Global_default.Event.listen("playback:playpause", (e) => {
    if (Fullscreen_default.IsOpen) {
      if (ActivePlaybackControlsInstance) {
        const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
        const PlayPauseButton = PlaybackControls.querySelector(".PlayStateToggle");
        if (e.data.isPaused) {
          PlayPauseButton.classList.remove("Playing");
          PlayPauseButton.classList.add("Paused");
          const SVG = PlayPauseButton.querySelector("svg");
          SVG.innerHTML = Icons.Play;
        } else {
          PlayPauseButton.classList.remove("Paused");
          PlayPauseButton.classList.add("Playing");
          const SVG = PlayPauseButton.querySelector("svg");
          SVG.innerHTML = Icons.Pause;
        }
      }
    }
  });
  Global_default.Event.listen("playback:loop", (e) => {
    if (Fullscreen_default.IsOpen) {
      if (ActivePlaybackControlsInstance) {
        const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
        const LoopButton = PlaybackControls.querySelector(".LoopToggle");
        const SVG = LoopButton.querySelector("svg");
        SVG.style.filter = "";
        if (e === "track") {
          SVG.innerHTML = Icons.LoopTrack;
        } else {
          SVG.innerHTML = Icons.Loop;
        }
        if (e !== "none") {
          LoopButton.classList.add("Enabled");
          SVG.style.filter = "drop-shadow(0 0 5px white)";
        } else {
          LoopButton.classList.remove("Enabled");
        }
      }
    }
  });
  Global_default.Event.listen("playback:shuffle", (e) => {
    if (Fullscreen_default.IsOpen) {
      if (ActivePlaybackControlsInstance) {
        const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
        const ShuffleButton = PlaybackControls.querySelector(".ShuffleToggle");
        const SVG = ShuffleButton.querySelector("svg");
        SVG.style.filter = "";
        if (e !== "none") {
          ShuffleButton.classList.add("Enabled");
          SVG.style.filter = "drop-shadow(0 0 5px white)";
        } else {
          ShuffleButton.classList.remove("Enabled");
        }
      }
    }
  });
  Global_default.Event.listen("playback:position", (e) => {
    if (Fullscreen_default.IsOpen) {
      if (ActiveSetupSongProgressBarInstance) {
        const updateTimelineState = ActiveSongProgressBarInstance_Map.get(
          "updateTimelineState_Function"
        );
        updateTimelineState(e);
      }
    }
  });
  Global_default.Event.listen("fullscreen:exit", () => {
    CleanUpActiveComponents();
  });

  // src/utils/API/Lyrics.ts
  var API_URL = Defaults_default.lyrics.api.url;
  async function getLyrics(id, headers = {}) {
    let [userData, status] = await SpicyFetch(
      "https://api.spotify.com/v1/me",
      true,
      true,
      false
    );
    if (status !== 200) {
      userData = {};
    }
    const res = await fetch(`${API_URL}/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        id,
        user_id: userData?.id,
        display_name: userData?.display_name,
        country: userData?.country,
        product: userData?.product,
        images: JSON.stringify(userData?.images)
      })
    });
    status = res.status;
    if (!res.ok)
      throw new Error("Request failed");
    let data;
    try {
      data = await res.json();
    } catch (error) {
      data = {};
    }
    return { response: data, status };
  }

  // node_modules/@google/genai/dist/web/index.mjs
  var BaseModule = class {
  };
  function formatMap(templateString, valueMap) {
    const regex = /\{([^}]+)\}/g;
    return templateString.replace(regex, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(valueMap, key)) {
        const value = valueMap[key];
        return value !== void 0 && value !== null ? String(value) : "";
      } else {
        throw new Error(`Key '${key}' not found in valueMap.`);
      }
    });
  }
  function setValueByPath(data, keys, value) {
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key.endsWith("[]")) {
        const keyName = key.slice(0, -2);
        if (!(keyName in data)) {
          if (Array.isArray(value)) {
            data[keyName] = Array.from({ length: value.length }, () => ({}));
          } else {
            throw new Error(`Value must be a list given an array path ${key}`);
          }
        }
        if (Array.isArray(data[keyName])) {
          const arrayData = data[keyName];
          if (Array.isArray(value)) {
            for (let j = 0; j < arrayData.length; j++) {
              const entry = arrayData[j];
              setValueByPath(entry, keys.slice(i + 1), value[j]);
            }
          } else {
            for (const d of arrayData) {
              setValueByPath(d, keys.slice(i + 1), value);
            }
          }
        }
        return;
      } else if (key.endsWith("[0]")) {
        const keyName = key.slice(0, -3);
        if (!(keyName in data)) {
          data[keyName] = [{}];
        }
        const arrayData = data[keyName];
        setValueByPath(arrayData[0], keys.slice(i + 1), value);
        return;
      }
      if (!data[key] || typeof data[key] !== "object") {
        data[key] = {};
      }
      data = data[key];
    }
    const keyToSet = keys[keys.length - 1];
    const existingData = data[keyToSet];
    if (existingData !== void 0) {
      if (!value || typeof value === "object" && Object.keys(value).length === 0) {
        return;
      }
      if (value === existingData) {
        return;
      }
      if (typeof existingData === "object" && typeof value === "object" && existingData !== null && value !== null) {
        Object.assign(existingData, value);
      } else {
        throw new Error(`Cannot set value for an existing key. Key: ${keyToSet}`);
      }
    } else {
      data[keyToSet] = value;
    }
  }
  function getValueByPath(data, keys) {
    try {
      if (keys.length === 1 && keys[0] === "_self") {
        return data;
      }
      for (let i = 0; i < keys.length; i++) {
        if (typeof data !== "object" || data === null) {
          return void 0;
        }
        const key = keys[i];
        if (key.endsWith("[]")) {
          const keyName = key.slice(0, -2);
          if (keyName in data) {
            const arrayData = data[keyName];
            if (!Array.isArray(arrayData)) {
              return void 0;
            }
            return arrayData.map((d) => getValueByPath(d, keys.slice(i + 1)));
          } else {
            return void 0;
          }
        } else {
          data = data[key];
        }
      }
      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        return void 0;
      }
      throw error;
    }
  }
  function tModel(apiClient, model) {
    if (!model || typeof model !== "string") {
      throw new Error("model is required and must be a string");
    }
    if (apiClient.isVertexAI()) {
      if (model.startsWith("publishers/") || model.startsWith("projects/") || model.startsWith("models/")) {
        return model;
      } else if (model.indexOf("/") >= 0) {
        const parts = model.split("/", 2);
        return `publishers/${parts[0]}/models/${parts[1]}`;
      } else {
        return `publishers/google/models/${model}`;
      }
    } else {
      if (model.startsWith("models/") || model.startsWith("tunedModels/")) {
        return model;
      } else {
        return `models/${model}`;
      }
    }
  }
  function tCachesModel(apiClient, model) {
    const transformedModel = tModel(apiClient, model);
    if (!transformedModel) {
      return "";
    }
    if (transformedModel.startsWith("publishers/") && apiClient.isVertexAI()) {
      return `projects/${apiClient.getProject()}/locations/${apiClient.getLocation()}/${transformedModel}`;
    } else if (transformedModel.startsWith("models/") && apiClient.isVertexAI()) {
      return `projects/${apiClient.getProject()}/locations/${apiClient.getLocation()}/publishers/google/${transformedModel}`;
    } else {
      return transformedModel;
    }
  }
  function tPart(apiClient, origin) {
    if (origin === null || origin === void 0) {
      throw new Error("PartUnion is required");
    }
    if (typeof origin === "object") {
      return origin;
    }
    if (typeof origin === "string") {
      return { text: origin };
    }
    throw new Error(`Unsupported part type: ${typeof origin}`);
  }
  function tParts(apiClient, origin) {
    if (origin === null || origin === void 0 || Array.isArray(origin) && origin.length === 0) {
      throw new Error("PartListUnion is required");
    }
    if (Array.isArray(origin)) {
      return origin.map((item) => tPart(apiClient, item));
    }
    return [tPart(apiClient, origin)];
  }
  function _isContent(origin) {
    return origin !== null && origin !== void 0 && typeof origin === "object" && "parts" in origin && Array.isArray(origin.parts);
  }
  function _isFunctionCallPart(origin) {
    return origin !== null && origin !== void 0 && typeof origin === "object" && "functionCall" in origin;
  }
  function _isUserPart(origin) {
    if (origin === null || origin === void 0) {
      return false;
    }
    if (_isFunctionCallPart(origin)) {
      return false;
    }
    return true;
  }
  function _areUserParts(origin) {
    if (origin === null || origin === void 0 || Array.isArray(origin) && origin.length === 0) {
      return false;
    }
    return origin.every(_isUserPart);
  }
  function tContent(apiClient, origin) {
    if (origin === null || origin === void 0) {
      throw new Error("ContentUnion is required");
    }
    if (_isContent(origin)) {
      return origin;
    }
    if (_isUserPart(origin)) {
      return {
        role: "user",
        parts: tParts(apiClient, origin)
      };
    } else {
      return {
        role: "model",
        parts: tParts(apiClient, origin)
      };
    }
  }
  function tContentsForEmbed(apiClient, origin) {
    if (!origin) {
      return [];
    }
    if (apiClient.isVertexAI() && Array.isArray(origin)) {
      return origin.flatMap((item) => {
        const content = tContent(apiClient, item);
        if (content.parts && content.parts.length > 0 && content.parts[0].text !== void 0) {
          return [content.parts[0].text];
        }
        return [];
      });
    } else if (apiClient.isVertexAI()) {
      const content = tContent(apiClient, origin);
      if (content.parts && content.parts.length > 0 && content.parts[0].text !== void 0) {
        return [content.parts[0].text];
      }
      return [];
    }
    if (Array.isArray(origin)) {
      return origin.map((item) => tContent(apiClient, item));
    }
    return [tContent(apiClient, origin)];
  }
  function _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts) {
    if (accumulatedParts.length === 0) {
      return;
    }
    if (_areUserParts(accumulatedParts)) {
      result.push({
        role: "user",
        parts: tParts(apiClient, accumulatedParts)
      });
    } else {
      result.push({
        role: "model",
        parts: tParts(apiClient, accumulatedParts)
      });
    }
    accumulatedParts.length = 0;
  }
  function _handleCurrentPart(apiClient, result, accumulatedParts, currentPart) {
    if (_isUserPart(currentPart) === _areUserParts(accumulatedParts)) {
      accumulatedParts.push(currentPart);
    } else {
      _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts);
      accumulatedParts.length = 0;
      accumulatedParts.push(currentPart);
    }
  }
  function tContents(apiClient, origin) {
    if (origin === null || origin === void 0 || Array.isArray(origin) && origin.length === 0) {
      throw new Error("contents are required");
    }
    if (!Array.isArray(origin)) {
      return [tContent(apiClient, origin)];
    }
    const result = [];
    const accumulatedParts = [];
    for (const content of origin) {
      if (_isContent(content)) {
        _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts);
        result.push(content);
      } else if (typeof content === "string" || typeof content === "object" && !Array.isArray(content)) {
        _handleCurrentPart(apiClient, result, accumulatedParts, content);
      } else if (Array.isArray(content)) {
        _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts);
        result.push({
          role: "user",
          parts: tParts(apiClient, content)
        });
      } else {
        throw new Error(`Unsupported content type: ${typeof content}`);
      }
    }
    _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts);
    return result;
  }
  function processSchema(apiClient, schema) {
    if (!apiClient.isVertexAI()) {
      if ("default" in schema) {
        throw new Error("Default value is not supported in the response schema for the Gemini API.");
      }
    }
    if ("anyOf" in schema) {
      if (schema["anyOf"] !== void 0) {
        for (const subSchema of schema["anyOf"]) {
          processSchema(apiClient, subSchema);
        }
      }
    }
    if ("items" in schema) {
      if (schema["items"] !== void 0) {
        processSchema(apiClient, schema["items"]);
      }
    }
    if ("properties" in schema) {
      if (schema["properties"] !== void 0) {
        for (const subSchema of Object.values(schema["properties"])) {
          processSchema(apiClient, subSchema);
        }
      }
    }
  }
  function tSchema(apiClient, schema) {
    processSchema(apiClient, schema);
    return schema;
  }
  function tSpeechConfig(apiClient, speechConfig) {
    if (typeof speechConfig === "object" && "voiceConfig" in speechConfig) {
      return speechConfig;
    } else if (typeof speechConfig === "string") {
      return {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: speechConfig
          }
        }
      };
    } else {
      throw new Error(`Unsupported speechConfig type: ${typeof speechConfig}`);
    }
  }
  function tTool(apiClient, tool) {
    return tool;
  }
  function tTools(apiClient, tool) {
    if (!Array.isArray(tool)) {
      throw new Error("tool is required and must be an array of Tools");
    }
    return tool;
  }
  function resourceName(client, resourceName2, resourcePrefix, splitsAfterPrefix = 1) {
    const shouldAppendPrefix = !resourceName2.startsWith(`${resourcePrefix}/`) && resourceName2.split("/").length === splitsAfterPrefix;
    if (client.isVertexAI()) {
      if (resourceName2.startsWith("projects/")) {
        return resourceName2;
      } else if (resourceName2.startsWith("locations/")) {
        return `projects/${client.getProject()}/${resourceName2}`;
      } else if (resourceName2.startsWith(`${resourcePrefix}/`)) {
        return `projects/${client.getProject()}/locations/${client.getLocation()}/${resourceName2}`;
      } else if (shouldAppendPrefix) {
        return `projects/${client.getProject()}/locations/${client.getLocation()}/${resourcePrefix}/${resourceName2}`;
      } else {
        return resourceName2;
      }
    }
    if (shouldAppendPrefix) {
      return `${resourcePrefix}/${resourceName2}`;
    }
    return resourceName2;
  }
  function tCachedContentName(apiClient, name) {
    if (typeof name !== "string") {
      throw new Error("name must be a string");
    }
    return resourceName(apiClient, name, "cachedContents");
  }
  function tBytes(apiClient, fromImageBytes) {
    if (typeof fromImageBytes !== "string") {
      throw new Error("fromImageBytes must be a string");
    }
    return fromImageBytes;
  }
  function tFileName(apiClient, fromName) {
    if (typeof fromName !== "string") {
      throw new Error("fromName must be a string");
    }
    if (fromName.startsWith("files/")) {
      return fromName.split("files/")[1];
    }
    return fromName;
  }
  function partToMldev$1(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["videoMetadata"]) !== void 0) {
      throw new Error("videoMetadata parameter is not supported in Gemini API.");
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partToMldev$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function functionDeclarationToMldev$1(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["response"]) !== void 0) {
      throw new Error("response parameter is not supported in Gemini API.");
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ["parameters"]);
    if (fromParameters != null) {
      setValueByPath(toObject, ["parameters"], fromParameters);
    }
    return toObject;
  }
  function googleSearchToMldev$1() {
    const toObject = {};
    return toObject;
  }
  function dynamicRetrievalConfigToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
      "dynamicThreshold"
    ]);
    if (fromDynamicThreshold != null) {
      setValueByPath(toObject, ["dynamicThreshold"], fromDynamicThreshold);
    }
    return toObject;
  }
  function googleSearchRetrievalToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
      "dynamicRetrievalConfig"
    ]);
    if (fromDynamicRetrievalConfig != null) {
      setValueByPath(toObject, ["dynamicRetrievalConfig"], dynamicRetrievalConfigToMldev$1(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
  }
  function toolToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
      "functionDeclarations"
    ]);
    if (fromFunctionDeclarations != null) {
      if (Array.isArray(fromFunctionDeclarations)) {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations.map((item) => {
          return functionDeclarationToMldev$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations);
      }
    }
    if (getValueByPath(fromObject, ["retrieval"]) !== void 0) {
      throw new Error("retrieval parameter is not supported in Gemini API.");
    }
    const fromGoogleSearch = getValueByPath(fromObject, ["googleSearch"]);
    if (fromGoogleSearch != null) {
      setValueByPath(toObject, ["googleSearch"], googleSearchToMldev$1());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
      "googleSearchRetrieval"
    ]);
    if (fromGoogleSearchRetrieval != null) {
      setValueByPath(toObject, ["googleSearchRetrieval"], googleSearchRetrievalToMldev$1(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
      "codeExecution"
    ]);
    if (fromCodeExecution != null) {
      setValueByPath(toObject, ["codeExecution"], fromCodeExecution);
    }
    return toObject;
  }
  function functionCallingConfigToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
      "allowedFunctionNames"
    ]);
    if (fromAllowedFunctionNames != null) {
      setValueByPath(toObject, ["allowedFunctionNames"], fromAllowedFunctionNames);
    }
    return toObject;
  }
  function toolConfigToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
      "functionCallingConfig"
    ]);
    if (fromFunctionCallingConfig != null) {
      setValueByPath(toObject, ["functionCallingConfig"], functionCallingConfigToMldev$1(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
  }
  function createCachedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ["ttl"]);
    if (parentObject !== void 0 && fromTtl != null) {
      setValueByPath(parentObject, ["ttl"], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (parentObject !== void 0 && fromExpireTime != null) {
      setValueByPath(parentObject, ["expireTime"], fromExpireTime);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (parentObject !== void 0 && fromDisplayName != null) {
      setValueByPath(parentObject, ["displayName"], fromDisplayName);
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (parentObject !== void 0 && fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(parentObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToMldev$1(apiClient, item);
        })));
      } else {
        setValueByPath(parentObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToMldev$1(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], fromTools.map((item) => {
          return toolToMldev$1(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["tools"], fromTools);
      }
    }
    const fromToolConfig = getValueByPath(fromObject, ["toolConfig"]);
    if (parentObject !== void 0 && fromToolConfig != null) {
      setValueByPath(parentObject, ["toolConfig"], toolConfigToMldev$1(apiClient, fromToolConfig));
    }
    return toObject;
  }
  function createCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["model"], tCachesModel(apiClient, fromModel));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], createCachedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function getCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function deleteCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function updateCachedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ["ttl"]);
    if (parentObject !== void 0 && fromTtl != null) {
      setValueByPath(parentObject, ["ttl"], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (parentObject !== void 0 && fromExpireTime != null) {
      setValueByPath(parentObject, ["expireTime"], fromExpireTime);
    }
    return toObject;
  }
  function updateCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], updateCachedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function listCachedContentsConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ["pageSize"]);
    if (parentObject !== void 0 && fromPageSize != null) {
      setValueByPath(parentObject, ["_query", "pageSize"], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ["pageToken"]);
    if (parentObject !== void 0 && fromPageToken != null) {
      setValueByPath(parentObject, ["_query", "pageToken"], fromPageToken);
    }
    return toObject;
  }
  function listCachedContentsParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], listCachedContentsConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function partToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partToVertex$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function schemaToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromExample = getValueByPath(fromObject, ["example"]);
    if (fromExample != null) {
      setValueByPath(toObject, ["example"], fromExample);
    }
    const fromPattern = getValueByPath(fromObject, ["pattern"]);
    if (fromPattern != null) {
      setValueByPath(toObject, ["pattern"], fromPattern);
    }
    const fromDefault = getValueByPath(fromObject, ["default"]);
    if (fromDefault != null) {
      setValueByPath(toObject, ["default"], fromDefault);
    }
    const fromMaxLength = getValueByPath(fromObject, ["maxLength"]);
    if (fromMaxLength != null) {
      setValueByPath(toObject, ["maxLength"], fromMaxLength);
    }
    const fromMinLength = getValueByPath(fromObject, ["minLength"]);
    if (fromMinLength != null) {
      setValueByPath(toObject, ["minLength"], fromMinLength);
    }
    const fromMinProperties = getValueByPath(fromObject, [
      "minProperties"
    ]);
    if (fromMinProperties != null) {
      setValueByPath(toObject, ["minProperties"], fromMinProperties);
    }
    const fromMaxProperties = getValueByPath(fromObject, [
      "maxProperties"
    ]);
    if (fromMaxProperties != null) {
      setValueByPath(toObject, ["maxProperties"], fromMaxProperties);
    }
    const fromAnyOf = getValueByPath(fromObject, ["anyOf"]);
    if (fromAnyOf != null) {
      setValueByPath(toObject, ["anyOf"], fromAnyOf);
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ["enum"]);
    if (fromEnum != null) {
      setValueByPath(toObject, ["enum"], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ["format"]);
    if (fromFormat != null) {
      setValueByPath(toObject, ["format"], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ["items"]);
    if (fromItems != null) {
      setValueByPath(toObject, ["items"], fromItems);
    }
    const fromMaxItems = getValueByPath(fromObject, ["maxItems"]);
    if (fromMaxItems != null) {
      setValueByPath(toObject, ["maxItems"], fromMaxItems);
    }
    const fromMaximum = getValueByPath(fromObject, ["maximum"]);
    if (fromMaximum != null) {
      setValueByPath(toObject, ["maximum"], fromMaximum);
    }
    const fromMinItems = getValueByPath(fromObject, ["minItems"]);
    if (fromMinItems != null) {
      setValueByPath(toObject, ["minItems"], fromMinItems);
    }
    const fromMinimum = getValueByPath(fromObject, ["minimum"]);
    if (fromMinimum != null) {
      setValueByPath(toObject, ["minimum"], fromMinimum);
    }
    const fromNullable = getValueByPath(fromObject, ["nullable"]);
    if (fromNullable != null) {
      setValueByPath(toObject, ["nullable"], fromNullable);
    }
    const fromProperties = getValueByPath(fromObject, ["properties"]);
    if (fromProperties != null) {
      setValueByPath(toObject, ["properties"], fromProperties);
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
      "propertyOrdering"
    ]);
    if (fromPropertyOrdering != null) {
      setValueByPath(toObject, ["propertyOrdering"], fromPropertyOrdering);
    }
    const fromRequired = getValueByPath(fromObject, ["required"]);
    if (fromRequired != null) {
      setValueByPath(toObject, ["required"], fromRequired);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (fromTitle != null) {
      setValueByPath(toObject, ["title"], fromTitle);
    }
    const fromType = getValueByPath(fromObject, ["type"]);
    if (fromType != null) {
      setValueByPath(toObject, ["type"], fromType);
    }
    return toObject;
  }
  function functionDeclarationToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromResponse = getValueByPath(fromObject, ["response"]);
    if (fromResponse != null) {
      setValueByPath(toObject, ["response"], schemaToVertex$1(apiClient, fromResponse));
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ["parameters"]);
    if (fromParameters != null) {
      setValueByPath(toObject, ["parameters"], fromParameters);
    }
    return toObject;
  }
  function googleSearchToVertex$1() {
    const toObject = {};
    return toObject;
  }
  function dynamicRetrievalConfigToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
      "dynamicThreshold"
    ]);
    if (fromDynamicThreshold != null) {
      setValueByPath(toObject, ["dynamicThreshold"], fromDynamicThreshold);
    }
    return toObject;
  }
  function googleSearchRetrievalToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
      "dynamicRetrievalConfig"
    ]);
    if (fromDynamicRetrievalConfig != null) {
      setValueByPath(toObject, ["dynamicRetrievalConfig"], dynamicRetrievalConfigToVertex$1(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
  }
  function toolToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
      "functionDeclarations"
    ]);
    if (fromFunctionDeclarations != null) {
      if (Array.isArray(fromFunctionDeclarations)) {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations.map((item) => {
          return functionDeclarationToVertex$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations);
      }
    }
    const fromRetrieval = getValueByPath(fromObject, ["retrieval"]);
    if (fromRetrieval != null) {
      setValueByPath(toObject, ["retrieval"], fromRetrieval);
    }
    const fromGoogleSearch = getValueByPath(fromObject, ["googleSearch"]);
    if (fromGoogleSearch != null) {
      setValueByPath(toObject, ["googleSearch"], googleSearchToVertex$1());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
      "googleSearchRetrieval"
    ]);
    if (fromGoogleSearchRetrieval != null) {
      setValueByPath(toObject, ["googleSearchRetrieval"], googleSearchRetrievalToVertex$1(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
      "codeExecution"
    ]);
    if (fromCodeExecution != null) {
      setValueByPath(toObject, ["codeExecution"], fromCodeExecution);
    }
    return toObject;
  }
  function functionCallingConfigToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
      "allowedFunctionNames"
    ]);
    if (fromAllowedFunctionNames != null) {
      setValueByPath(toObject, ["allowedFunctionNames"], fromAllowedFunctionNames);
    }
    return toObject;
  }
  function toolConfigToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
      "functionCallingConfig"
    ]);
    if (fromFunctionCallingConfig != null) {
      setValueByPath(toObject, ["functionCallingConfig"], functionCallingConfigToVertex$1(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
  }
  function createCachedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ["ttl"]);
    if (parentObject !== void 0 && fromTtl != null) {
      setValueByPath(parentObject, ["ttl"], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (parentObject !== void 0 && fromExpireTime != null) {
      setValueByPath(parentObject, ["expireTime"], fromExpireTime);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (parentObject !== void 0 && fromDisplayName != null) {
      setValueByPath(parentObject, ["displayName"], fromDisplayName);
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (parentObject !== void 0 && fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(parentObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToVertex$1(apiClient, item);
        })));
      } else {
        setValueByPath(parentObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToVertex$1(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], fromTools.map((item) => {
          return toolToVertex$1(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["tools"], fromTools);
      }
    }
    const fromToolConfig = getValueByPath(fromObject, ["toolConfig"]);
    if (parentObject !== void 0 && fromToolConfig != null) {
      setValueByPath(parentObject, ["toolConfig"], toolConfigToVertex$1(apiClient, fromToolConfig));
    }
    return toObject;
  }
  function createCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["model"], tCachesModel(apiClient, fromModel));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], createCachedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function getCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function deleteCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function updateCachedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ["ttl"]);
    if (parentObject !== void 0 && fromTtl != null) {
      setValueByPath(parentObject, ["ttl"], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (parentObject !== void 0 && fromExpireTime != null) {
      setValueByPath(parentObject, ["expireTime"], fromExpireTime);
    }
    return toObject;
  }
  function updateCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], updateCachedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function listCachedContentsConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ["pageSize"]);
    if (parentObject !== void 0 && fromPageSize != null) {
      setValueByPath(parentObject, ["_query", "pageSize"], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ["pageToken"]);
    if (parentObject !== void 0 && fromPageToken != null) {
      setValueByPath(parentObject, ["_query", "pageToken"], fromPageToken);
    }
    return toObject;
  }
  function listCachedContentsParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], listCachedContentsConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function cachedContentFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["model"], fromModel);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (fromExpireTime != null) {
      setValueByPath(toObject, ["expireTime"], fromExpireTime);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], fromUsageMetadata);
    }
    return toObject;
  }
  function deleteCachedContentResponseFromMldev() {
    const toObject = {};
    return toObject;
  }
  function listCachedContentsResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
      "nextPageToken"
    ]);
    if (fromNextPageToken != null) {
      setValueByPath(toObject, ["nextPageToken"], fromNextPageToken);
    }
    const fromCachedContents = getValueByPath(fromObject, [
      "cachedContents"
    ]);
    if (fromCachedContents != null) {
      if (Array.isArray(fromCachedContents)) {
        setValueByPath(toObject, ["cachedContents"], fromCachedContents.map((item) => {
          return cachedContentFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["cachedContents"], fromCachedContents);
      }
    }
    return toObject;
  }
  function cachedContentFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["model"], fromModel);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (fromExpireTime != null) {
      setValueByPath(toObject, ["expireTime"], fromExpireTime);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], fromUsageMetadata);
    }
    return toObject;
  }
  function deleteCachedContentResponseFromVertex() {
    const toObject = {};
    return toObject;
  }
  function listCachedContentsResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
      "nextPageToken"
    ]);
    if (fromNextPageToken != null) {
      setValueByPath(toObject, ["nextPageToken"], fromNextPageToken);
    }
    const fromCachedContents = getValueByPath(fromObject, [
      "cachedContents"
    ]);
    if (fromCachedContents != null) {
      if (Array.isArray(fromCachedContents)) {
        setValueByPath(toObject, ["cachedContents"], fromCachedContents.map((item) => {
          return cachedContentFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["cachedContents"], fromCachedContents);
      }
    }
    return toObject;
  }
  var PagedItem;
  (function(PagedItem2) {
    PagedItem2["PAGED_ITEM_BATCH_JOBS"] = "batchJobs";
    PagedItem2["PAGED_ITEM_MODELS"] = "models";
    PagedItem2["PAGED_ITEM_TUNING_JOBS"] = "tuningJobs";
    PagedItem2["PAGED_ITEM_FILES"] = "files";
    PagedItem2["PAGED_ITEM_CACHED_CONTENTS"] = "cachedContents";
  })(PagedItem || (PagedItem = {}));
  var Pager = class {
    constructor(name, request, response, params) {
      this.pageInternal = [];
      this.paramsInternal = {};
      this.requestInternal = request;
      this.init(name, response, params);
    }
    init(name, response, params) {
      var _a2, _b;
      this.nameInternal = name;
      this.pageInternal = response[this.nameInternal] || [];
      this.idxInternal = 0;
      let requestParams = { config: {} };
      if (!params) {
        requestParams = { config: {} };
      } else if (typeof params === "object") {
        requestParams = Object.assign({}, params);
      } else {
        requestParams = params;
      }
      if (requestParams["config"]) {
        requestParams["config"]["pageToken"] = response["nextPageToken"];
      }
      this.paramsInternal = requestParams;
      this.pageInternalSize = (_b = (_a2 = requestParams["config"]) === null || _a2 === void 0 ? void 0 : _a2["pageSize"]) !== null && _b !== void 0 ? _b : this.pageInternal.length;
    }
    initNextPage(response) {
      this.init(this.nameInternal, response, this.paramsInternal);
    }
    get page() {
      return this.pageInternal;
    }
    get name() {
      return this.nameInternal;
    }
    get pageSize() {
      return this.pageInternalSize;
    }
    get params() {
      return this.paramsInternal;
    }
    get pageLength() {
      return this.pageInternal.length;
    }
    getItem(index) {
      return this.pageInternal[index];
    }
    [Symbol.asyncIterator]() {
      return {
        next: async () => {
          if (this.idxInternal >= this.pageLength) {
            if (this.hasNextPage()) {
              await this.nextPage();
            } else {
              return { value: void 0, done: true };
            }
          }
          const item = this.getItem(this.idxInternal);
          this.idxInternal += 1;
          return { value: item, done: false };
        },
        return: async () => {
          return { value: void 0, done: true };
        }
      };
    }
    async nextPage() {
      if (!this.hasNextPage()) {
        throw new Error("No more pages to fetch.");
      }
      const response = await this.requestInternal(this.params);
      this.initNextPage(response);
      return this.page;
    }
    hasNextPage() {
      var _a2;
      if (((_a2 = this.params["config"]) === null || _a2 === void 0 ? void 0 : _a2["pageToken"]) !== void 0) {
        return true;
      }
      return false;
    }
  };
  var Outcome;
  (function(Outcome2) {
    Outcome2["OUTCOME_UNSPECIFIED"] = "OUTCOME_UNSPECIFIED";
    Outcome2["OUTCOME_OK"] = "OUTCOME_OK";
    Outcome2["OUTCOME_FAILED"] = "OUTCOME_FAILED";
    Outcome2["OUTCOME_DEADLINE_EXCEEDED"] = "OUTCOME_DEADLINE_EXCEEDED";
  })(Outcome || (Outcome = {}));
  var Language;
  (function(Language2) {
    Language2["LANGUAGE_UNSPECIFIED"] = "LANGUAGE_UNSPECIFIED";
    Language2["PYTHON"] = "PYTHON";
  })(Language || (Language = {}));
  var Type;
  (function(Type2) {
    Type2["TYPE_UNSPECIFIED"] = "TYPE_UNSPECIFIED";
    Type2["STRING"] = "STRING";
    Type2["NUMBER"] = "NUMBER";
    Type2["INTEGER"] = "INTEGER";
    Type2["BOOLEAN"] = "BOOLEAN";
    Type2["ARRAY"] = "ARRAY";
    Type2["OBJECT"] = "OBJECT";
  })(Type || (Type = {}));
  var HarmCategory;
  (function(HarmCategory2) {
    HarmCategory2["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
    HarmCategory2["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
    HarmCategory2["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
    HarmCategory2["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
    HarmCategory2["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
    HarmCategory2["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
  })(HarmCategory || (HarmCategory = {}));
  var HarmBlockMethod;
  (function(HarmBlockMethod2) {
    HarmBlockMethod2["HARM_BLOCK_METHOD_UNSPECIFIED"] = "HARM_BLOCK_METHOD_UNSPECIFIED";
    HarmBlockMethod2["SEVERITY"] = "SEVERITY";
    HarmBlockMethod2["PROBABILITY"] = "PROBABILITY";
  })(HarmBlockMethod || (HarmBlockMethod = {}));
  var HarmBlockThreshold;
  (function(HarmBlockThreshold2) {
    HarmBlockThreshold2["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
    HarmBlockThreshold2["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    HarmBlockThreshold2["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    HarmBlockThreshold2["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    HarmBlockThreshold2["BLOCK_NONE"] = "BLOCK_NONE";
    HarmBlockThreshold2["OFF"] = "OFF";
  })(HarmBlockThreshold || (HarmBlockThreshold = {}));
  var Mode;
  (function(Mode2) {
    Mode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    Mode2["MODE_DYNAMIC"] = "MODE_DYNAMIC";
  })(Mode || (Mode = {}));
  var FinishReason;
  (function(FinishReason2) {
    FinishReason2["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
    FinishReason2["STOP"] = "STOP";
    FinishReason2["MAX_TOKENS"] = "MAX_TOKENS";
    FinishReason2["SAFETY"] = "SAFETY";
    FinishReason2["RECITATION"] = "RECITATION";
    FinishReason2["OTHER"] = "OTHER";
    FinishReason2["BLOCKLIST"] = "BLOCKLIST";
    FinishReason2["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
    FinishReason2["SPII"] = "SPII";
    FinishReason2["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
    FinishReason2["IMAGE_SAFETY"] = "IMAGE_SAFETY";
  })(FinishReason || (FinishReason = {}));
  var HarmProbability;
  (function(HarmProbability2) {
    HarmProbability2["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
    HarmProbability2["NEGLIGIBLE"] = "NEGLIGIBLE";
    HarmProbability2["LOW"] = "LOW";
    HarmProbability2["MEDIUM"] = "MEDIUM";
    HarmProbability2["HIGH"] = "HIGH";
  })(HarmProbability || (HarmProbability = {}));
  var HarmSeverity;
  (function(HarmSeverity2) {
    HarmSeverity2["HARM_SEVERITY_UNSPECIFIED"] = "HARM_SEVERITY_UNSPECIFIED";
    HarmSeverity2["HARM_SEVERITY_NEGLIGIBLE"] = "HARM_SEVERITY_NEGLIGIBLE";
    HarmSeverity2["HARM_SEVERITY_LOW"] = "HARM_SEVERITY_LOW";
    HarmSeverity2["HARM_SEVERITY_MEDIUM"] = "HARM_SEVERITY_MEDIUM";
    HarmSeverity2["HARM_SEVERITY_HIGH"] = "HARM_SEVERITY_HIGH";
  })(HarmSeverity || (HarmSeverity = {}));
  var BlockedReason;
  (function(BlockedReason2) {
    BlockedReason2["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
    BlockedReason2["SAFETY"] = "SAFETY";
    BlockedReason2["OTHER"] = "OTHER";
    BlockedReason2["BLOCKLIST"] = "BLOCKLIST";
    BlockedReason2["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
  })(BlockedReason || (BlockedReason = {}));
  var Modality;
  (function(Modality2) {
    Modality2["MODALITY_UNSPECIFIED"] = "MODALITY_UNSPECIFIED";
    Modality2["TEXT"] = "TEXT";
    Modality2["IMAGE"] = "IMAGE";
    Modality2["AUDIO"] = "AUDIO";
  })(Modality || (Modality = {}));
  var State;
  (function(State2) {
    State2["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    State2["ACTIVE"] = "ACTIVE";
    State2["ERROR"] = "ERROR";
  })(State || (State = {}));
  var DynamicRetrievalConfigMode;
  (function(DynamicRetrievalConfigMode2) {
    DynamicRetrievalConfigMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    DynamicRetrievalConfigMode2["MODE_DYNAMIC"] = "MODE_DYNAMIC";
  })(DynamicRetrievalConfigMode || (DynamicRetrievalConfigMode = {}));
  var FunctionCallingConfigMode;
  (function(FunctionCallingConfigMode2) {
    FunctionCallingConfigMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    FunctionCallingConfigMode2["AUTO"] = "AUTO";
    FunctionCallingConfigMode2["ANY"] = "ANY";
    FunctionCallingConfigMode2["NONE"] = "NONE";
  })(FunctionCallingConfigMode || (FunctionCallingConfigMode = {}));
  var MediaResolution;
  (function(MediaResolution2) {
    MediaResolution2["MEDIA_RESOLUTION_UNSPECIFIED"] = "MEDIA_RESOLUTION_UNSPECIFIED";
    MediaResolution2["MEDIA_RESOLUTION_LOW"] = "MEDIA_RESOLUTION_LOW";
    MediaResolution2["MEDIA_RESOLUTION_MEDIUM"] = "MEDIA_RESOLUTION_MEDIUM";
    MediaResolution2["MEDIA_RESOLUTION_HIGH"] = "MEDIA_RESOLUTION_HIGH";
  })(MediaResolution || (MediaResolution = {}));
  var SafetyFilterLevel;
  (function(SafetyFilterLevel2) {
    SafetyFilterLevel2["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    SafetyFilterLevel2["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    SafetyFilterLevel2["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    SafetyFilterLevel2["BLOCK_NONE"] = "BLOCK_NONE";
  })(SafetyFilterLevel || (SafetyFilterLevel = {}));
  var PersonGeneration;
  (function(PersonGeneration2) {
    PersonGeneration2["DONT_ALLOW"] = "DONT_ALLOW";
    PersonGeneration2["ALLOW_ADULT"] = "ALLOW_ADULT";
    PersonGeneration2["ALLOW_ALL"] = "ALLOW_ALL";
  })(PersonGeneration || (PersonGeneration = {}));
  var ImagePromptLanguage;
  (function(ImagePromptLanguage2) {
    ImagePromptLanguage2["auto"] = "auto";
    ImagePromptLanguage2["en"] = "en";
    ImagePromptLanguage2["ja"] = "ja";
    ImagePromptLanguage2["ko"] = "ko";
    ImagePromptLanguage2["hi"] = "hi";
  })(ImagePromptLanguage || (ImagePromptLanguage = {}));
  var FileState;
  (function(FileState2) {
    FileState2["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    FileState2["PROCESSING"] = "PROCESSING";
    FileState2["ACTIVE"] = "ACTIVE";
    FileState2["FAILED"] = "FAILED";
  })(FileState || (FileState = {}));
  var FileSource;
  (function(FileSource2) {
    FileSource2["SOURCE_UNSPECIFIED"] = "SOURCE_UNSPECIFIED";
    FileSource2["UPLOADED"] = "UPLOADED";
    FileSource2["GENERATED"] = "GENERATED";
  })(FileSource || (FileSource = {}));
  var MaskReferenceMode;
  (function(MaskReferenceMode2) {
    MaskReferenceMode2["MASK_MODE_DEFAULT"] = "MASK_MODE_DEFAULT";
    MaskReferenceMode2["MASK_MODE_USER_PROVIDED"] = "MASK_MODE_USER_PROVIDED";
    MaskReferenceMode2["MASK_MODE_BACKGROUND"] = "MASK_MODE_BACKGROUND";
    MaskReferenceMode2["MASK_MODE_FOREGROUND"] = "MASK_MODE_FOREGROUND";
    MaskReferenceMode2["MASK_MODE_SEMANTIC"] = "MASK_MODE_SEMANTIC";
  })(MaskReferenceMode || (MaskReferenceMode = {}));
  var ControlReferenceType;
  (function(ControlReferenceType2) {
    ControlReferenceType2["CONTROL_TYPE_DEFAULT"] = "CONTROL_TYPE_DEFAULT";
    ControlReferenceType2["CONTROL_TYPE_CANNY"] = "CONTROL_TYPE_CANNY";
    ControlReferenceType2["CONTROL_TYPE_SCRIBBLE"] = "CONTROL_TYPE_SCRIBBLE";
    ControlReferenceType2["CONTROL_TYPE_FACE_MESH"] = "CONTROL_TYPE_FACE_MESH";
  })(ControlReferenceType || (ControlReferenceType = {}));
  var SubjectReferenceType;
  (function(SubjectReferenceType2) {
    SubjectReferenceType2["SUBJECT_TYPE_DEFAULT"] = "SUBJECT_TYPE_DEFAULT";
    SubjectReferenceType2["SUBJECT_TYPE_PERSON"] = "SUBJECT_TYPE_PERSON";
    SubjectReferenceType2["SUBJECT_TYPE_ANIMAL"] = "SUBJECT_TYPE_ANIMAL";
    SubjectReferenceType2["SUBJECT_TYPE_PRODUCT"] = "SUBJECT_TYPE_PRODUCT";
  })(SubjectReferenceType || (SubjectReferenceType = {}));
  var GenerateContentResponse = class {
    get text() {
      var _a2, _b, _c, _d, _e, _f, _g, _h;
      if (((_d = (_c = (_b = (_a2 = this.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
        return void 0;
      }
      if (this.candidates && this.candidates.length > 1) {
        console.warn("there are multiple candidates in the response, returning text from the first one.");
      }
      let text = "";
      let anyTextPartText = false;
      const nonTextParts = [];
      for (const part of (_h = (_g = (_f = (_e = this.candidates) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) !== null && _h !== void 0 ? _h : []) {
        for (const [fieldName, fieldValue] of Object.entries(part)) {
          if (fieldName !== "text" && fieldName !== "thought" && (fieldValue !== null || fieldValue !== void 0)) {
            nonTextParts.push(fieldName);
          }
        }
        if (typeof part.text === "string") {
          if (typeof part.thought === "boolean" && part.thought) {
            continue;
          }
          anyTextPartText = true;
          text += part.text;
        }
      }
      if (nonTextParts.length > 0) {
        console.warn(`there are non-text parts ${nonTextParts} in the response, returning concatenation of all text parts. Please refer to the non text parts for a full response from model.`);
      }
      return anyTextPartText ? text : void 0;
    }
    get functionCalls() {
      var _a2, _b, _c, _d, _e, _f, _g, _h;
      if (((_d = (_c = (_b = (_a2 = this.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
        return void 0;
      }
      if (this.candidates && this.candidates.length > 1) {
        console.warn("there are multiple candidates in the response, returning function calls from the first one.");
      }
      const functionCalls = (_h = (_g = (_f = (_e = this.candidates) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) === null || _h === void 0 ? void 0 : _h.filter((part) => part.functionCall).map((part) => part.functionCall).filter((functionCall) => functionCall !== void 0);
      if ((functionCalls === null || functionCalls === void 0 ? void 0 : functionCalls.length) === 0) {
        return void 0;
      }
      return functionCalls;
    }
    get executableCode() {
      var _a2, _b, _c, _d, _e, _f, _g, _h, _j;
      if (((_d = (_c = (_b = (_a2 = this.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
        return void 0;
      }
      if (this.candidates && this.candidates.length > 1) {
        console.warn("there are multiple candidates in the response, returning executable code from the first one.");
      }
      const executableCode = (_h = (_g = (_f = (_e = this.candidates) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) === null || _h === void 0 ? void 0 : _h.filter((part) => part.executableCode).map((part) => part.executableCode).filter((executableCode2) => executableCode2 !== void 0);
      if ((executableCode === null || executableCode === void 0 ? void 0 : executableCode.length) === 0) {
        return void 0;
      }
      return (_j = executableCode === null || executableCode === void 0 ? void 0 : executableCode[0]) === null || _j === void 0 ? void 0 : _j.code;
    }
    get codeExecutionResult() {
      var _a2, _b, _c, _d, _e, _f, _g, _h, _j;
      if (((_d = (_c = (_b = (_a2 = this.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
        return void 0;
      }
      if (this.candidates && this.candidates.length > 1) {
        console.warn("there are multiple candidates in the response, returning code execution result from the first one.");
      }
      const codeExecutionResult = (_h = (_g = (_f = (_e = this.candidates) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) === null || _h === void 0 ? void 0 : _h.filter((part) => part.codeExecutionResult).map((part) => part.codeExecutionResult).filter((codeExecutionResult2) => codeExecutionResult2 !== void 0);
      if ((codeExecutionResult === null || codeExecutionResult === void 0 ? void 0 : codeExecutionResult.length) === 0) {
        return void 0;
      }
      return (_j = codeExecutionResult === null || codeExecutionResult === void 0 ? void 0 : codeExecutionResult[0]) === null || _j === void 0 ? void 0 : _j.output;
    }
  };
  var EmbedContentResponse = class {
  };
  var GenerateImagesResponse = class {
  };
  var CountTokensResponse = class {
  };
  var ComputeTokensResponse = class {
  };
  var DeleteCachedContentResponse = class {
  };
  var ListCachedContentsResponse = class {
  };
  var ListFilesResponse = class {
  };
  var HttpResponse = class {
    constructor(response) {
      const headers = {};
      for (const pair of response.headers.entries()) {
        headers[pair[0]] = pair[1];
      }
      this.headers = headers;
      this.responseInternal = response;
    }
    json() {
      return this.responseInternal.json();
    }
  };
  var CreateFileResponse = class {
  };
  var DeleteFileResponse = class {
  };
  var Caches = class extends BaseModule {
    constructor(apiClient) {
      super();
      this.apiClient = apiClient;
      this.list = async (params = {}) => {
        return new Pager(PagedItem.PAGED_ITEM_CACHED_CONTENTS, (x) => this.listInternal(x), await this.listInternal(params), params);
      };
    }
    async create(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = createCachedContentParametersToVertex(this.apiClient, params);
        path = formatMap("cachedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromVertex(this.apiClient, apiResponse);
          return resp;
        });
      } else {
        const body = createCachedContentParametersToMldev(this.apiClient, params);
        path = formatMap("cachedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromMldev(this.apiClient, apiResponse);
          return resp;
        });
      }
    }
    async get(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = getCachedContentParametersToVertex(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromVertex(this.apiClient, apiResponse);
          return resp;
        });
      } else {
        const body = getCachedContentParametersToMldev(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromMldev(this.apiClient, apiResponse);
          return resp;
        });
      }
    }
    async delete(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = deleteCachedContentParametersToVertex(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "DELETE",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then(() => {
          const resp = deleteCachedContentResponseFromVertex();
          const typedResp = new DeleteCachedContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = deleteCachedContentParametersToMldev(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "DELETE",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then(() => {
          const resp = deleteCachedContentResponseFromMldev();
          const typedResp = new DeleteCachedContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async update(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = updateCachedContentParametersToVertex(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "PATCH",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromVertex(this.apiClient, apiResponse);
          return resp;
        });
      } else {
        const body = updateCachedContentParametersToMldev(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "PATCH",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromMldev(this.apiClient, apiResponse);
          return resp;
        });
      }
    }
    async listInternal(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = listCachedContentsParametersToVertex(this.apiClient, params);
        path = formatMap("cachedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = listCachedContentsResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new ListCachedContentsResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = listCachedContentsParametersToMldev(this.apiClient, params);
        path = formatMap("cachedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = listCachedContentsResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new ListCachedContentsResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
  };
  function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }
  function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
  }
  function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator)
      throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
      return this;
    }, i;
    function awaitReturn(f) {
      return function(v) {
        return Promise.resolve(v).then(f, reject);
      };
    }
    function verb(n, f) {
      if (g[n]) {
        i[n] = function(v) {
          return new Promise(function(a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
        if (f)
          i[n] = f(i[n]);
      }
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v) {
      if (f(v), q.shift(), q.length)
        resume(q[0][0], q[0][1]);
    }
  }
  function __asyncValues(o) {
    if (!Symbol.asyncIterator)
      throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
      return this;
    }, i);
    function verb(n) {
      i[n] = o[n] && function(v) {
        return new Promise(function(resolve, reject) {
          v = o[n](v), settle(resolve, reject, v.done, v.value);
        });
      };
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function(v2) {
        resolve({ value: v2, done: d });
      }, reject);
    }
  }
  function isValidResponse(response) {
    var _a2;
    if (response.candidates == void 0 || response.candidates.length === 0) {
      return false;
    }
    const content = (_a2 = response.candidates[0]) === null || _a2 === void 0 ? void 0 : _a2.content;
    if (content === void 0) {
      return false;
    }
    return isValidContent(content);
  }
  function isValidContent(content) {
    if (content.parts === void 0 || content.parts.length === 0) {
      return false;
    }
    for (const part of content.parts) {
      if (part === void 0 || Object.keys(part).length === 0) {
        return false;
      }
      if (part.text !== void 0 && part.text === "") {
        return false;
      }
    }
    return true;
  }
  function validateHistory(history) {
    if (history.length === 0) {
      return;
    }
    if (history[0].role !== "user") {
      throw new Error("History must start with a user turn.");
    }
    for (const content of history) {
      if (content.role !== "user" && content.role !== "model") {
        throw new Error(`Role must be user or model, but got ${content.role}.`);
      }
    }
  }
  function extractCuratedHistory(comprehensiveHistory) {
    if (comprehensiveHistory === void 0 || comprehensiveHistory.length === 0) {
      return [];
    }
    const curatedHistory = [];
    const length = comprehensiveHistory.length;
    let i = 0;
    let userInput = comprehensiveHistory[0];
    while (i < length) {
      if (comprehensiveHistory[i].role === "user") {
        userInput = comprehensiveHistory[i];
        i++;
      } else {
        const modelOutput = [];
        let isValid = true;
        while (i < length && comprehensiveHistory[i].role === "model") {
          modelOutput.push(comprehensiveHistory[i]);
          if (isValid && !isValidContent(comprehensiveHistory[i])) {
            isValid = false;
          }
          i++;
        }
        if (isValid) {
          curatedHistory.push(userInput);
          curatedHistory.push(...modelOutput);
        }
      }
    }
    return curatedHistory;
  }
  var Chats = class {
    constructor(modelsModule, apiClient) {
      this.modelsModule = modelsModule;
      this.apiClient = apiClient;
    }
    create(params) {
      return new Chat(this.apiClient, this.modelsModule, params.model, params.config, params.history);
    }
  };
  var Chat = class {
    constructor(apiClient, modelsModule, model, config = {}, history = []) {
      this.apiClient = apiClient;
      this.modelsModule = modelsModule;
      this.model = model;
      this.config = config;
      this.history = history;
      this.sendPromise = Promise.resolve();
      validateHistory(history);
    }
    async sendMessage(params) {
      var _a2;
      await this.sendPromise;
      const inputContent = tContent(this.apiClient, params.message);
      const responsePromise = this.modelsModule.generateContent({
        model: this.model,
        contents: this.getHistory(true).concat(inputContent),
        config: (_a2 = params.config) !== null && _a2 !== void 0 ? _a2 : this.config
      });
      this.sendPromise = (async () => {
        var _a3, _b;
        const response = await responsePromise;
        const outputContent = (_b = (_a3 = response.candidates) === null || _a3 === void 0 ? void 0 : _a3[0]) === null || _b === void 0 ? void 0 : _b.content;
        const modelOutput = outputContent ? [outputContent] : [];
        this.recordHistory(inputContent, modelOutput);
        return;
      })();
      await this.sendPromise;
      return responsePromise;
    }
    async sendMessageStream(params) {
      var _a2;
      await this.sendPromise;
      const inputContent = tContent(this.apiClient, params.message);
      const streamResponse = this.modelsModule.generateContentStream({
        model: this.model,
        contents: this.getHistory(true).concat(inputContent),
        config: (_a2 = params.config) !== null && _a2 !== void 0 ? _a2 : this.config
      });
      this.sendPromise = streamResponse.then(() => void 0);
      const response = await streamResponse;
      const result = this.processStreamResponse(response, inputContent);
      return result;
    }
    getHistory(curated = false) {
      return curated ? extractCuratedHistory(this.history) : this.history;
    }
    processStreamResponse(streamResponse, inputContent) {
      var _a2, _b;
      return __asyncGenerator(this, arguments, function* processStreamResponse_1() {
        var _c, e_1, _d, _e;
        const outputContent = [];
        try {
          for (var _f = true, streamResponse_1 = __asyncValues(streamResponse), streamResponse_1_1; streamResponse_1_1 = yield __await(streamResponse_1.next()), _c = streamResponse_1_1.done, !_c; _f = true) {
            _e = streamResponse_1_1.value;
            _f = false;
            const chunk = _e;
            if (isValidResponse(chunk)) {
              const content = (_b = (_a2 = chunk.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content;
              if (content !== void 0) {
                outputContent.push(content);
              }
            }
            yield yield __await(chunk);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (!_f && !_c && (_d = streamResponse_1.return))
              yield __await(_d.call(streamResponse_1));
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
        this.recordHistory(inputContent, outputContent);
      });
    }
    recordHistory(userInput, modelOutput) {
      let outputContents = [];
      if (modelOutput.length > 0 && modelOutput.every((content) => content.role === "model")) {
        outputContents = modelOutput;
      } else {
        outputContents.push({
          role: "model",
          parts: []
        });
      }
      this.history.push(userInput);
      this.history.push(...outputContents);
    }
  };
  function partToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["videoMetadata"]) !== void 0) {
      throw new Error("videoMetadata parameter is not supported in Gemini API.");
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partToMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function schemaToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["example"]) !== void 0) {
      throw new Error("example parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["pattern"]) !== void 0) {
      throw new Error("pattern parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["default"]) !== void 0) {
      throw new Error("default parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["maxLength"]) !== void 0) {
      throw new Error("maxLength parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["minLength"]) !== void 0) {
      throw new Error("minLength parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["minProperties"]) !== void 0) {
      throw new Error("minProperties parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["maxProperties"]) !== void 0) {
      throw new Error("maxProperties parameter is not supported in Gemini API.");
    }
    const fromAnyOf = getValueByPath(fromObject, ["anyOf"]);
    if (fromAnyOf != null) {
      setValueByPath(toObject, ["anyOf"], fromAnyOf);
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ["enum"]);
    if (fromEnum != null) {
      setValueByPath(toObject, ["enum"], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ["format"]);
    if (fromFormat != null) {
      setValueByPath(toObject, ["format"], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ["items"]);
    if (fromItems != null) {
      setValueByPath(toObject, ["items"], fromItems);
    }
    const fromMaxItems = getValueByPath(fromObject, ["maxItems"]);
    if (fromMaxItems != null) {
      setValueByPath(toObject, ["maxItems"], fromMaxItems);
    }
    const fromMaximum = getValueByPath(fromObject, ["maximum"]);
    if (fromMaximum != null) {
      setValueByPath(toObject, ["maximum"], fromMaximum);
    }
    const fromMinItems = getValueByPath(fromObject, ["minItems"]);
    if (fromMinItems != null) {
      setValueByPath(toObject, ["minItems"], fromMinItems);
    }
    const fromMinimum = getValueByPath(fromObject, ["minimum"]);
    if (fromMinimum != null) {
      setValueByPath(toObject, ["minimum"], fromMinimum);
    }
    const fromNullable = getValueByPath(fromObject, ["nullable"]);
    if (fromNullable != null) {
      setValueByPath(toObject, ["nullable"], fromNullable);
    }
    const fromProperties = getValueByPath(fromObject, ["properties"]);
    if (fromProperties != null) {
      setValueByPath(toObject, ["properties"], fromProperties);
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
      "propertyOrdering"
    ]);
    if (fromPropertyOrdering != null) {
      setValueByPath(toObject, ["propertyOrdering"], fromPropertyOrdering);
    }
    const fromRequired = getValueByPath(fromObject, ["required"]);
    if (fromRequired != null) {
      setValueByPath(toObject, ["required"], fromRequired);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (fromTitle != null) {
      setValueByPath(toObject, ["title"], fromTitle);
    }
    const fromType = getValueByPath(fromObject, ["type"]);
    if (fromType != null) {
      setValueByPath(toObject, ["type"], fromType);
    }
    return toObject;
  }
  function safetySettingToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["method"]) !== void 0) {
      throw new Error("method parameter is not supported in Gemini API.");
    }
    const fromCategory = getValueByPath(fromObject, ["category"]);
    if (fromCategory != null) {
      setValueByPath(toObject, ["category"], fromCategory);
    }
    const fromThreshold = getValueByPath(fromObject, ["threshold"]);
    if (fromThreshold != null) {
      setValueByPath(toObject, ["threshold"], fromThreshold);
    }
    return toObject;
  }
  function functionDeclarationToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["response"]) !== void 0) {
      throw new Error("response parameter is not supported in Gemini API.");
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ["parameters"]);
    if (fromParameters != null) {
      setValueByPath(toObject, ["parameters"], fromParameters);
    }
    return toObject;
  }
  function googleSearchToMldev() {
    const toObject = {};
    return toObject;
  }
  function dynamicRetrievalConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
      "dynamicThreshold"
    ]);
    if (fromDynamicThreshold != null) {
      setValueByPath(toObject, ["dynamicThreshold"], fromDynamicThreshold);
    }
    return toObject;
  }
  function googleSearchRetrievalToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
      "dynamicRetrievalConfig"
    ]);
    if (fromDynamicRetrievalConfig != null) {
      setValueByPath(toObject, ["dynamicRetrievalConfig"], dynamicRetrievalConfigToMldev(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
  }
  function toolToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
      "functionDeclarations"
    ]);
    if (fromFunctionDeclarations != null) {
      if (Array.isArray(fromFunctionDeclarations)) {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations.map((item) => {
          return functionDeclarationToMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations);
      }
    }
    if (getValueByPath(fromObject, ["retrieval"]) !== void 0) {
      throw new Error("retrieval parameter is not supported in Gemini API.");
    }
    const fromGoogleSearch = getValueByPath(fromObject, ["googleSearch"]);
    if (fromGoogleSearch != null) {
      setValueByPath(toObject, ["googleSearch"], googleSearchToMldev());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
      "googleSearchRetrieval"
    ]);
    if (fromGoogleSearchRetrieval != null) {
      setValueByPath(toObject, ["googleSearchRetrieval"], googleSearchRetrievalToMldev(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
      "codeExecution"
    ]);
    if (fromCodeExecution != null) {
      setValueByPath(toObject, ["codeExecution"], fromCodeExecution);
    }
    return toObject;
  }
  function functionCallingConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
      "allowedFunctionNames"
    ]);
    if (fromAllowedFunctionNames != null) {
      setValueByPath(toObject, ["allowedFunctionNames"], fromAllowedFunctionNames);
    }
    return toObject;
  }
  function toolConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
      "functionCallingConfig"
    ]);
    if (fromFunctionCallingConfig != null) {
      setValueByPath(toObject, ["functionCallingConfig"], functionCallingConfigToMldev(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
  }
  function prebuiltVoiceConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromVoiceName = getValueByPath(fromObject, ["voiceName"]);
    if (fromVoiceName != null) {
      setValueByPath(toObject, ["voiceName"], fromVoiceName);
    }
    return toObject;
  }
  function voiceConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromPrebuiltVoiceConfig = getValueByPath(fromObject, [
      "prebuiltVoiceConfig"
    ]);
    if (fromPrebuiltVoiceConfig != null) {
      setValueByPath(toObject, ["prebuiltVoiceConfig"], prebuiltVoiceConfigToMldev(apiClient, fromPrebuiltVoiceConfig));
    }
    return toObject;
  }
  function speechConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromVoiceConfig = getValueByPath(fromObject, ["voiceConfig"]);
    if (fromVoiceConfig != null) {
      setValueByPath(toObject, ["voiceConfig"], voiceConfigToMldev(apiClient, fromVoiceConfig));
    }
    return toObject;
  }
  function thinkingConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromIncludeThoughts = getValueByPath(fromObject, [
      "includeThoughts"
    ]);
    if (fromIncludeThoughts != null) {
      setValueByPath(toObject, ["includeThoughts"], fromIncludeThoughts);
    }
    return toObject;
  }
  function generateContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToMldev(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTemperature = getValueByPath(fromObject, ["temperature"]);
    if (fromTemperature != null) {
      setValueByPath(toObject, ["temperature"], fromTemperature);
    }
    const fromTopP = getValueByPath(fromObject, ["topP"]);
    if (fromTopP != null) {
      setValueByPath(toObject, ["topP"], fromTopP);
    }
    const fromTopK = getValueByPath(fromObject, ["topK"]);
    if (fromTopK != null) {
      setValueByPath(toObject, ["topK"], fromTopK);
    }
    const fromCandidateCount = getValueByPath(fromObject, [
      "candidateCount"
    ]);
    if (fromCandidateCount != null) {
      setValueByPath(toObject, ["candidateCount"], fromCandidateCount);
    }
    const fromMaxOutputTokens = getValueByPath(fromObject, [
      "maxOutputTokens"
    ]);
    if (fromMaxOutputTokens != null) {
      setValueByPath(toObject, ["maxOutputTokens"], fromMaxOutputTokens);
    }
    const fromStopSequences = getValueByPath(fromObject, [
      "stopSequences"
    ]);
    if (fromStopSequences != null) {
      setValueByPath(toObject, ["stopSequences"], fromStopSequences);
    }
    const fromResponseLogprobs = getValueByPath(fromObject, [
      "responseLogprobs"
    ]);
    if (fromResponseLogprobs != null) {
      setValueByPath(toObject, ["responseLogprobs"], fromResponseLogprobs);
    }
    const fromLogprobs = getValueByPath(fromObject, ["logprobs"]);
    if (fromLogprobs != null) {
      setValueByPath(toObject, ["logprobs"], fromLogprobs);
    }
    const fromPresencePenalty = getValueByPath(fromObject, [
      "presencePenalty"
    ]);
    if (fromPresencePenalty != null) {
      setValueByPath(toObject, ["presencePenalty"], fromPresencePenalty);
    }
    const fromFrequencyPenalty = getValueByPath(fromObject, [
      "frequencyPenalty"
    ]);
    if (fromFrequencyPenalty != null) {
      setValueByPath(toObject, ["frequencyPenalty"], fromFrequencyPenalty);
    }
    const fromSeed = getValueByPath(fromObject, ["seed"]);
    if (fromSeed != null) {
      setValueByPath(toObject, ["seed"], fromSeed);
    }
    const fromResponseMimeType = getValueByPath(fromObject, [
      "responseMimeType"
    ]);
    if (fromResponseMimeType != null) {
      setValueByPath(toObject, ["responseMimeType"], fromResponseMimeType);
    }
    const fromResponseSchema = getValueByPath(fromObject, [
      "responseSchema"
    ]);
    if (fromResponseSchema != null) {
      setValueByPath(toObject, ["responseSchema"], schemaToMldev(apiClient, tSchema(apiClient, fromResponseSchema)));
    }
    if (getValueByPath(fromObject, ["routingConfig"]) !== void 0) {
      throw new Error("routingConfig parameter is not supported in Gemini API.");
    }
    const fromSafetySettings = getValueByPath(fromObject, [
      "safetySettings"
    ]);
    if (parentObject !== void 0 && fromSafetySettings != null) {
      if (Array.isArray(fromSafetySettings)) {
        setValueByPath(parentObject, ["safetySettings"], fromSafetySettings.map((item) => {
          return safetySettingToMldev(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["safetySettings"], fromSafetySettings);
      }
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], tTools(apiClient, tTools(apiClient, fromTools).map((item) => {
          return toolToMldev(apiClient, tTool(apiClient, item));
        })));
      } else {
        setValueByPath(parentObject, ["tools"], tTools(apiClient, fromTools));
      }
    }
    const fromToolConfig = getValueByPath(fromObject, ["toolConfig"]);
    if (parentObject !== void 0 && fromToolConfig != null) {
      setValueByPath(parentObject, ["toolConfig"], toolConfigToMldev(apiClient, fromToolConfig));
    }
    if (getValueByPath(fromObject, ["labels"]) !== void 0) {
      throw new Error("labels parameter is not supported in Gemini API.");
    }
    const fromCachedContent = getValueByPath(fromObject, [
      "cachedContent"
    ]);
    if (parentObject !== void 0 && fromCachedContent != null) {
      setValueByPath(parentObject, ["cachedContent"], tCachedContentName(apiClient, fromCachedContent));
    }
    const fromResponseModalities = getValueByPath(fromObject, [
      "responseModalities"
    ]);
    if (fromResponseModalities != null) {
      setValueByPath(toObject, ["responseModalities"], fromResponseModalities);
    }
    const fromMediaResolution = getValueByPath(fromObject, [
      "mediaResolution"
    ]);
    if (fromMediaResolution != null) {
      setValueByPath(toObject, ["mediaResolution"], fromMediaResolution);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ["speechConfig"]);
    if (fromSpeechConfig != null) {
      setValueByPath(toObject, ["speechConfig"], speechConfigToMldev(apiClient, tSpeechConfig(apiClient, fromSpeechConfig)));
    }
    if (getValueByPath(fromObject, ["audioTimestamp"]) !== void 0) {
      throw new Error("audioTimestamp parameter is not supported in Gemini API.");
    }
    const fromThinkingConfig = getValueByPath(fromObject, [
      "thinkingConfig"
    ]);
    if (fromThinkingConfig != null) {
      setValueByPath(toObject, ["thinkingConfig"], thinkingConfigToMldev(apiClient, fromThinkingConfig));
    }
    return toObject;
  }
  function generateContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToMldev(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["generationConfig"], generateContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function embedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTaskType = getValueByPath(fromObject, ["taskType"]);
    if (parentObject !== void 0 && fromTaskType != null) {
      setValueByPath(parentObject, ["requests[]", "taskType"], fromTaskType);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (parentObject !== void 0 && fromTitle != null) {
      setValueByPath(parentObject, ["requests[]", "title"], fromTitle);
    }
    const fromOutputDimensionality = getValueByPath(fromObject, [
      "outputDimensionality"
    ]);
    if (parentObject !== void 0 && fromOutputDimensionality != null) {
      setValueByPath(parentObject, ["requests[]", "outputDimensionality"], fromOutputDimensionality);
    }
    if (getValueByPath(fromObject, ["mimeType"]) !== void 0) {
      throw new Error("mimeType parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["autoTruncate"]) !== void 0) {
      throw new Error("autoTruncate parameter is not supported in Gemini API.");
    }
    return toObject;
  }
  function embedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      setValueByPath(toObject, ["requests[]", "content"], tContentsForEmbed(apiClient, fromContents));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], embedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    const fromModelForEmbedContent = getValueByPath(fromObject, ["model"]);
    if (fromModelForEmbedContent !== void 0) {
      setValueByPath(toObject, ["requests[]", "model"], tModel(apiClient, fromModelForEmbedContent));
    }
    return toObject;
  }
  function generateImagesConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["outputGcsUri"]) !== void 0) {
      throw new Error("outputGcsUri parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["negativePrompt"]) !== void 0) {
      throw new Error("negativePrompt parameter is not supported in Gemini API.");
    }
    const fromNumberOfImages = getValueByPath(fromObject, [
      "numberOfImages"
    ]);
    if (parentObject !== void 0 && fromNumberOfImages != null) {
      setValueByPath(parentObject, ["parameters", "sampleCount"], fromNumberOfImages);
    }
    const fromAspectRatio = getValueByPath(fromObject, ["aspectRatio"]);
    if (parentObject !== void 0 && fromAspectRatio != null) {
      setValueByPath(parentObject, ["parameters", "aspectRatio"], fromAspectRatio);
    }
    const fromGuidanceScale = getValueByPath(fromObject, [
      "guidanceScale"
    ]);
    if (parentObject !== void 0 && fromGuidanceScale != null) {
      setValueByPath(parentObject, ["parameters", "guidanceScale"], fromGuidanceScale);
    }
    if (getValueByPath(fromObject, ["seed"]) !== void 0) {
      throw new Error("seed parameter is not supported in Gemini API.");
    }
    const fromSafetyFilterLevel = getValueByPath(fromObject, [
      "safetyFilterLevel"
    ]);
    if (parentObject !== void 0 && fromSafetyFilterLevel != null) {
      setValueByPath(parentObject, ["parameters", "safetySetting"], fromSafetyFilterLevel);
    }
    const fromPersonGeneration = getValueByPath(fromObject, [
      "personGeneration"
    ]);
    if (parentObject !== void 0 && fromPersonGeneration != null) {
      setValueByPath(parentObject, ["parameters", "personGeneration"], fromPersonGeneration);
    }
    const fromIncludeSafetyAttributes = getValueByPath(fromObject, [
      "includeSafetyAttributes"
    ]);
    if (parentObject !== void 0 && fromIncludeSafetyAttributes != null) {
      setValueByPath(parentObject, ["parameters", "includeSafetyAttributes"], fromIncludeSafetyAttributes);
    }
    const fromIncludeRaiReason = getValueByPath(fromObject, [
      "includeRaiReason"
    ]);
    if (parentObject !== void 0 && fromIncludeRaiReason != null) {
      setValueByPath(parentObject, ["parameters", "includeRaiReason"], fromIncludeRaiReason);
    }
    const fromLanguage = getValueByPath(fromObject, ["language"]);
    if (parentObject !== void 0 && fromLanguage != null) {
      setValueByPath(parentObject, ["parameters", "language"], fromLanguage);
    }
    const fromOutputMimeType = getValueByPath(fromObject, [
      "outputMimeType"
    ]);
    if (parentObject !== void 0 && fromOutputMimeType != null) {
      setValueByPath(parentObject, ["parameters", "outputOptions", "mimeType"], fromOutputMimeType);
    }
    const fromOutputCompressionQuality = getValueByPath(fromObject, [
      "outputCompressionQuality"
    ]);
    if (parentObject !== void 0 && fromOutputCompressionQuality != null) {
      setValueByPath(parentObject, ["parameters", "outputOptions", "compressionQuality"], fromOutputCompressionQuality);
    }
    if (getValueByPath(fromObject, ["addWatermark"]) !== void 0) {
      throw new Error("addWatermark parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["enhancePrompt"]) !== void 0) {
      throw new Error("enhancePrompt parameter is not supported in Gemini API.");
    }
    return toObject;
  }
  function generateImagesParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromPrompt = getValueByPath(fromObject, ["prompt"]);
    if (fromPrompt != null) {
      setValueByPath(toObject, ["instances[0]", "prompt"], fromPrompt);
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], generateImagesConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function countTokensConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["systemInstruction"]) !== void 0) {
      throw new Error("systemInstruction parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["tools"]) !== void 0) {
      throw new Error("tools parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["generationConfig"]) !== void 0) {
      throw new Error("generationConfig parameter is not supported in Gemini API.");
    }
    return toObject;
  }
  function countTokensParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToMldev(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], countTokensConfigToMldev(apiClient, fromConfig));
    }
    return toObject;
  }
  function partToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partToVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function schemaToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromExample = getValueByPath(fromObject, ["example"]);
    if (fromExample != null) {
      setValueByPath(toObject, ["example"], fromExample);
    }
    const fromPattern = getValueByPath(fromObject, ["pattern"]);
    if (fromPattern != null) {
      setValueByPath(toObject, ["pattern"], fromPattern);
    }
    const fromDefault = getValueByPath(fromObject, ["default"]);
    if (fromDefault != null) {
      setValueByPath(toObject, ["default"], fromDefault);
    }
    const fromMaxLength = getValueByPath(fromObject, ["maxLength"]);
    if (fromMaxLength != null) {
      setValueByPath(toObject, ["maxLength"], fromMaxLength);
    }
    const fromMinLength = getValueByPath(fromObject, ["minLength"]);
    if (fromMinLength != null) {
      setValueByPath(toObject, ["minLength"], fromMinLength);
    }
    const fromMinProperties = getValueByPath(fromObject, [
      "minProperties"
    ]);
    if (fromMinProperties != null) {
      setValueByPath(toObject, ["minProperties"], fromMinProperties);
    }
    const fromMaxProperties = getValueByPath(fromObject, [
      "maxProperties"
    ]);
    if (fromMaxProperties != null) {
      setValueByPath(toObject, ["maxProperties"], fromMaxProperties);
    }
    const fromAnyOf = getValueByPath(fromObject, ["anyOf"]);
    if (fromAnyOf != null) {
      setValueByPath(toObject, ["anyOf"], fromAnyOf);
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ["enum"]);
    if (fromEnum != null) {
      setValueByPath(toObject, ["enum"], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ["format"]);
    if (fromFormat != null) {
      setValueByPath(toObject, ["format"], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ["items"]);
    if (fromItems != null) {
      setValueByPath(toObject, ["items"], fromItems);
    }
    const fromMaxItems = getValueByPath(fromObject, ["maxItems"]);
    if (fromMaxItems != null) {
      setValueByPath(toObject, ["maxItems"], fromMaxItems);
    }
    const fromMaximum = getValueByPath(fromObject, ["maximum"]);
    if (fromMaximum != null) {
      setValueByPath(toObject, ["maximum"], fromMaximum);
    }
    const fromMinItems = getValueByPath(fromObject, ["minItems"]);
    if (fromMinItems != null) {
      setValueByPath(toObject, ["minItems"], fromMinItems);
    }
    const fromMinimum = getValueByPath(fromObject, ["minimum"]);
    if (fromMinimum != null) {
      setValueByPath(toObject, ["minimum"], fromMinimum);
    }
    const fromNullable = getValueByPath(fromObject, ["nullable"]);
    if (fromNullable != null) {
      setValueByPath(toObject, ["nullable"], fromNullable);
    }
    const fromProperties = getValueByPath(fromObject, ["properties"]);
    if (fromProperties != null) {
      setValueByPath(toObject, ["properties"], fromProperties);
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
      "propertyOrdering"
    ]);
    if (fromPropertyOrdering != null) {
      setValueByPath(toObject, ["propertyOrdering"], fromPropertyOrdering);
    }
    const fromRequired = getValueByPath(fromObject, ["required"]);
    if (fromRequired != null) {
      setValueByPath(toObject, ["required"], fromRequired);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (fromTitle != null) {
      setValueByPath(toObject, ["title"], fromTitle);
    }
    const fromType = getValueByPath(fromObject, ["type"]);
    if (fromType != null) {
      setValueByPath(toObject, ["type"], fromType);
    }
    return toObject;
  }
  function safetySettingToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromMethod = getValueByPath(fromObject, ["method"]);
    if (fromMethod != null) {
      setValueByPath(toObject, ["method"], fromMethod);
    }
    const fromCategory = getValueByPath(fromObject, ["category"]);
    if (fromCategory != null) {
      setValueByPath(toObject, ["category"], fromCategory);
    }
    const fromThreshold = getValueByPath(fromObject, ["threshold"]);
    if (fromThreshold != null) {
      setValueByPath(toObject, ["threshold"], fromThreshold);
    }
    return toObject;
  }
  function functionDeclarationToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromResponse = getValueByPath(fromObject, ["response"]);
    if (fromResponse != null) {
      setValueByPath(toObject, ["response"], schemaToVertex(apiClient, fromResponse));
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ["parameters"]);
    if (fromParameters != null) {
      setValueByPath(toObject, ["parameters"], fromParameters);
    }
    return toObject;
  }
  function googleSearchToVertex() {
    const toObject = {};
    return toObject;
  }
  function dynamicRetrievalConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
      "dynamicThreshold"
    ]);
    if (fromDynamicThreshold != null) {
      setValueByPath(toObject, ["dynamicThreshold"], fromDynamicThreshold);
    }
    return toObject;
  }
  function googleSearchRetrievalToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
      "dynamicRetrievalConfig"
    ]);
    if (fromDynamicRetrievalConfig != null) {
      setValueByPath(toObject, ["dynamicRetrievalConfig"], dynamicRetrievalConfigToVertex(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
  }
  function toolToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
      "functionDeclarations"
    ]);
    if (fromFunctionDeclarations != null) {
      if (Array.isArray(fromFunctionDeclarations)) {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations.map((item) => {
          return functionDeclarationToVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations);
      }
    }
    const fromRetrieval = getValueByPath(fromObject, ["retrieval"]);
    if (fromRetrieval != null) {
      setValueByPath(toObject, ["retrieval"], fromRetrieval);
    }
    const fromGoogleSearch = getValueByPath(fromObject, ["googleSearch"]);
    if (fromGoogleSearch != null) {
      setValueByPath(toObject, ["googleSearch"], googleSearchToVertex());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
      "googleSearchRetrieval"
    ]);
    if (fromGoogleSearchRetrieval != null) {
      setValueByPath(toObject, ["googleSearchRetrieval"], googleSearchRetrievalToVertex(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
      "codeExecution"
    ]);
    if (fromCodeExecution != null) {
      setValueByPath(toObject, ["codeExecution"], fromCodeExecution);
    }
    return toObject;
  }
  function functionCallingConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
      "allowedFunctionNames"
    ]);
    if (fromAllowedFunctionNames != null) {
      setValueByPath(toObject, ["allowedFunctionNames"], fromAllowedFunctionNames);
    }
    return toObject;
  }
  function toolConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
      "functionCallingConfig"
    ]);
    if (fromFunctionCallingConfig != null) {
      setValueByPath(toObject, ["functionCallingConfig"], functionCallingConfigToVertex(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
  }
  function prebuiltVoiceConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVoiceName = getValueByPath(fromObject, ["voiceName"]);
    if (fromVoiceName != null) {
      setValueByPath(toObject, ["voiceName"], fromVoiceName);
    }
    return toObject;
  }
  function voiceConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromPrebuiltVoiceConfig = getValueByPath(fromObject, [
      "prebuiltVoiceConfig"
    ]);
    if (fromPrebuiltVoiceConfig != null) {
      setValueByPath(toObject, ["prebuiltVoiceConfig"], prebuiltVoiceConfigToVertex(apiClient, fromPrebuiltVoiceConfig));
    }
    return toObject;
  }
  function speechConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVoiceConfig = getValueByPath(fromObject, ["voiceConfig"]);
    if (fromVoiceConfig != null) {
      setValueByPath(toObject, ["voiceConfig"], voiceConfigToVertex(apiClient, fromVoiceConfig));
    }
    return toObject;
  }
  function thinkingConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromIncludeThoughts = getValueByPath(fromObject, [
      "includeThoughts"
    ]);
    if (fromIncludeThoughts != null) {
      setValueByPath(toObject, ["includeThoughts"], fromIncludeThoughts);
    }
    return toObject;
  }
  function generateContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToVertex(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTemperature = getValueByPath(fromObject, ["temperature"]);
    if (fromTemperature != null) {
      setValueByPath(toObject, ["temperature"], fromTemperature);
    }
    const fromTopP = getValueByPath(fromObject, ["topP"]);
    if (fromTopP != null) {
      setValueByPath(toObject, ["topP"], fromTopP);
    }
    const fromTopK = getValueByPath(fromObject, ["topK"]);
    if (fromTopK != null) {
      setValueByPath(toObject, ["topK"], fromTopK);
    }
    const fromCandidateCount = getValueByPath(fromObject, [
      "candidateCount"
    ]);
    if (fromCandidateCount != null) {
      setValueByPath(toObject, ["candidateCount"], fromCandidateCount);
    }
    const fromMaxOutputTokens = getValueByPath(fromObject, [
      "maxOutputTokens"
    ]);
    if (fromMaxOutputTokens != null) {
      setValueByPath(toObject, ["maxOutputTokens"], fromMaxOutputTokens);
    }
    const fromStopSequences = getValueByPath(fromObject, [
      "stopSequences"
    ]);
    if (fromStopSequences != null) {
      setValueByPath(toObject, ["stopSequences"], fromStopSequences);
    }
    const fromResponseLogprobs = getValueByPath(fromObject, [
      "responseLogprobs"
    ]);
    if (fromResponseLogprobs != null) {
      setValueByPath(toObject, ["responseLogprobs"], fromResponseLogprobs);
    }
    const fromLogprobs = getValueByPath(fromObject, ["logprobs"]);
    if (fromLogprobs != null) {
      setValueByPath(toObject, ["logprobs"], fromLogprobs);
    }
    const fromPresencePenalty = getValueByPath(fromObject, [
      "presencePenalty"
    ]);
    if (fromPresencePenalty != null) {
      setValueByPath(toObject, ["presencePenalty"], fromPresencePenalty);
    }
    const fromFrequencyPenalty = getValueByPath(fromObject, [
      "frequencyPenalty"
    ]);
    if (fromFrequencyPenalty != null) {
      setValueByPath(toObject, ["frequencyPenalty"], fromFrequencyPenalty);
    }
    const fromSeed = getValueByPath(fromObject, ["seed"]);
    if (fromSeed != null) {
      setValueByPath(toObject, ["seed"], fromSeed);
    }
    const fromResponseMimeType = getValueByPath(fromObject, [
      "responseMimeType"
    ]);
    if (fromResponseMimeType != null) {
      setValueByPath(toObject, ["responseMimeType"], fromResponseMimeType);
    }
    const fromResponseSchema = getValueByPath(fromObject, [
      "responseSchema"
    ]);
    if (fromResponseSchema != null) {
      setValueByPath(toObject, ["responseSchema"], schemaToVertex(apiClient, tSchema(apiClient, fromResponseSchema)));
    }
    const fromRoutingConfig = getValueByPath(fromObject, [
      "routingConfig"
    ]);
    if (fromRoutingConfig != null) {
      setValueByPath(toObject, ["routingConfig"], fromRoutingConfig);
    }
    const fromSafetySettings = getValueByPath(fromObject, [
      "safetySettings"
    ]);
    if (parentObject !== void 0 && fromSafetySettings != null) {
      if (Array.isArray(fromSafetySettings)) {
        setValueByPath(parentObject, ["safetySettings"], fromSafetySettings.map((item) => {
          return safetySettingToVertex(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["safetySettings"], fromSafetySettings);
      }
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], tTools(apiClient, tTools(apiClient, fromTools).map((item) => {
          return toolToVertex(apiClient, tTool(apiClient, item));
        })));
      } else {
        setValueByPath(parentObject, ["tools"], tTools(apiClient, fromTools));
      }
    }
    const fromToolConfig = getValueByPath(fromObject, ["toolConfig"]);
    if (parentObject !== void 0 && fromToolConfig != null) {
      setValueByPath(parentObject, ["toolConfig"], toolConfigToVertex(apiClient, fromToolConfig));
    }
    const fromLabels = getValueByPath(fromObject, ["labels"]);
    if (parentObject !== void 0 && fromLabels != null) {
      setValueByPath(parentObject, ["labels"], fromLabels);
    }
    const fromCachedContent = getValueByPath(fromObject, [
      "cachedContent"
    ]);
    if (parentObject !== void 0 && fromCachedContent != null) {
      setValueByPath(parentObject, ["cachedContent"], tCachedContentName(apiClient, fromCachedContent));
    }
    const fromResponseModalities = getValueByPath(fromObject, [
      "responseModalities"
    ]);
    if (fromResponseModalities != null) {
      setValueByPath(toObject, ["responseModalities"], fromResponseModalities);
    }
    const fromMediaResolution = getValueByPath(fromObject, [
      "mediaResolution"
    ]);
    if (fromMediaResolution != null) {
      setValueByPath(toObject, ["mediaResolution"], fromMediaResolution);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ["speechConfig"]);
    if (fromSpeechConfig != null) {
      setValueByPath(toObject, ["speechConfig"], speechConfigToVertex(apiClient, tSpeechConfig(apiClient, fromSpeechConfig)));
    }
    const fromAudioTimestamp = getValueByPath(fromObject, [
      "audioTimestamp"
    ]);
    if (fromAudioTimestamp != null) {
      setValueByPath(toObject, ["audioTimestamp"], fromAudioTimestamp);
    }
    const fromThinkingConfig = getValueByPath(fromObject, [
      "thinkingConfig"
    ]);
    if (fromThinkingConfig != null) {
      setValueByPath(toObject, ["thinkingConfig"], thinkingConfigToVertex(apiClient, fromThinkingConfig));
    }
    return toObject;
  }
  function generateContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToVertex(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["generationConfig"], generateContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function embedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTaskType = getValueByPath(fromObject, ["taskType"]);
    if (parentObject !== void 0 && fromTaskType != null) {
      setValueByPath(parentObject, ["instances[]", "task_type"], fromTaskType);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (parentObject !== void 0 && fromTitle != null) {
      setValueByPath(parentObject, ["instances[]", "title"], fromTitle);
    }
    const fromOutputDimensionality = getValueByPath(fromObject, [
      "outputDimensionality"
    ]);
    if (parentObject !== void 0 && fromOutputDimensionality != null) {
      setValueByPath(parentObject, ["parameters", "outputDimensionality"], fromOutputDimensionality);
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (parentObject !== void 0 && fromMimeType != null) {
      setValueByPath(parentObject, ["instances[]", "mimeType"], fromMimeType);
    }
    const fromAutoTruncate = getValueByPath(fromObject, ["autoTruncate"]);
    if (parentObject !== void 0 && fromAutoTruncate != null) {
      setValueByPath(parentObject, ["parameters", "autoTruncate"], fromAutoTruncate);
    }
    return toObject;
  }
  function embedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      setValueByPath(toObject, ["instances[]", "content"], tContentsForEmbed(apiClient, fromContents));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], embedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function generateImagesConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromOutputGcsUri = getValueByPath(fromObject, ["outputGcsUri"]);
    if (parentObject !== void 0 && fromOutputGcsUri != null) {
      setValueByPath(parentObject, ["parameters", "storageUri"], fromOutputGcsUri);
    }
    const fromNegativePrompt = getValueByPath(fromObject, [
      "negativePrompt"
    ]);
    if (parentObject !== void 0 && fromNegativePrompt != null) {
      setValueByPath(parentObject, ["parameters", "negativePrompt"], fromNegativePrompt);
    }
    const fromNumberOfImages = getValueByPath(fromObject, [
      "numberOfImages"
    ]);
    if (parentObject !== void 0 && fromNumberOfImages != null) {
      setValueByPath(parentObject, ["parameters", "sampleCount"], fromNumberOfImages);
    }
    const fromAspectRatio = getValueByPath(fromObject, ["aspectRatio"]);
    if (parentObject !== void 0 && fromAspectRatio != null) {
      setValueByPath(parentObject, ["parameters", "aspectRatio"], fromAspectRatio);
    }
    const fromGuidanceScale = getValueByPath(fromObject, [
      "guidanceScale"
    ]);
    if (parentObject !== void 0 && fromGuidanceScale != null) {
      setValueByPath(parentObject, ["parameters", "guidanceScale"], fromGuidanceScale);
    }
    const fromSeed = getValueByPath(fromObject, ["seed"]);
    if (parentObject !== void 0 && fromSeed != null) {
      setValueByPath(parentObject, ["parameters", "seed"], fromSeed);
    }
    const fromSafetyFilterLevel = getValueByPath(fromObject, [
      "safetyFilterLevel"
    ]);
    if (parentObject !== void 0 && fromSafetyFilterLevel != null) {
      setValueByPath(parentObject, ["parameters", "safetySetting"], fromSafetyFilterLevel);
    }
    const fromPersonGeneration = getValueByPath(fromObject, [
      "personGeneration"
    ]);
    if (parentObject !== void 0 && fromPersonGeneration != null) {
      setValueByPath(parentObject, ["parameters", "personGeneration"], fromPersonGeneration);
    }
    const fromIncludeSafetyAttributes = getValueByPath(fromObject, [
      "includeSafetyAttributes"
    ]);
    if (parentObject !== void 0 && fromIncludeSafetyAttributes != null) {
      setValueByPath(parentObject, ["parameters", "includeSafetyAttributes"], fromIncludeSafetyAttributes);
    }
    const fromIncludeRaiReason = getValueByPath(fromObject, [
      "includeRaiReason"
    ]);
    if (parentObject !== void 0 && fromIncludeRaiReason != null) {
      setValueByPath(parentObject, ["parameters", "includeRaiReason"], fromIncludeRaiReason);
    }
    const fromLanguage = getValueByPath(fromObject, ["language"]);
    if (parentObject !== void 0 && fromLanguage != null) {
      setValueByPath(parentObject, ["parameters", "language"], fromLanguage);
    }
    const fromOutputMimeType = getValueByPath(fromObject, [
      "outputMimeType"
    ]);
    if (parentObject !== void 0 && fromOutputMimeType != null) {
      setValueByPath(parentObject, ["parameters", "outputOptions", "mimeType"], fromOutputMimeType);
    }
    const fromOutputCompressionQuality = getValueByPath(fromObject, [
      "outputCompressionQuality"
    ]);
    if (parentObject !== void 0 && fromOutputCompressionQuality != null) {
      setValueByPath(parentObject, ["parameters", "outputOptions", "compressionQuality"], fromOutputCompressionQuality);
    }
    const fromAddWatermark = getValueByPath(fromObject, ["addWatermark"]);
    if (parentObject !== void 0 && fromAddWatermark != null) {
      setValueByPath(parentObject, ["parameters", "addWatermark"], fromAddWatermark);
    }
    const fromEnhancePrompt = getValueByPath(fromObject, [
      "enhancePrompt"
    ]);
    if (parentObject !== void 0 && fromEnhancePrompt != null) {
      setValueByPath(parentObject, ["parameters", "enhancePrompt"], fromEnhancePrompt);
    }
    return toObject;
  }
  function generateImagesParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromPrompt = getValueByPath(fromObject, ["prompt"]);
    if (fromPrompt != null) {
      setValueByPath(toObject, ["instances[0]", "prompt"], fromPrompt);
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], generateImagesConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function countTokensConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToVertex(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], fromTools.map((item) => {
          return toolToVertex(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["tools"], fromTools);
      }
    }
    const fromGenerationConfig = getValueByPath(fromObject, [
      "generationConfig"
    ]);
    if (parentObject !== void 0 && fromGenerationConfig != null) {
      setValueByPath(parentObject, ["generationConfig"], fromGenerationConfig);
    }
    return toObject;
  }
  function countTokensParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToVertex(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], countTokensConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function computeTokensParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToVertex(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function partFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function citationMetadataFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromCitations = getValueByPath(fromObject, ["citationSources"]);
    if (fromCitations != null) {
      setValueByPath(toObject, ["citations"], fromCitations);
    }
    return toObject;
  }
  function candidateFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromContent = getValueByPath(fromObject, ["content"]);
    if (fromContent != null) {
      setValueByPath(toObject, ["content"], contentFromMldev(apiClient, fromContent));
    }
    const fromCitationMetadata = getValueByPath(fromObject, [
      "citationMetadata"
    ]);
    if (fromCitationMetadata != null) {
      setValueByPath(toObject, ["citationMetadata"], citationMetadataFromMldev(apiClient, fromCitationMetadata));
    }
    const fromTokenCount = getValueByPath(fromObject, ["tokenCount"]);
    if (fromTokenCount != null) {
      setValueByPath(toObject, ["tokenCount"], fromTokenCount);
    }
    const fromFinishReason = getValueByPath(fromObject, ["finishReason"]);
    if (fromFinishReason != null) {
      setValueByPath(toObject, ["finishReason"], fromFinishReason);
    }
    const fromAvgLogprobs = getValueByPath(fromObject, ["avgLogprobs"]);
    if (fromAvgLogprobs != null) {
      setValueByPath(toObject, ["avgLogprobs"], fromAvgLogprobs);
    }
    const fromGroundingMetadata = getValueByPath(fromObject, [
      "groundingMetadata"
    ]);
    if (fromGroundingMetadata != null) {
      setValueByPath(toObject, ["groundingMetadata"], fromGroundingMetadata);
    }
    const fromIndex = getValueByPath(fromObject, ["index"]);
    if (fromIndex != null) {
      setValueByPath(toObject, ["index"], fromIndex);
    }
    const fromLogprobsResult = getValueByPath(fromObject, [
      "logprobsResult"
    ]);
    if (fromLogprobsResult != null) {
      setValueByPath(toObject, ["logprobsResult"], fromLogprobsResult);
    }
    const fromSafetyRatings = getValueByPath(fromObject, [
      "safetyRatings"
    ]);
    if (fromSafetyRatings != null) {
      setValueByPath(toObject, ["safetyRatings"], fromSafetyRatings);
    }
    return toObject;
  }
  function generateContentResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromCandidates = getValueByPath(fromObject, ["candidates"]);
    if (fromCandidates != null) {
      if (Array.isArray(fromCandidates)) {
        setValueByPath(toObject, ["candidates"], fromCandidates.map((item) => {
          return candidateFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["candidates"], fromCandidates);
      }
    }
    const fromModelVersion = getValueByPath(fromObject, ["modelVersion"]);
    if (fromModelVersion != null) {
      setValueByPath(toObject, ["modelVersion"], fromModelVersion);
    }
    const fromPromptFeedback = getValueByPath(fromObject, [
      "promptFeedback"
    ]);
    if (fromPromptFeedback != null) {
      setValueByPath(toObject, ["promptFeedback"], fromPromptFeedback);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], fromUsageMetadata);
    }
    return toObject;
  }
  function contentEmbeddingFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromValues = getValueByPath(fromObject, ["values"]);
    if (fromValues != null) {
      setValueByPath(toObject, ["values"], fromValues);
    }
    return toObject;
  }
  function embedContentMetadataFromMldev() {
    const toObject = {};
    return toObject;
  }
  function embedContentResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromEmbeddings = getValueByPath(fromObject, ["embeddings"]);
    if (fromEmbeddings != null) {
      if (Array.isArray(fromEmbeddings)) {
        setValueByPath(toObject, ["embeddings"], fromEmbeddings.map((item) => {
          return contentEmbeddingFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["embeddings"], fromEmbeddings);
      }
    }
    const fromMetadata = getValueByPath(fromObject, ["metadata"]);
    if (fromMetadata != null) {
      setValueByPath(toObject, ["metadata"], embedContentMetadataFromMldev());
    }
    return toObject;
  }
  function imageFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromImageBytes = getValueByPath(fromObject, [
      "bytesBase64Encoded"
    ]);
    if (fromImageBytes != null) {
      setValueByPath(toObject, ["imageBytes"], tBytes(apiClient, fromImageBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function safetyAttributesFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromCategories = getValueByPath(fromObject, [
      "safetyAttributes",
      "categories"
    ]);
    if (fromCategories != null) {
      setValueByPath(toObject, ["categories"], fromCategories);
    }
    const fromScores = getValueByPath(fromObject, [
      "safetyAttributes",
      "scores"
    ]);
    if (fromScores != null) {
      setValueByPath(toObject, ["scores"], fromScores);
    }
    const fromContentType = getValueByPath(fromObject, ["contentType"]);
    if (fromContentType != null) {
      setValueByPath(toObject, ["contentType"], fromContentType);
    }
    return toObject;
  }
  function generatedImageFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromImage = getValueByPath(fromObject, ["_self"]);
    if (fromImage != null) {
      setValueByPath(toObject, ["image"], imageFromMldev(apiClient, fromImage));
    }
    const fromRaiFilteredReason = getValueByPath(fromObject, [
      "raiFilteredReason"
    ]);
    if (fromRaiFilteredReason != null) {
      setValueByPath(toObject, ["raiFilteredReason"], fromRaiFilteredReason);
    }
    const fromSafetyAttributes = getValueByPath(fromObject, ["_self"]);
    if (fromSafetyAttributes != null) {
      setValueByPath(toObject, ["safetyAttributes"], safetyAttributesFromMldev(apiClient, fromSafetyAttributes));
    }
    return toObject;
  }
  function generateImagesResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromGeneratedImages = getValueByPath(fromObject, [
      "predictions"
    ]);
    if (fromGeneratedImages != null) {
      if (Array.isArray(fromGeneratedImages)) {
        setValueByPath(toObject, ["generatedImages"], fromGeneratedImages.map((item) => {
          return generatedImageFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["generatedImages"], fromGeneratedImages);
      }
    }
    const fromPositivePromptSafetyAttributes = getValueByPath(fromObject, [
      "positivePromptSafetyAttributes"
    ]);
    if (fromPositivePromptSafetyAttributes != null) {
      setValueByPath(toObject, ["positivePromptSafetyAttributes"], safetyAttributesFromMldev(apiClient, fromPositivePromptSafetyAttributes));
    }
    return toObject;
  }
  function countTokensResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromTotalTokens = getValueByPath(fromObject, ["totalTokens"]);
    if (fromTotalTokens != null) {
      setValueByPath(toObject, ["totalTokens"], fromTotalTokens);
    }
    const fromCachedContentTokenCount = getValueByPath(fromObject, [
      "cachedContentTokenCount"
    ]);
    if (fromCachedContentTokenCount != null) {
      setValueByPath(toObject, ["cachedContentTokenCount"], fromCachedContentTokenCount);
    }
    return toObject;
  }
  function partFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function citationMetadataFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromCitations = getValueByPath(fromObject, ["citations"]);
    if (fromCitations != null) {
      setValueByPath(toObject, ["citations"], fromCitations);
    }
    return toObject;
  }
  function candidateFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromContent = getValueByPath(fromObject, ["content"]);
    if (fromContent != null) {
      setValueByPath(toObject, ["content"], contentFromVertex(apiClient, fromContent));
    }
    const fromCitationMetadata = getValueByPath(fromObject, [
      "citationMetadata"
    ]);
    if (fromCitationMetadata != null) {
      setValueByPath(toObject, ["citationMetadata"], citationMetadataFromVertex(apiClient, fromCitationMetadata));
    }
    const fromFinishMessage = getValueByPath(fromObject, [
      "finishMessage"
    ]);
    if (fromFinishMessage != null) {
      setValueByPath(toObject, ["finishMessage"], fromFinishMessage);
    }
    const fromFinishReason = getValueByPath(fromObject, ["finishReason"]);
    if (fromFinishReason != null) {
      setValueByPath(toObject, ["finishReason"], fromFinishReason);
    }
    const fromAvgLogprobs = getValueByPath(fromObject, ["avgLogprobs"]);
    if (fromAvgLogprobs != null) {
      setValueByPath(toObject, ["avgLogprobs"], fromAvgLogprobs);
    }
    const fromGroundingMetadata = getValueByPath(fromObject, [
      "groundingMetadata"
    ]);
    if (fromGroundingMetadata != null) {
      setValueByPath(toObject, ["groundingMetadata"], fromGroundingMetadata);
    }
    const fromIndex = getValueByPath(fromObject, ["index"]);
    if (fromIndex != null) {
      setValueByPath(toObject, ["index"], fromIndex);
    }
    const fromLogprobsResult = getValueByPath(fromObject, [
      "logprobsResult"
    ]);
    if (fromLogprobsResult != null) {
      setValueByPath(toObject, ["logprobsResult"], fromLogprobsResult);
    }
    const fromSafetyRatings = getValueByPath(fromObject, [
      "safetyRatings"
    ]);
    if (fromSafetyRatings != null) {
      setValueByPath(toObject, ["safetyRatings"], fromSafetyRatings);
    }
    return toObject;
  }
  function generateContentResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromCandidates = getValueByPath(fromObject, ["candidates"]);
    if (fromCandidates != null) {
      if (Array.isArray(fromCandidates)) {
        setValueByPath(toObject, ["candidates"], fromCandidates.map((item) => {
          return candidateFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["candidates"], fromCandidates);
      }
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromResponseId = getValueByPath(fromObject, ["responseId"]);
    if (fromResponseId != null) {
      setValueByPath(toObject, ["responseId"], fromResponseId);
    }
    const fromModelVersion = getValueByPath(fromObject, ["modelVersion"]);
    if (fromModelVersion != null) {
      setValueByPath(toObject, ["modelVersion"], fromModelVersion);
    }
    const fromPromptFeedback = getValueByPath(fromObject, [
      "promptFeedback"
    ]);
    if (fromPromptFeedback != null) {
      setValueByPath(toObject, ["promptFeedback"], fromPromptFeedback);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], fromUsageMetadata);
    }
    return toObject;
  }
  function contentEmbeddingStatisticsFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromTruncated = getValueByPath(fromObject, ["truncated"]);
    if (fromTruncated != null) {
      setValueByPath(toObject, ["truncated"], fromTruncated);
    }
    const fromTokenCount = getValueByPath(fromObject, ["token_count"]);
    if (fromTokenCount != null) {
      setValueByPath(toObject, ["tokenCount"], fromTokenCount);
    }
    return toObject;
  }
  function contentEmbeddingFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromValues = getValueByPath(fromObject, ["values"]);
    if (fromValues != null) {
      setValueByPath(toObject, ["values"], fromValues);
    }
    const fromStatistics = getValueByPath(fromObject, ["statistics"]);
    if (fromStatistics != null) {
      setValueByPath(toObject, ["statistics"], contentEmbeddingStatisticsFromVertex(apiClient, fromStatistics));
    }
    return toObject;
  }
  function embedContentMetadataFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromBillableCharacterCount = getValueByPath(fromObject, [
      "billableCharacterCount"
    ]);
    if (fromBillableCharacterCount != null) {
      setValueByPath(toObject, ["billableCharacterCount"], fromBillableCharacterCount);
    }
    return toObject;
  }
  function embedContentResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromEmbeddings = getValueByPath(fromObject, [
      "predictions[]",
      "embeddings"
    ]);
    if (fromEmbeddings != null) {
      if (Array.isArray(fromEmbeddings)) {
        setValueByPath(toObject, ["embeddings"], fromEmbeddings.map((item) => {
          return contentEmbeddingFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["embeddings"], fromEmbeddings);
      }
    }
    const fromMetadata = getValueByPath(fromObject, ["metadata"]);
    if (fromMetadata != null) {
      setValueByPath(toObject, ["metadata"], embedContentMetadataFromVertex(apiClient, fromMetadata));
    }
    return toObject;
  }
  function imageFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGcsUri = getValueByPath(fromObject, ["gcsUri"]);
    if (fromGcsUri != null) {
      setValueByPath(toObject, ["gcsUri"], fromGcsUri);
    }
    const fromImageBytes = getValueByPath(fromObject, [
      "bytesBase64Encoded"
    ]);
    if (fromImageBytes != null) {
      setValueByPath(toObject, ["imageBytes"], tBytes(apiClient, fromImageBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function safetyAttributesFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromCategories = getValueByPath(fromObject, [
      "safetyAttributes",
      "categories"
    ]);
    if (fromCategories != null) {
      setValueByPath(toObject, ["categories"], fromCategories);
    }
    const fromScores = getValueByPath(fromObject, [
      "safetyAttributes",
      "scores"
    ]);
    if (fromScores != null) {
      setValueByPath(toObject, ["scores"], fromScores);
    }
    const fromContentType = getValueByPath(fromObject, ["contentType"]);
    if (fromContentType != null) {
      setValueByPath(toObject, ["contentType"], fromContentType);
    }
    return toObject;
  }
  function generatedImageFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromImage = getValueByPath(fromObject, ["_self"]);
    if (fromImage != null) {
      setValueByPath(toObject, ["image"], imageFromVertex(apiClient, fromImage));
    }
    const fromRaiFilteredReason = getValueByPath(fromObject, [
      "raiFilteredReason"
    ]);
    if (fromRaiFilteredReason != null) {
      setValueByPath(toObject, ["raiFilteredReason"], fromRaiFilteredReason);
    }
    const fromSafetyAttributes = getValueByPath(fromObject, ["_self"]);
    if (fromSafetyAttributes != null) {
      setValueByPath(toObject, ["safetyAttributes"], safetyAttributesFromVertex(apiClient, fromSafetyAttributes));
    }
    const fromEnhancedPrompt = getValueByPath(fromObject, ["prompt"]);
    if (fromEnhancedPrompt != null) {
      setValueByPath(toObject, ["enhancedPrompt"], fromEnhancedPrompt);
    }
    return toObject;
  }
  function generateImagesResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGeneratedImages = getValueByPath(fromObject, [
      "predictions"
    ]);
    if (fromGeneratedImages != null) {
      if (Array.isArray(fromGeneratedImages)) {
        setValueByPath(toObject, ["generatedImages"], fromGeneratedImages.map((item) => {
          return generatedImageFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["generatedImages"], fromGeneratedImages);
      }
    }
    const fromPositivePromptSafetyAttributes = getValueByPath(fromObject, [
      "positivePromptSafetyAttributes"
    ]);
    if (fromPositivePromptSafetyAttributes != null) {
      setValueByPath(toObject, ["positivePromptSafetyAttributes"], safetyAttributesFromVertex(apiClient, fromPositivePromptSafetyAttributes));
    }
    return toObject;
  }
  function countTokensResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromTotalTokens = getValueByPath(fromObject, ["totalTokens"]);
    if (fromTotalTokens != null) {
      setValueByPath(toObject, ["totalTokens"], fromTotalTokens);
    }
    return toObject;
  }
  function computeTokensResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromTokensInfo = getValueByPath(fromObject, ["tokensInfo"]);
    if (fromTokensInfo != null) {
      setValueByPath(toObject, ["tokensInfo"], fromTokensInfo);
    }
    return toObject;
  }
  function liveConnectParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig !== void 0 && fromConfig !== null) {
      setValueByPath(toObject, ["setup"], liveConnectConfigToMldev(apiClient, fromConfig));
    }
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel !== void 0) {
      setValueByPath(toObject, ["setup", "model"], fromModel);
    }
    return toObject;
  }
  function liveConnectParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig !== void 0 && fromConfig !== null) {
      setValueByPath(toObject, ["setup"], liveConnectConfigToVertex(apiClient, fromConfig));
    }
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel !== void 0) {
      setValueByPath(toObject, ["setup", "model"], fromModel);
    }
    return toObject;
  }
  function liveServerMessageFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromSetupComplete = getValueByPath(fromObject, [
      "setupComplete"
    ]);
    if (fromSetupComplete !== void 0) {
      setValueByPath(toObject, ["setupComplete"], fromSetupComplete);
    }
    const fromServerContent = getValueByPath(fromObject, [
      "serverContent"
    ]);
    if (fromServerContent !== void 0 && fromServerContent !== null) {
      setValueByPath(toObject, ["serverContent"], liveServerContentFromMldev(apiClient, fromServerContent));
    }
    const fromToolCall = getValueByPath(fromObject, ["toolCall"]);
    if (fromToolCall !== void 0 && fromToolCall !== null) {
      setValueByPath(toObject, ["toolCall"], liveServerToolCallFromMldev(apiClient, fromToolCall));
    }
    const fromToolCallCancellation = getValueByPath(fromObject, [
      "toolCallCancellation"
    ]);
    if (fromToolCallCancellation !== void 0 && fromToolCallCancellation !== null) {
      setValueByPath(toObject, ["toolCallCancellation"], liveServerToolCallCancellationFromMldev(apiClient, fromToolCallCancellation));
    }
    return toObject;
  }
  function liveServerMessageFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromSetupComplete = getValueByPath(fromObject, [
      "setupComplete"
    ]);
    if (fromSetupComplete !== void 0) {
      setValueByPath(toObject, ["setupComplete"], fromSetupComplete);
    }
    const fromServerContent = getValueByPath(fromObject, [
      "serverContent"
    ]);
    if (fromServerContent !== void 0 && fromServerContent !== null) {
      setValueByPath(toObject, ["serverContent"], liveServerContentFromVertex(apiClient, fromServerContent));
    }
    const fromToolCall = getValueByPath(fromObject, ["toolCall"]);
    if (fromToolCall !== void 0 && fromToolCall !== null) {
      setValueByPath(toObject, ["toolCall"], liveServerToolCallFromVertex(apiClient, fromToolCall));
    }
    const fromToolCallCancellation = getValueByPath(fromObject, [
      "toolCallCancellation"
    ]);
    if (fromToolCallCancellation !== void 0 && fromToolCallCancellation !== null) {
      setValueByPath(toObject, ["toolCallCancellation"], liveServerToolCallCancellationFromVertex(apiClient, fromToolCallCancellation));
    }
    return toObject;
  }
  function liveConnectConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromGenerationConfig = getValueByPath(fromObject, [
      "generationConfig"
    ]);
    if (fromGenerationConfig !== void 0) {
      setValueByPath(toObject, ["generationConfig"], fromGenerationConfig);
    }
    const fromResponseModalities = getValueByPath(fromObject, [
      "responseModalities"
    ]);
    if (fromResponseModalities !== void 0) {
      setValueByPath(toObject, ["generationConfig", "responseModalities"], fromResponseModalities);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ["speechConfig"]);
    if (fromSpeechConfig !== void 0) {
      setValueByPath(toObject, ["generationConfig", "speechConfig"], fromSpeechConfig);
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (fromSystemInstruction !== void 0 && fromSystemInstruction !== null) {
      setValueByPath(toObject, ["systemInstruction"], contentToMldev(apiClient, fromSystemInstruction));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (fromTools !== void 0 && fromTools !== null && Array.isArray(fromTools)) {
      setValueByPath(toObject, ["tools"], fromTools.map((item) => {
        return toolToMldev(apiClient, item);
      }));
    }
    return toObject;
  }
  function liveConnectConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGenerationConfig = getValueByPath(fromObject, [
      "generationConfig"
    ]);
    if (fromGenerationConfig !== void 0) {
      setValueByPath(toObject, ["generationConfig"], fromGenerationConfig);
    }
    const fromResponseModalities = getValueByPath(fromObject, [
      "responseModalities"
    ]);
    if (fromResponseModalities !== void 0) {
      setValueByPath(toObject, ["generationConfig", "responseModalities"], fromResponseModalities);
    } else {
      setValueByPath(toObject, ["generationConfig", "responseModalities"], ["AUDIO"]);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ["speechConfig"]);
    if (fromSpeechConfig !== void 0) {
      setValueByPath(toObject, ["generationConfig", "speechConfig"], fromSpeechConfig);
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (fromSystemInstruction !== void 0 && fromSystemInstruction !== null) {
      setValueByPath(toObject, ["systemInstruction"], contentToVertex(apiClient, fromSystemInstruction));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (fromTools !== void 0 && fromTools !== null && Array.isArray(fromTools)) {
      setValueByPath(toObject, ["tools"], fromTools.map((item) => {
        return toolToVertex(apiClient, item);
      }));
    }
    return toObject;
  }
  function liveServerContentFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModelTurn = getValueByPath(fromObject, ["modelTurn"]);
    if (fromModelTurn !== void 0 && fromModelTurn !== null) {
      setValueByPath(toObject, ["modelTurn"], contentFromMldev(apiClient, fromModelTurn));
    }
    const fromTurnComplete = getValueByPath(fromObject, ["turnComplete"]);
    if (fromTurnComplete !== void 0) {
      setValueByPath(toObject, ["turnComplete"], fromTurnComplete);
    }
    const fromInterrupted = getValueByPath(fromObject, ["interrupted"]);
    if (fromInterrupted !== void 0) {
      setValueByPath(toObject, ["interrupted"], fromInterrupted);
    }
    return toObject;
  }
  function liveServerContentFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModelTurn = getValueByPath(fromObject, ["modelTurn"]);
    if (fromModelTurn !== void 0 && fromModelTurn !== null) {
      setValueByPath(toObject, ["modelTurn"], contentFromVertex(apiClient, fromModelTurn));
    }
    const fromTurnComplete = getValueByPath(fromObject, ["turnComplete"]);
    if (fromTurnComplete !== void 0) {
      setValueByPath(toObject, ["turnComplete"], fromTurnComplete);
    }
    const fromInterrupted = getValueByPath(fromObject, ["interrupted"]);
    if (fromInterrupted !== void 0) {
      setValueByPath(toObject, ["interrupted"], fromInterrupted);
    }
    return toObject;
  }
  function functionCallFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromId = getValueByPath(fromObject, ["id"]);
    if (fromId !== void 0) {
      setValueByPath(toObject, ["id"], fromId);
    }
    const fromArgs = getValueByPath(fromObject, ["args"]);
    if (fromArgs !== void 0) {
      setValueByPath(toObject, ["args"], fromArgs);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName !== void 0) {
      setValueByPath(toObject, ["name"], fromName);
    }
    return toObject;
  }
  function functionCallFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromArgs = getValueByPath(fromObject, ["args"]);
    if (fromArgs !== void 0) {
      setValueByPath(toObject, ["args"], fromArgs);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName !== void 0) {
      setValueByPath(toObject, ["name"], fromName);
    }
    return toObject;
  }
  function liveServerToolCallFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCalls = getValueByPath(fromObject, [
      "functionCalls"
    ]);
    if (fromFunctionCalls !== void 0 && fromFunctionCalls !== null && Array.isArray(fromFunctionCalls)) {
      setValueByPath(toObject, ["functionCalls"], fromFunctionCalls.map((item) => {
        return functionCallFromMldev(apiClient, item);
      }));
    }
    return toObject;
  }
  function liveServerToolCallFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCalls = getValueByPath(fromObject, [
      "functionCalls"
    ]);
    if (fromFunctionCalls !== void 0 && fromFunctionCalls !== null && Array.isArray(fromFunctionCalls)) {
      setValueByPath(toObject, ["functionCalls"], fromFunctionCalls.map((item) => {
        return functionCallFromVertex(apiClient, item);
      }));
    }
    return toObject;
  }
  function liveServerToolCallCancellationFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromIds = getValueByPath(fromObject, ["ids"]);
    if (fromIds !== void 0) {
      setValueByPath(toObject, ["ids"], fromIds);
    }
    return toObject;
  }
  function liveServerToolCallCancellationFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromIds = getValueByPath(fromObject, ["ids"]);
    if (fromIds !== void 0) {
      setValueByPath(toObject, ["ids"], fromIds);
    }
    return toObject;
  }
  var FUNCTION_RESPONSE_REQUIRES_ID = "FunctionResponse request must have an `id` field from the response of a ToolCall.FunctionalCalls in Google AI.";
  async function handleWebSocketMessage(apiClient, onmessage, event) {
    let serverMessage;
    let data;
    if (event.data instanceof Blob) {
      data = JSON.parse(await event.data.text());
    } else {
      data = JSON.parse(event.data);
    }
    if (apiClient.isVertexAI()) {
      serverMessage = liveServerMessageFromVertex(apiClient, data);
    } else {
      serverMessage = liveServerMessageFromMldev(apiClient, data);
    }
    onmessage(serverMessage);
  }
  var Live = class {
    constructor(apiClient, auth, webSocketFactory) {
      this.apiClient = apiClient;
      this.auth = auth;
      this.webSocketFactory = webSocketFactory;
    }
    async connect(params) {
      var _a2, _b;
      const websocketBaseUrl = this.apiClient.getWebsocketBaseUrl();
      const apiVersion = this.apiClient.getApiVersion();
      let url;
      const headers = mapToHeaders(this.apiClient.getDefaultHeaders());
      if (this.apiClient.isVertexAI()) {
        url = `${websocketBaseUrl}/ws/google.cloud.aiplatform.${apiVersion}.LlmBidiService/BidiGenerateContent`;
        await this.auth.addAuthHeaders(headers);
      } else {
        const apiKey = this.apiClient.getApiKey();
        url = `${websocketBaseUrl}/ws/google.ai.generativelanguage.${apiVersion}.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      }
      let onopenResolve = () => {
      };
      const onopenPromise = new Promise((resolve) => {
        onopenResolve = resolve;
      });
      const callbacks = params.callbacks;
      const onopenAwaitedCallback = function() {
        var _a3;
        (_a3 = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onopen) === null || _a3 === void 0 ? void 0 : _a3.call(callbacks);
        onopenResolve({});
      };
      const apiClient = this.apiClient;
      const websocketCallbacks = {
        onopen: onopenAwaitedCallback,
        onmessage: (event) => {
          void handleWebSocketMessage(apiClient, callbacks.onmessage, event);
        },
        onerror: (_a2 = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onerror) !== null && _a2 !== void 0 ? _a2 : function(e) {
        },
        onclose: (_b = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onclose) !== null && _b !== void 0 ? _b : function(e) {
        }
      };
      const conn = this.webSocketFactory.create(url, headersToMap(headers), websocketCallbacks);
      conn.connect();
      await onopenPromise;
      let transformedModel = tModel(this.apiClient, params.model);
      if (this.apiClient.isVertexAI() && transformedModel.startsWith("publishers/")) {
        const project = this.apiClient.getProject();
        const location = this.apiClient.getLocation();
        transformedModel = `projects/${project}/locations/${location}/` + transformedModel;
      }
      let clientMessage = {};
      const liveConnectParameters = {
        model: transformedModel,
        config: params.config,
        callbacks: params.callbacks
      };
      if (this.apiClient.isVertexAI()) {
        clientMessage = liveConnectParametersToVertex(this.apiClient, liveConnectParameters);
      } else {
        clientMessage = liveConnectParametersToMldev(this.apiClient, liveConnectParameters);
      }
      conn.send(JSON.stringify(clientMessage));
      return new Session2(conn, this.apiClient);
    }
  };
  var defaultLiveSendClientContentParamerters = {
    turnComplete: true
  };
  var Session2 = class {
    constructor(conn, apiClient) {
      this.conn = conn;
      this.apiClient = apiClient;
    }
    tLiveClientContent(apiClient, params) {
      if (params.turns !== null && params.turns !== void 0) {
        let contents = [];
        try {
          contents = tContents(apiClient, params.turns);
          if (apiClient.isVertexAI()) {
            contents = contents.map((item) => contentToVertex(apiClient, item));
          } else {
            contents = contents.map((item) => contentToMldev(apiClient, item));
          }
        } catch (_a2) {
          throw new Error(`Failed to parse client content "turns", type: '${typeof params.turns}'`);
        }
        return {
          clientContent: { turns: contents, turnComplete: params.turnComplete }
        };
      }
      return {
        clientContent: { turnComplete: params.turnComplete }
      };
    }
    tLiveClientRealtimeInput(apiClient, params) {
      let clientMessage = {};
      if (!("media" in params) || !params.media) {
        throw new Error(`Failed to convert realtime input "media", type: '${typeof params.media}'`);
      }
      clientMessage = { realtimeInput: { mediaChunks: [params.media] } };
      return clientMessage;
    }
    tLiveClienttToolResponse(apiClient, params) {
      let functionResponses = [];
      if (params.functionResponses == null) {
        throw new Error("functionResponses is required.");
      }
      if (!Array.isArray(params.functionResponses)) {
        functionResponses = [params.functionResponses];
      }
      if (functionResponses.length === 0) {
        throw new Error("functionResponses is required.");
      }
      for (const functionResponse of functionResponses) {
        if (typeof functionResponse !== "object" || functionResponse === null || !("name" in functionResponse) || !("response" in functionResponse)) {
          throw new Error(`Could not parse function response, type '${typeof functionResponse}'.`);
        }
        if (!apiClient.isVertexAI() && !("id" in functionResponse)) {
          throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
        }
      }
      const clientMessage = {
        toolResponse: { functionResponses }
      };
      return clientMessage;
    }
    sendClientContent(params) {
      params = Object.assign(Object.assign({}, defaultLiveSendClientContentParamerters), params);
      const clientMessage = this.tLiveClientContent(this.apiClient, params);
      this.conn.send(JSON.stringify(clientMessage));
    }
    sendRealtimeInput(params) {
      if (params.media == null) {
        throw new Error("Media is required.");
      }
      const clientMessage = this.tLiveClientRealtimeInput(this.apiClient, params);
      this.conn.send(JSON.stringify(clientMessage));
    }
    sendToolResponse(params) {
      if (params.functionResponses == null) {
        throw new Error("Tool response parameters are required.");
      }
      const clientMessage = this.tLiveClienttToolResponse(this.apiClient, params);
      this.conn.send(JSON.stringify(clientMessage));
    }
    close() {
      this.conn.close();
    }
  };
  function headersToMap(headers) {
    const headerMap = {};
    headers.forEach((value, key) => {
      headerMap[key] = value;
    });
    return headerMap;
  }
  function mapToHeaders(map) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(map)) {
      headers.append(key, value);
    }
    return headers;
  }
  var Models = class extends BaseModule {
    constructor(apiClient) {
      super();
      this.apiClient = apiClient;
      this.generateContent = async (params) => {
        return await this.generateContentInternal(params);
      };
      this.generateContentStream = async (params) => {
        return await this.generateContentStreamInternal(params);
      };
      this.generateImages = async (params) => {
        return await this.generateImagesInternal(params).then((apiResponse) => {
          var _a2;
          let positivePromptSafetyAttributes;
          const generatedImages = [];
          if (apiResponse === null || apiResponse === void 0 ? void 0 : apiResponse.generatedImages) {
            for (const generatedImage of apiResponse.generatedImages) {
              if (generatedImage && (generatedImage === null || generatedImage === void 0 ? void 0 : generatedImage.safetyAttributes) && ((_a2 = generatedImage === null || generatedImage === void 0 ? void 0 : generatedImage.safetyAttributes) === null || _a2 === void 0 ? void 0 : _a2.contentType) === "Positive Prompt") {
                positivePromptSafetyAttributes = generatedImage === null || generatedImage === void 0 ? void 0 : generatedImage.safetyAttributes;
              } else {
                generatedImages.push(generatedImage);
              }
            }
          }
          let response;
          if (positivePromptSafetyAttributes) {
            response = {
              generatedImages,
              positivePromptSafetyAttributes
            };
          } else {
            response = {
              generatedImages
            };
          }
          return response;
        });
      };
    }
    async generateContentInternal(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = generateContentParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:generateContent", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = generateContentResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new GenerateContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = generateContentParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:generateContent", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = generateContentResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new GenerateContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async generateContentStreamInternal(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = generateContentParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:streamGenerateContent?alt=sse", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        const apiClient = this.apiClient;
        response = apiClient.requestStream({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        });
        return response.then(function(apiResponse) {
          return __asyncGenerator(this, arguments, function* () {
            var _a3, e_1, _b2, _c;
            try {
              for (var _d = true, apiResponse_1 = __asyncValues(apiResponse), apiResponse_1_1; apiResponse_1_1 = yield __await(apiResponse_1.next()), _a3 = apiResponse_1_1.done, !_a3; _d = true) {
                _c = apiResponse_1_1.value;
                _d = false;
                const chunk = _c;
                const resp = generateContentResponseFromVertex(apiClient, chunk);
                const typedResp = new GenerateContentResponse();
                Object.assign(typedResp, resp);
                yield yield __await(typedResp);
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (!_d && !_a3 && (_b2 = apiResponse_1.return))
                  yield __await(_b2.call(apiResponse_1));
              } finally {
                if (e_1)
                  throw e_1.error;
              }
            }
          });
        });
      } else {
        const body = generateContentParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:streamGenerateContent?alt=sse", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        const apiClient = this.apiClient;
        response = apiClient.requestStream({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        });
        return response.then(function(apiResponse) {
          return __asyncGenerator(this, arguments, function* () {
            var _a3, e_2, _b2, _c;
            try {
              for (var _d = true, apiResponse_2 = __asyncValues(apiResponse), apiResponse_2_1; apiResponse_2_1 = yield __await(apiResponse_2.next()), _a3 = apiResponse_2_1.done, !_a3; _d = true) {
                _c = apiResponse_2_1.value;
                _d = false;
                const chunk = _c;
                const resp = generateContentResponseFromMldev(apiClient, chunk);
                const typedResp = new GenerateContentResponse();
                Object.assign(typedResp, resp);
                yield yield __await(typedResp);
              }
            } catch (e_2_1) {
              e_2 = { error: e_2_1 };
            } finally {
              try {
                if (!_d && !_a3 && (_b2 = apiResponse_2.return))
                  yield __await(_b2.call(apiResponse_2));
              } finally {
                if (e_2)
                  throw e_2.error;
              }
            }
          });
        });
      }
    }
    async embedContent(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = embedContentParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:predict", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = embedContentResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new EmbedContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = embedContentParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:batchEmbedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = embedContentResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new EmbedContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async generateImagesInternal(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = generateImagesParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:predict", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = generateImagesResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new GenerateImagesResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = generateImagesParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:predict", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = generateImagesResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new GenerateImagesResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async countTokens(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = countTokensParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:countTokens", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = countTokensResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new CountTokensResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = countTokensParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:countTokens", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = countTokensResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new CountTokensResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async computeTokens(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = computeTokensParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:computeTokens", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = computeTokensResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new ComputeTokensResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        throw new Error("This method is only supported by the Vertex AI.");
      }
    }
  };
  var CONTENT_TYPE_HEADER = "Content-Type";
  var USER_AGENT_HEADER = "User-Agent";
  var GOOGLE_API_CLIENT_HEADER = "x-goog-api-client";
  var SDK_VERSION = "0.6.1";
  var LIBRARY_LABEL = `google-genai-sdk/${SDK_VERSION}`;
  var VERTEX_AI_API_DEFAULT_VERSION = "v1beta1";
  var GOOGLE_AI_API_DEFAULT_VERSION = "v1beta";
  var responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
  var ClientError = class extends Error {
    constructor(message, stackTrace) {
      if (stackTrace) {
        super(message, { cause: stackTrace });
      } else {
        super(message, { cause: new Error().stack });
      }
      this.message = message;
      this.name = "ClientError";
    }
  };
  var ServerError = class extends Error {
    constructor(message, stackTrace) {
      if (stackTrace) {
        super(message, { cause: stackTrace });
      } else {
        super(message, { cause: new Error().stack });
      }
      this.message = message;
      this.name = "ServerError";
    }
  };
  var ApiClient = class {
    constructor(opts) {
      var _a2, _b;
      this.clientOptions = Object.assign(Object.assign({}, opts), { project: opts.project, location: opts.location, apiKey: opts.apiKey, vertexai: opts.vertexai });
      const initHttpOptions = {};
      if (this.clientOptions.vertexai) {
        initHttpOptions.apiVersion = (_a2 = this.clientOptions.apiVersion) !== null && _a2 !== void 0 ? _a2 : VERTEX_AI_API_DEFAULT_VERSION;
        if (this.getProject() || this.getLocation()) {
          initHttpOptions.baseUrl = `https://${this.clientOptions.location}-aiplatform.googleapis.com/`;
          this.clientOptions.apiKey = void 0;
        } else {
          initHttpOptions.baseUrl = `https://aiplatform.googleapis.com/`;
          this.clientOptions.project = void 0;
          this.clientOptions.location = void 0;
        }
      } else {
        initHttpOptions.apiVersion = (_b = this.clientOptions.apiVersion) !== null && _b !== void 0 ? _b : GOOGLE_AI_API_DEFAULT_VERSION;
        initHttpOptions.baseUrl = `https://generativelanguage.googleapis.com/`;
      }
      initHttpOptions.headers = this.getDefaultHeaders();
      this.clientOptions.httpOptions = initHttpOptions;
      if (opts.httpOptions) {
        this.clientOptions.httpOptions = this.patchHttpOptions(initHttpOptions, opts.httpOptions);
      }
    }
    isVertexAI() {
      var _a2;
      return (_a2 = this.clientOptions.vertexai) !== null && _a2 !== void 0 ? _a2 : false;
    }
    getProject() {
      return this.clientOptions.project;
    }
    getLocation() {
      return this.clientOptions.location;
    }
    getApiVersion() {
      if (this.clientOptions.httpOptions && this.clientOptions.httpOptions.apiVersion !== void 0) {
        return this.clientOptions.httpOptions.apiVersion;
      }
      throw new Error("API version is not set.");
    }
    getBaseUrl() {
      if (this.clientOptions.httpOptions && this.clientOptions.httpOptions.baseUrl !== void 0) {
        return this.clientOptions.httpOptions.baseUrl;
      }
      throw new Error("Base URL is not set.");
    }
    getRequestUrl() {
      return this.getRequestUrlInternal(this.clientOptions.httpOptions);
    }
    getHeaders() {
      if (this.clientOptions.httpOptions && this.clientOptions.httpOptions.headers !== void 0) {
        return this.clientOptions.httpOptions.headers;
      } else {
        throw new Error("Headers are not set.");
      }
    }
    getRequestUrlInternal(httpOptions) {
      if (!httpOptions || httpOptions.baseUrl === void 0 || httpOptions.apiVersion === void 0) {
        throw new Error("HTTP options are not correctly set.");
      }
      const baseUrl = httpOptions.baseUrl.endsWith("/") ? httpOptions.baseUrl.slice(0, -1) : httpOptions.baseUrl;
      const urlElement = [baseUrl];
      if (httpOptions.apiVersion && httpOptions.apiVersion !== "") {
        urlElement.push(httpOptions.apiVersion);
      }
      return urlElement.join("/");
    }
    getBaseResourcePath() {
      return `projects/${this.clientOptions.project}/locations/${this.clientOptions.location}`;
    }
    getApiKey() {
      return this.clientOptions.apiKey;
    }
    getWebsocketBaseUrl() {
      const baseUrl = this.getBaseUrl();
      const urlParts = new URL(baseUrl);
      urlParts.protocol = "wss";
      return urlParts.toString();
    }
    setBaseUrl(url) {
      if (this.clientOptions.httpOptions) {
        this.clientOptions.httpOptions.baseUrl = url;
      } else {
        throw new Error("HTTP options are not correctly set.");
      }
    }
    constructUrl(path, httpOptions) {
      const urlElement = [this.getRequestUrlInternal(httpOptions)];
      if (this.clientOptions.vertexai && !this.clientOptions.apiKey && !path.startsWith("projects/")) {
        urlElement.push(this.getBaseResourcePath());
      }
      if (path !== "") {
        urlElement.push(path);
      }
      const url = new URL(`${urlElement.join("/")}`);
      return url;
    }
    async request(request) {
      let patchedHttpOptions = this.clientOptions.httpOptions;
      if (request.httpOptions) {
        patchedHttpOptions = this.patchHttpOptions(this.clientOptions.httpOptions, request.httpOptions);
      }
      const url = this.constructUrl(request.path, patchedHttpOptions);
      if (request.queryParams) {
        for (const [key, value] of Object.entries(request.queryParams)) {
          url.searchParams.append(key, String(value));
        }
      }
      let requestInit = {};
      if (request.httpMethod === "GET") {
        if (request.body && request.body !== "{}") {
          throw new Error("Request body should be empty for GET request, but got non empty request body");
        }
      } else {
        requestInit.body = request.body;
      }
      requestInit = await this.includeExtraHttpOptionsToRequestInit(requestInit, patchedHttpOptions);
      return this.unaryApiCall(url, requestInit, request.httpMethod);
    }
    patchHttpOptions(baseHttpOptions, requestHttpOptions) {
      const patchedHttpOptions = JSON.parse(JSON.stringify(baseHttpOptions));
      for (const [key, value] of Object.entries(requestHttpOptions)) {
        if (typeof value === "object") {
          patchedHttpOptions[key] = Object.assign(Object.assign({}, patchedHttpOptions[key]), value);
        } else if (value !== void 0) {
          patchedHttpOptions[key] = value;
        }
      }
      return patchedHttpOptions;
    }
    async requestStream(request) {
      let patchedHttpOptions = this.clientOptions.httpOptions;
      if (request.httpOptions) {
        patchedHttpOptions = this.patchHttpOptions(this.clientOptions.httpOptions, request.httpOptions);
      }
      const url = this.constructUrl(request.path, patchedHttpOptions);
      if (!url.searchParams.has("alt") || url.searchParams.get("alt") !== "sse") {
        url.searchParams.set("alt", "sse");
      }
      let requestInit = {};
      requestInit.body = request.body;
      requestInit = await this.includeExtraHttpOptionsToRequestInit(requestInit, patchedHttpOptions);
      return this.streamApiCall(url, requestInit, request.httpMethod);
    }
    async includeExtraHttpOptionsToRequestInit(requestInit, httpOptions) {
      if (httpOptions && httpOptions.timeout && httpOptions.timeout > 0) {
        const abortController = new AbortController();
        const signal = abortController.signal;
        setTimeout(() => abortController.abort(), httpOptions.timeout);
        requestInit.signal = signal;
      }
      requestInit.headers = await this.getHeadersInternal(httpOptions);
      return requestInit;
    }
    async unaryApiCall(url, requestInit, httpMethod) {
      return this.apiCall(url.toString(), Object.assign(Object.assign({}, requestInit), { method: httpMethod })).then(async (response) => {
        await throwErrorIfNotOK(response);
        return new HttpResponse(response);
      }).catch((e) => {
        if (e instanceof Error) {
          throw e;
        } else {
          throw new Error(JSON.stringify(e));
        }
      });
    }
    async streamApiCall(url, requestInit, httpMethod) {
      return this.apiCall(url.toString(), Object.assign(Object.assign({}, requestInit), { method: httpMethod })).then(async (response) => {
        await throwErrorIfNotOK(response);
        return this.processStreamResponse(response);
      }).catch((e) => {
        if (e instanceof Error) {
          throw e;
        } else {
          throw new Error(JSON.stringify(e));
        }
      });
    }
    processStreamResponse(response) {
      var _a2;
      return __asyncGenerator(this, arguments, function* processStreamResponse_1() {
        const reader = (_a2 = response === null || response === void 0 ? void 0 : response.body) === null || _a2 === void 0 ? void 0 : _a2.getReader();
        const decoder = new TextDecoder("utf-8");
        if (!reader) {
          throw new Error("Response body is empty");
        }
        try {
          let buffer = "";
          while (true) {
            const { done, value } = yield __await(reader.read());
            if (done) {
              if (buffer.trim().length > 0) {
                throw new Error("Incomplete JSON segment at the end");
              }
              break;
            }
            const chunkString = decoder.decode(value);
            buffer += chunkString;
            let match = buffer.match(responseLineRE);
            while (match) {
              const processedChunkString = match[1];
              try {
                const chunkData = JSON.parse(processedChunkString);
                yield yield __await(chunkData);
                buffer = buffer.slice(match[0].length);
                match = buffer.match(responseLineRE);
              } catch (e) {
                throw new Error(`exception parsing stream chunk ${processedChunkString}. ${e}`);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      });
    }
    async apiCall(url, requestInit) {
      return fetch(url, requestInit).catch((e) => {
        throw new Error(`exception ${e} sending request`);
      });
    }
    getDefaultHeaders() {
      const headers = {};
      const versionHeaderValue = LIBRARY_LABEL + " " + this.clientOptions.userAgentExtra;
      headers[USER_AGENT_HEADER] = versionHeaderValue;
      headers[GOOGLE_API_CLIENT_HEADER] = versionHeaderValue;
      headers[CONTENT_TYPE_HEADER] = "application/json";
      return headers;
    }
    async getHeadersInternal(httpOptions) {
      const headers = new Headers();
      if (httpOptions && httpOptions.headers) {
        for (const [key, value] of Object.entries(httpOptions.headers)) {
          headers.append(key, value);
        }
      }
      await this.clientOptions.auth.addAuthHeaders(headers);
      return headers;
    }
    async uploadFile(file, config) {
      var _a2;
      const fileToUpload = {};
      if (config != null) {
        fileToUpload.mimeType = config.mimeType;
        fileToUpload.name = config.name;
        fileToUpload.displayName = config.displayName;
      }
      if (fileToUpload.name && !fileToUpload.name.startsWith("files/")) {
        fileToUpload.name = `files/${fileToUpload.name}`;
      }
      const uploader = this.clientOptions.uploader;
      const fileStat = await uploader.stat(file);
      fileToUpload.sizeBytes = fileStat.size;
      const mimeType = (_a2 = config === null || config === void 0 ? void 0 : config.mimeType) !== null && _a2 !== void 0 ? _a2 : fileStat.type;
      if (mimeType === void 0 || mimeType === "") {
        throw new Error("Can not determine mimeType. Please provide mimeType in the config.");
      }
      fileToUpload.mimeType = mimeType;
      const uploadUrl = await this.fetchUploadUrl(fileToUpload, config);
      return uploader.upload(file, uploadUrl, this);
    }
    async fetchUploadUrl(file, config) {
      var _a2;
      let httpOptions = {};
      if (config === null || config === void 0 ? void 0 : config.httpOptions) {
        httpOptions = config.httpOptions;
      } else {
        httpOptions = {
          apiVersion: "",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": `${file.sizeBytes}`,
            "X-Goog-Upload-Header-Content-Type": `${file.mimeType}`
          }
        };
      }
      const body = {
        "file": file
      };
      const httpResponse = await this.request({
        path: formatMap("upload/v1beta/files", body["_url"]),
        body: JSON.stringify(body),
        httpMethod: "POST",
        httpOptions
      });
      if (!httpResponse || !(httpResponse === null || httpResponse === void 0 ? void 0 : httpResponse.headers)) {
        throw new Error("Server did not return an HttpResponse or the returned HttpResponse did not have headers.");
      }
      const uploadUrl = (_a2 = httpResponse === null || httpResponse === void 0 ? void 0 : httpResponse.headers) === null || _a2 === void 0 ? void 0 : _a2["x-goog-upload-url"];
      if (uploadUrl === void 0) {
        throw new Error("Failed to get upload url. Server did not return the x-google-upload-url in the headers");
      }
      return uploadUrl;
    }
  };
  async function throwErrorIfNotOK(response) {
    var _a2;
    if (response === void 0) {
      throw new ServerError("response is undefined");
    }
    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      let errorBody;
      if ((_a2 = response.headers.get("content-type")) === null || _a2 === void 0 ? void 0 : _a2.includes("application/json")) {
        errorBody = await response.json();
      } else {
        errorBody = {
          error: {
            message: "exception parsing response",
            code: response.status,
            status: response.statusText
          }
        };
      }
      const errorMessage = `got status: ${status} ${statusText}. ${JSON.stringify(errorBody)}`;
      if (status >= 400 && status < 500) {
        const clientError = new ClientError(errorMessage);
        throw clientError;
      } else if (status >= 500 && status < 600) {
        const serverError = new ServerError(errorMessage);
        throw serverError;
      }
      throw new Error(errorMessage);
    }
  }
  function listFilesConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ["pageSize"]);
    if (parentObject !== void 0 && fromPageSize != null) {
      setValueByPath(parentObject, ["_query", "pageSize"], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ["pageToken"]);
    if (parentObject !== void 0 && fromPageToken != null) {
      setValueByPath(parentObject, ["_query", "pageToken"], fromPageToken);
    }
    return toObject;
  }
  function listFilesParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], listFilesConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function fileStatusToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromDetails = getValueByPath(fromObject, ["details"]);
    if (fromDetails != null) {
      setValueByPath(toObject, ["details"], fromDetails);
    }
    const fromMessage = getValueByPath(fromObject, ["message"]);
    if (fromMessage != null) {
      setValueByPath(toObject, ["message"], fromMessage);
    }
    const fromCode = getValueByPath(fromObject, ["code"]);
    if (fromCode != null) {
      setValueByPath(toObject, ["code"], fromCode);
    }
    return toObject;
  }
  function fileToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    const fromSizeBytes = getValueByPath(fromObject, ["sizeBytes"]);
    if (fromSizeBytes != null) {
      setValueByPath(toObject, ["sizeBytes"], fromSizeBytes);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromExpirationTime = getValueByPath(fromObject, [
      "expirationTime"
    ]);
    if (fromExpirationTime != null) {
      setValueByPath(toObject, ["expirationTime"], fromExpirationTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    const fromSha256Hash = getValueByPath(fromObject, ["sha256Hash"]);
    if (fromSha256Hash != null) {
      setValueByPath(toObject, ["sha256Hash"], fromSha256Hash);
    }
    const fromUri = getValueByPath(fromObject, ["uri"]);
    if (fromUri != null) {
      setValueByPath(toObject, ["uri"], fromUri);
    }
    const fromDownloadUri = getValueByPath(fromObject, ["downloadUri"]);
    if (fromDownloadUri != null) {
      setValueByPath(toObject, ["downloadUri"], fromDownloadUri);
    }
    const fromState = getValueByPath(fromObject, ["state"]);
    if (fromState != null) {
      setValueByPath(toObject, ["state"], fromState);
    }
    const fromSource = getValueByPath(fromObject, ["source"]);
    if (fromSource != null) {
      setValueByPath(toObject, ["source"], fromSource);
    }
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromError = getValueByPath(fromObject, ["error"]);
    if (fromError != null) {
      setValueByPath(toObject, ["error"], fileStatusToMldev(apiClient, fromError));
    }
    return toObject;
  }
  function createFileParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFile = getValueByPath(fromObject, ["file"]);
    if (fromFile != null) {
      setValueByPath(toObject, ["file"], fileToMldev(apiClient, fromFile));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function getFileParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "file"], tFileName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function deleteFileParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "file"], tFileName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function fileStatusFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromDetails = getValueByPath(fromObject, ["details"]);
    if (fromDetails != null) {
      setValueByPath(toObject, ["details"], fromDetails);
    }
    const fromMessage = getValueByPath(fromObject, ["message"]);
    if (fromMessage != null) {
      setValueByPath(toObject, ["message"], fromMessage);
    }
    const fromCode = getValueByPath(fromObject, ["code"]);
    if (fromCode != null) {
      setValueByPath(toObject, ["code"], fromCode);
    }
    return toObject;
  }
  function fileFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    const fromSizeBytes = getValueByPath(fromObject, ["sizeBytes"]);
    if (fromSizeBytes != null) {
      setValueByPath(toObject, ["sizeBytes"], fromSizeBytes);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromExpirationTime = getValueByPath(fromObject, [
      "expirationTime"
    ]);
    if (fromExpirationTime != null) {
      setValueByPath(toObject, ["expirationTime"], fromExpirationTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    const fromSha256Hash = getValueByPath(fromObject, ["sha256Hash"]);
    if (fromSha256Hash != null) {
      setValueByPath(toObject, ["sha256Hash"], fromSha256Hash);
    }
    const fromUri = getValueByPath(fromObject, ["uri"]);
    if (fromUri != null) {
      setValueByPath(toObject, ["uri"], fromUri);
    }
    const fromDownloadUri = getValueByPath(fromObject, ["downloadUri"]);
    if (fromDownloadUri != null) {
      setValueByPath(toObject, ["downloadUri"], fromDownloadUri);
    }
    const fromState = getValueByPath(fromObject, ["state"]);
    if (fromState != null) {
      setValueByPath(toObject, ["state"], fromState);
    }
    const fromSource = getValueByPath(fromObject, ["source"]);
    if (fromSource != null) {
      setValueByPath(toObject, ["source"], fromSource);
    }
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromError = getValueByPath(fromObject, ["error"]);
    if (fromError != null) {
      setValueByPath(toObject, ["error"], fileStatusFromMldev(apiClient, fromError));
    }
    return toObject;
  }
  function listFilesResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
      "nextPageToken"
    ]);
    if (fromNextPageToken != null) {
      setValueByPath(toObject, ["nextPageToken"], fromNextPageToken);
    }
    const fromFiles = getValueByPath(fromObject, ["files"]);
    if (fromFiles != null) {
      if (Array.isArray(fromFiles)) {
        setValueByPath(toObject, ["files"], fromFiles.map((item) => {
          return fileFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["files"], fromFiles);
      }
    }
    return toObject;
  }
  function createFileResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromHttpHeaders = getValueByPath(fromObject, ["httpHeaders"]);
    if (fromHttpHeaders != null) {
      setValueByPath(toObject, ["httpHeaders"], fromHttpHeaders);
    }
    return toObject;
  }
  function deleteFileResponseFromMldev() {
    const toObject = {};
    return toObject;
  }
  var Files = class extends BaseModule {
    constructor(apiClient) {
      super();
      this.apiClient = apiClient;
      this.list = async (params = {}) => {
        return new Pager(PagedItem.PAGED_ITEM_FILES, (x) => this.listInternal(x), await this.listInternal(params), params);
      };
    }
    async upload(params) {
      if (this.apiClient.isVertexAI()) {
        throw new Error("Vertex AI does not support uploading files. You can share files through a GCS bucket.");
      }
      return this.apiClient.uploadFile(params.file, params.config).then((response) => {
        const file = fileFromMldev(this.apiClient, response);
        return file;
      });
    }
    async listInternal(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        throw new Error("This method is only supported by the Gemini Developer API.");
      } else {
        const body = listFilesParametersToMldev(this.apiClient, params);
        path = formatMap("files", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = listFilesResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new ListFilesResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async createInternal(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        throw new Error("This method is only supported by the Gemini Developer API.");
      } else {
        const body = createFileParametersToMldev(this.apiClient, params);
        path = formatMap("upload/v1beta/files", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = createFileResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new CreateFileResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async get(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        throw new Error("This method is only supported by the Gemini Developer API.");
      } else {
        const body = getFileParametersToMldev(this.apiClient, params);
        path = formatMap("files/{file}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = fileFromMldev(this.apiClient, apiResponse);
          return resp;
        });
      }
    }
    async delete(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        throw new Error("This method is only supported by the Gemini Developer API.");
      } else {
        const body = deleteFileParametersToMldev(this.apiClient, params);
        path = formatMap("files/{file}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "DELETE",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then(() => {
          const resp = deleteFileResponseFromMldev();
          const typedResp = new DeleteFileResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
  };
  var MAX_CHUNK_SIZE = 1024 * 1024 * 8;
  async function uploadBlob(file, uploadUrl, apiClient) {
    var _a2, _b;
    let fileSize = 0;
    let offset = 0;
    let response = new HttpResponse(new Response());
    let uploadCommand = "upload";
    fileSize = file.size;
    while (offset < fileSize) {
      const chunkSize = Math.min(MAX_CHUNK_SIZE, fileSize - offset);
      const chunk = file.slice(offset, offset + chunkSize);
      if (offset + chunkSize >= fileSize) {
        uploadCommand += ", finalize";
      }
      response = await apiClient.request({
        path: "",
        body: chunk,
        httpMethod: "POST",
        httpOptions: {
          apiVersion: "",
          baseUrl: uploadUrl,
          headers: {
            "X-Goog-Upload-Command": uploadCommand,
            "X-Goog-Upload-Offset": String(offset),
            "Content-Length": String(chunkSize)
          }
        }
      });
      offset += chunkSize;
      if (((_a2 = response === null || response === void 0 ? void 0 : response.headers) === null || _a2 === void 0 ? void 0 : _a2["x-goog-upload-status"]) !== "active") {
        break;
      }
      if (fileSize <= offset) {
        throw new Error("All content has been uploaded, but the upload status is not finalized.");
      }
    }
    const responseJson = await (response === null || response === void 0 ? void 0 : response.json());
    if (((_b = response === null || response === void 0 ? void 0 : response.headers) === null || _b === void 0 ? void 0 : _b["x-goog-upload-status"]) !== "final") {
      throw new Error("Failed to upload file: Upload status is not finalized.");
    }
    return responseJson["file"];
  }
  async function getBlobStat(file) {
    const fileStat = { size: file.size, type: file.type };
    return fileStat;
  }
  var BrowserUploader = class {
    async upload(file, uploadUrl, apiClient) {
      if (typeof file === "string") {
        throw new Error("File path is not supported in browser uploader.");
      }
      return await uploadBlob(file, uploadUrl, apiClient);
    }
    async stat(file) {
      if (typeof file === "string") {
        throw new Error("File path is not supported in browser uploader.");
      } else {
        return await getBlobStat(file);
      }
    }
  };
  var BrowserWebSocketFactory = class {
    create(url, headers, callbacks) {
      return new BrowserWebSocket(url, headers, callbacks);
    }
  };
  var BrowserWebSocket = class {
    constructor(url, headers, callbacks) {
      this.url = url;
      this.headers = headers;
      this.callbacks = callbacks;
    }
    connect() {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.callbacks.onopen;
      this.ws.onerror = this.callbacks.onerror;
      this.ws.onclose = this.callbacks.onclose;
      this.ws.onmessage = this.callbacks.onmessage;
    }
    send(message) {
      if (this.ws === void 0) {
        throw new Error("WebSocket is not connected");
      }
      this.ws.send(message);
    }
    close() {
      if (this.ws === void 0) {
        throw new Error("WebSocket is not connected");
      }
      this.ws.close();
    }
  };
  var GOOGLE_API_KEY_HEADER = "x-goog-api-key";
  var WebAuth = class {
    constructor(apiKey) {
      this.apiKey = apiKey;
    }
    async addAuthHeaders(headers) {
      if (headers.get(GOOGLE_API_KEY_HEADER) !== null) {
        return;
      }
      headers.append(GOOGLE_API_KEY_HEADER, this.apiKey);
    }
  };
  var LANGUAGE_LABEL_PREFIX = "gl-node/";
  var GoogleGenAI = class {
    constructor(options) {
      var _a2;
      if (options.apiKey == null) {
        throw new Error("An API Key must be set when running in a browser");
      }
      if (options.project || options.location) {
        throw new Error("Vertex AI project based authentication is not supported on browser runtimes. Please do not provide a project or location.");
      }
      this.vertexai = (_a2 = options.vertexai) !== null && _a2 !== void 0 ? _a2 : false;
      this.apiKey = options.apiKey;
      this.apiVersion = options.apiVersion;
      const auth = new WebAuth(this.apiKey);
      this.apiClient = new ApiClient({
        auth,
        apiVersion: this.apiVersion,
        apiKey: this.apiKey,
        vertexai: this.vertexai,
        httpOptions: options.httpOptions,
        userAgentExtra: LANGUAGE_LABEL_PREFIX + "web",
        uploader: new BrowserUploader()
      });
      this.models = new Models(this.apiClient);
      this.live = new Live(this.apiClient, auth, new BrowserWebSocketFactory());
      this.chats = new Chats(this.models, this.apiClient);
      this.caches = new Caches(this.apiClient);
      this.files = new Files(this.apiClient);
    }
  };

  // src/utils/Lyrics/fetchLyrics.ts
  var lyricsCache = new SpikyCache({
    name: "Cache_Lyrics"
  });
  async function fetchLyrics(uri) {
    resetLyricsUI();
    const currFetching = storage_default.get("currentlyFetching");
    if (currFetching == "true")
      return;
    storage_default.set("currentlyFetching", "true");
    document.querySelector("#SpicyLyricsPage .ContentBox")?.classList.remove("LyricsHidden");
    ClearLyricsPageContainer();
    const trackId = uri.split(":")[2];
    const localLyrics = await getLyricsFromLocalStorage(trackId);
    if (localLyrics)
      return localLyrics;
    const cachedLyrics = await getLyricsFromCache(trackId);
    if (cachedLyrics)
      return cachedLyrics;
    ShowLoaderContainer();
    return await fetchLyricsFromAPI(trackId);
  }
  async function fetchLyricsFromAPI(trackId) {
    try {
      Spicetify.showNotification("Fetching lyrics..", false, 1e3);
      const SpotifyAccessToken = await Platform_default.GetSpotifyAccessToken();
      let status = 0;
      const getLyricsResult = await getLyrics(trackId, {
        Authorization: `Bearer ${SpotifyAccessToken}`
      });
      let lyricsJson = getLyricsResult.response;
      status = getLyricsResult.status;
      if (!lyricsJson || typeof lyricsJson === "object" && !("id" in lyricsJson)) {
        lyricsJson = "";
      }
      if (status !== 200) {
        if (status === 500)
          return await noLyricsMessage(false, true);
        if (status === 401) {
          storage_default.set("currentlyFetching", "false");
          return await noLyricsMessage(false, false);
        }
        ClearLyricsPageContainer();
        if (status === 404) {
          return await noLyricsMessage(false, true);
        }
        return await noLyricsMessage(false, true);
      }
      ClearLyricsPageContainer();
      if (lyricsJson === null)
        return await noLyricsMessage(false, false);
      if (lyricsJson === "")
        return await noLyricsMessage(false, true);
      const hasKanji = lyricsJson.Content?.some(
        (item) => item.Lead?.Syllables?.some((syl) => /[\u4E00-\u9FFF]/.test(syl.Text))
      ) || lyricsJson.Content?.some((item) => /[\u4E00-\u9FFF]/.test(item.Text)) || lyricsJson.Lines?.some((item) => /[\u4E00-\u9FFF]/.test(item.Text)) || false;
      const hasKorean = lyricsJson.Content?.some(
        (item) => item.Lead?.Syllables?.some((syl) => /[\uAC00-\uD7AF]/.test(syl.Text))
      ) || lyricsJson.Content?.some((item) => /[\uAC00-\uD7AF]/.test(item.Text)) || lyricsJson.Lines?.some((item) => /[\uAC00-\uD7AF]/.test(item.Text)) || false;
      if (hasKanji) {
        if (storage_default.get("enable_romaji") === "true") {
          lyricsJson = await generateRomaji(lyricsJson);
        } else {
          lyricsJson = await generateFurigana(lyricsJson);
        }
      } else if (hasKorean) {
        lyricsJson = await generateRomaja(lyricsJson);
      }
      console.log("DEBUG result", lyricsJson);
      storage_default.set("currentLyricsData", JSON.stringify(lyricsJson));
      storage_default.set("currentlyFetching", "false");
      HideLoaderContainer();
      ClearLyricsPageContainer();
      if (lyricsCache) {
        const expiresAt = new Date().getTime() + 1e3 * 60 * 60 * 24 * 7;
        try {
          await lyricsCache.set(trackId, {
            ...lyricsJson,
            expiresAt
          });
        } catch (error) {
          console.error("Error saving lyrics to cache:", error);
        }
      }
      Defaults_default.CurrentLyricsType = lyricsJson.Type;
      Spicetify.showNotification("Completed", false, 1e3);
      return { ...lyricsJson, fromCache: false };
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      storage_default.set("currentlyFetching", "false");
      ClearLyricsPageContainer();
      return await noLyricsMessage(false, true);
    }
  }
  async function generateFurigana(lyricsJson) {
    return await generateLyricsWithPrompt(lyricsJson, Defaults_default.furiganaPrompt);
  }
  async function generateRomaja(lyricsJson) {
    return await generateLyricsWithPrompt(lyricsJson, Defaults_default.romajaPrompt);
  }
  async function generateRomaji(lyricsJson) {
    return await generateLyricsWithPrompt(lyricsJson, Defaults_default.romajiPrompt);
  }
  async function generateLyricsWithPrompt(lyricsJson, prompt) {
    if (!await checkGeminiAPIKey(lyricsJson)) {
      return lyricsJson;
    }
    lyricsJson = await processLyricsWithGemini(
      lyricsJson,
      Defaults_default.systemInstruction,
      prompt
    );
    return lyricsJson;
  }
  async function checkGeminiAPIKey(lyricsJson) {
    const GEMINI_API_KEY = storage_default.get("GEMINI_API_KEY")?.toString();
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "") {
      console.error("Amai Lyrics: Gemini API Key missing");
      lyricsJson.Info = "Amai Lyrics: Gemini API Key missing. Click here to add your own API key.";
      return false;
    }
    return true;
  }
  async function processLyricsWithGemini(lyricsJson, systemInstruction, prompt) {
    try {
      console.log("SI:", systemInstruction);
      console.log("Prompt:", prompt);
      console.log("Amai Lyrics: Gemini API Key present");
      const GEMINI_API_KEY = storage_default.get("GEMINI_API_KEY")?.toString();
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const generationConfig = {
        temperature: 0.258,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: [],
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            lines: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        systemInstruction: `${systemInstruction}`
      };
      console.log("Amai Lyrics:", "Fetch Begin");
      if (lyricsJson.Type === "Syllable") {
        lyricsJson.Type = "Line";
        lyricsJson.Content = await convertLyrics(lyricsJson.Content);
      }
      let lyricsOnly = await extractLyrics(lyricsJson);
      if (lyricsOnly.length > 0) {
        lyricsJson.Raw = lyricsOnly;
        const response = await ai.models.generateContent({
          config: generationConfig,
          model: "gemini-2.0-flash",
          contents: `${prompt} Here are the lyrics:
${JSON.stringify(
            lyricsOnly
          )}`
        });
        let lyrics = JSON.parse(response.text.replace(/\\n/g, ""));
        if (lyricsJson.Type === "Line") {
          lyricsJson.Content = lyricsJson.Content.map(
            (item, index) => ({
              ...item,
              Text: lyrics.lines[index]
            })
          );
        } else if (lyricsJson.Type === "Static") {
          lyricsJson.Lines = lyricsJson.Lines.map((item, index) => ({
            ...item,
            Text: lyrics.lines[index]
          }));
        }
      }
    } catch (error) {
      console.error("Amai Lyrics:", error);
      lyricsJson.Info = "Amai Lyrics: Fetch Error. Please double check your API key. Click here to open settings page.";
    }
    return lyricsJson;
  }
  async function extractLyrics(lyricsJson) {
    const removeEmptyLinesAndCharacters = (items) => {
      items = items.filter((item) => item.Text.trim() !== "");
      items = items.map((item) => {
        item.Text = item.Text.replace(/[「」",.!]/g, "");
        item.Text = item.Text.normalize("NFKC");
        return item;
      });
      return items;
    };
    if (lyricsJson.Type === "Line") {
      const offset = 0.55;
      lyricsJson.Content = lyricsJson.Content.map((item) => ({
        ...item,
        StartTime: Math.max(0, item.StartTime - offset)
      }));
      lyricsJson.Content = removeEmptyLinesAndCharacters(lyricsJson.Content);
      return lyricsJson.Content.map((item) => item.Text);
    }
    if (lyricsJson.Type === "Static") {
      lyricsJson.Lines = removeEmptyLinesAndCharacters(lyricsJson.Lines);
      return lyricsJson.Lines.map((item) => item.Text);
    }
  }
  async function getLyricsFromCache(trackId) {
    if (!lyricsCache)
      return null;
    try {
      const lyricsFromCache = await lyricsCache.get(trackId);
      if (!lyricsFromCache)
        return null;
      if (lyricsFromCache.expiresAt < new Date().getTime()) {
        await lyricsCache.remove(trackId);
        return null;
      }
      if (lyricsFromCache.status === "NO_LYRICS") {
        return await noLyricsMessage(false, true);
      }
      storage_default.set("currentLyricsData", JSON.stringify(lyricsFromCache));
      storage_default.set("currentlyFetching", "false");
      HideLoaderContainer();
      ClearLyricsPageContainer();
      Defaults_default.CurrentLyricsType = lyricsFromCache.Type;
      return { ...lyricsFromCache, fromCache: true };
    } catch (error) {
      ClearLyricsPageContainer();
      console.log("Error parsing saved lyrics data:", error);
      return await noLyricsMessage(false, true);
    }
  }
  async function getLyricsFromLocalStorage(trackId) {
    const savedLyricsData = storage_default.get("currentLyricsData")?.toString();
    if (!savedLyricsData)
      return null;
    try {
      if (savedLyricsData.includes("NO_LYRICS")) {
        const split = savedLyricsData.split(":");
        const id = split[1];
        if (id === trackId) {
          return await noLyricsMessage(false, true);
        }
      } else {
        const lyricsData = JSON.parse(savedLyricsData);
        if (lyricsData?.id === trackId) {
          storage_default.set("currentlyFetching", "false");
          HideLoaderContainer();
          ClearLyricsPageContainer();
          Defaults_default.CurrentLyricsType = lyricsData.Type;
          return lyricsData;
        }
      }
    } catch (error) {
      console.error("Error parsing saved lyrics data:", error);
      storage_default.set("currentlyFetching", "false");
      HideLoaderContainer();
      ClearLyricsPageContainer();
    }
    return null;
  }
  function resetLyricsUI() {
    const lyricsContent = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    if (lyricsContent?.classList.contains("offline")) {
      lyricsContent.classList.remove("offline");
    }
    document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.remove("Hidden");
    if (!Fullscreen_default.IsOpen)
      PageView_default.AppendViewControls(true);
  }
  function convertLyrics(data) {
    console.log("DEBUG", "Converting Syllable to Line type");
    return data.map((item) => {
      let leadText = "";
      let prevIsJapanese = null;
      item.Lead.Syllables.forEach((syl) => {
        const currentIsJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/.test(syl.Text);
        if (currentIsJapanese) {
          if (prevIsJapanese === false && leadText) {
            leadText += " ";
          }
          leadText += syl.Text;
        } else {
          leadText += (leadText ? " " : "") + syl.Text;
        }
        prevIsJapanese = currentIsJapanese;
      });
      let startTime = item.Lead.StartTime;
      let endTime = item.Lead.EndTime;
      let fullText = leadText;
      if (item.Background && Array.isArray(item.Background)) {
        const bgTexts = item.Background.map((bg) => {
          startTime = Math.min(startTime, bg.StartTime);
          endTime = Math.max(endTime, bg.EndTime);
          let bgText = "";
          let prevIsJapanese2 = null;
          bg.Syllables.forEach((syl) => {
            const currentIsJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/.test(
              syl.Text
            );
            if (currentIsJapanese) {
              if (prevIsJapanese2 === false && bgText) {
                bgText += " ";
              }
              bgText += syl.Text;
            } else {
              bgText += (bgText ? " " : "") + syl.Text;
            }
            prevIsJapanese2 = currentIsJapanese;
          });
          return bgText;
        });
        fullText += " (" + bgTexts.join(" ") + ")";
      }
      return {
        Type: item.Type,
        OppositeAligned: item.OppositeAligned,
        Text: fullText,
        StartTime: startTime,
        EndTime: endTime
      };
    });
  }
  async function noLyricsMessage(Cache2 = true, LocalStorage = true) {
    Spicetify.showNotification("Lyrics unavailable", false, 1e3);
    storage_default.set("currentlyFetching", "false");
    HideLoaderContainer();
    Defaults_default.CurrentLyricsType = "None";
    document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.add("Hidden");
    document.querySelector("#SpicyLyricsPage .ContentBox")?.classList.add("LyricsHidden");
    OpenNowBar();
    DeregisterNowBarBtn();
    return "1";
  }
  var ContainerShowLoaderTimeout;
  function ShowLoaderContainer() {
    if (document.querySelector("#SpicyLyricsPage .LyricsContainer .loaderContainer")) {
      ContainerShowLoaderTimeout = setTimeout(
        () => document.querySelector("#SpicyLyricsPage .LyricsContainer .loaderContainer").classList.add("active"),
        1e3
      );
    }
  }
  function HideLoaderContainer() {
    if (document.querySelector("#SpicyLyricsPage .LyricsContainer .loaderContainer")) {
      if (ContainerShowLoaderTimeout) {
        clearTimeout(ContainerShowLoaderTimeout);
        ContainerShowLoaderTimeout = null;
      }
      document.querySelector("#SpicyLyricsPage .LyricsContainer .loaderContainer").classList.remove("active");
    }
  }
  function ClearLyricsPageContainer() {
    if (document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent")) {
      document.querySelector(
        "#SpicyLyricsPage .LyricsContainer .LyricsContent"
      ).innerHTML = "";
    }
  }

  // src/edited_packages/spcr-settings/settingsSection.tsx
  var import_react = __toESM(require_react());
  var import_react_dom = __toESM(require_react_dom());
  var SettingsSection = class {
    constructor(name, settingsId, initialSettingsFields = {}) {
      this.name = name;
      this.settingsId = settingsId;
      this.initialSettingsFields = initialSettingsFields;
      this.settingsFields = this.initialSettingsFields;
      this.setRerender = null;
      this.pushSettings = async () => {
        Object.entries(this.settingsFields).forEach(([nameId, field]) => {
          if (field.type !== "button" && this.getFieldValue(nameId) === void 0) {
            this.setFieldValue(nameId, field.defaultValue);
          }
        });
        while (!Spicetify?.Platform?.History?.listen) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (this.stopHistoryListener)
          this.stopHistoryListener();
        this.stopHistoryListener = Spicetify.Platform.History.listen((e) => {
          if (e.pathname === "/preferences") {
            this.render();
          }
        });
        if (Spicetify.Platform.History.location.pathname === "/preferences") {
          await this.render();
        }
      };
      this.rerender = () => {
        if (this.setRerender) {
          this.setRerender(Math.random());
        }
      };
      this.render = async () => {
        while (!document.getElementById("desktop.settings.selectLanguage")) {
          if (Spicetify.Platform.History.location.pathname !== "/preferences")
            return;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        const allSettingsContainer = document.querySelector(
          ".main-view-container__scroll-node-child main div"
        );
        if (!allSettingsContainer)
          return console.error("[spcr-settings] settings container not found");
        let pluginSettingsContainer = Array.from(
          allSettingsContainer.children
        ).find((child) => child.id === this.settingsId);
        if (!pluginSettingsContainer) {
          pluginSettingsContainer = document.createElement("div");
          pluginSettingsContainer.id = this.settingsId;
          allSettingsContainer.appendChild(pluginSettingsContainer);
        } else {
          console.log(pluginSettingsContainer);
        }
        import_react_dom.default.render(/* @__PURE__ */ import_react.default.createElement(this.FieldsContainer, null), pluginSettingsContainer);
      };
      this.addButton = (nameId, description, value, onClick, events) => {
        this.settingsFields[nameId] = {
          type: "button",
          description,
          value,
          events: {
            onClick,
            ...events
          }
        };
      };
      this.addInput = (nameId, description, defaultValue, onChange, inputType, events) => {
        this.settingsFields[nameId] = {
          type: "input",
          description,
          defaultValue,
          inputType,
          events: {
            onChange,
            ...events
          }
        };
      };
      this.addHidden = (nameId, defaultValue) => {
        this.settingsFields[nameId] = {
          type: "hidden",
          defaultValue
        };
      };
      this.addToggle = (nameId, description, defaultValue, onChange, events) => {
        this.settingsFields[nameId] = {
          type: "toggle",
          description,
          defaultValue,
          events: {
            onChange,
            ...events
          }
        };
      };
      this.addDropDown = (nameId, description, options, defaultIndex, onSelect, events) => {
        this.settingsFields[nameId] = {
          type: "dropdown",
          description,
          defaultValue: options[defaultIndex],
          options,
          events: {
            onSelect,
            ...events
          }
        };
      };
      this.getFieldValue = (nameId) => {
        return JSON.parse(
          Spicetify.LocalStorage.get(`${this.settingsId}.${nameId}`) || "{}"
        )?.value;
      };
      this.setFieldValue = (nameId, newValue) => {
        Spicetify.LocalStorage.set(
          `${this.settingsId}.${nameId}`,
          JSON.stringify({ value: newValue })
        );
      };
      this.FieldsContainer = () => {
        const [rerender, setRerender] = (0, import_react.useState)(0);
        this.setRerender = setRerender;
        return /* @__PURE__ */ import_react.default.createElement("div", {
          className: "x-settings-section",
          key: rerender
        }, /* @__PURE__ */ import_react.default.createElement("h2", {
          className: "amai-settings-header"
        }, this.name), Object.entries(this.settingsFields).map(([nameId, field]) => {
          return /* @__PURE__ */ import_react.default.createElement(this.Field, {
            nameId,
            field
          });
        }));
      };
      this.Field = (props) => {
        const id = `${this.settingsId}.${props.nameId}`;
        let defaultStateValue;
        if (props.field.type === "button") {
          defaultStateValue = props.field.value;
        } else {
          defaultStateValue = this.getFieldValue(props.nameId);
        }
        if (props.field.type === "hidden") {
          return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null);
        }
        const [value, setValueState] = (0, import_react.useState)(defaultStateValue);
        const setValue = (newValue) => {
          if (newValue !== void 0) {
            setValueState(newValue);
            this.setFieldValue(props.nameId, newValue);
          }
        };
        return /* @__PURE__ */ import_react.default.createElement("div", {
          className: "x-settings-row"
        }, /* @__PURE__ */ import_react.default.createElement("div", {
          className: "x-settings-firstColumn"
        }, /* @__PURE__ */ import_react.default.createElement("label", {
          className: "TypeElement-viola-textSubdued-type",
          htmlFor: id
        }, props.field.description || "")), /* @__PURE__ */ import_react.default.createElement("div", {
          className: "x-settings-secondColumn"
        }, props.field.type === "input" ? /* @__PURE__ */ import_react.default.createElement("input", {
          className: "x-settings-input",
          id,
          dir: "ltr",
          value,
          type: props.field.inputType || "text",
          ...props.field.events,
          onChange: (e) => {
            setValue(e.currentTarget.value);
            const onChange = props.field.events?.onChange;
            if (onChange)
              onChange(e);
          }
        }) : props.field.type === "button" ? /* @__PURE__ */ import_react.default.createElement("span", null, /* @__PURE__ */ import_react.default.createElement("button", {
          id,
          className: "Button-sc-y0gtbx-0 Button-small-buttonSecondary-useBrowserDefaultFocusStyle x-settings-button",
          ...props.field.events,
          onClick: (e) => {
            setValue();
            const onClick = props.field.events?.onClick;
            if (onClick)
              onClick(e);
          },
          type: "button"
        }, value)) : props.field.type === "toggle" ? /* @__PURE__ */ import_react.default.createElement("label", {
          className: "x-settings-secondColumn x-toggle-wrapper"
        }, /* @__PURE__ */ import_react.default.createElement("input", {
          id,
          className: "x-toggle-input",
          type: "checkbox",
          checked: value,
          ...props.field.events,
          onClick: (e) => {
            setValue(e.currentTarget.checked);
            const onClick = props.field.events?.onClick;
            if (onClick)
              onClick(e);
          }
        }), /* @__PURE__ */ import_react.default.createElement("span", {
          className: "x-toggle-indicatorWrapper"
        }, /* @__PURE__ */ import_react.default.createElement("span", {
          className: "x-toggle-indicator"
        }))) : props.field.type === "dropdown" ? /* @__PURE__ */ import_react.default.createElement("select", {
          className: "main-dropDown-dropDown",
          id,
          ...props.field.events,
          onChange: (e) => {
            setValue(
              props.field.options[e.currentTarget.selectedIndex]
            );
            const onSelect = props.field.events?.onSelect;
            if (onSelect)
              onSelect(e);
          }
        }, props.field.options.map((option, i) => {
          return /* @__PURE__ */ import_react.default.createElement("option", {
            selected: option === value,
            value: i + 1
          }, option);
        })) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null)));
      };
    }
  };

  // src/utils/settings.ts
  function setSettingsMenu() {
    generalSettings();
    devSettings();
    infos();
  }
  function devSettings() {
    const settings = new SettingsSection(
      "Amai - Dev Settings",
      "amai-dev-settings"
    );
    settings.addButton(
      "remove-cached-lyrics",
      "Remove Cached Lyrics",
      "Remove Cached Lyrics",
      () => {
        lyricsCache.destroy();
        Spicetify.showNotification("Cache Destroyed Successfully!", false, 2e3);
      }
    );
    settings.addButton(
      "remove-current-song-lyrics-from-localStorage",
      "Remove Current Song Lyrics from LocalStorage",
      "Remove Current Lyrics",
      () => {
        storage_default.set("currentLyricsData", null);
        Spicetify.showNotification(
          "Current Lyrics Removed Successfully!",
          false,
          2e3
        );
      }
    );
    settings.addButton("reload", "Reload UI", "Reload", () => {
      window.location.reload();
    });
    settings.pushSettings();
  }
  function generalSettings() {
    const settings = new SettingsSection("Amai - Settings", "amai-settings");
    settings.addInput("gemini-api-key", "Gemini API Key", "", () => {
      storage_default.set(
        "GEMINI_API_KEY",
        settings.getFieldValue("gemini-api-key")
      );
      lyricsCache.destroy();
      storage_default.set("currentLyricsData", null);
      if (!Spicetify.Player.data?.item?.uri)
        return;
      const currentUri = Spicetify.Player.data.item.uri;
      fetchLyrics(currentUri).then(ApplyLyrics);
    });
    settings.addButton(
      "get-gemini-api",
      "Get your own Gemini API here",
      "get API",
      () => {
        window.location.href = "https://aistudio.google.com/app/apikey/";
      }
    );
    settings.addToggle(
      "enableRomaji",
      "Enable Romaji for Japanese Lyrics",
      Defaults_default.enableRomaji,
      () => {
        lyricsCache.destroy();
        storage_default.set("currentLyricsData", null);
        storage_default.set(
          "enable_romaji",
          settings.getFieldValue("enableRomaji")
        );
      }
    );
    settings.addToggle(
      "disableRomajiToggleNotification",
      "Disable Romaji/Furigana Toggle Notification",
      Defaults_default.disableRomajiToggleNotification,
      () => {
        storage_default.set(
          "disable_romaji_toggle_notification",
          settings.getFieldValue("disableRomajiToggleNotification")
        );
      }
    );
    settings.pushSettings();
  }
  function infos() {
    const settings = new SettingsSection("Amai - Info", "amai-info");
    settings.addButton(
      "more-info",
      "Enhances your Spotify experience by adding Furigana, Romaji for Japanese, and Romanization for Korean lyrics.",
      `${Defaults_default.Version}`,
      () => {
      }
    );
    settings.pushSettings();
  }

  // src/components/Styling/Fonts.ts
  var Fonts = DeepFreeze({
    Lyrics: () => LoadFont("https://fonts.spikerko.org/spicy-lyrics/source.css"),
    Vazirmatn: () => LoadFont("https://fonts.spikerko.org/Vazirmatn/source.css")
  });
  function LoadFonts() {
    Object.values(Fonts).forEach((loadFontFunction) => loadFontFunction());
  }
  function LoadFont(url) {
    const fontElement = document.createElement("link");
    fontElement.href = url;
    fontElement.rel = "stylesheet";
    fontElement.type = "text/css";
    document.head.appendChild(fontElement);
  }

  // src/utils/sleep.ts
  async function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
  }
  var sleep_default = sleep;

  // src/app.tsx
  async function main() {
    await Platform_default.OnSpotifyReady;
    if (!storage_default.get("lyrics_spacing")) {
      storage_default.set("lyrics_spacing", "Medium");
    }
    const htmlElement = document.documentElement;
    const spacingMap = {
      "None": "0",
      "Small": "0.5cqw 0",
      "Medium": "1cqw 0",
      "Large": "1.5cqw 0",
      "Extra Large": "2cqw 0"
    };
    const lyricsSpacing = storage_default.get("lyrics_spacing");
    if (spacingMap[lyricsSpacing]) {
      htmlElement.style.setProperty("--SpicyLyrics-LineSpacing", spacingMap[lyricsSpacing]);
    }
    setSettingsMenu();
    const OldStyleFont = storage_default.get("old-style-font");
    if (OldStyleFont != "true") {
      LoadFonts();
    }
    {
      const scripts = [];
      const GetFullUrl = (target) => `https://cdn.jsdelivr.net/gh/hudzax/amai-lyrics/dist/${target}`;
      const AddScript = (scriptFileName) => {
        const script = document.createElement("script");
        script.async = true;
        script.src = GetFullUrl(scriptFileName);
        console.log("Adding Script:", script.src);
        script.onerror = () => {
          sleep_default(2).then(() => {
            window._spicy_lyrics?.func_main?._deappend_scripts();
            window._spicy_lyrics?.func_main?._add_script(scriptFileName);
            window._spicy_lyrics?.func_main?._append_scripts();
          });
        };
        scripts.push(script);
      };
      Global_default.SetScope("func_main._add_script", AddScript);
      AddScript("spicy-hasher.js");
      AddScript("pako.min.js");
      AddScript("vibrant.min.js");
      const AppendScripts = () => {
        for (const script of scripts) {
          document.head.appendChild(script);
        }
      };
      const DeappendScripts = () => {
        for (const script of scripts) {
          document.head.removeChild(script);
        }
      };
      Global_default.SetScope("func_main._append_scripts", AppendScripts);
      Global_default.SetScope("func_main._deappend_scripts", DeappendScripts);
      AppendScripts();
    }
    const skeletonStyle = document.createElement("style");
    skeletonStyle.innerHTML = `
        <style>
            @keyframes skeleton {
                to {
                    background-position-x: 0
                }
            }
        </style>
  `;
    document.head.appendChild(skeletonStyle);
    let buttonRegistered = false;
    const button = new Spicetify.Playbar.Button(
      "Amai Lyrics",
      Icons.LyricsPage,
      (self2) => {
        if (!self2.active) {
          Session_default.Navigate({ pathname: "/AmaiLyrics" });
        } else {
          Session_default.GoBack();
        }
      },
      false,
      false
    );
    Global_default.Event.listen("pagecontainer:available", () => {
      if (!buttonRegistered) {
        button.register();
        buttonRegistered = true;
      }
    });
    const Hometinue = async () => {
      Whentil_default.When(() => Spicetify.Platform.PlaybackAPI, () => {
        requestPositionSync();
      });
      let lastImgUrl;
      const lowQModeEnabled = storage_default.get("lowQMode") === "true";
      function applyDynamicBackgroundToNowPlayingBar(coverUrl) {
        if (lowQModeEnabled)
          return;
        const nowPlayingBar = document.querySelector(".Root__right-sidebar aside.NowPlayingView");
        try {
          if (nowPlayingBar == null) {
            lastImgUrl = null;
            return;
          }
          ;
          if (coverUrl === lastImgUrl)
            return;
          const dynamicBackground = document.createElement("div");
          dynamicBackground.classList.add("spicy-dynamic-bg");
          dynamicBackground.innerHTML = `
          <img class="Front" src="${coverUrl}" />
          <img class="Back" src="${coverUrl}" />
          <img class="BackCenter" src="${coverUrl}" />
        `;
          nowPlayingBar.classList.add("spicy-dynamic-bg-in-this");
          if (nowPlayingBar?.querySelector(".spicy-dynamic-bg")) {
            nowPlayingBar.querySelector(".spicy-dynamic-bg").remove();
          }
          nowPlayingBar.appendChild(dynamicBackground);
          lastImgUrl = coverUrl;
        } catch (error) {
          console.error("Error Applying the Dynamic BG to the NowPlayingBar:", error);
        }
      }
      new IntervalManager(1, () => {
        applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
      }).Start();
      Spicetify.Player.addEventListener("songchange", onSongChange);
      Spicetify.Player.addEventListener("songchange", async (event) => {
        fetchLyrics(event?.data?.item?.uri).then(ApplyLyrics);
      });
      let songChangeLoopRan = 0;
      const songChangeLoopMax = 5;
      async function onSongChange(event) {
        let currentUri = event?.data?.item?.uri;
        if (!currentUri) {
          currentUri = Spicetify.Player.data?.item?.uri;
          if (!currentUri) {
            if (songChangeLoopRan >= songChangeLoopMax) {
              return;
            }
            onSongChange(event);
            songChangeLoopRan++;
            return;
          }
        }
        ;
        const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";
        if (IsSomethingElseThanTrack) {
          button.deregister();
          buttonRegistered = false;
        } else {
          if (!buttonRegistered) {
            button.register();
            buttonRegistered = true;
          }
        }
        if (!IsSomethingElseThanTrack) {
          await SpotifyPlayer.Track.GetTrackInfo();
          if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar"))
            UpdateNowBar();
        }
        applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
        songChangeLoopRan = 0;
        if (!document.querySelector("#SpicyLyricsPage .LyricsContainer"))
          return;
        ApplyDynamicBackground(document.querySelector("#SpicyLyricsPage .ContentBox"));
      }
      {
        fetchLyrics(Spicetify.Player.data.item.uri).then(ApplyLyrics);
      }
      window.addEventListener("online", async () => {
        storage_default.set("lastFetchedUri", null);
        fetchLyrics(Spicetify.Player.data?.item.uri).then(ApplyLyrics);
      });
      new IntervalManager(ScrollingIntervalTime, () => ScrollToActiveLine(ScrollSimplebar)).Start();
      let lastLocation = null;
      function loadPage(location) {
        if (location.pathname === "/AmaiLyrics") {
          PageView_default.Open();
          button.active = true;
        } else {
          if (lastLocation?.pathname === "/AmaiLyrics") {
            PageView_default.Destroy();
            button.active = false;
          }
        }
        lastLocation = location;
      }
      Spicetify.Platform.History.listen(loadPage);
      if (Spicetify.Platform.History.location.pathname === "/AmaiLyrics") {
        Global_default.Event.listen("pagecontainer:available", () => {
          loadPage(Spicetify.Platform.History.location);
          button.active = true;
        });
      }
      button.tippy.setContent("Amai Lyrics");
      Spicetify.Player.addEventListener("onplaypause", (e) => {
        SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
        Global_default.Event.evoke("playback:playpause", e);
      });
      {
        let lastLoopType = null;
        const LoopInt = new IntervalManager(0.2, () => {
          const LoopState = Spicetify.Player.getRepeat();
          const LoopType = LoopState === 1 ? "context" : LoopState === 2 ? "track" : "none";
          SpotifyPlayer.LoopType = LoopType;
          if (lastLoopType !== LoopType) {
            Global_default.Event.evoke("playback:loop", LoopType);
          }
          lastLoopType = LoopType;
        }).Start();
      }
      {
        let lastShuffleType = null;
        const ShuffleInt = new IntervalManager(0.2, () => {
          const ShuffleType = Spicetify.Player.origin._state.smartShuffle ? "smart" : Spicetify.Player.origin._state.shuffle ? "normal" : "none";
          SpotifyPlayer.ShuffleType = ShuffleType;
          if (lastShuffleType !== ShuffleType) {
            Global_default.Event.evoke("playback:shuffle", ShuffleType);
          }
          lastShuffleType = ShuffleType;
        }).Start();
      }
      {
        let lastPosition = 0;
        const PositionInt = new IntervalManager(0.5, () => {
          const pos = SpotifyPlayer.GetTrackPosition();
          if (pos !== lastPosition) {
            Global_default.Event.evoke("playback:position", pos);
          }
          lastPosition = pos;
        }).Start();
      }
      SpotifyPlayer.IsPlaying = IsPlaying();
      {
        Spicetify.Player.addEventListener("onplaypause", (e) => Global_default.Event.evoke("playback:playpause", e));
        Spicetify.Player.addEventListener("onprogress", (e) => Global_default.Event.evoke("playback:progress", e));
        Spicetify.Player.addEventListener("songchange", (e) => Global_default.Event.evoke("playback:songchange", e));
        Whentil_default.When(() => document.querySelector(".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"), () => {
          Global_default.Event.evoke("pagecontainer:available", document.querySelector(".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"));
        });
        Spicetify.Platform.History.listen(Session_default.RecordNavigation);
        Session_default.RecordNavigation(Spicetify.Platform.History.location);
      }
    };
    Whentil_default.When(() => Spicetify.Player.data.item.type, () => {
      const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";
      if (IsSomethingElseThanTrack) {
        button.deregister();
        buttonRegistered = false;
      } else {
        if (!buttonRegistered) {
          button.register();
          buttonRegistered = true;
        }
      }
    });
    Whentil_default.When(() => SpicyHasher && pako && Vibrant, Hometinue);
  }
  var app_default = main;

  // C:/Users/Hathaway/AppData/Local/Temp/spicetify-creator/index.jsx
  (async () => {
    await app_default();
  })();
})();
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" -o ./`
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
(async () => {
    if (!document.getElementById(`amaiDlyrics`)) {
      var el = document.createElement('style');
      el.id = `amaiDlyrics`;
      el.textContent = (String.raw`
  /* C:/Users/Hathaway/AppData/Local/Temp/tmp-17232-nA92Zv476dZU/196070005967/DotLoader.css */
#DotLoader {
  width: 15px;
  aspect-ratio: 1;
  border-radius: 50%;
  animation: l5 1s infinite linear alternate;
}
@keyframes l5 {
  0% {
    box-shadow: 20px 0 #FFF, -20px 0 #ffffff22;
    background: #FFF;
  }
  33% {
    box-shadow: 20px 0 #FFF, -20px 0 #ffffff22;
    background: #ffffff22;
  }
  66% {
    box-shadow: 20px 0 #ffffff22, -20px 0 #FFF;
    background: #ffffff22;
  }
  100% {
    box-shadow: 20px 0 #ffffff22, -20px 0 #FFF;
    background: #FFF;
  }
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-17232-nA92Zv476dZU/1960700053a0/default.css */
:root {
  --bg-rotation-degree: 258deg;
}
.main-nowPlayingView-contextItemInfo::before {
  display: none;
}
#SpicyLyricsPage {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  height: 100%;
  container-type: size;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  font-weight: 700;
  z-index: 99;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
#SpicyLyricsPage.UseSpicyFont {
  font-family: SpicyLyrics;
}
[font=Vazirmatn] {
  font-family: "VazirmatnRegular", sans-serif;
}
body:has(#SpicyLyricsPage) .main-view-container__scroll-node-child,
body:has(#SpicyLyricsPage) .main-view-container__scroll-node-child-spacer,
body:has(#SpicyLyricsPage) .main-view-container__scroll-node-child,
body:has(#SpicyLyricsPage) .main-view-container__scroll-node-child-spacer {
  display: none;
}
#SpicyLyricsPage .ViewControls {
  container-type: size;
  display: flex;
  gap: 8px;
  height: 5cqh;
  justify-content: center;
  opacity: .5;
  transition: opacity .2s, bottom .5s;
  z-index: 101;
  --ViewControlSize: 100cqh;
}
#SpicyLyricsPage:not(.Fullscreen) .ViewControls {
  position: absolute;
  width: 100cqw;
  bottom: -8cqh;
  --PageHoverOffset: -2.2cqh;
  --ControlsHoverOffset: 1.5cqh;
}
#SpicyLyricsPage .ViewControls .ViewControl {
  --ViewControlHeight: var(--ViewControlSize, 100cqh);
  aspect-ratio: 1;
  background: rgba(21, 22, 23, .72);
  border: none;
  border-radius: 100rem;
  display: flex;
  height: var(--ViewControlHeight);
  width: var(--ViewControlHeight);
  -webkit-app-region: no-drag;
  align-items: center;
  color: hsla(0, 0%, 100%, .7);
  justify-content: center;
  text-align: center;
  -webkit-box-align: center;
  -webkit-box-pack: center;
}
#SpicyLyricsPage .ViewControls .ViewControl svg {
  fill: currentColor;
}
#SpicyLyricsPage:not(.Fullscreen) .ViewControls:hover {
  opacity: 1 !important;
  bottom: var(--ControlsHoverOffset) !important;
}
#SpicyLyricsPage:not(.Fullscreen):hover .ViewControls {
  opacity: .5;
  bottom: var(--PageHoverOffset);
}
#SpicyLyricsPage .ViewControls button {
  cursor: pointer;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) {
  --background-tint: color-mix(in srgb,rgb(var(--spice-rgb-selected-row)) 7%,transparent);
  --spice-card: var(--background-tint);
  --background-tinted-base: var(--background-tint) ;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-content {
  background: transparent;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-contextItemInfo:before {
  display: none;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg div[data-overlayscrollbars-viewport],
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg div[data-overlayscrollbars-viewport] > div {
  background: transparent;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg .main-nowPlayingView-coverArtContainer div:has(video):after,
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg .main-nowPlayingView-coverArtContainer div:has(video):before {
  display: none;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg .main-trackInfo-artists {
  filter: brightness(1.15);
  opacity: .75;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-coverArt {
  box-shadow: 0 9px 20px 0 rgba(0, 0, 0, .271);
  opacity: .95;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-section {
  background-color: var(--background-tinted-base);
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) button[type=button] {
  background-color: var(--background-tinted-base);
  color: hsla(0, 0%, 100%, .8);
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) button[type=button] .Button-sm-buttonSecondary-isUsingKeyboard-useBrowserDefaultFocusStyle,
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) button[type=button] .Button-sm-buttonSecondary-useBrowserDefaultFocusStyle {
  border: 1px solid hsla(0, 0%, 100%, .5);
}
#SpicyLyricsPageSvg {
  fill: currentColor;
  transform: translateY(2px);
}
button:has(#SpicyLyricsPageSvg):after {
  transform: translateX(-370%) translateY(-40%) !important;
}
.Root__main-view:has(#SpicyLyricsPage),
.Root__main-view:has(#SpicyLyricsPage) .KL8t9WB65UfUEPuTFAhO,
.Root__main-view:has(#SpicyLyricsPage) .main-content-view,
.Root__main-view:has(#SpicyLyricsPage) .main-view-container,
.Root__main-view:has(#SpicyLyricsPage) .main-view-container__scroll-node,
.Root__main-view:has(#SpicyLyricsPage) .main-view-container .div[data-overlayscrollbars-viewport] {
  height: 100% !important;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-17232-nA92Zv476dZU/196070005681/Simplebar.css */
#SpicyLyricsPage [data-simplebar] {
  position: relative;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
}
#SpicyLyricsPage .simplebar-wrapper {
  overflow: hidden;
  width: inherit;
  height: inherit;
  max-width: inherit;
  max-height: inherit;
}
#SpicyLyricsPage .simplebar-mask {
  direction: inherit;
  position: absolute;
  overflow: hidden;
  padding: 0;
  margin: 0;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  width: auto !important;
  height: auto !important;
  z-index: 0;
}
#SpicyLyricsPage .simplebar-offset {
  direction: inherit !important;
  box-sizing: inherit !important;
  resize: none !important;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 0;
  margin: 0;
  -webkit-overflow-scrolling: touch;
}
#SpicyLyricsPage .simplebar-content-wrapper {
  direction: inherit;
  box-sizing: border-box !important;
  position: relative;
  display: block;
  height: 100%;
  width: auto;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
#SpicyLyricsPage .simplebar-content-wrapper::-webkit-scrollbar,
#SpicyLyricsPage .simplebar-hide-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
#SpicyLyricsPage .simplebar-content:before,
#SpicyLyricsPage .simplebar-content:after {
  content: " ";
  display: table;
}
#SpicyLyricsPage .simplebar-placeholder {
  max-height: 100%;
  max-width: 100%;
  width: 100%;
  pointer-events: none;
}
#SpicyLyricsPage .simplebar-height-auto-observer-wrapper {
  box-sizing: inherit !important;
  height: 100%;
  width: 100%;
  max-width: 1px;
  position: relative;
  float: left;
  max-height: 1px;
  overflow: hidden;
  z-index: -1;
  padding: 0;
  margin: 0;
  pointer-events: none;
  flex-grow: inherit;
  flex-shrink: 0;
  flex-basis: 0;
}
#SpicyLyricsPage .simplebar-height-auto-observer {
  box-sizing: inherit;
  display: block;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  height: 1000%;
  width: 1000%;
  min-height: 1px;
  min-width: 1px;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}
#SpicyLyricsPage .simplebar-track {
  z-index: 1;
  position: absolute;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}
#SpicyLyricsPage [data-simplebar].simplebar-dragging {
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
#SpicyLyricsPage [data-simplebar].simplebar-dragging .simplebar-content {
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
#SpicyLyricsPage [data-simplebar].simplebar-dragging .simplebar-track {
  pointer-events: all;
}
#SpicyLyricsPage .simplebar-scrollbar {
  position: absolute;
  left: 0;
  right: 0;
  min-height: 10px;
}
.simplebar-scrollbar:before {
  position: absolute;
  content: "";
  background: var(--Simplebar-Scrollbar-Color) !important;
  border-radius: 7px;
  left: 2px;
  right: 2px;
  opacity: 0;
  transition: opacity 0.2s 0.5s linear;
}
#SpicyLyricsPage .simplebar-scrollbar.simplebar-visible:before {
  opacity: 0.5 !important;
  transition-delay: 0s !important;
  transition-duration: 0s !important;
}
#SpicyLyricsPage .simplebar-track.simplebar-vertical {
  top: 0;
  width: 11px;
}
#SpicyLyricsPage .simplebar-scrollbar:before {
  top: 2px;
  bottom: 2px;
  left: 2px;
  right: 2px;
}
#SpicyLyricsPage .simplebar-track.simplebar-horizontal {
  left: 0;
  height: 11px;
}
#SpicyLyricsPage .simplebar-track.simplebar-horizontal .simplebar-scrollbar {
  right: auto;
  left: 0;
  top: 0;
  bottom: 0;
  min-height: 0;
  min-width: 10px;
  width: auto;
}
#SpicyLyricsPage [data-simplebar-direction=rtl] .simplebar-track.simplebar-vertical {
  right: auto;
  left: 0;
}
#SpicyLyricsPage .simplebar-dummy-scrollbar-size {
  direction: rtl;
  position: fixed;
  opacity: 0;
  visibility: hidden;
  height: 500px;
  width: 500px;
  overflow-y: hidden;
  overflow-x: scroll;
  -ms-overflow-style: scrollbar !important;
}
#SpicyLyricsPage .simplebar-dummy-scrollbar-size > div {
  width: 200%;
  height: 200%;
  margin: 10px 0;
}
#SpicyLyricsPage .ScrollbarScrollable .simplebar-track {
  transition: opacity 0.2s linear;
  opacity: 1;
}
#SpicyLyricsPage .ScrollbarScrollable .simplebar-track.simplebar-vertical {
  right: 5px;
}
#SpicyLyricsPage .ScrollbarScrollable .simplebar-track.simplebar-horizontal {
  bottom: 5px;
}
#SpicyLyricsPage .ScrollbarScrollable.hide-scrollbar .simplebar-track {
  opacity: 0;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-17232-nA92Zv476dZU/1960700056f2/ContentBox.css */
.Skeletoned {
  --BorderRadius: .5cqw;
  --ValueStop1: 40%;
  --ValueStop2: 50%;
  --ValueStop3: 60%;
  --ColorStop1: hsla(0, 0%, 93%, .25);
  --ColorStop2: hsla(0, 0%, 98%, .45);
  --ColorStop3: hsla(0, 0%, 93%, .25);
  animation: skeleton 1s linear infinite;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  background: linear-gradient(-45deg, var(--ColorStop1) var(--ValueStop1), var(--ColorStop2) var(--ValueStop2), var(--ColorStop3) var(--ValueStop3));
  background-position-x: 100%;
  background-size: 500%;
  border-radius: var(--BorderRadius);
}
.Skeletoned * {
  display: none;
}
@keyframes skeleton {
  to {
    background-position-x: 0;
  }
}
#SpicyLyricsPage .ContentBox {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  --default-font-size: clamp(0.5rem, calc(1cqw* 3), 2.1rem);
}
#SpicyLyricsPage .ContentBox .NowBar {
  --title-height: 5cqh;
  display: flex;
  position: absolute;
  inset: 0;
  align-items: center;
  justify-content: center;
  height: 100cqh;
  z-index: -1;
  margin: 0 5cqw 0 5cqw;
  transition: opacity 0.2s ease-in-out;
  opacity: 0;
}
#SpicyLyricsPage .ContentBox .NowBar.RightSide {
  margin: 0 5cqw 0 5cqw;
}
#SpicyLyricsPage .ContentBox .NowBar.Active {
  position: relative;
  opacity: 1;
  z-index: 1;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 25cqw;
  height: 25cqw;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox {
  width: 30cqw;
  height: 30cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage {
  --ArtworkBrightness: 1;
  --ArtworkBlur: 0px;
  border-radius: 1cqh;
  width: 100%;
  height: 100%;
  box-shadow: 0 9px 20px 0 rgba(0, 0, 0, .271);
  opacity: .95;
  filter: brightness(var(--ArtworkBrightness)) blur(var(--ArtworkBlur));
  transition: opacity, scale .1s cubic-bezier(.24, .01, .97, 1.41);
  cursor: grab;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent {
  cursor: grab;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent .AlbumData {
  font-size: calc(var(--default-font-size) * 0.95);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 99;
  opacity: 1;
  color: white;
  margin-top: 15.5cqh;
  overflow: hidden;
  width: 22cqw;
  box-sizing: border-box;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent .AlbumData span {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  text-align: center;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 2cqh;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName {
  font-weight: 900;
  font-size: var(--default-font-size);
  color: white;
  text-align: center;
  opacity: .95;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 24cqw;
  display: inline-block;
  text-align: center;
  line-height: var(--title-height);
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists {
  font-size: calc(var(--default-font-size)* 0.65);
  line-height: calc(var(--title-height) * 0.5);
  font-weight: 400;
  color: white;
  opacity: .7;
  animation: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 23cqw;
  display: inline-block;
  text-align: center;
}
#SpicyLyricsPage .ContentBox .NowBar:is(.Active.LeftSide) + .LyricsContainer .loaderContainer {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 20%);
}
#SpicyLyricsPage .ContentBox .NowBar:is(.Active.RightSide) + .LyricsContainer .loaderContainer {
  background: linear-gradient(270deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 20%);
}
#SpicyLyricsPage .ContentBox.LyricsHidden .NowBar {
  margin: 0 !important;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox.Skeletoned {
  width: 27cqw;
  height: 27cqw;
  --BorderRadius: 1cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox.Skeletoned {
  width: 30cqw;
  height: 30cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox.Skeletoned .MediaImage {
  display: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName.Skeletoned {
  width: 14cqw;
  height: 4.5cqh;
  --BorderRadius: .25cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox.Skeletoned * {
  display: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName.Skeletoned span {
  display: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists.Skeletoned {
  width: 12cqw;
  height: 3.5cqh;
  margin: 1.5cqh 0;
  --BorderRadius: .25cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists.Skeletoned span {
  display: none;
}
#SpicyLyricsPage .ContentBox .DropZone.RightSide {
  order: 4;
}
#SpicyLyricsPage .ContentBox .DropZone.LeftSide {
  order: 0;
}
#SpicyLyricsPage .ContentBox .NowBar.LeftSide {
  order: 1;
}
#SpicyLyricsPage .ContentBox .LyricsContainer {
  order: 2;
}
#SpicyLyricsPage .ContentBox .NowBar.RightSide {
  order: 3;
}
#SpicyLyricsPage:has(.ContentBox .NowBar.Active.RightSide) .ScrollbarScrollable .simplebar-track.simplebar-vertical {
  left: 5px;
  right: 0;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99;
  display: flex;
  align-items: center;
  flex-direction: column;
  opacity: 0;
  transition: opacity .2s;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox:hover .MediaContent {
  opacity: .85;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent {
  display: none;
}
#SpicyLyricsPage .ContentBox .DropZone {
  width: 200cqw;
  height: 100cqh;
  position: absolute;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.25s ease-in-out;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
#SpicyLyricsPage .ContentBox .DropZone span {
  color: black;
  font-size: var(--default-font-size);
  text-align: center;
}
#SpicyLyricsPage .ContentBox .DropZone.Hidden {
  display: none !important;
}
#SpicyLyricsPage.SomethingDragging .ContentBox .LyricsContainer {
  display: none;
}
#SpicyLyricsPage.SomethingDragging .ContentBox .DropZone {
  position: relative;
  z-index: 99999;
  opacity: .2;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage.Dragging {
  opacity: .6;
}
#SpicyLyricsPage.SomethingDragging .ContentBox .DropZone.DraggingOver {
  opacity: .5;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 5cqh;
  padding: 0 10cqh 0;
  position: absolute;
  bottom: 7.2cqh;
  z-index: 2;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.TrackSkip.PrevTrack {
  rotate: 180deg;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl {
  aspect-ratio: 1;
  display: flex;
  fill: #fff;
  align-items: center;
  cursor: pointer;
  justify-content: center;
  transition: opacity .175s cubic-bezier(.37, 0, .63, 1), filter .175s ease-out;
  --ShrinkScale: 0.9;
  --ShrinkDelta: calc(1 - var(--ShrinkScale));
  height: 4cqh;
  width: 4cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl svg {
  transition: filter .175s ease-out;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.ShuffleToggle,
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.LoopToggle {
  height: 2cqh;
  width: 2cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.PlayStateToggle.Playing {
  height: 3.8cqh;
  width: 3.8cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.PlayStateToggle.Paused {
  height: 4.4cqh;
  width: 4.4cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl:not(.Pressed) {
  animation: pressAnimation .6s;
  animation-fill-mode: forwards;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .ViewControls {
  opacity: 1 !important;
  position: relative;
  width: 100%;
  margin-bottom: 2cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.Pressed {
  transform: scale(var(--ShrinkScale));
  transition: opacity transform .175s cubic-bezier(.37, 0, .63, 1);
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls:hover .PlaybackControl:not(:hover) {
  opacity: .5;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl:hover {
  opacity: 1 !important;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.ShuffleToggle.Enabled,
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.LoopToggle.Enabled {
  filter: brightness(2.75);
}
@keyframes pressAnimation {
  0% {
    transform: scale(calc(1 - var(--ShrinkDelta)*1));
  }
  16% {
    transform: scale(calc(1 - var(--ShrinkDelta)*-.32));
  }
  28% {
    transform: scale(calc(1 - var(--ShrinkDelta)*.13));
  }
  44% {
    transform: scale(calc(1 - var(--ShrinkDelta)*-.05));
  }
  59% {
    transform: scale(calc(1 - var(--ShrinkDelta)*.02));
  }
  73% {
    transform: scale(calc(1 - var(--ShrinkDelta)*-.01));
  }
  88% {
    transform: scale(calc(1 - var(--ShrinkDelta)*0));
  }
  to {
    transform: scale(calc(1 - var(--ShrinkDelta)*0));
  }
}
#SpicyLyricsPage .Timeline {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 1.7cqw 2cqw;
  gap: .6cqw;
  position: absolute;
  bottom: 0;
}
#SpicyLyricsPage .Timeline .SliderBar {
  --TraveledColor: hsla(0,0%,100%,.9);
  --RemainingColor: hsla(0,0%,100%,.38);
  --SliderProgress: 0.6;
  background: linear-gradient(90deg, var(--TraveledColor) 0, var(--TraveledColor) calc(100%*var(--SliderProgress)), var(--RemainingColor) calc(100%*var(--SliderProgress)), var(--RemainingColor));
  border-radius: 100cqw;
  container-type: size;
  flex-grow: 1;
  position: relative;
  width: auto;
  height: .65cqh;
  cursor: pointer;
}
#SpicyLyricsPage .Timeline .SliderBar .Handle {
  aspect-ratio: 1;
  background: #fff;
  border-radius: 100cqw;
  display: block;
  height: 185cqh;
  left: calc(100cqw*var(--SliderProgress));
  position: absolute;
  top: 54cqh;
  transform: translate(-50%, -50%);
}
#SpicyLyricsPage .NotificationContainer {
  display: none;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100%;
  height: 7cqh;
  padding: 2cqh 4cqh;
}
#SpicyLyricsPage .NotificationContainer.Danger {
  background: rgba(255, 118, 118, 0.5);
}
#SpicyLyricsPage .NotificationContainer.Information {
  background: rgba(158, 158, 255, 0.5);
}
#SpicyLyricsPage .NotificationContainer.Success {
  background: rgba(148, 255, 148, 0.5);
}
#SpicyLyricsPage .NotificationContainer.Warning {
  background: rgba(255, 208, 19, 0.5);
}
#SpicyLyricsPage .NotificationContainer.Visible {
  display: flex;
}
#SpicyLyricsPage .NotificationContainer .NotificationIcon {
  aspect-ratio: 1;
  width: 4cqh;
  height: 4cqh;
  display: flex;
  align-items: center;
  justify-content: center;
}
#SpicyLyricsPage .NotificationContainer .NotificationIcon svg {
  aspect-ratio: 1;
  width: 3cqh;
  height: 3cqh;
}
#SpicyLyricsPage .NotificationContainer.Danger .NotificationIcon svg {
  fill: #ff0000;
}
#SpicyLyricsPage .NotificationContainer.Information .NotificationIcon svg {
  fill: #2a2aff;
}
#SpicyLyricsPage .NotificationContainer.Success .NotificationIcon svg {
  fill: #00ff00;
}
#SpicyLyricsPage .NotificationContainer.Warning .NotificationIcon svg {
  fill: #ffaa00;
}
#SpicyLyricsPage .NotificationContainer .NotificationText {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin: 1cqh;
}
#SpicyLyricsPage .NotificationContainer .NotificationText .NotificationTitle {
  font-size: calc(var(--default-font-size) * 0.8);
  font-weight: 900;
  color: rgb(255, 255, 255);
  text-align: center;
}
#SpicyLyricsPage .NotificationContainer .NotificationText .NotificationDescription {
  font-size: calc(var(--default-font-size) * 0.4);
  font-weight: 400;
  color: rgb(206, 206, 206);
  text-align: center;
}
#SpicyLyricsPage .NotificationContainer .NotificationCloseButton {
  color: rgb(255, 255, 255);
  font-size: calc(var(--default-font-size) * 0.3);
  cursor: pointer;
  width: 4cqh;
  height: 4cqh;
  display: flex;
  align-items: center;
  justify-content: center;
}
#SpicyLyricsPage .NotificationContainer .NotificationCloseButton.Disabled {
  opacity: 0;
  z-index: -1;
  pointer-events: none;
  cursor: default;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-17232-nA92Zv476dZU/1960700057a3/spicy-dynamic-bg.css */
.spicy-dynamic-bg {
  filter: saturate(1.5) brightness(.8);
  height: 100%;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
}
.spicy-dynamic-bg .Back,
.spicy-dynamic-bg .BackCenter,
.spicy-dynamic-bg .Front {
  --PlaceholderHueShift: 0deg;
  animation: bgAnim 45s linear infinite;
  border-radius: 100em;
  position: absolute;
  width: 200%;
  filter: blur(15px);
}
#SpicyLyricsPage.Fullscreen .spicy-dynamic-bg:not(.lowqmode) {
  max-height: 60%;
  max-width: 20%;
  scale: 500% 170%;
}
.spicy-dynamic-bg .Back:not(.NoEffect),
.spicy-dynamic-bg .BackCenter:not(.NoEffect),
.spicy-dynamic-bg .Front:not(.NoEffect) {
  filter: hue-rotate(var(--PlaceholderHueShift)) blur(40px);
}
.spicy-dynamic-bg-in-this:is(aside) .spicy-dynamic-bg .Back:not(.NoEffect),
.spicy-dynamic-bg-in-this:is(aside) .spicy-dynamic-bg .BackCenter:not(.NoEffect),
.spicy-dynamic-bg-in-this:is(aside) .spicy-dynamic-bg .Front:not(.NoEffect) {
  filter: hue-rotate(var(--PlaceholderHueShift)) blur(30px);
}
.spicy-dynamic-bg .Front {
  right: 0;
  top: 0;
  z-index: 2;
}
.spicy-dynamic-bg .Back {
  animation-direction: reverse;
  bottom: 0;
  left: 0;
  z-index: 1;
}
.spicy-dynamic-bg .BackCenter {
  animation-direction: reverse;
  right: -50%;
  top: -20%;
  width: 300%;
  z-index: 0;
}
.spicy-dynamic-bg-in-this {
  overflow: hidden;
  position: relative;
}
.spicy-dynamic-bg-in-this:is(aside) .spicy-dynamic-bg {
  filter: saturate(2) brightness(0.7);
  max-height: 100%;
  max-width: 100%;
}
.spicy-dynamic-bg-in-this:is(aside) video {
  filter: opacity(0.75) brightness(0.5);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0) 90%);
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0) 90%);
}
.main-nowPlayingView-coverArtContainer div:has(video)::before,
.main-nowPlayingView-coverArtContainer div:has(video)::after {
  display: none;
}
.spicy-dynamic-bg-in-this:is(aside) .AAdBM1nhG73supMfnYX7 {
  z-index: 1;
  position: relative;
}
#SpicyLyricsPage .spicy-dynamic-bg:not(.lowqmode) {
  max-height: 55%;
  max-width: 35%;
  scale: 290% 185%;
  transform-origin: left top;
}
#SpicyLyricsPage .spicy-dynamic-bg {
  filter: saturate(2.5) brightness(.65);
}
#SpicyLyricsPage .spicy-dynamic-bg:is(.lowqmode) {
  -o-object-fit: cover;
  object-fit: cover;
  filter: brightness(.55) blur(9px) saturate(1.05);
  scale: 1.05;
}
@keyframes bgAnim {
  0% {
    transform: rotate(var(--bg-rotation-degree));
  }
  to {
    transform: rotate(calc(var(--bg-rotation-degree) + 1turn));
  }
}
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .spicy-dynamic-bg-in-this) .spicy-dynamic-bg,
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .spicy-dynamic-bg-in-this) .spicy-dynamic-bg .Front,
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .spicy-dynamic-bg-in-this) .spicy-dynamic-bg .Back,
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .spicy-dynamic-bg-in-this) .spicy-dynamic-bg .BackCenter {
  display: none;
  animation: none;
  filter: none;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-17232-nA92Zv476dZU/1960700057f4/main.css */
#SpicyLyricsPage .LyricsContainer {
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}
#SpicyLyricsPage .LyricsContainer.Hidden {
  display: none;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent {
  --TextGlowDef: rgba(255,255,255,0.15) 0px 0px 6px;
  --ActiveTextGlowDef: rgba(255,255,255,0.4) 0px 0px 14px;
  --StrongTextGlowDef: rgba(255,255,255,0.68) 0px 0px 16.4px;
  --StrongerTextGlowDef: rgba(255,255,255,0.74) 0px 0px 16px;
  --DefaultLyricsSize: clamp(1.5rem,calc(1cqw* 7), 2rem);
  --DefaultLyricsSize-Small: clamp(1.1rem,calc(1cqw* 6), 1.5rem);
  --Simplebar-Scrollbar-Color: rgba(255, 255, 255, 0.6);
  overflow-x: hidden !important;
  overflow-y: auto !important;
  height: 100cqh;
  width: 100%;
  font-size: var(--DefaultLyricsSize);
  font-weight: 900;
  transition:
    opacity,
    transform,
    scale 0.2s linear;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  z-index: 9;
  --ImageMask: linear-gradient( 180deg, transparent 0, var(--spice-sidebar) 16px, var(--spice-sidebar) calc(100% - 64px), transparent calc(100% - 16px), transparent );
  --webkit-mask-image: var(--ImageMask);
  -webkit-mask-image: var(--ImageMask);
  mask-image: var(--ImageMask);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .BottomSpacer {
  display: block;
  height: 50cqh;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .TopSpacer {
  display: block;
  height: 25cqh;
}
#SpicyLyricsPage .ContentBox .NowBar:not(.Active) + .LyricsContainer .LyricsContent .simplebar-content-wrapper {
  padding: 0 18cqw;
}
#SpicyLyricsPage .ContentBox .NowBar.Active:is(.LeftSide) + .LyricsContainer .LyricsContent .simplebar-content-wrapper .simplebar-content {
  padding: 0 5cqw 0 2cqw !important;
}
#SpicyLyricsPage .ContentBox .NowBar.Active:is(.RightSide) + .LyricsContainer .LyricsContent .simplebar-content-wrapper .simplebar-content {
  padding: 0 2cqw 0 5cqw !important;
}
header.main-topBar-container .amai-info {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.55);
  padding: 8px;
  text-align: center;
  font-size: 13px;
  color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-decoration: none;
}
.simplebar-content .line {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}
.line-furigana {
  font-size: var(--DefaultLyricsSize-Small);
  margin-top: -0.25rem;
}
#amai-settings button,
#amai-dev-settings button,
#amai-info button {
  --encore-control-size-smaller: 32px;
  --encore-spacing-tighter-4: 4px;
  --encore-spacing-base: 16px;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  background-color: transparent;
  border-radius: var(--encore-button-corner-radius,9999px);
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  text-transform: none;
  touch-action: manipulation;
  transition-duration: 33ms;
  transition-property:
    background-color,
    border-color,
    color,
    box-shadow,
    filter,
    transform;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  vertical-align: middle;
  transform: translate3d(0px, 0px, 0px);
  border: 1px solid var(--essential-subdued,#818181);
  color: var(--text-base,#000000);
  min-inline-size: 0px;
  min-block-size: var(--encore-control-size-smaller,32px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: var(--encore-control-size-smaller);
  padding-block: var(--encore-spacing-tighter-4);
  padding-inline: var(--encore-spacing-base);
}
#amai-settings button:hover,
#amai-dev-settings button:hover,
#amai-info button:hover {
  transform: scale(1.04);
  border: 1px solid var(--essential-base,#000000);
}
#amai-settings button:active,
#amai-dev-settings button:active,
#amai-info button:active {
  opacity: 0.7;
  outline: none;
  transform: scale(1);
  border: 1px solid var(--essential-subdued,#818181);
}
.BoxComponent-box-elevated {
  opacity: 0.7;
  padding-top: 8px;
  padding-bottom: 8px;
  min-block-size: 38px;
}
#SpicyLyricsPage .ContentBox .NowBar .Header,
#SpicyLyricsPage .ContentBox .NowBar.Active + .LyricsContainer .LyricsContent .simplebar-content-wrapper .simplebar-content {
  padding: 3cqh 3cqh 2cqh 3cqh;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 1cqh;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-section {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 1cqh;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-section > button > div > div {
  background-color: transparent;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata {
  margin: 3cqh 0 0 0;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists {
  line-height: calc(var(--title-height) * 0.8);
}
ruby {
  margin-top: -0.5rem;
}
ruby.romaja {
  margin-right: 0.5rem;
}
ruby > rt {
  margin-bottom: 0.1rem;
}
.Button-buttonSecondary-small-useBrowserDefaultFocusStyle {
  border: 1px solid rgba(255, 255, 255, 0.55);
}
.amai-settings-header {
  color: var(--text-base,#ffffff);
  font-size: 1.25rem;
  font-weight: 700;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-17232-nA92Zv476dZU/196070005845/Mixed.css */
#SpicyLyricsPage .lyricsParent .LyricsContent.lowqmode .line {
  --BlurAmount: 0px !important;
  filter: none !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line {
  --font-size: var(--DefaultLyricsSize);
  display: flex;
  flex-wrap: wrap;
  transition: opacity .1s cubic-bezier(0.61, 1, 0.88, 1);
  font-size: var(--font-size);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line {
  cursor: pointer;
  font-weight: 900;
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  position: relative;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letter {
  --gradient-position: -20%;
  --gradient-alpha: 0.85;
  --gradient-alpha-end: 0.5;
  --gradient-degrees: 90deg;
  --gradient-offset: 0%;
  background-image: linear-gradient(var(--gradient-degrees), rgba(255, 255, 255, var(--gradient-alpha)) var(--gradient-position), rgba(255, 255, 255, var(--gradient-alpha-end)) calc(var(--gradient-position) + 20% + var(--gradient-offset)));
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line {
  --BlurAmount: 0px;
  --DefaultLyricsScale: 0.95;
  --DefaultEmphasisLyricsScale: 0.95;
  --DefaultLineScale: 1;
  --Vocal-NotSung-opacity: 0.51;
  --Vocal-Active-opacity: 1;
  --Vocal-Sung-opacity: 0.497;
  --Vocal-Hover-opacity: 1;
  --gradient-degrees: 180deg !important;
  --gradient-alpha-end: 0.35 !important;
  letter-spacing: 0;
  line-height: 1.5;
  direction: ltr;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.rtl {
  direction: rtl !important;
  transform-origin: right center !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:not(.HideLineBlur) .line {
  filter: blur(var(--BlurAmount));
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word {
  transform-origin: center center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word.PartOfWord + :is(.word, .letterGroup) {
  transform-origin: left center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word.PartOfWord {
  transform-origin: right center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .dotGroup,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup {
  --text-shadow-blur-radius: 4px;
  --text-shadow-opacity: 0%;
  --TextShadowDefinition: 0 0 var(--text-shadow-blur-radius) rgba(255,255,255,var(--text-shadow-opacity));
  will-change:
    --gradient-percentage,
    transform,
    opacity,
    text-shadow,
    scale;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:not(.musical-line) .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup {
  display: inline-block;
  --DefaultTransitionDuration: var(--content-duration, 0.15s);
  --TransitionDuration: var(--DefaultTransitionDuration);
  --TransitionDefinition: all var(--TransitionDuration) cubic-bezier(0.61, 1, 0.88, 1);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .letterGroup {
  text-shadow: var(--TextShadowDefinition);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .letterGroup {
  transition: var(--TransitionDefinition);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .letterGroup .letter {
  --gradient-alpha: 0.6;
  --gradient-alpha-end: 0.3;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.OppositeAligned {
  justify-content: flex-end;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung {
  opacity: var(--Vocal-Sung-opacity);
  --gradient-position: 100% !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung {
  scale: var(--DefaultLineScale);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung {
  opacity: var(--Vocal-NotSung-opacity);
  --gradient-position: -20% !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung:hover,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung:hover .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung:hover .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung:hover,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung:hover .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung:hover .letter {
  text-shadow: none;
  opacity: var(--Vocal-Hover-opacity, 1) !important;
  filter: none;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word:not(.PartOfWord, .dot, .LastWordInLine)::after,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup:not(.PartOfWord, .dot, .LastWordInLine)::after {
  content: "";
  margin-right: .3ch;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letter {
  --text-shadow-blur-radius: 4px !important;
  --text-shadow-opacity: 0% !important;
  --gradient-position: -20% !important;
  --TransitionDuration: var(--DefaultTransitionDuration) !important;
  scale: var(--DefaultLyricsScale) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .word {
  transform: translateY(calc(var(--DefaultLyricsSize) * 0.01)) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letterGroup,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letter {
  transform: translateY(calc(var(--DefaultLyricsSize) * 0.02)) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letterGroup {
  scale: var(--DefaultEmphasisLyricsScale);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup {
  transition: all 0.24s cubic-bezier(0.61, 1, 0.88, 1);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word-group {
  display: inline-flex;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung .letter {
  --gradient-position: 100% !important;
  --text-shadow-blur-radius: 4px !important;
  --text-shadow-opacity: 0% !important;
  --TransitionDuration: var(--DefaultTransitionDuration) !important;
  text-shadow: var(--TextShadowDefinition) !important;
  transform: translateY(0) !important;
  scale: 1 !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung .letterGroup {
  transform: translateY(0) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup {
  display: inline-flex;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .letterGroup,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .letterGroup .letter {
  --font-size: calc(var(--DefaultLyricsSize)*0.75);
  font-size: var(--font-size);
  font-family: SpicyLyrics;
  font-weight: 500;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line {
  transition: scale 0.25s ease-in-out, position 0.25s ease-in-out;
  position: absolute;
  transform-origin: center center;
  margin: 0;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line.Active {
  position: relative;
  margin: -1.38cqw 0;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Line] .line.musical-line.Active {
  margin: -0.8cqw 0 !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line .dotGroup {
  scale: 0;
  transition: all 0.25s ease-in-out;
  transform-origin: center center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line.Active .dotGroup {
  scale: 1;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line {
  margin: -1.3cqw 0 1.5cqw !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line .dotGroup {
  --dot-gap: clamp(0.005rem, 1.7cqw, 0.2rem);
  display: flex;
  flex-direction: row;
  gap: var(--dot-gap);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line .dotGroup .dot {
  --font-size: calc(var(--DefaultLyricsSize)*1.3);
  --opacity-size: .2;
  border-radius: 50%;
  transition: all ease-in 0.3s;
  scale: 0.75;
  font-size: var(--font-size);
  opacity: var(--opacity-size);
  --gradient-position: 100%;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Active {
  opacity: 1;
  filter: none;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Active .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Active .letterGroup,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Active .letterGroup .letter {
  opacity: 1;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.static {
  cursor: default;
  --gradient-position: 100%;
  --gradient-alpha: 1;
  --gradient-alpha-end: 1;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent.offline {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:not(.musical-line),
#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits {
  margin: var(--SpicyLyrics-LineSpacing, 1cqw 0);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits {
  --font-size: calc(var(--DefaultLyricsSize)*0.47);
  font-size: var(--font-size);
  opacity: 0.8;
  margin-top: 7cqh !important;
  scale: 1;
  transition: opacity 0.8s ease-in-out;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits.Active {
  opacity: 1;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Line] .line {
  transform-origin: left center;
  transition: scale .2s cubic-bezier(.37, 0, .63, 1), opacity .2s cubic-bezier(.37, 0, .63, 1);
  margin: 1cqw 0;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Line] .line.OppositeAligned {
  transform-origin: right center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Line] .line.Active {
  scale: 1.05;
  text-shadow: var(--ActiveTextGlowDef) !important;
}
#SpicyLyricsPage.Podcast .LyricsContainer .LyricsContent .line.NotSung .word,
#SpicyLyricsPage.Podcast .LyricsContainer .LyricsContent .line.Sung .word {
  scale: 1 !important;
  transform: translateY(calc(var(--DefaultLyricsSize) * 0)) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:has(.OppositeAligned) .line.OppositeAligned:not(.rtl) {
  padding-left: 15cqw;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:has(.OppositeAligned) .line:not(.OppositeAligned, .rtl) {
  padding-right: 15cqw;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:has(.OppositeAligned.rtl) .line.OppositeAligned {
  padding-right: 15cqw;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:has(.OppositeAligned.rtl) .line:not(.OppositeAligned) {
  padding-left: 15cqw;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-17232-nA92Zv476dZU/1960700058a6/LoaderContainer.css */
#SpicyLyricsPage .LyricsContainer .loaderContainer {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: -1;
  opacity: 0;
  transition: all 0.4s ease-in-out;
}
#SpicyLyricsPage .LyricsContainer .loaderContainer.active {
  position: relative;
  opacity: 1;
  z-index: 9;
}
#SpicyLyricsPage .LyricsContainer .loaderContainer:is(.active) + .LyricsContent {
  display: none;
}

      `).trim();
      document.head.appendChild(el);
    }
  })()
      })();