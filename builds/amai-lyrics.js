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
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
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

  // node_modules/@hudzax/web-modules/UniqueId.js
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
  var GeneratedIds;
  var init_UniqueId = __esm({
    "node_modules/@hudzax/web-modules/UniqueId.js"() {
      GeneratedIds = /* @__PURE__ */ new Set();
    }
  });

  // node_modules/@hudzax/web-modules/FreeArray.js
  var FreeArray;
  var init_FreeArray = __esm({
    "node_modules/@hudzax/web-modules/FreeArray.js"() {
      init_UniqueId();
      FreeArray = class {
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
    }
  });

  // node_modules/@hudzax/web-modules/Signal.js
  var Connection, Event, Signal, IsConnection;
  var init_Signal = __esm({
    "node_modules/@hudzax/web-modules/Signal.js"() {
      init_FreeArray();
      Connection = class {
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
      Event = class {
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
      Signal = class {
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
          return new Event(this);
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
      IsConnection = (value) => {
        return value instanceof Connection;
      };
    }
  });

  // node_modules/@hudzax/web-modules/Scheduler.js
  var Cancel, Timeout, Defer, IsScheduled;
  var init_Scheduler = __esm({
    "node_modules/@hudzax/web-modules/Scheduler.js"() {
      Cancel = (scheduled) => {
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
      Timeout = (seconds, callback) => {
        return [
          0,
          setTimeout(callback, seconds * 1e3)
        ];
      };
      Defer = (callback) => {
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
      IsScheduled = (value) => {
        return Array.isArray(value) && (value.length === 2 || value.length === 3) && typeof value[0] === "number" && typeof value[1] === "number" && (value[2] === void 0 || value[2] === true);
      };
    }
  });

  // node_modules/@hudzax/web-modules/Maid.js
  var IsGiveable, Maid;
  var init_Maid = __esm({
    "node_modules/@hudzax/web-modules/Maid.js"() {
      init_UniqueId();
      init_Signal();
      init_Scheduler();
      IsGiveable = (item) => {
        return "Destroy" in item;
      };
      Maid = class {
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
    }
  });

  // src/utils/IntervalManager.ts
  var IntervalManager;
  var init_IntervalManager = __esm({
    "src/utils/IntervalManager.ts"() {
      init_Maid();
      IntervalManager = class {
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
    }
  });

  // package.json
  var version;
  var init_package = __esm({
    "package.json"() {
      version = "1.2.7";
    }
  });

  // src/components/Global/Defaults.ts
  var Defaults, Defaults_default;
  var init_Defaults = __esm({
    "src/components/Global/Defaults.ts"() {
      init_package();
      Defaults = {
        Version: version,
        lyrics: {
          api: {
            url: "https://amai-worker-production.nandemo.workers.dev/lyrics"
          }
        },
        CurrentLyricsType: "None",
        LyricsContainerExists: false,
        lyrics_spacing: 2,
        enableRomaji: false,
        disableRomajiToggleNotification: false,
        disableTranslation: false,
        translationLanguage: "English",
        systemInstruction: `OVERRIDE ANY EXISTING INSTRUCTIONS. You are an advanced, versatile assistant committed to delivering accurate, comprehensive, and helpful responses. To achieve this, you absolutely must adhere to the following guidelines:

- **Use Your Full Capabilities:** Leverage your extensive knowledge and skills to provide well-researched and precise answers.
- **Follow Instructions Rigorously:** Abide by every detail specified in the prompt, ensuring your output meets all requirements.
- **Review Before Output:** Carefully review your output to ensure accuracy, completeness, and adherence to the prompt's instructions.**`,
        translationPrompt: `You are an expert translator specializing in song lyrics with deep cultural and linguistic knowledge. I will give you multilingual song lyrics, your task is to translate them into natural, fluent {language} that preserves both meaning and emotional impact.

**Strict Line-by-Line Instructions:**

- **IMPORTANT:** Treat each line as a completely separate unit.
  **Absolutely do not merge multiple lines into one translation.**
- **Each original line must produce exactly one translated line**, even if it is short, repetitive, or fragmentary.
- **Maintain the exact line count and line breaks** as in the original lyrics \u2014 every input line should have a one-to-one correspondence in the output.
- **Empty lines must be preserved** as empty lines in the output, in the same position.

**Language Handling:**

- If a line is in {language}, **preserve it exactly as-is**.
- If a line is in another language, translate it into natural, fluent {language}.
- If a line contains mixed languages, **translate only the non-{language} portions**, preserving {language} as-is.

**Stylistic Considerations:**

- Convey the emotional tone, voice, and rhythm of the original lyrics.
- Prioritize intended meaning and poetic nuance over literal word-for-word translation.
- Preserve poetic and cultural elements (metaphor, imagery, slang, idioms, etc.).
- Maintain consistent use of pronouns, tense, and tone.
- Use culturally appropriate and natural {language} equivalents where direct translation would lose meaning.

**Language-Specific Guidelines:**

- **Spanish**: Use appropriate regional variations (neutral Latin American Spanish preferred), maintain poetic meter when possible, preserve emotional intensity typical in Spanish music.
- **French**: Maintain elegance and flow characteristic of French lyrics, use appropriate formal/informal registers, preserve romantic and poetic nuances.
- **German**: Respect compound word structures when creating natural translations, maintain the directness or philosophical depth often found in German lyrics.
- **Portuguese**: Distinguish between Brazilian and European Portuguese contexts when relevant, preserve the musicality and rhythm important in Portuguese lyrics.
- **Chinese (Simplified)**: Use contemporary Mandarin expressions, maintain cultural sensitivity, preserve metaphorical and poetic elements common in Chinese lyrics.
- **Thai**: Use appropriate formal/informal language levels, preserve cultural references and emotional expressions typical in Thai music.
- **Indonesian/Malay**: Maintain the melodic quality of the language, use contemporary expressions while preserving cultural context.`,
        romajaPrompt: `You are an expert Korean linguist specializing in accurate romaja transcription for song lyrics. Your primary goal is to add Revised Romanization in curly braces {} after EVERY sequence of Korean Hangul characters in the provided lyrics.

**Core Task:** Convert Korean lyrics to include inline romaja with perfect accuracy.

**Strict Rules:**
1. **Mandatory Conversion:** You MUST process EVERY Korean word or sequence of Hangul characters. No exceptions. Do NOT skip any.
   - **CRITICAL: Process ALL Korean text regardless of position** - whether it appears at the beginning, middle, or end of a mixed-language phrase
   - **CRITICAL: Never skip any Korean text** - even in complex mixed-language scenarios like "\uC5EC\uB984\uC5EC\uB984\uD574hey" or "good\uBC24"
   - **CRITICAL: Scan the entire text character by character** to ensure no Korean sequence is missed

2. **Inline Format:** Insert the romaja pronunciation enclosed in curly braces {} immediately following the corresponding Korean word/sequence. Example: \uD55C\uAD6D\uC5B4 = \uD55C\uAD6D\uC5B4{hangugeo}.
   - **CRITICAL: Correct Placement:** The romaja in curly braces MUST appear immediately after the complete Korean sequence and BEFORE any non-Korean text.
   - **INCORRECT:** \uC720\uC8FCbe{yuju} (wrong placement - romaja should be after the full Korean sequence)
   - **CORRECT:** \uC720\uC8FC{yuju}be (correct placement - romaja immediately follows Korean characters)

3. **Romanization System:** Strictly use the official Revised Romanization of Korean (RR) rules with these specific guidelines:
   - Use 'eo' not 'o' for \u3153 (\uC608: \uC5B4=eo, \uB108=neo)
   - Use 'eu' not 'u' for \u3161 (\uC608: \uC74C=eum, \uB298=neul)
   - Use 'ae' not 'ai' for \u3150 (\uC608: \uAC1C=gae, \uBC30=bae)
   - Follow official RR consonant rules: \u3131=g/k, \u3137=d/t, \u3142=b/p, etc.
   - Distinguish between \u3145=s and \u3146=ss
   - Proper handling of \u3139: initial \u3139=r, medial \u3139=l, final \u3139=l
   - Proper handling of assimilation: \uD569\uB2C8\uB2E4=hamnida (not hapnida)

4. **Linguistic Accuracy:**
   - Process word by word, not character by character
   - Correctly handle syllable-final consonants (\uBC1B\uCE68)
   - Apply proper sound change rules for connected speech
   - Account for consonant assimilation and liaison between words when needed

5. **Preserve Everything Else:** Keep all non-Korean text (English, numbers, symbols, punctuation) and original spacing/line breaks exactly as they are.

6. **Completeness Check:** Before outputting, methodically verify that every single Korean word/sequence has its romaja pair.
   - **CRITICAL: Double-check mixed-language phrases** to ensure no Korean text was missed
   - **CRITICAL: Verify that Korean text at the beginning, middle, or end of phrases** all have romaja

7. **Mixed Text Handling:** For text that mixes Korean with other scripts or characters:
   - First identify ALL consecutive Korean Hangul characters, regardless of their position in the text
   - Add romaja ONLY after the complete Korean sequence
   - Leave all non-Korean characters in their original positions
   - **CRITICAL: Process Korean text at the end of mixed phrases** (e.g., "good\uBC24" = "good\uBC24{bam}")
   - **CRITICAL: Process Korean text in the middle of mixed phrases** (e.g., "hello\uC548\uB155hi" = "hello\uC548\uB155{annyeong}hi")

**Examples with Sound Change Rules:**
* \uC815\uB9D0 = \uC815\uB9D0{jeongmal}
* \uC88B\uC544\uD574 = \uC88B\uC544\uD574{joahae}
* \uAC19\uC774 = \uAC19\uC774{gachi} (Note assimilation)
* \uC77D\uB2E4 = \uC77D\uB2E4{ikda} (Note syllable-final consonant rule)
* \uBC25 \uBA39\uC5B4 = \uBC25{bap} \uBA39\uC5B4{meogeo} (Note final consonant pronunciation)
* \uAF43\uC78E = \uAF43\uC78E{kkonip} (Note assimilation at morpheme boundary)
* \uC5C6\uC5B4 = \uC5C6\uC5B4{eopseo} (Note complex consonant cluster)
* \uC549\uC544 = \uC549\uC544{anja} (Note complex consonant rules)
* \uAC14\uB2E4 \uC654\uB2E4 = \uAC14\uB2E4{gatda} \uC654\uB2E4{watda} (Note past tense pronunciation)
* \uC0AC\uB791\uD574\uC694 = \uC0AC\uB791\uD574\uC694{saranghaeyo} (Note aspirated consonant)

**Special Cases:**
* Numbers mixed with Korean: 2\uC0B4\uC774\uC5D0\uC694 = 2\uC0B4\uC774\uC5D0\uC694{salieyo}
* Parentheses: (\uB0B4\uAC00 \uC544\uB2C8\uC796\uC544) = (\uB0B4\uAC00{naega} \uC544\uB2C8\uC796\uC544{anijana})
* Particles: \uCC45\uC774 = \uCC45\uC774{chaegi}, \uC9D1\uC5D0 = \uC9D1\uC5D0{jibe} (Note sound changes)
* Long words: \uAC00\uB098\uB2E4\uB77C\uB9C8\uBC14\uC0AC = \uAC00\uB098\uB2E4\uB77C\uB9C8\uBC14\uC0AC{ganadaramabasa}
* Words with suffixes: \uAF43\uC78E\uCC98\uB7FC = \uAF43\uC78E\uCC98\uB7FC{konnipcheorom}
* Mixed script: \uC720\uC8FCbeat = \uC720\uC8FC{yuju}beat (romaja only for Korean part)
* Mixed script: \uC544\uC774love\uB178\uB798 = \uC544\uC774{ai}love\uB178\uB798{norae} (separate Korean sequences)
* Korean at end: good\uBC24 = good\uBC24{bam} (Korean at end of phrase)
* Korean in middle: hello\uC548\uB155hi = hello\uC548\uB155{annyeong}hi (Korean in middle)
* Complex mix: \uC5EC\uB984\uC5EC\uB984\uD574hey = \uC5EC\uB984\uC5EC\uB984\uD574{yeoreumyeoreumhae}hey (Korean followed by English)
* Multiple Korean segments: \uC548\uB155hello\uC5EC\uBCF4\uC138\uC694 = \uC548\uB155{annyeong}hello\uC5EC\uBCF4\uC138\uC694{yeoboseyo} (Korean-English-Korean)

**Input:** You will receive lines of song lyrics.
**Output:** Return the lyrics with romaja added inline according to the rules above. Ensure the output maintains the original line structure.`,
        furiganaPrompt: `You are an expert Japanese linguist specializing in accurate furigana transcription for song lyrics. Your primary goal is to add Hiragana readings in curly braces {} after EVERY Kanji character or compound Kanji sequence in the provided lyrics.

**Core Task:** Convert Japanese lyrics to include inline furigana for all Kanji.

**Strict Rules:**
1.  **Mandatory Conversion:** You MUST process EVERY Kanji character and compound Kanji sequence. No exceptions. Do NOT skip any.
2.  **Inline Format:** Insert the correct Hiragana reading enclosed in curly braces {} immediately following the corresponding Kanji character or sequence. Example: \u6F22\u5B57 = \u6F22\u5B57{\u304B\u3093\u3058}.
3.  **Contextual Readings:** Use the contextually appropriate reading (kun'yomi or on'yomi). For compound words (jukugo), provide the reading for the entire compound. Example: \u65E5\u672C\u8A9E = \u65E5\u672C\u8A9E{\u306B\u307B\u3093\u3054}. For single Kanji followed by okurigana, provide the reading for the Kanji part only. Example: \u98DF{\u305F}\u3079\u308B.
4.  **Preserve Everything Else:** Keep all non-Kanji text (Hiragana, Katakana, English, numbers, symbols, punctuation) and original spacing/line breaks exactly as they are.
5.  **Completeness Check:** Before outputting, double-check that every single Kanji character/sequence has its furigana pair.

**Examples:**
*   \u9858\u3044 = \u9858{\u306D\u304C}\u3044
*   \u53EF\u611B\u3044 = \u53EF\u611B{\u304B\u308F\u3044}\u3044
*   5\u4EBA = 5\u4EBA{\u306B\u3093} (Number preserved, Kanji romanized)
*   \u660E\u5F8C\u65E5 = \u660E\u5F8C\u65E5{\u3042\u3055\u3063\u3066} (Compound word)
*   \u795E\u69D8 = \u795E\u69D8{\u304B\u307F\u3055\u307E} (Compound word)
*   \u805E\u304D = \u805E{\u304D}\u304D (Kanji with okurigana)
*   \u98DF\u3079\u308B = \u98DF{\u305F}\u3079\u308B
*   \u7F8E\u3057\u3044 = \u7F8E{\u3046\u3064\u304F}\u3057\u3044
*   \u6771\u4EAC\u30BF\u30EF\u30FC = \u6771\u4EAC{\u3068\u3046\u304D\u3087\u3046}\u30BF\u30EF\u30FC (Mixed script, Katakana preserved)
*   (\u5927\u4E08\u592B\u3060\u3088) = (\u5927\u4E08\u592B{\u3060\u3044\u3058\u3087\u3046\u3076}\u3060\u3088) (Parentheses and Hiragana preserved)

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
   - **Verb (Te-form) + Auxiliary Verb Combinations:** Treat combinations like Verb-\u3066 + \u3044\u308B/\u3042\u308B/\u304A\u304F/\u3057\u307E\u3046/\u3044\u304F/\u304F\u308B and their conjugations or contractions (e.g., -te iru = -teru, -te ita = -teta, -te shimau = -chau) as **single verb phrases** that **must not be split**.
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
     - **Long vowels:** Use macrons consistently: \u304A\u3046/\u304A\u304A = \u014D, \u3048\u3044/\u3048\u3048 = \u0113, \u3046\u3046 = \u016B, \u3044\u3044 = \u012B, \u3042\u3042 = \u0101 (e.g., \u6771\u4EAC{T\u014Dky\u014D}, \u3042\u308A\u304C\u3068\u3046{arigat\u014D}, \u7F8E\u5473\u3057\u3044{oishii})
     - **Extended vowels in casual speech**: Properly romanize extended vowels in casual expressions, including those marked with "\u30FC" (e.g., \u305B\u30FC\u306E{s\u0113 no}, \u3088\u30FC\u3044{y\u014D i})
     - Particles: \u306F = wa, \u3078 = e, \u3092 = o
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
   - **Special Delimiters (\u300C\u300D, \uFF08\uFF09):** For Japanese text enclosed within full-width quotation marks (\u300C\u300D) or full-width parentheses \uFF08\uFF09, the Romaji should be inserted *inside* these delimiters. Example: \u300C\u904B\u547D\u300D = \u300C\u904B\u547D{unmei}\u300D.

#### Input
Song lyrics containing Japanese text.

#### Output
The original lyrics with accurate, complete Hepburn Romaji in '{}' appended to every complete Japanese word, particle, conjugated form, or verb phrase, respecting the strict segmentation and indivisibility rules, ensuring **only Romaji appears within the braces**, and excluding all punctuation marks from Romanization. Respond in JSON.`
      };
      Defaults_default = Defaults;
    }
  });

  // node_modules/@hudzax/web-modules/SpikyCache.js
  var SpikyCache;
  var init_SpikyCache = __esm({
    "node_modules/@hudzax/web-modules/SpikyCache.js"() {
      SpikyCache = class {
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
    }
  });

  // src/components/Global/Platform.ts
  var Spotify, SpotifyPlatform, SpotifyInternalFetch, OnSpotifyReady, tokenProviderResponse, accessTokenPromise, GetSpotifyAccessToken, Platform, Platform_default;
  var init_Platform = __esm({
    "src/components/Global/Platform.ts"() {
      init_Scheduler();
      Spotify = globalThis.Spicetify;
      OnSpotifyReady = new Promise((resolve) => {
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
      GetSpotifyAccessToken = () => {
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
      Platform = {
        OnSpotifyReady,
        GetSpotifyAccessToken
      };
      Platform_default = Platform;
    }
  });

  // node_modules/pako/dist/pako.esm.mjs
  function zero$1(buf) {
    let len = buf.length;
    while (--len >= 0) {
      buf[len] = 0;
    }
  }
  function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
    this.static_tree = static_tree;
    this.extra_bits = extra_bits;
    this.extra_base = extra_base;
    this.elems = elems;
    this.max_length = max_length;
    this.has_stree = static_tree && static_tree.length;
  }
  function TreeDesc(dyn_tree, stat_desc) {
    this.dyn_tree = dyn_tree;
    this.max_code = 0;
    this.stat_desc = stat_desc;
  }
  function Config(good_length, max_lazy, nice_length, max_chain, func) {
    this.good_length = good_length;
    this.max_lazy = max_lazy;
    this.nice_length = nice_length;
    this.max_chain = max_chain;
    this.func = func;
  }
  function DeflateState() {
    this.strm = null;
    this.status = 0;
    this.pending_buf = null;
    this.pending_buf_size = 0;
    this.pending_out = 0;
    this.pending = 0;
    this.wrap = 0;
    this.gzhead = null;
    this.gzindex = 0;
    this.method = Z_DEFLATED$2;
    this.last_flush = -1;
    this.w_size = 0;
    this.w_bits = 0;
    this.w_mask = 0;
    this.window = null;
    this.window_size = 0;
    this.prev = null;
    this.head = null;
    this.ins_h = 0;
    this.hash_size = 0;
    this.hash_bits = 0;
    this.hash_mask = 0;
    this.hash_shift = 0;
    this.block_start = 0;
    this.match_length = 0;
    this.prev_match = 0;
    this.match_available = 0;
    this.strstart = 0;
    this.match_start = 0;
    this.lookahead = 0;
    this.prev_length = 0;
    this.max_chain_length = 0;
    this.max_lazy_match = 0;
    this.level = 0;
    this.strategy = 0;
    this.good_match = 0;
    this.nice_match = 0;
    this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
    this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
    this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
    zero(this.dyn_ltree);
    zero(this.dyn_dtree);
    zero(this.bl_tree);
    this.l_desc = null;
    this.d_desc = null;
    this.bl_desc = null;
    this.bl_count = new Uint16Array(MAX_BITS + 1);
    this.heap = new Uint16Array(2 * L_CODES + 1);
    zero(this.heap);
    this.heap_len = 0;
    this.heap_max = 0;
    this.depth = new Uint16Array(2 * L_CODES + 1);
    zero(this.depth);
    this.sym_buf = 0;
    this.lit_bufsize = 0;
    this.sym_next = 0;
    this.sym_end = 0;
    this.opt_len = 0;
    this.static_len = 0;
    this.matches = 0;
    this.insert = 0;
    this.bi_buf = 0;
    this.bi_valid = 0;
  }
  function ZStream() {
    this.input = null;
    this.next_in = 0;
    this.avail_in = 0;
    this.total_in = 0;
    this.output = null;
    this.next_out = 0;
    this.avail_out = 0;
    this.total_out = 0;
    this.msg = "";
    this.state = null;
    this.data_type = 2;
    this.adler = 0;
  }
  function Deflate$1(options) {
    this.options = common.assign({
      level: Z_DEFAULT_COMPRESSION,
      method: Z_DEFLATED$1,
      chunkSize: 16384,
      windowBits: 15,
      memLevel: 8,
      strategy: Z_DEFAULT_STRATEGY
    }, options || {});
    let opt = this.options;
    if (opt.raw && opt.windowBits > 0) {
      opt.windowBits = -opt.windowBits;
    } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
      opt.windowBits += 16;
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = deflate_1$2.deflateInit2(
      this.strm,
      opt.level,
      opt.method,
      opt.windowBits,
      opt.memLevel,
      opt.strategy
    );
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    if (opt.header) {
      deflate_1$2.deflateSetHeader(this.strm, opt.header);
    }
    if (opt.dictionary) {
      let dict;
      if (typeof opt.dictionary === "string") {
        dict = strings.string2buf(opt.dictionary);
      } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
        dict = new Uint8Array(opt.dictionary);
      } else {
        dict = opt.dictionary;
      }
      status = deflate_1$2.deflateSetDictionary(this.strm, dict);
      if (status !== Z_OK$2) {
        throw new Error(messages[status]);
      }
      this._dict_set = true;
    }
  }
  function deflate$1(input, options) {
    const deflator = new Deflate$1(options);
    deflator.push(input, true);
    if (deflator.err) {
      throw deflator.msg || messages[deflator.err];
    }
    return deflator.result;
  }
  function deflateRaw$1(input, options) {
    options = options || {};
    options.raw = true;
    return deflate$1(input, options);
  }
  function gzip$1(input, options) {
    options = options || {};
    options.gzip = true;
    return deflate$1(input, options);
  }
  function InflateState() {
    this.strm = null;
    this.mode = 0;
    this.last = false;
    this.wrap = 0;
    this.havedict = false;
    this.flags = 0;
    this.dmax = 0;
    this.check = 0;
    this.total = 0;
    this.head = null;
    this.wbits = 0;
    this.wsize = 0;
    this.whave = 0;
    this.wnext = 0;
    this.window = null;
    this.hold = 0;
    this.bits = 0;
    this.length = 0;
    this.offset = 0;
    this.extra = 0;
    this.lencode = null;
    this.distcode = null;
    this.lenbits = 0;
    this.distbits = 0;
    this.ncode = 0;
    this.nlen = 0;
    this.ndist = 0;
    this.have = 0;
    this.next = null;
    this.lens = new Uint16Array(320);
    this.work = new Uint16Array(288);
    this.lendyn = null;
    this.distdyn = null;
    this.sane = 0;
    this.back = 0;
    this.was = 0;
  }
  function GZheader() {
    this.text = 0;
    this.time = 0;
    this.xflags = 0;
    this.os = 0;
    this.extra = null;
    this.extra_len = 0;
    this.name = "";
    this.comment = "";
    this.hcrc = 0;
    this.done = false;
  }
  function Inflate$1(options) {
    this.options = common.assign({
      chunkSize: 1024 * 64,
      windowBits: 15,
      to: ""
    }, options || {});
    const opt = this.options;
    if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
      opt.windowBits = -opt.windowBits;
      if (opt.windowBits === 0) {
        opt.windowBits = -15;
      }
    }
    if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
      opt.windowBits += 32;
    }
    if (opt.windowBits > 15 && opt.windowBits < 48) {
      if ((opt.windowBits & 15) === 0) {
        opt.windowBits |= 15;
      }
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = inflate_1$2.inflateInit2(
      this.strm,
      opt.windowBits
    );
    if (status !== Z_OK) {
      throw new Error(messages[status]);
    }
    this.header = new gzheader();
    inflate_1$2.inflateGetHeader(this.strm, this.header);
    if (opt.dictionary) {
      if (typeof opt.dictionary === "string") {
        opt.dictionary = strings.string2buf(opt.dictionary);
      } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
        opt.dictionary = new Uint8Array(opt.dictionary);
      }
      if (opt.raw) {
        status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
        if (status !== Z_OK) {
          throw new Error(messages[status]);
        }
      }
    }
  }
  function inflate$1(input, options) {
    const inflator = new Inflate$1(options);
    inflator.push(input);
    if (inflator.err)
      throw inflator.msg || messages[inflator.err];
    return inflator.result;
  }
  function inflateRaw$1(input, options) {
    options = options || {};
    options.raw = true;
    return inflate$1(input, options);
  }
  var Z_FIXED$1, Z_BINARY, Z_TEXT, Z_UNKNOWN$1, STORED_BLOCK, STATIC_TREES, DYN_TREES, MIN_MATCH$1, MAX_MATCH$1, LENGTH_CODES$1, LITERALS$1, L_CODES$1, D_CODES$1, BL_CODES$1, HEAP_SIZE$1, MAX_BITS$1, Buf_size, MAX_BL_BITS, END_BLOCK, REP_3_6, REPZ_3_10, REPZ_11_138, extra_lbits, extra_dbits, extra_blbits, bl_order, DIST_CODE_LEN, static_ltree, static_dtree, _dist_code, _length_code, base_length, base_dist, static_l_desc, static_d_desc, static_bl_desc, d_code, put_short, send_bits, send_code, bi_reverse, bi_flush, gen_bitlen, gen_codes, tr_static_init, init_block, bi_windup, smaller, pqdownheap, compress_block, build_tree, scan_tree, send_tree, build_bl_tree, send_all_trees, detect_data_type, static_init_done, _tr_init$1, _tr_stored_block$1, _tr_align$1, _tr_flush_block$1, _tr_tally$1, _tr_init_1, _tr_stored_block_1, _tr_flush_block_1, _tr_tally_1, _tr_align_1, trees, adler32, adler32_1, makeTable, crcTable, crc32, crc32_1, messages, constants$2, _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align, Z_NO_FLUSH$2, Z_PARTIAL_FLUSH, Z_FULL_FLUSH$1, Z_FINISH$3, Z_BLOCK$1, Z_OK$3, Z_STREAM_END$3, Z_STREAM_ERROR$2, Z_DATA_ERROR$2, Z_BUF_ERROR$1, Z_DEFAULT_COMPRESSION$1, Z_FILTERED, Z_HUFFMAN_ONLY, Z_RLE, Z_FIXED, Z_DEFAULT_STRATEGY$1, Z_UNKNOWN, Z_DEFLATED$2, MAX_MEM_LEVEL, MAX_WBITS$1, DEF_MEM_LEVEL, LENGTH_CODES, LITERALS, L_CODES, D_CODES, BL_CODES, HEAP_SIZE, MAX_BITS, MIN_MATCH, MAX_MATCH, MIN_LOOKAHEAD, PRESET_DICT, INIT_STATE, GZIP_STATE, EXTRA_STATE, NAME_STATE, COMMENT_STATE, HCRC_STATE, BUSY_STATE, FINISH_STATE, BS_NEED_MORE, BS_BLOCK_DONE, BS_FINISH_STARTED, BS_FINISH_DONE, OS_CODE, err, rank, zero, slide_hash, HASH_ZLIB, HASH, flush_pending, flush_block_only, put_byte, putShortMSB, read_buf, longest_match, fill_window, deflate_stored, deflate_fast, deflate_slow, deflate_rle, deflate_huff, configuration_table, lm_init, deflateStateCheck, deflateResetKeep, deflateReset, deflateSetHeader, deflateInit2, deflateInit, deflate$2, deflateEnd, deflateSetDictionary, deflateInit_1, deflateInit2_1, deflateReset_1, deflateResetKeep_1, deflateSetHeader_1, deflate_2$1, deflateEnd_1, deflateSetDictionary_1, deflateInfo, deflate_1$2, _has, assign, flattenChunks, common, STR_APPLY_UIA_OK, _utf8len, string2buf, buf2binstring, buf2string, utf8border, strings, zstream, toString$1, Z_NO_FLUSH$1, Z_SYNC_FLUSH, Z_FULL_FLUSH, Z_FINISH$2, Z_OK$2, Z_STREAM_END$2, Z_DEFAULT_COMPRESSION, Z_DEFAULT_STRATEGY, Z_DEFLATED$1, Deflate_1$1, deflate_2, deflateRaw_1$1, gzip_1$1, constants$1, deflate_1$1, BAD$1, TYPE$1, inffast, MAXBITS, ENOUGH_LENS$1, ENOUGH_DISTS$1, CODES$1, LENS$1, DISTS$1, lbase, lext, dbase, dext, inflate_table, inftrees, CODES, LENS, DISTS, Z_FINISH$1, Z_BLOCK, Z_TREES, Z_OK$1, Z_STREAM_END$1, Z_NEED_DICT$1, Z_STREAM_ERROR$1, Z_DATA_ERROR$1, Z_MEM_ERROR$1, Z_BUF_ERROR, Z_DEFLATED, HEAD, FLAGS, TIME, OS, EXLEN, EXTRA, NAME, COMMENT, HCRC, DICTID, DICT, TYPE, TYPEDO, STORED, COPY_, COPY, TABLE, LENLENS, CODELENS, LEN_, LEN, LENEXT, DIST, DISTEXT, MATCH, LIT, CHECK, LENGTH, DONE, BAD, MEM, SYNC, ENOUGH_LENS, ENOUGH_DISTS, MAX_WBITS, DEF_WBITS, zswap32, inflateStateCheck, inflateResetKeep, inflateReset, inflateReset2, inflateInit2, inflateInit, virgin, lenfix, distfix, fixedtables, updatewindow, inflate$2, inflateEnd, inflateGetHeader, inflateSetDictionary, inflateReset_1, inflateReset2_1, inflateResetKeep_1, inflateInit_1, inflateInit2_1, inflate_2$1, inflateEnd_1, inflateGetHeader_1, inflateSetDictionary_1, inflateInfo, inflate_1$2, gzheader, toString, Z_NO_FLUSH, Z_FINISH, Z_OK, Z_STREAM_END, Z_NEED_DICT, Z_STREAM_ERROR, Z_DATA_ERROR, Z_MEM_ERROR, Inflate_1$1, inflate_2, inflateRaw_1$1, ungzip$1, constants, inflate_1$1, Deflate, deflate, deflateRaw, gzip, Inflate, inflate, inflateRaw, ungzip, Deflate_1, deflate_1, deflateRaw_1, gzip_1, Inflate_1, inflate_1, inflateRaw_1, ungzip_1, constants_1, pako;
  var init_pako_esm = __esm({
    "node_modules/pako/dist/pako.esm.mjs"() {
      Z_FIXED$1 = 4;
      Z_BINARY = 0;
      Z_TEXT = 1;
      Z_UNKNOWN$1 = 2;
      STORED_BLOCK = 0;
      STATIC_TREES = 1;
      DYN_TREES = 2;
      MIN_MATCH$1 = 3;
      MAX_MATCH$1 = 258;
      LENGTH_CODES$1 = 29;
      LITERALS$1 = 256;
      L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
      D_CODES$1 = 30;
      BL_CODES$1 = 19;
      HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
      MAX_BITS$1 = 15;
      Buf_size = 16;
      MAX_BL_BITS = 7;
      END_BLOCK = 256;
      REP_3_6 = 16;
      REPZ_3_10 = 17;
      REPZ_11_138 = 18;
      extra_lbits = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]);
      extra_dbits = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
      extra_blbits = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]);
      bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
      DIST_CODE_LEN = 512;
      static_ltree = new Array((L_CODES$1 + 2) * 2);
      zero$1(static_ltree);
      static_dtree = new Array(D_CODES$1 * 2);
      zero$1(static_dtree);
      _dist_code = new Array(DIST_CODE_LEN);
      zero$1(_dist_code);
      _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
      zero$1(_length_code);
      base_length = new Array(LENGTH_CODES$1);
      zero$1(base_length);
      base_dist = new Array(D_CODES$1);
      zero$1(base_dist);
      d_code = (dist) => {
        return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
      };
      put_short = (s, w) => {
        s.pending_buf[s.pending++] = w & 255;
        s.pending_buf[s.pending++] = w >>> 8 & 255;
      };
      send_bits = (s, value, length) => {
        if (s.bi_valid > Buf_size - length) {
          s.bi_buf |= value << s.bi_valid & 65535;
          put_short(s, s.bi_buf);
          s.bi_buf = value >> Buf_size - s.bi_valid;
          s.bi_valid += length - Buf_size;
        } else {
          s.bi_buf |= value << s.bi_valid & 65535;
          s.bi_valid += length;
        }
      };
      send_code = (s, c, tree) => {
        send_bits(s, tree[c * 2], tree[c * 2 + 1]);
      };
      bi_reverse = (code, len) => {
        let res = 0;
        do {
          res |= code & 1;
          code >>>= 1;
          res <<= 1;
        } while (--len > 0);
        return res >>> 1;
      };
      bi_flush = (s) => {
        if (s.bi_valid === 16) {
          put_short(s, s.bi_buf);
          s.bi_buf = 0;
          s.bi_valid = 0;
        } else if (s.bi_valid >= 8) {
          s.pending_buf[s.pending++] = s.bi_buf & 255;
          s.bi_buf >>= 8;
          s.bi_valid -= 8;
        }
      };
      gen_bitlen = (s, desc) => {
        const tree = desc.dyn_tree;
        const max_code = desc.max_code;
        const stree = desc.stat_desc.static_tree;
        const has_stree = desc.stat_desc.has_stree;
        const extra = desc.stat_desc.extra_bits;
        const base = desc.stat_desc.extra_base;
        const max_length = desc.stat_desc.max_length;
        let h;
        let n, m;
        let bits;
        let xbits;
        let f;
        let overflow = 0;
        for (bits = 0; bits <= MAX_BITS$1; bits++) {
          s.bl_count[bits] = 0;
        }
        tree[s.heap[s.heap_max] * 2 + 1] = 0;
        for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
          n = s.heap[h];
          bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
          if (bits > max_length) {
            bits = max_length;
            overflow++;
          }
          tree[n * 2 + 1] = bits;
          if (n > max_code) {
            continue;
          }
          s.bl_count[bits]++;
          xbits = 0;
          if (n >= base) {
            xbits = extra[n - base];
          }
          f = tree[n * 2];
          s.opt_len += f * (bits + xbits);
          if (has_stree) {
            s.static_len += f * (stree[n * 2 + 1] + xbits);
          }
        }
        if (overflow === 0) {
          return;
        }
        do {
          bits = max_length - 1;
          while (s.bl_count[bits] === 0) {
            bits--;
          }
          s.bl_count[bits]--;
          s.bl_count[bits + 1] += 2;
          s.bl_count[max_length]--;
          overflow -= 2;
        } while (overflow > 0);
        for (bits = max_length; bits !== 0; bits--) {
          n = s.bl_count[bits];
          while (n !== 0) {
            m = s.heap[--h];
            if (m > max_code) {
              continue;
            }
            if (tree[m * 2 + 1] !== bits) {
              s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
              tree[m * 2 + 1] = bits;
            }
            n--;
          }
        }
      };
      gen_codes = (tree, max_code, bl_count) => {
        const next_code = new Array(MAX_BITS$1 + 1);
        let code = 0;
        let bits;
        let n;
        for (bits = 1; bits <= MAX_BITS$1; bits++) {
          code = code + bl_count[bits - 1] << 1;
          next_code[bits] = code;
        }
        for (n = 0; n <= max_code; n++) {
          let len = tree[n * 2 + 1];
          if (len === 0) {
            continue;
          }
          tree[n * 2] = bi_reverse(next_code[len]++, len);
        }
      };
      tr_static_init = () => {
        let n;
        let bits;
        let length;
        let code;
        let dist;
        const bl_count = new Array(MAX_BITS$1 + 1);
        length = 0;
        for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
          base_length[code] = length;
          for (n = 0; n < 1 << extra_lbits[code]; n++) {
            _length_code[length++] = code;
          }
        }
        _length_code[length - 1] = code;
        dist = 0;
        for (code = 0; code < 16; code++) {
          base_dist[code] = dist;
          for (n = 0; n < 1 << extra_dbits[code]; n++) {
            _dist_code[dist++] = code;
          }
        }
        dist >>= 7;
        for (; code < D_CODES$1; code++) {
          base_dist[code] = dist << 7;
          for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
            _dist_code[256 + dist++] = code;
          }
        }
        for (bits = 0; bits <= MAX_BITS$1; bits++) {
          bl_count[bits] = 0;
        }
        n = 0;
        while (n <= 143) {
          static_ltree[n * 2 + 1] = 8;
          n++;
          bl_count[8]++;
        }
        while (n <= 255) {
          static_ltree[n * 2 + 1] = 9;
          n++;
          bl_count[9]++;
        }
        while (n <= 279) {
          static_ltree[n * 2 + 1] = 7;
          n++;
          bl_count[7]++;
        }
        while (n <= 287) {
          static_ltree[n * 2 + 1] = 8;
          n++;
          bl_count[8]++;
        }
        gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
        for (n = 0; n < D_CODES$1; n++) {
          static_dtree[n * 2 + 1] = 5;
          static_dtree[n * 2] = bi_reverse(n, 5);
        }
        static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
        static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
        static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
      };
      init_block = (s) => {
        let n;
        for (n = 0; n < L_CODES$1; n++) {
          s.dyn_ltree[n * 2] = 0;
        }
        for (n = 0; n < D_CODES$1; n++) {
          s.dyn_dtree[n * 2] = 0;
        }
        for (n = 0; n < BL_CODES$1; n++) {
          s.bl_tree[n * 2] = 0;
        }
        s.dyn_ltree[END_BLOCK * 2] = 1;
        s.opt_len = s.static_len = 0;
        s.sym_next = s.matches = 0;
      };
      bi_windup = (s) => {
        if (s.bi_valid > 8) {
          put_short(s, s.bi_buf);
        } else if (s.bi_valid > 0) {
          s.pending_buf[s.pending++] = s.bi_buf;
        }
        s.bi_buf = 0;
        s.bi_valid = 0;
      };
      smaller = (tree, n, m, depth) => {
        const _n2 = n * 2;
        const _m2 = m * 2;
        return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
      };
      pqdownheap = (s, tree, k) => {
        const v = s.heap[k];
        let j = k << 1;
        while (j <= s.heap_len) {
          if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
            j++;
          }
          if (smaller(tree, v, s.heap[j], s.depth)) {
            break;
          }
          s.heap[k] = s.heap[j];
          k = j;
          j <<= 1;
        }
        s.heap[k] = v;
      };
      compress_block = (s, ltree, dtree) => {
        let dist;
        let lc;
        let sx = 0;
        let code;
        let extra;
        if (s.sym_next !== 0) {
          do {
            dist = s.pending_buf[s.sym_buf + sx++] & 255;
            dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
            lc = s.pending_buf[s.sym_buf + sx++];
            if (dist === 0) {
              send_code(s, lc, ltree);
            } else {
              code = _length_code[lc];
              send_code(s, code + LITERALS$1 + 1, ltree);
              extra = extra_lbits[code];
              if (extra !== 0) {
                lc -= base_length[code];
                send_bits(s, lc, extra);
              }
              dist--;
              code = d_code(dist);
              send_code(s, code, dtree);
              extra = extra_dbits[code];
              if (extra !== 0) {
                dist -= base_dist[code];
                send_bits(s, dist, extra);
              }
            }
          } while (sx < s.sym_next);
        }
        send_code(s, END_BLOCK, ltree);
      };
      build_tree = (s, desc) => {
        const tree = desc.dyn_tree;
        const stree = desc.stat_desc.static_tree;
        const has_stree = desc.stat_desc.has_stree;
        const elems = desc.stat_desc.elems;
        let n, m;
        let max_code = -1;
        let node;
        s.heap_len = 0;
        s.heap_max = HEAP_SIZE$1;
        for (n = 0; n < elems; n++) {
          if (tree[n * 2] !== 0) {
            s.heap[++s.heap_len] = max_code = n;
            s.depth[n] = 0;
          } else {
            tree[n * 2 + 1] = 0;
          }
        }
        while (s.heap_len < 2) {
          node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
          tree[node * 2] = 1;
          s.depth[node] = 0;
          s.opt_len--;
          if (has_stree) {
            s.static_len -= stree[node * 2 + 1];
          }
        }
        desc.max_code = max_code;
        for (n = s.heap_len >> 1; n >= 1; n--) {
          pqdownheap(s, tree, n);
        }
        node = elems;
        do {
          n = s.heap[1];
          s.heap[1] = s.heap[s.heap_len--];
          pqdownheap(s, tree, 1);
          m = s.heap[1];
          s.heap[--s.heap_max] = n;
          s.heap[--s.heap_max] = m;
          tree[node * 2] = tree[n * 2] + tree[m * 2];
          s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
          tree[n * 2 + 1] = tree[m * 2 + 1] = node;
          s.heap[1] = node++;
          pqdownheap(s, tree, 1);
        } while (s.heap_len >= 2);
        s.heap[--s.heap_max] = s.heap[1];
        gen_bitlen(s, desc);
        gen_codes(tree, max_code, s.bl_count);
      };
      scan_tree = (s, tree, max_code) => {
        let n;
        let prevlen = -1;
        let curlen;
        let nextlen = tree[0 * 2 + 1];
        let count = 0;
        let max_count = 7;
        let min_count = 4;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        }
        tree[(max_code + 1) * 2 + 1] = 65535;
        for (n = 0; n <= max_code; n++) {
          curlen = nextlen;
          nextlen = tree[(n + 1) * 2 + 1];
          if (++count < max_count && curlen === nextlen) {
            continue;
          } else if (count < min_count) {
            s.bl_tree[curlen * 2] += count;
          } else if (curlen !== 0) {
            if (curlen !== prevlen) {
              s.bl_tree[curlen * 2]++;
            }
            s.bl_tree[REP_3_6 * 2]++;
          } else if (count <= 10) {
            s.bl_tree[REPZ_3_10 * 2]++;
          } else {
            s.bl_tree[REPZ_11_138 * 2]++;
          }
          count = 0;
          prevlen = curlen;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
          } else {
            max_count = 7;
            min_count = 4;
          }
        }
      };
      send_tree = (s, tree, max_code) => {
        let n;
        let prevlen = -1;
        let curlen;
        let nextlen = tree[0 * 2 + 1];
        let count = 0;
        let max_count = 7;
        let min_count = 4;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        }
        for (n = 0; n <= max_code; n++) {
          curlen = nextlen;
          nextlen = tree[(n + 1) * 2 + 1];
          if (++count < max_count && curlen === nextlen) {
            continue;
          } else if (count < min_count) {
            do {
              send_code(s, curlen, s.bl_tree);
            } while (--count !== 0);
          } else if (curlen !== 0) {
            if (curlen !== prevlen) {
              send_code(s, curlen, s.bl_tree);
              count--;
            }
            send_code(s, REP_3_6, s.bl_tree);
            send_bits(s, count - 3, 2);
          } else if (count <= 10) {
            send_code(s, REPZ_3_10, s.bl_tree);
            send_bits(s, count - 3, 3);
          } else {
            send_code(s, REPZ_11_138, s.bl_tree);
            send_bits(s, count - 11, 7);
          }
          count = 0;
          prevlen = curlen;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
          } else {
            max_count = 7;
            min_count = 4;
          }
        }
      };
      build_bl_tree = (s) => {
        let max_blindex;
        scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
        scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
        build_tree(s, s.bl_desc);
        for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
          if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
            break;
          }
        }
        s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
        return max_blindex;
      };
      send_all_trees = (s, lcodes, dcodes, blcodes) => {
        let rank2;
        send_bits(s, lcodes - 257, 5);
        send_bits(s, dcodes - 1, 5);
        send_bits(s, blcodes - 4, 4);
        for (rank2 = 0; rank2 < blcodes; rank2++) {
          send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
        }
        send_tree(s, s.dyn_ltree, lcodes - 1);
        send_tree(s, s.dyn_dtree, dcodes - 1);
      };
      detect_data_type = (s) => {
        let block_mask = 4093624447;
        let n;
        for (n = 0; n <= 31; n++, block_mask >>>= 1) {
          if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
            return Z_BINARY;
          }
        }
        if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
          return Z_TEXT;
        }
        for (n = 32; n < LITERALS$1; n++) {
          if (s.dyn_ltree[n * 2] !== 0) {
            return Z_TEXT;
          }
        }
        return Z_BINARY;
      };
      static_init_done = false;
      _tr_init$1 = (s) => {
        if (!static_init_done) {
          tr_static_init();
          static_init_done = true;
        }
        s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
        s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
        s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
        s.bi_buf = 0;
        s.bi_valid = 0;
        init_block(s);
      };
      _tr_stored_block$1 = (s, buf, stored_len, last) => {
        send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
        bi_windup(s);
        put_short(s, stored_len);
        put_short(s, ~stored_len);
        if (stored_len) {
          s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
        }
        s.pending += stored_len;
      };
      _tr_align$1 = (s) => {
        send_bits(s, STATIC_TREES << 1, 3);
        send_code(s, END_BLOCK, static_ltree);
        bi_flush(s);
      };
      _tr_flush_block$1 = (s, buf, stored_len, last) => {
        let opt_lenb, static_lenb;
        let max_blindex = 0;
        if (s.level > 0) {
          if (s.strm.data_type === Z_UNKNOWN$1) {
            s.strm.data_type = detect_data_type(s);
          }
          build_tree(s, s.l_desc);
          build_tree(s, s.d_desc);
          max_blindex = build_bl_tree(s);
          opt_lenb = s.opt_len + 3 + 7 >>> 3;
          static_lenb = s.static_len + 3 + 7 >>> 3;
          if (static_lenb <= opt_lenb) {
            opt_lenb = static_lenb;
          }
        } else {
          opt_lenb = static_lenb = stored_len + 5;
        }
        if (stored_len + 4 <= opt_lenb && buf !== -1) {
          _tr_stored_block$1(s, buf, stored_len, last);
        } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
          send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
          compress_block(s, static_ltree, static_dtree);
        } else {
          send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
          send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
          compress_block(s, s.dyn_ltree, s.dyn_dtree);
        }
        init_block(s);
        if (last) {
          bi_windup(s);
        }
      };
      _tr_tally$1 = (s, dist, lc) => {
        s.pending_buf[s.sym_buf + s.sym_next++] = dist;
        s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
        s.pending_buf[s.sym_buf + s.sym_next++] = lc;
        if (dist === 0) {
          s.dyn_ltree[lc * 2]++;
        } else {
          s.matches++;
          dist--;
          s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
          s.dyn_dtree[d_code(dist) * 2]++;
        }
        return s.sym_next === s.sym_end;
      };
      _tr_init_1 = _tr_init$1;
      _tr_stored_block_1 = _tr_stored_block$1;
      _tr_flush_block_1 = _tr_flush_block$1;
      _tr_tally_1 = _tr_tally$1;
      _tr_align_1 = _tr_align$1;
      trees = {
        _tr_init: _tr_init_1,
        _tr_stored_block: _tr_stored_block_1,
        _tr_flush_block: _tr_flush_block_1,
        _tr_tally: _tr_tally_1,
        _tr_align: _tr_align_1
      };
      adler32 = (adler, buf, len, pos) => {
        let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
        while (len !== 0) {
          n = len > 2e3 ? 2e3 : len;
          len -= n;
          do {
            s1 = s1 + buf[pos++] | 0;
            s2 = s2 + s1 | 0;
          } while (--n);
          s1 %= 65521;
          s2 %= 65521;
        }
        return s1 | s2 << 16 | 0;
      };
      adler32_1 = adler32;
      makeTable = () => {
        let c, table = [];
        for (var n = 0; n < 256; n++) {
          c = n;
          for (var k = 0; k < 8; k++) {
            c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
          }
          table[n] = c;
        }
        return table;
      };
      crcTable = new Uint32Array(makeTable());
      crc32 = (crc, buf, len, pos) => {
        const t = crcTable;
        const end = pos + len;
        crc ^= -1;
        for (let i = pos; i < end; i++) {
          crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
        }
        return crc ^ -1;
      };
      crc32_1 = crc32;
      messages = {
        2: "need dictionary",
        1: "stream end",
        0: "",
        "-1": "file error",
        "-2": "stream error",
        "-3": "data error",
        "-4": "insufficient memory",
        "-5": "buffer error",
        "-6": "incompatible version"
      };
      constants$2 = {
        Z_NO_FLUSH: 0,
        Z_PARTIAL_FLUSH: 1,
        Z_SYNC_FLUSH: 2,
        Z_FULL_FLUSH: 3,
        Z_FINISH: 4,
        Z_BLOCK: 5,
        Z_TREES: 6,
        Z_OK: 0,
        Z_STREAM_END: 1,
        Z_NEED_DICT: 2,
        Z_ERRNO: -1,
        Z_STREAM_ERROR: -2,
        Z_DATA_ERROR: -3,
        Z_MEM_ERROR: -4,
        Z_BUF_ERROR: -5,
        Z_NO_COMPRESSION: 0,
        Z_BEST_SPEED: 1,
        Z_BEST_COMPRESSION: 9,
        Z_DEFAULT_COMPRESSION: -1,
        Z_FILTERED: 1,
        Z_HUFFMAN_ONLY: 2,
        Z_RLE: 3,
        Z_FIXED: 4,
        Z_DEFAULT_STRATEGY: 0,
        Z_BINARY: 0,
        Z_TEXT: 1,
        Z_UNKNOWN: 2,
        Z_DEFLATED: 8
      };
      ({ _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees);
      ({
        Z_NO_FLUSH: Z_NO_FLUSH$2,
        Z_PARTIAL_FLUSH,
        Z_FULL_FLUSH: Z_FULL_FLUSH$1,
        Z_FINISH: Z_FINISH$3,
        Z_BLOCK: Z_BLOCK$1,
        Z_OK: Z_OK$3,
        Z_STREAM_END: Z_STREAM_END$3,
        Z_STREAM_ERROR: Z_STREAM_ERROR$2,
        Z_DATA_ERROR: Z_DATA_ERROR$2,
        Z_BUF_ERROR: Z_BUF_ERROR$1,
        Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
        Z_FILTERED,
        Z_HUFFMAN_ONLY,
        Z_RLE,
        Z_FIXED,
        Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
        Z_UNKNOWN,
        Z_DEFLATED: Z_DEFLATED$2
      } = constants$2);
      MAX_MEM_LEVEL = 9;
      MAX_WBITS$1 = 15;
      DEF_MEM_LEVEL = 8;
      LENGTH_CODES = 29;
      LITERALS = 256;
      L_CODES = LITERALS + 1 + LENGTH_CODES;
      D_CODES = 30;
      BL_CODES = 19;
      HEAP_SIZE = 2 * L_CODES + 1;
      MAX_BITS = 15;
      MIN_MATCH = 3;
      MAX_MATCH = 258;
      MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
      PRESET_DICT = 32;
      INIT_STATE = 42;
      GZIP_STATE = 57;
      EXTRA_STATE = 69;
      NAME_STATE = 73;
      COMMENT_STATE = 91;
      HCRC_STATE = 103;
      BUSY_STATE = 113;
      FINISH_STATE = 666;
      BS_NEED_MORE = 1;
      BS_BLOCK_DONE = 2;
      BS_FINISH_STARTED = 3;
      BS_FINISH_DONE = 4;
      OS_CODE = 3;
      err = (strm, errorCode) => {
        strm.msg = messages[errorCode];
        return errorCode;
      };
      rank = (f) => {
        return f * 2 - (f > 4 ? 9 : 0);
      };
      zero = (buf) => {
        let len = buf.length;
        while (--len >= 0) {
          buf[len] = 0;
        }
      };
      slide_hash = (s) => {
        let n, m;
        let p;
        let wsize = s.w_size;
        n = s.hash_size;
        p = n;
        do {
          m = s.head[--p];
          s.head[p] = m >= wsize ? m - wsize : 0;
        } while (--n);
        n = wsize;
        p = n;
        do {
          m = s.prev[--p];
          s.prev[p] = m >= wsize ? m - wsize : 0;
        } while (--n);
      };
      HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
      HASH = HASH_ZLIB;
      flush_pending = (strm) => {
        const s = strm.state;
        let len = s.pending;
        if (len > strm.avail_out) {
          len = strm.avail_out;
        }
        if (len === 0) {
          return;
        }
        strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
        strm.next_out += len;
        s.pending_out += len;
        strm.total_out += len;
        strm.avail_out -= len;
        s.pending -= len;
        if (s.pending === 0) {
          s.pending_out = 0;
        }
      };
      flush_block_only = (s, last) => {
        _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
        s.block_start = s.strstart;
        flush_pending(s.strm);
      };
      put_byte = (s, b) => {
        s.pending_buf[s.pending++] = b;
      };
      putShortMSB = (s, b) => {
        s.pending_buf[s.pending++] = b >>> 8 & 255;
        s.pending_buf[s.pending++] = b & 255;
      };
      read_buf = (strm, buf, start, size) => {
        let len = strm.avail_in;
        if (len > size) {
          len = size;
        }
        if (len === 0) {
          return 0;
        }
        strm.avail_in -= len;
        buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
        if (strm.state.wrap === 1) {
          strm.adler = adler32_1(strm.adler, buf, len, start);
        } else if (strm.state.wrap === 2) {
          strm.adler = crc32_1(strm.adler, buf, len, start);
        }
        strm.next_in += len;
        strm.total_in += len;
        return len;
      };
      longest_match = (s, cur_match) => {
        let chain_length = s.max_chain_length;
        let scan = s.strstart;
        let match;
        let len;
        let best_len = s.prev_length;
        let nice_match = s.nice_match;
        const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
        const _win = s.window;
        const wmask = s.w_mask;
        const prev = s.prev;
        const strend = s.strstart + MAX_MATCH;
        let scan_end1 = _win[scan + best_len - 1];
        let scan_end = _win[scan + best_len];
        if (s.prev_length >= s.good_match) {
          chain_length >>= 2;
        }
        if (nice_match > s.lookahead) {
          nice_match = s.lookahead;
        }
        do {
          match = cur_match;
          if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
            continue;
          }
          scan += 2;
          match++;
          do {
          } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
          len = MAX_MATCH - (strend - scan);
          scan = strend - MAX_MATCH;
          if (len > best_len) {
            s.match_start = cur_match;
            best_len = len;
            if (len >= nice_match) {
              break;
            }
            scan_end1 = _win[scan + best_len - 1];
            scan_end = _win[scan + best_len];
          }
        } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
        if (best_len <= s.lookahead) {
          return best_len;
        }
        return s.lookahead;
      };
      fill_window = (s) => {
        const _w_size = s.w_size;
        let n, more, str;
        do {
          more = s.window_size - s.lookahead - s.strstart;
          if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
            s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
            s.match_start -= _w_size;
            s.strstart -= _w_size;
            s.block_start -= _w_size;
            if (s.insert > s.strstart) {
              s.insert = s.strstart;
            }
            slide_hash(s);
            more += _w_size;
          }
          if (s.strm.avail_in === 0) {
            break;
          }
          n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
          s.lookahead += n;
          if (s.lookahead + s.insert >= MIN_MATCH) {
            str = s.strstart - s.insert;
            s.ins_h = s.window[str];
            s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
            while (s.insert) {
              s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
              s.prev[str & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = str;
              str++;
              s.insert--;
              if (s.lookahead + s.insert < MIN_MATCH) {
                break;
              }
            }
          }
        } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
      };
      deflate_stored = (s, flush) => {
        let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
        let len, left, have, last = 0;
        let used = s.strm.avail_in;
        do {
          len = 65535;
          have = s.bi_valid + 42 >> 3;
          if (s.strm.avail_out < have) {
            break;
          }
          have = s.strm.avail_out - have;
          left = s.strstart - s.block_start;
          if (len > left + s.strm.avail_in) {
            len = left + s.strm.avail_in;
          }
          if (len > have) {
            len = have;
          }
          if (len < min_block && (len === 0 && flush !== Z_FINISH$3 || flush === Z_NO_FLUSH$2 || len !== left + s.strm.avail_in)) {
            break;
          }
          last = flush === Z_FINISH$3 && len === left + s.strm.avail_in ? 1 : 0;
          _tr_stored_block(s, 0, 0, last);
          s.pending_buf[s.pending - 4] = len;
          s.pending_buf[s.pending - 3] = len >> 8;
          s.pending_buf[s.pending - 2] = ~len;
          s.pending_buf[s.pending - 1] = ~len >> 8;
          flush_pending(s.strm);
          if (left) {
            if (left > len) {
              left = len;
            }
            s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
            s.strm.next_out += left;
            s.strm.avail_out -= left;
            s.strm.total_out += left;
            s.block_start += left;
            len -= left;
          }
          if (len) {
            read_buf(s.strm, s.strm.output, s.strm.next_out, len);
            s.strm.next_out += len;
            s.strm.avail_out -= len;
            s.strm.total_out += len;
          }
        } while (last === 0);
        used -= s.strm.avail_in;
        if (used) {
          if (used >= s.w_size) {
            s.matches = 2;
            s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
            s.strstart = s.w_size;
            s.insert = s.strstart;
          } else {
            if (s.window_size - s.strstart <= used) {
              s.strstart -= s.w_size;
              s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
              if (s.matches < 2) {
                s.matches++;
              }
              if (s.insert > s.strstart) {
                s.insert = s.strstart;
              }
            }
            s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
            s.strstart += used;
            s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
          }
          s.block_start = s.strstart;
        }
        if (s.high_water < s.strstart) {
          s.high_water = s.strstart;
        }
        if (last) {
          return BS_FINISH_DONE;
        }
        if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 && s.strm.avail_in === 0 && s.strstart === s.block_start) {
          return BS_BLOCK_DONE;
        }
        have = s.window_size - s.strstart;
        if (s.strm.avail_in > have && s.block_start >= s.w_size) {
          s.block_start -= s.w_size;
          s.strstart -= s.w_size;
          s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
          if (s.matches < 2) {
            s.matches++;
          }
          have += s.w_size;
          if (s.insert > s.strstart) {
            s.insert = s.strstart;
          }
        }
        if (have > s.strm.avail_in) {
          have = s.strm.avail_in;
        }
        if (have) {
          read_buf(s.strm, s.window, s.strstart, have);
          s.strstart += have;
          s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
        }
        if (s.high_water < s.strstart) {
          s.high_water = s.strstart;
        }
        have = s.bi_valid + 42 >> 3;
        have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
        min_block = have > s.w_size ? s.w_size : have;
        left = s.strstart - s.block_start;
        if (left >= min_block || (left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 && s.strm.avail_in === 0 && left <= have) {
          len = left > have ? have : left;
          last = flush === Z_FINISH$3 && s.strm.avail_in === 0 && len === left ? 1 : 0;
          _tr_stored_block(s, s.block_start, len, last);
          s.block_start += len;
          flush_pending(s.strm);
        }
        return last ? BS_FINISH_STARTED : BS_NEED_MORE;
      };
      deflate_fast = (s, flush) => {
        let hash_head;
        let bflush;
        for (; ; ) {
          if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          hash_head = 0;
          if (s.lookahead >= MIN_MATCH) {
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
          if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
          }
          if (s.match_length >= MIN_MATCH) {
            bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
              s.match_length--;
              do {
                s.strstart++;
                s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
              } while (--s.match_length !== 0);
              s.strstart++;
            } else {
              s.strstart += s.match_length;
              s.match_length = 0;
              s.ins_h = s.window[s.strstart];
              s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
            }
          } else {
            bflush = _tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
          }
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH$3) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.sym_next) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      };
      deflate_slow = (s, flush) => {
        let hash_head;
        let bflush;
        let max_insert;
        for (; ; ) {
          if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          hash_head = 0;
          if (s.lookahead >= MIN_MATCH) {
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
          s.prev_length = s.match_length;
          s.prev_match = s.match_start;
          s.match_length = MIN_MATCH - 1;
          if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
            if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
              s.match_length = MIN_MATCH - 1;
            }
          }
          if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
            max_insert = s.strstart + s.lookahead - MIN_MATCH;
            bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
            s.lookahead -= s.prev_length - 1;
            s.prev_length -= 2;
            do {
              if (++s.strstart <= max_insert) {
                s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
              }
            } while (--s.prev_length !== 0);
            s.match_available = 0;
            s.match_length = MIN_MATCH - 1;
            s.strstart++;
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          } else if (s.match_available) {
            bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
            if (bflush) {
              flush_block_only(s, false);
            }
            s.strstart++;
            s.lookahead--;
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          } else {
            s.match_available = 1;
            s.strstart++;
            s.lookahead--;
          }
        }
        if (s.match_available) {
          bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
          s.match_available = 0;
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH$3) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.sym_next) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      };
      deflate_rle = (s, flush) => {
        let bflush;
        let prev;
        let scan, strend;
        const _win = s.window;
        for (; ; ) {
          if (s.lookahead <= MAX_MATCH) {
            fill_window(s);
            if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          s.match_length = 0;
          if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
            scan = s.strstart - 1;
            prev = _win[scan];
            if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
              strend = s.strstart + MAX_MATCH;
              do {
              } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
              s.match_length = MAX_MATCH - (strend - scan);
              if (s.match_length > s.lookahead) {
                s.match_length = s.lookahead;
              }
            }
          }
          if (s.match_length >= MIN_MATCH) {
            bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            s.strstart += s.match_length;
            s.match_length = 0;
          } else {
            bflush = _tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
          }
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH$3) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.sym_next) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      };
      deflate_huff = (s, flush) => {
        let bflush;
        for (; ; ) {
          if (s.lookahead === 0) {
            fill_window(s);
            if (s.lookahead === 0) {
              if (flush === Z_NO_FLUSH$2) {
                return BS_NEED_MORE;
              }
              break;
            }
          }
          s.match_length = 0;
          bflush = _tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH$3) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.sym_next) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      };
      configuration_table = [
        new Config(0, 0, 0, 0, deflate_stored),
        new Config(4, 4, 8, 4, deflate_fast),
        new Config(4, 5, 16, 8, deflate_fast),
        new Config(4, 6, 32, 32, deflate_fast),
        new Config(4, 4, 16, 16, deflate_slow),
        new Config(8, 16, 32, 32, deflate_slow),
        new Config(8, 16, 128, 128, deflate_slow),
        new Config(8, 32, 128, 256, deflate_slow),
        new Config(32, 128, 258, 1024, deflate_slow),
        new Config(32, 258, 258, 4096, deflate_slow)
      ];
      lm_init = (s) => {
        s.window_size = 2 * s.w_size;
        zero(s.head);
        s.max_lazy_match = configuration_table[s.level].max_lazy;
        s.good_match = configuration_table[s.level].good_length;
        s.nice_match = configuration_table[s.level].nice_length;
        s.max_chain_length = configuration_table[s.level].max_chain;
        s.strstart = 0;
        s.block_start = 0;
        s.lookahead = 0;
        s.insert = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        s.ins_h = 0;
      };
      deflateStateCheck = (strm) => {
        if (!strm) {
          return 1;
        }
        const s = strm.state;
        if (!s || s.strm !== strm || s.status !== INIT_STATE && s.status !== GZIP_STATE && s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
          return 1;
        }
        return 0;
      };
      deflateResetKeep = (strm) => {
        if (deflateStateCheck(strm)) {
          return err(strm, Z_STREAM_ERROR$2);
        }
        strm.total_in = strm.total_out = 0;
        strm.data_type = Z_UNKNOWN;
        const s = strm.state;
        s.pending = 0;
        s.pending_out = 0;
        if (s.wrap < 0) {
          s.wrap = -s.wrap;
        }
        s.status = s.wrap === 2 ? GZIP_STATE : s.wrap ? INIT_STATE : BUSY_STATE;
        strm.adler = s.wrap === 2 ? 0 : 1;
        s.last_flush = -2;
        _tr_init(s);
        return Z_OK$3;
      };
      deflateReset = (strm) => {
        const ret = deflateResetKeep(strm);
        if (ret === Z_OK$3) {
          lm_init(strm.state);
        }
        return ret;
      };
      deflateSetHeader = (strm, head) => {
        if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
          return Z_STREAM_ERROR$2;
        }
        strm.state.gzhead = head;
        return Z_OK$3;
      };
      deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
        if (!strm) {
          return Z_STREAM_ERROR$2;
        }
        let wrap = 1;
        if (level === Z_DEFAULT_COMPRESSION$1) {
          level = 6;
        }
        if (windowBits < 0) {
          wrap = 0;
          windowBits = -windowBits;
        } else if (windowBits > 15) {
          wrap = 2;
          windowBits -= 16;
        }
        if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap !== 1) {
          return err(strm, Z_STREAM_ERROR$2);
        }
        if (windowBits === 8) {
          windowBits = 9;
        }
        const s = new DeflateState();
        strm.state = s;
        s.strm = strm;
        s.status = INIT_STATE;
        s.wrap = wrap;
        s.gzhead = null;
        s.w_bits = windowBits;
        s.w_size = 1 << s.w_bits;
        s.w_mask = s.w_size - 1;
        s.hash_bits = memLevel + 7;
        s.hash_size = 1 << s.hash_bits;
        s.hash_mask = s.hash_size - 1;
        s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
        s.window = new Uint8Array(s.w_size * 2);
        s.head = new Uint16Array(s.hash_size);
        s.prev = new Uint16Array(s.w_size);
        s.lit_bufsize = 1 << memLevel + 6;
        s.pending_buf_size = s.lit_bufsize * 4;
        s.pending_buf = new Uint8Array(s.pending_buf_size);
        s.sym_buf = s.lit_bufsize;
        s.sym_end = (s.lit_bufsize - 1) * 3;
        s.level = level;
        s.strategy = strategy;
        s.method = method;
        return deflateReset(strm);
      };
      deflateInit = (strm, level) => {
        return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
      };
      deflate$2 = (strm, flush) => {
        if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
          return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
        }
        const s = strm.state;
        if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
          return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
        }
        const old_flush = s.last_flush;
        s.last_flush = flush;
        if (s.pending !== 0) {
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
        } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
          return err(strm, Z_BUF_ERROR$1);
        }
        if (s.status === FINISH_STATE && strm.avail_in !== 0) {
          return err(strm, Z_BUF_ERROR$1);
        }
        if (s.status === INIT_STATE && s.wrap === 0) {
          s.status = BUSY_STATE;
        }
        if (s.status === INIT_STATE) {
          let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
          let level_flags = -1;
          if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
            level_flags = 0;
          } else if (s.level < 6) {
            level_flags = 1;
          } else if (s.level === 6) {
            level_flags = 2;
          } else {
            level_flags = 3;
          }
          header |= level_flags << 6;
          if (s.strstart !== 0) {
            header |= PRESET_DICT;
          }
          header += 31 - header % 31;
          putShortMSB(s, header);
          if (s.strstart !== 0) {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 65535);
          }
          strm.adler = 1;
          s.status = BUSY_STATE;
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
        }
        if (s.status === GZIP_STATE) {
          strm.adler = 0;
          put_byte(s, 31);
          put_byte(s, 139);
          put_byte(s, 8);
          if (!s.gzhead) {
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
            put_byte(s, OS_CODE);
            s.status = BUSY_STATE;
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
          } else {
            put_byte(
              s,
              (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
            );
            put_byte(s, s.gzhead.time & 255);
            put_byte(s, s.gzhead.time >> 8 & 255);
            put_byte(s, s.gzhead.time >> 16 & 255);
            put_byte(s, s.gzhead.time >> 24 & 255);
            put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
            put_byte(s, s.gzhead.os & 255);
            if (s.gzhead.extra && s.gzhead.extra.length) {
              put_byte(s, s.gzhead.extra.length & 255);
              put_byte(s, s.gzhead.extra.length >> 8 & 255);
            }
            if (s.gzhead.hcrc) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
            }
            s.gzindex = 0;
            s.status = EXTRA_STATE;
          }
        }
        if (s.status === EXTRA_STATE) {
          if (s.gzhead.extra) {
            let beg = s.pending;
            let left = (s.gzhead.extra.length & 65535) - s.gzindex;
            while (s.pending + left > s.pending_buf_size) {
              let copy = s.pending_buf_size - s.pending;
              s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
              s.pending = s.pending_buf_size;
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              s.gzindex += copy;
              flush_pending(strm);
              if (s.pending !== 0) {
                s.last_flush = -1;
                return Z_OK$3;
              }
              beg = 0;
              left -= copy;
            }
            let gzhead_extra = new Uint8Array(s.gzhead.extra);
            s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
            s.pending += left;
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            s.gzindex = 0;
          }
          s.status = NAME_STATE;
        }
        if (s.status === NAME_STATE) {
          if (s.gzhead.name) {
            let beg = s.pending;
            let val;
            do {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                if (s.pending !== 0) {
                  s.last_flush = -1;
                  return Z_OK$3;
                }
                beg = 0;
              }
              if (s.gzindex < s.gzhead.name.length) {
                val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
              } else {
                val = 0;
              }
              put_byte(s, val);
            } while (val !== 0);
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            s.gzindex = 0;
          }
          s.status = COMMENT_STATE;
        }
        if (s.status === COMMENT_STATE) {
          if (s.gzhead.comment) {
            let beg = s.pending;
            let val;
            do {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                if (s.pending !== 0) {
                  s.last_flush = -1;
                  return Z_OK$3;
                }
                beg = 0;
              }
              if (s.gzindex < s.gzhead.comment.length) {
                val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
              } else {
                val = 0;
              }
              put_byte(s, val);
            } while (val !== 0);
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
          }
          s.status = HCRC_STATE;
        }
        if (s.status === HCRC_STATE) {
          if (s.gzhead.hcrc) {
            if (s.pending + 2 > s.pending_buf_size) {
              flush_pending(strm);
              if (s.pending !== 0) {
                s.last_flush = -1;
                return Z_OK$3;
              }
            }
            put_byte(s, strm.adler & 255);
            put_byte(s, strm.adler >> 8 & 255);
            strm.adler = 0;
          }
          s.status = BUSY_STATE;
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
        }
        if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
          let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
          if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
            s.status = FINISH_STATE;
          }
          if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
            if (strm.avail_out === 0) {
              s.last_flush = -1;
            }
            return Z_OK$3;
          }
          if (bstate === BS_BLOCK_DONE) {
            if (flush === Z_PARTIAL_FLUSH) {
              _tr_align(s);
            } else if (flush !== Z_BLOCK$1) {
              _tr_stored_block(s, 0, 0, false);
              if (flush === Z_FULL_FLUSH$1) {
                zero(s.head);
                if (s.lookahead === 0) {
                  s.strstart = 0;
                  s.block_start = 0;
                  s.insert = 0;
                }
              }
            }
            flush_pending(strm);
            if (strm.avail_out === 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
          }
        }
        if (flush !== Z_FINISH$3) {
          return Z_OK$3;
        }
        if (s.wrap <= 0) {
          return Z_STREAM_END$3;
        }
        if (s.wrap === 2) {
          put_byte(s, strm.adler & 255);
          put_byte(s, strm.adler >> 8 & 255);
          put_byte(s, strm.adler >> 16 & 255);
          put_byte(s, strm.adler >> 24 & 255);
          put_byte(s, strm.total_in & 255);
          put_byte(s, strm.total_in >> 8 & 255);
          put_byte(s, strm.total_in >> 16 & 255);
          put_byte(s, strm.total_in >> 24 & 255);
        } else {
          putShortMSB(s, strm.adler >>> 16);
          putShortMSB(s, strm.adler & 65535);
        }
        flush_pending(strm);
        if (s.wrap > 0) {
          s.wrap = -s.wrap;
        }
        return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
      };
      deflateEnd = (strm) => {
        if (deflateStateCheck(strm)) {
          return Z_STREAM_ERROR$2;
        }
        const status = strm.state.status;
        strm.state = null;
        return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
      };
      deflateSetDictionary = (strm, dictionary) => {
        let dictLength = dictionary.length;
        if (deflateStateCheck(strm)) {
          return Z_STREAM_ERROR$2;
        }
        const s = strm.state;
        const wrap = s.wrap;
        if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
          return Z_STREAM_ERROR$2;
        }
        if (wrap === 1) {
          strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
        }
        s.wrap = 0;
        if (dictLength >= s.w_size) {
          if (wrap === 0) {
            zero(s.head);
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
          let tmpDict = new Uint8Array(s.w_size);
          tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
          dictionary = tmpDict;
          dictLength = s.w_size;
        }
        const avail = strm.avail_in;
        const next = strm.next_in;
        const input = strm.input;
        strm.avail_in = dictLength;
        strm.next_in = 0;
        strm.input = dictionary;
        fill_window(s);
        while (s.lookahead >= MIN_MATCH) {
          let str = s.strstart;
          let n = s.lookahead - (MIN_MATCH - 1);
          do {
            s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
          } while (--n);
          s.strstart = str;
          s.lookahead = MIN_MATCH - 1;
          fill_window(s);
        }
        s.strstart += s.lookahead;
        s.block_start = s.strstart;
        s.insert = s.lookahead;
        s.lookahead = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        strm.next_in = next;
        strm.input = input;
        strm.avail_in = avail;
        s.wrap = wrap;
        return Z_OK$3;
      };
      deflateInit_1 = deflateInit;
      deflateInit2_1 = deflateInit2;
      deflateReset_1 = deflateReset;
      deflateResetKeep_1 = deflateResetKeep;
      deflateSetHeader_1 = deflateSetHeader;
      deflate_2$1 = deflate$2;
      deflateEnd_1 = deflateEnd;
      deflateSetDictionary_1 = deflateSetDictionary;
      deflateInfo = "pako deflate (from Nodeca project)";
      deflate_1$2 = {
        deflateInit: deflateInit_1,
        deflateInit2: deflateInit2_1,
        deflateReset: deflateReset_1,
        deflateResetKeep: deflateResetKeep_1,
        deflateSetHeader: deflateSetHeader_1,
        deflate: deflate_2$1,
        deflateEnd: deflateEnd_1,
        deflateSetDictionary: deflateSetDictionary_1,
        deflateInfo
      };
      _has = (obj, key) => {
        return Object.prototype.hasOwnProperty.call(obj, key);
      };
      assign = function(obj) {
        const sources = Array.prototype.slice.call(arguments, 1);
        while (sources.length) {
          const source = sources.shift();
          if (!source) {
            continue;
          }
          if (typeof source !== "object") {
            throw new TypeError(source + "must be non-object");
          }
          for (const p in source) {
            if (_has(source, p)) {
              obj[p] = source[p];
            }
          }
        }
        return obj;
      };
      flattenChunks = (chunks) => {
        let len = 0;
        for (let i = 0, l = chunks.length; i < l; i++) {
          len += chunks[i].length;
        }
        const result = new Uint8Array(len);
        for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
          let chunk = chunks[i];
          result.set(chunk, pos);
          pos += chunk.length;
        }
        return result;
      };
      common = {
        assign,
        flattenChunks
      };
      STR_APPLY_UIA_OK = true;
      try {
        String.fromCharCode.apply(null, new Uint8Array(1));
      } catch (__) {
        STR_APPLY_UIA_OK = false;
      }
      _utf8len = new Uint8Array(256);
      for (let q = 0; q < 256; q++) {
        _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
      }
      _utf8len[254] = _utf8len[254] = 1;
      string2buf = (str) => {
        if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
          return new TextEncoder().encode(str);
        }
        let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
        for (m_pos = 0; m_pos < str_len; m_pos++) {
          c = str.charCodeAt(m_pos);
          if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
            c2 = str.charCodeAt(m_pos + 1);
            if ((c2 & 64512) === 56320) {
              c = 65536 + (c - 55296 << 10) + (c2 - 56320);
              m_pos++;
            }
          }
          buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
        }
        buf = new Uint8Array(buf_len);
        for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
          c = str.charCodeAt(m_pos);
          if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
            c2 = str.charCodeAt(m_pos + 1);
            if ((c2 & 64512) === 56320) {
              c = 65536 + (c - 55296 << 10) + (c2 - 56320);
              m_pos++;
            }
          }
          if (c < 128) {
            buf[i++] = c;
          } else if (c < 2048) {
            buf[i++] = 192 | c >>> 6;
            buf[i++] = 128 | c & 63;
          } else if (c < 65536) {
            buf[i++] = 224 | c >>> 12;
            buf[i++] = 128 | c >>> 6 & 63;
            buf[i++] = 128 | c & 63;
          } else {
            buf[i++] = 240 | c >>> 18;
            buf[i++] = 128 | c >>> 12 & 63;
            buf[i++] = 128 | c >>> 6 & 63;
            buf[i++] = 128 | c & 63;
          }
        }
        return buf;
      };
      buf2binstring = (buf, len) => {
        if (len < 65534) {
          if (buf.subarray && STR_APPLY_UIA_OK) {
            return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
          }
        }
        let result = "";
        for (let i = 0; i < len; i++) {
          result += String.fromCharCode(buf[i]);
        }
        return result;
      };
      buf2string = (buf, max) => {
        const len = max || buf.length;
        if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
          return new TextDecoder().decode(buf.subarray(0, max));
        }
        let i, out;
        const utf16buf = new Array(len * 2);
        for (out = 0, i = 0; i < len; ) {
          let c = buf[i++];
          if (c < 128) {
            utf16buf[out++] = c;
            continue;
          }
          let c_len = _utf8len[c];
          if (c_len > 4) {
            utf16buf[out++] = 65533;
            i += c_len - 1;
            continue;
          }
          c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
          while (c_len > 1 && i < len) {
            c = c << 6 | buf[i++] & 63;
            c_len--;
          }
          if (c_len > 1) {
            utf16buf[out++] = 65533;
            continue;
          }
          if (c < 65536) {
            utf16buf[out++] = c;
          } else {
            c -= 65536;
            utf16buf[out++] = 55296 | c >> 10 & 1023;
            utf16buf[out++] = 56320 | c & 1023;
          }
        }
        return buf2binstring(utf16buf, out);
      };
      utf8border = (buf, max) => {
        max = max || buf.length;
        if (max > buf.length) {
          max = buf.length;
        }
        let pos = max - 1;
        while (pos >= 0 && (buf[pos] & 192) === 128) {
          pos--;
        }
        if (pos < 0) {
          return max;
        }
        if (pos === 0) {
          return max;
        }
        return pos + _utf8len[buf[pos]] > max ? pos : max;
      };
      strings = {
        string2buf,
        buf2string,
        utf8border
      };
      zstream = ZStream;
      toString$1 = Object.prototype.toString;
      ({
        Z_NO_FLUSH: Z_NO_FLUSH$1,
        Z_SYNC_FLUSH,
        Z_FULL_FLUSH,
        Z_FINISH: Z_FINISH$2,
        Z_OK: Z_OK$2,
        Z_STREAM_END: Z_STREAM_END$2,
        Z_DEFAULT_COMPRESSION,
        Z_DEFAULT_STRATEGY,
        Z_DEFLATED: Z_DEFLATED$1
      } = constants$2);
      Deflate$1.prototype.push = function(data, flush_mode) {
        const strm = this.strm;
        const chunkSize = this.options.chunkSize;
        let status, _flush_mode;
        if (this.ended) {
          return false;
        }
        if (flush_mode === ~~flush_mode)
          _flush_mode = flush_mode;
        else
          _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
        if (typeof data === "string") {
          strm.input = strings.string2buf(data);
        } else if (toString$1.call(data) === "[object ArrayBuffer]") {
          strm.input = new Uint8Array(data);
        } else {
          strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        for (; ; ) {
          if (strm.avail_out === 0) {
            strm.output = new Uint8Array(chunkSize);
            strm.next_out = 0;
            strm.avail_out = chunkSize;
          }
          if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
            this.onData(strm.output.subarray(0, strm.next_out));
            strm.avail_out = 0;
            continue;
          }
          status = deflate_1$2.deflate(strm, _flush_mode);
          if (status === Z_STREAM_END$2) {
            if (strm.next_out > 0) {
              this.onData(strm.output.subarray(0, strm.next_out));
            }
            status = deflate_1$2.deflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return status === Z_OK$2;
          }
          if (strm.avail_out === 0) {
            this.onData(strm.output);
            continue;
          }
          if (_flush_mode > 0 && strm.next_out > 0) {
            this.onData(strm.output.subarray(0, strm.next_out));
            strm.avail_out = 0;
            continue;
          }
          if (strm.avail_in === 0)
            break;
        }
        return true;
      };
      Deflate$1.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
      };
      Deflate$1.prototype.onEnd = function(status) {
        if (status === Z_OK$2) {
          this.result = common.flattenChunks(this.chunks);
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
      };
      Deflate_1$1 = Deflate$1;
      deflate_2 = deflate$1;
      deflateRaw_1$1 = deflateRaw$1;
      gzip_1$1 = gzip$1;
      constants$1 = constants$2;
      deflate_1$1 = {
        Deflate: Deflate_1$1,
        deflate: deflate_2,
        deflateRaw: deflateRaw_1$1,
        gzip: gzip_1$1,
        constants: constants$1
      };
      BAD$1 = 16209;
      TYPE$1 = 16191;
      inffast = function inflate_fast(strm, start) {
        let _in;
        let last;
        let _out;
        let beg;
        let end;
        let dmax;
        let wsize;
        let whave;
        let wnext;
        let s_window;
        let hold;
        let bits;
        let lcode;
        let dcode;
        let lmask;
        let dmask;
        let here;
        let op;
        let len;
        let dist;
        let from;
        let from_source;
        let input, output;
        const state = strm.state;
        _in = strm.next_in;
        input = strm.input;
        last = _in + (strm.avail_in - 5);
        _out = strm.next_out;
        output = strm.output;
        beg = _out - (start - strm.avail_out);
        end = _out + (strm.avail_out - 257);
        dmax = state.dmax;
        wsize = state.wsize;
        whave = state.whave;
        wnext = state.wnext;
        s_window = state.window;
        hold = state.hold;
        bits = state.bits;
        lcode = state.lencode;
        dcode = state.distcode;
        lmask = (1 << state.lenbits) - 1;
        dmask = (1 << state.distbits) - 1;
        top:
          do {
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = lcode[hold & lmask];
            dolen:
              for (; ; ) {
                op = here >>> 24;
                hold >>>= op;
                bits -= op;
                op = here >>> 16 & 255;
                if (op === 0) {
                  output[_out++] = here & 65535;
                } else if (op & 16) {
                  len = here & 65535;
                  op &= 15;
                  if (op) {
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                    len += hold & (1 << op) - 1;
                    hold >>>= op;
                    bits -= op;
                  }
                  if (bits < 15) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  here = dcode[hold & dmask];
                  dodist:
                    for (; ; ) {
                      op = here >>> 24;
                      hold >>>= op;
                      bits -= op;
                      op = here >>> 16 & 255;
                      if (op & 16) {
                        dist = here & 65535;
                        op &= 15;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                          if (bits < op) {
                            hold += input[_in++] << bits;
                            bits += 8;
                          }
                        }
                        dist += hold & (1 << op) - 1;
                        if (dist > dmax) {
                          strm.msg = "invalid distance too far back";
                          state.mode = BAD$1;
                          break top;
                        }
                        hold >>>= op;
                        bits -= op;
                        op = _out - beg;
                        if (dist > op) {
                          op = dist - op;
                          if (op > whave) {
                            if (state.sane) {
                              strm.msg = "invalid distance too far back";
                              state.mode = BAD$1;
                              break top;
                            }
                          }
                          from = 0;
                          from_source = s_window;
                          if (wnext === 0) {
                            from += wsize - op;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          } else if (wnext < op) {
                            from += wsize + wnext - op;
                            op -= wnext;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = 0;
                              if (wnext < len) {
                                op = wnext;
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = _out - dist;
                                from_source = output;
                              }
                            }
                          } else {
                            from += wnext - op;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          }
                          while (len > 2) {
                            output[_out++] = from_source[from++];
                            output[_out++] = from_source[from++];
                            output[_out++] = from_source[from++];
                            len -= 3;
                          }
                          if (len) {
                            output[_out++] = from_source[from++];
                            if (len > 1) {
                              output[_out++] = from_source[from++];
                            }
                          }
                        } else {
                          from = _out - dist;
                          do {
                            output[_out++] = output[from++];
                            output[_out++] = output[from++];
                            output[_out++] = output[from++];
                            len -= 3;
                          } while (len > 2);
                          if (len) {
                            output[_out++] = output[from++];
                            if (len > 1) {
                              output[_out++] = output[from++];
                            }
                          }
                        }
                      } else if ((op & 64) === 0) {
                        here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                        continue dodist;
                      } else {
                        strm.msg = "invalid distance code";
                        state.mode = BAD$1;
                        break top;
                      }
                      break;
                    }
                } else if ((op & 64) === 0) {
                  here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                  continue dolen;
                } else if (op & 32) {
                  state.mode = TYPE$1;
                  break top;
                } else {
                  strm.msg = "invalid literal/length code";
                  state.mode = BAD$1;
                  break top;
                }
                break;
              }
          } while (_in < last && _out < end);
        len = bits >> 3;
        _in -= len;
        bits -= len << 3;
        hold &= (1 << bits) - 1;
        strm.next_in = _in;
        strm.next_out = _out;
        strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
        strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
        state.hold = hold;
        state.bits = bits;
        return;
      };
      MAXBITS = 15;
      ENOUGH_LENS$1 = 852;
      ENOUGH_DISTS$1 = 592;
      CODES$1 = 0;
      LENS$1 = 1;
      DISTS$1 = 2;
      lbase = new Uint16Array([
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        13,
        15,
        17,
        19,
        23,
        27,
        31,
        35,
        43,
        51,
        59,
        67,
        83,
        99,
        115,
        131,
        163,
        195,
        227,
        258,
        0,
        0
      ]);
      lext = new Uint8Array([
        16,
        16,
        16,
        16,
        16,
        16,
        16,
        16,
        17,
        17,
        17,
        17,
        18,
        18,
        18,
        18,
        19,
        19,
        19,
        19,
        20,
        20,
        20,
        20,
        21,
        21,
        21,
        21,
        16,
        72,
        78
      ]);
      dbase = new Uint16Array([
        1,
        2,
        3,
        4,
        5,
        7,
        9,
        13,
        17,
        25,
        33,
        49,
        65,
        97,
        129,
        193,
        257,
        385,
        513,
        769,
        1025,
        1537,
        2049,
        3073,
        4097,
        6145,
        8193,
        12289,
        16385,
        24577,
        0,
        0
      ]);
      dext = new Uint8Array([
        16,
        16,
        16,
        16,
        17,
        17,
        18,
        18,
        19,
        19,
        20,
        20,
        21,
        21,
        22,
        22,
        23,
        23,
        24,
        24,
        25,
        25,
        26,
        26,
        27,
        27,
        28,
        28,
        29,
        29,
        64,
        64
      ]);
      inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
        const bits = opts.bits;
        let len = 0;
        let sym = 0;
        let min = 0, max = 0;
        let root = 0;
        let curr = 0;
        let drop = 0;
        let left = 0;
        let used = 0;
        let huff = 0;
        let incr;
        let fill;
        let low;
        let mask;
        let next;
        let base = null;
        let match;
        const count = new Uint16Array(MAXBITS + 1);
        const offs = new Uint16Array(MAXBITS + 1);
        let extra = null;
        let here_bits, here_op, here_val;
        for (len = 0; len <= MAXBITS; len++) {
          count[len] = 0;
        }
        for (sym = 0; sym < codes; sym++) {
          count[lens[lens_index + sym]]++;
        }
        root = bits;
        for (max = MAXBITS; max >= 1; max--) {
          if (count[max] !== 0) {
            break;
          }
        }
        if (root > max) {
          root = max;
        }
        if (max === 0) {
          table[table_index++] = 1 << 24 | 64 << 16 | 0;
          table[table_index++] = 1 << 24 | 64 << 16 | 0;
          opts.bits = 1;
          return 0;
        }
        for (min = 1; min < max; min++) {
          if (count[min] !== 0) {
            break;
          }
        }
        if (root < min) {
          root = min;
        }
        left = 1;
        for (len = 1; len <= MAXBITS; len++) {
          left <<= 1;
          left -= count[len];
          if (left < 0) {
            return -1;
          }
        }
        if (left > 0 && (type === CODES$1 || max !== 1)) {
          return -1;
        }
        offs[1] = 0;
        for (len = 1; len < MAXBITS; len++) {
          offs[len + 1] = offs[len] + count[len];
        }
        for (sym = 0; sym < codes; sym++) {
          if (lens[lens_index + sym] !== 0) {
            work[offs[lens[lens_index + sym]]++] = sym;
          }
        }
        if (type === CODES$1) {
          base = extra = work;
          match = 20;
        } else if (type === LENS$1) {
          base = lbase;
          extra = lext;
          match = 257;
        } else {
          base = dbase;
          extra = dext;
          match = 0;
        }
        huff = 0;
        sym = 0;
        len = min;
        next = table_index;
        curr = root;
        drop = 0;
        low = -1;
        used = 1 << root;
        mask = used - 1;
        if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
          return 1;
        }
        for (; ; ) {
          here_bits = len - drop;
          if (work[sym] + 1 < match) {
            here_op = 0;
            here_val = work[sym];
          } else if (work[sym] >= match) {
            here_op = extra[work[sym] - match];
            here_val = base[work[sym] - match];
          } else {
            here_op = 32 + 64;
            here_val = 0;
          }
          incr = 1 << len - drop;
          fill = 1 << curr;
          min = fill;
          do {
            fill -= incr;
            table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
          } while (fill !== 0);
          incr = 1 << len - 1;
          while (huff & incr) {
            incr >>= 1;
          }
          if (incr !== 0) {
            huff &= incr - 1;
            huff += incr;
          } else {
            huff = 0;
          }
          sym++;
          if (--count[len] === 0) {
            if (len === max) {
              break;
            }
            len = lens[lens_index + work[sym]];
          }
          if (len > root && (huff & mask) !== low) {
            if (drop === 0) {
              drop = root;
            }
            next += min;
            curr = len - drop;
            left = 1 << curr;
            while (curr + drop < max) {
              left -= count[curr + drop];
              if (left <= 0) {
                break;
              }
              curr++;
              left <<= 1;
            }
            used += 1 << curr;
            if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
              return 1;
            }
            low = huff & mask;
            table[low] = root << 24 | curr << 16 | next - table_index | 0;
          }
        }
        if (huff !== 0) {
          table[next + huff] = len - drop << 24 | 64 << 16 | 0;
        }
        opts.bits = root;
        return 0;
      };
      inftrees = inflate_table;
      CODES = 0;
      LENS = 1;
      DISTS = 2;
      ({
        Z_FINISH: Z_FINISH$1,
        Z_BLOCK,
        Z_TREES,
        Z_OK: Z_OK$1,
        Z_STREAM_END: Z_STREAM_END$1,
        Z_NEED_DICT: Z_NEED_DICT$1,
        Z_STREAM_ERROR: Z_STREAM_ERROR$1,
        Z_DATA_ERROR: Z_DATA_ERROR$1,
        Z_MEM_ERROR: Z_MEM_ERROR$1,
        Z_BUF_ERROR,
        Z_DEFLATED
      } = constants$2);
      HEAD = 16180;
      FLAGS = 16181;
      TIME = 16182;
      OS = 16183;
      EXLEN = 16184;
      EXTRA = 16185;
      NAME = 16186;
      COMMENT = 16187;
      HCRC = 16188;
      DICTID = 16189;
      DICT = 16190;
      TYPE = 16191;
      TYPEDO = 16192;
      STORED = 16193;
      COPY_ = 16194;
      COPY = 16195;
      TABLE = 16196;
      LENLENS = 16197;
      CODELENS = 16198;
      LEN_ = 16199;
      LEN = 16200;
      LENEXT = 16201;
      DIST = 16202;
      DISTEXT = 16203;
      MATCH = 16204;
      LIT = 16205;
      CHECK = 16206;
      LENGTH = 16207;
      DONE = 16208;
      BAD = 16209;
      MEM = 16210;
      SYNC = 16211;
      ENOUGH_LENS = 852;
      ENOUGH_DISTS = 592;
      MAX_WBITS = 15;
      DEF_WBITS = MAX_WBITS;
      zswap32 = (q) => {
        return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
      };
      inflateStateCheck = (strm) => {
        if (!strm) {
          return 1;
        }
        const state = strm.state;
        if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
          return 1;
        }
        return 0;
      };
      inflateResetKeep = (strm) => {
        if (inflateStateCheck(strm)) {
          return Z_STREAM_ERROR$1;
        }
        const state = strm.state;
        strm.total_in = strm.total_out = state.total = 0;
        strm.msg = "";
        if (state.wrap) {
          strm.adler = state.wrap & 1;
        }
        state.mode = HEAD;
        state.last = 0;
        state.havedict = 0;
        state.flags = -1;
        state.dmax = 32768;
        state.head = null;
        state.hold = 0;
        state.bits = 0;
        state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
        state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
        state.sane = 1;
        state.back = -1;
        return Z_OK$1;
      };
      inflateReset = (strm) => {
        if (inflateStateCheck(strm)) {
          return Z_STREAM_ERROR$1;
        }
        const state = strm.state;
        state.wsize = 0;
        state.whave = 0;
        state.wnext = 0;
        return inflateResetKeep(strm);
      };
      inflateReset2 = (strm, windowBits) => {
        let wrap;
        if (inflateStateCheck(strm)) {
          return Z_STREAM_ERROR$1;
        }
        const state = strm.state;
        if (windowBits < 0) {
          wrap = 0;
          windowBits = -windowBits;
        } else {
          wrap = (windowBits >> 4) + 5;
          if (windowBits < 48) {
            windowBits &= 15;
          }
        }
        if (windowBits && (windowBits < 8 || windowBits > 15)) {
          return Z_STREAM_ERROR$1;
        }
        if (state.window !== null && state.wbits !== windowBits) {
          state.window = null;
        }
        state.wrap = wrap;
        state.wbits = windowBits;
        return inflateReset(strm);
      };
      inflateInit2 = (strm, windowBits) => {
        if (!strm) {
          return Z_STREAM_ERROR$1;
        }
        const state = new InflateState();
        strm.state = state;
        state.strm = strm;
        state.window = null;
        state.mode = HEAD;
        const ret = inflateReset2(strm, windowBits);
        if (ret !== Z_OK$1) {
          strm.state = null;
        }
        return ret;
      };
      inflateInit = (strm) => {
        return inflateInit2(strm, DEF_WBITS);
      };
      virgin = true;
      fixedtables = (state) => {
        if (virgin) {
          lenfix = new Int32Array(512);
          distfix = new Int32Array(32);
          let sym = 0;
          while (sym < 144) {
            state.lens[sym++] = 8;
          }
          while (sym < 256) {
            state.lens[sym++] = 9;
          }
          while (sym < 280) {
            state.lens[sym++] = 7;
          }
          while (sym < 288) {
            state.lens[sym++] = 8;
          }
          inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
          sym = 0;
          while (sym < 32) {
            state.lens[sym++] = 5;
          }
          inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
          virgin = false;
        }
        state.lencode = lenfix;
        state.lenbits = 9;
        state.distcode = distfix;
        state.distbits = 5;
      };
      updatewindow = (strm, src, end, copy) => {
        let dist;
        const state = strm.state;
        if (state.window === null) {
          state.wsize = 1 << state.wbits;
          state.wnext = 0;
          state.whave = 0;
          state.window = new Uint8Array(state.wsize);
        }
        if (copy >= state.wsize) {
          state.window.set(src.subarray(end - state.wsize, end), 0);
          state.wnext = 0;
          state.whave = state.wsize;
        } else {
          dist = state.wsize - state.wnext;
          if (dist > copy) {
            dist = copy;
          }
          state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
          copy -= dist;
          if (copy) {
            state.window.set(src.subarray(end - copy, end), 0);
            state.wnext = copy;
            state.whave = state.wsize;
          } else {
            state.wnext += dist;
            if (state.wnext === state.wsize) {
              state.wnext = 0;
            }
            if (state.whave < state.wsize) {
              state.whave += dist;
            }
          }
        }
        return 0;
      };
      inflate$2 = (strm, flush) => {
        let state;
        let input, output;
        let next;
        let put;
        let have, left;
        let hold;
        let bits;
        let _in, _out;
        let copy;
        let from;
        let from_source;
        let here = 0;
        let here_bits, here_op, here_val;
        let last_bits, last_op, last_val;
        let len;
        let ret;
        const hbuf = new Uint8Array(4);
        let opts;
        let n;
        const order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
        if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
          return Z_STREAM_ERROR$1;
        }
        state = strm.state;
        if (state.mode === TYPE) {
          state.mode = TYPEDO;
        }
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        _in = have;
        _out = left;
        ret = Z_OK$1;
        inf_leave:
          for (; ; ) {
            switch (state.mode) {
              case HEAD:
                if (state.wrap === 0) {
                  state.mode = TYPEDO;
                  break;
                }
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.wrap & 2 && hold === 35615) {
                  if (state.wbits === 0) {
                    state.wbits = 15;
                  }
                  state.check = 0;
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32_1(state.check, hbuf, 2, 0);
                  hold = 0;
                  bits = 0;
                  state.mode = FLAGS;
                  break;
                }
                if (state.head) {
                  state.head.done = false;
                }
                if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
                  strm.msg = "incorrect header check";
                  state.mode = BAD;
                  break;
                }
                if ((hold & 15) !== Z_DEFLATED) {
                  strm.msg = "unknown compression method";
                  state.mode = BAD;
                  break;
                }
                hold >>>= 4;
                bits -= 4;
                len = (hold & 15) + 8;
                if (state.wbits === 0) {
                  state.wbits = len;
                }
                if (len > 15 || len > state.wbits) {
                  strm.msg = "invalid window size";
                  state.mode = BAD;
                  break;
                }
                state.dmax = 1 << state.wbits;
                state.flags = 0;
                strm.adler = state.check = 1;
                state.mode = hold & 512 ? DICTID : TYPE;
                hold = 0;
                bits = 0;
                break;
              case FLAGS:
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.flags = hold;
                if ((state.flags & 255) !== Z_DEFLATED) {
                  strm.msg = "unknown compression method";
                  state.mode = BAD;
                  break;
                }
                if (state.flags & 57344) {
                  strm.msg = "unknown header flags set";
                  state.mode = BAD;
                  break;
                }
                if (state.head) {
                  state.head.text = hold >> 8 & 1;
                }
                if (state.flags & 512 && state.wrap & 4) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32_1(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = TIME;
              case TIME:
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.head) {
                  state.head.time = hold;
                }
                if (state.flags & 512 && state.wrap & 4) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  hbuf[2] = hold >>> 16 & 255;
                  hbuf[3] = hold >>> 24 & 255;
                  state.check = crc32_1(state.check, hbuf, 4, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = OS;
              case OS:
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.head) {
                  state.head.xflags = hold & 255;
                  state.head.os = hold >> 8;
                }
                if (state.flags & 512 && state.wrap & 4) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32_1(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = EXLEN;
              case EXLEN:
                if (state.flags & 1024) {
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.length = hold;
                  if (state.head) {
                    state.head.extra_len = hold;
                  }
                  if (state.flags & 512 && state.wrap & 4) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32_1(state.check, hbuf, 2, 0);
                  }
                  hold = 0;
                  bits = 0;
                } else if (state.head) {
                  state.head.extra = null;
                }
                state.mode = EXTRA;
              case EXTRA:
                if (state.flags & 1024) {
                  copy = state.length;
                  if (copy > have) {
                    copy = have;
                  }
                  if (copy) {
                    if (state.head) {
                      len = state.head.extra_len - state.length;
                      if (!state.head.extra) {
                        state.head.extra = new Uint8Array(state.head.extra_len);
                      }
                      state.head.extra.set(
                        input.subarray(
                          next,
                          next + copy
                        ),
                        len
                      );
                    }
                    if (state.flags & 512 && state.wrap & 4) {
                      state.check = crc32_1(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    state.length -= copy;
                  }
                  if (state.length) {
                    break inf_leave;
                  }
                }
                state.length = 0;
                state.mode = NAME;
              case NAME:
                if (state.flags & 2048) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  copy = 0;
                  do {
                    len = input[next + copy++];
                    if (state.head && len && state.length < 65536) {
                      state.head.name += String.fromCharCode(len);
                    }
                  } while (len && copy < have);
                  if (state.flags & 512 && state.wrap & 4) {
                    state.check = crc32_1(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  if (len) {
                    break inf_leave;
                  }
                } else if (state.head) {
                  state.head.name = null;
                }
                state.length = 0;
                state.mode = COMMENT;
              case COMMENT:
                if (state.flags & 4096) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  copy = 0;
                  do {
                    len = input[next + copy++];
                    if (state.head && len && state.length < 65536) {
                      state.head.comment += String.fromCharCode(len);
                    }
                  } while (len && copy < have);
                  if (state.flags & 512 && state.wrap & 4) {
                    state.check = crc32_1(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  if (len) {
                    break inf_leave;
                  }
                } else if (state.head) {
                  state.head.comment = null;
                }
                state.mode = HCRC;
              case HCRC:
                if (state.flags & 512) {
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (state.wrap & 4 && hold !== (state.check & 65535)) {
                    strm.msg = "header crc mismatch";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                if (state.head) {
                  state.head.hcrc = state.flags >> 9 & 1;
                  state.head.done = true;
                }
                strm.adler = state.check = 0;
                state.mode = TYPE;
                break;
              case DICTID:
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                strm.adler = state.check = zswap32(hold);
                hold = 0;
                bits = 0;
                state.mode = DICT;
              case DICT:
                if (state.havedict === 0) {
                  strm.next_out = put;
                  strm.avail_out = left;
                  strm.next_in = next;
                  strm.avail_in = have;
                  state.hold = hold;
                  state.bits = bits;
                  return Z_NEED_DICT$1;
                }
                strm.adler = state.check = 1;
                state.mode = TYPE;
              case TYPE:
                if (flush === Z_BLOCK || flush === Z_TREES) {
                  break inf_leave;
                }
              case TYPEDO:
                if (state.last) {
                  hold >>>= bits & 7;
                  bits -= bits & 7;
                  state.mode = CHECK;
                  break;
                }
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.last = hold & 1;
                hold >>>= 1;
                bits -= 1;
                switch (hold & 3) {
                  case 0:
                    state.mode = STORED;
                    break;
                  case 1:
                    fixedtables(state);
                    state.mode = LEN_;
                    if (flush === Z_TREES) {
                      hold >>>= 2;
                      bits -= 2;
                      break inf_leave;
                    }
                    break;
                  case 2:
                    state.mode = TABLE;
                    break;
                  case 3:
                    strm.msg = "invalid block type";
                    state.mode = BAD;
                }
                hold >>>= 2;
                bits -= 2;
                break;
              case STORED:
                hold >>>= bits & 7;
                bits -= bits & 7;
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                  strm.msg = "invalid stored block lengths";
                  state.mode = BAD;
                  break;
                }
                state.length = hold & 65535;
                hold = 0;
                bits = 0;
                state.mode = COPY_;
                if (flush === Z_TREES) {
                  break inf_leave;
                }
              case COPY_:
                state.mode = COPY;
              case COPY:
                copy = state.length;
                if (copy) {
                  if (copy > have) {
                    copy = have;
                  }
                  if (copy > left) {
                    copy = left;
                  }
                  if (copy === 0) {
                    break inf_leave;
                  }
                  output.set(input.subarray(next, next + copy), put);
                  have -= copy;
                  next += copy;
                  left -= copy;
                  put += copy;
                  state.length -= copy;
                  break;
                }
                state.mode = TYPE;
                break;
              case TABLE:
                while (bits < 14) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.nlen = (hold & 31) + 257;
                hold >>>= 5;
                bits -= 5;
                state.ndist = (hold & 31) + 1;
                hold >>>= 5;
                bits -= 5;
                state.ncode = (hold & 15) + 4;
                hold >>>= 4;
                bits -= 4;
                if (state.nlen > 286 || state.ndist > 30) {
                  strm.msg = "too many length or distance symbols";
                  state.mode = BAD;
                  break;
                }
                state.have = 0;
                state.mode = LENLENS;
              case LENLENS:
                while (state.have < state.ncode) {
                  while (bits < 3) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.lens[order[state.have++]] = hold & 7;
                  hold >>>= 3;
                  bits -= 3;
                }
                while (state.have < 19) {
                  state.lens[order[state.have++]] = 0;
                }
                state.lencode = state.lendyn;
                state.lenbits = 7;
                opts = { bits: state.lenbits };
                ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid code lengths set";
                  state.mode = BAD;
                  break;
                }
                state.have = 0;
                state.mode = CODELENS;
              case CODELENS:
                while (state.have < state.nlen + state.ndist) {
                  for (; ; ) {
                    here = state.lencode[hold & (1 << state.lenbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (here_val < 16) {
                    hold >>>= here_bits;
                    bits -= here_bits;
                    state.lens[state.have++] = here_val;
                  } else {
                    if (here_val === 16) {
                      n = here_bits + 2;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      if (state.have === 0) {
                        strm.msg = "invalid bit length repeat";
                        state.mode = BAD;
                        break;
                      }
                      len = state.lens[state.have - 1];
                      copy = 3 + (hold & 3);
                      hold >>>= 2;
                      bits -= 2;
                    } else if (here_val === 17) {
                      n = here_bits + 3;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      len = 0;
                      copy = 3 + (hold & 7);
                      hold >>>= 3;
                      bits -= 3;
                    } else {
                      n = here_bits + 7;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      len = 0;
                      copy = 11 + (hold & 127);
                      hold >>>= 7;
                      bits -= 7;
                    }
                    if (state.have + copy > state.nlen + state.ndist) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    while (copy--) {
                      state.lens[state.have++] = len;
                    }
                  }
                }
                if (state.mode === BAD) {
                  break;
                }
                if (state.lens[256] === 0) {
                  strm.msg = "invalid code -- missing end-of-block";
                  state.mode = BAD;
                  break;
                }
                state.lenbits = 9;
                opts = { bits: state.lenbits };
                ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid literal/lengths set";
                  state.mode = BAD;
                  break;
                }
                state.distbits = 6;
                state.distcode = state.distdyn;
                opts = { bits: state.distbits };
                ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                state.distbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid distances set";
                  state.mode = BAD;
                  break;
                }
                state.mode = LEN_;
                if (flush === Z_TREES) {
                  break inf_leave;
                }
              case LEN_:
                state.mode = LEN;
              case LEN:
                if (have >= 6 && left >= 258) {
                  strm.next_out = put;
                  strm.avail_out = left;
                  strm.next_in = next;
                  strm.avail_in = have;
                  state.hold = hold;
                  state.bits = bits;
                  inffast(strm, _out);
                  put = strm.next_out;
                  output = strm.output;
                  left = strm.avail_out;
                  next = strm.next_in;
                  input = strm.input;
                  have = strm.avail_in;
                  hold = state.hold;
                  bits = state.bits;
                  if (state.mode === TYPE) {
                    state.back = -1;
                  }
                  break;
                }
                state.back = 0;
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (here_op && (here_op & 240) === 0) {
                  last_bits = here_bits;
                  last_op = here_op;
                  last_val = here_val;
                  for (; ; ) {
                    here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (last_bits + here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= last_bits;
                  bits -= last_bits;
                  state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                state.length = here_val;
                if (here_op === 0) {
                  state.mode = LIT;
                  break;
                }
                if (here_op & 32) {
                  state.back = -1;
                  state.mode = TYPE;
                  break;
                }
                if (here_op & 64) {
                  strm.msg = "invalid literal/length code";
                  state.mode = BAD;
                  break;
                }
                state.extra = here_op & 15;
                state.mode = LENEXT;
              case LENEXT:
                if (state.extra) {
                  n = state.extra;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.length += hold & (1 << state.extra) - 1;
                  hold >>>= state.extra;
                  bits -= state.extra;
                  state.back += state.extra;
                }
                state.was = state.length;
                state.mode = DIST;
              case DIST:
                for (; ; ) {
                  here = state.distcode[hold & (1 << state.distbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if ((here_op & 240) === 0) {
                  last_bits = here_bits;
                  last_op = here_op;
                  last_val = here_val;
                  for (; ; ) {
                    here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (last_bits + here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= last_bits;
                  bits -= last_bits;
                  state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                if (here_op & 64) {
                  strm.msg = "invalid distance code";
                  state.mode = BAD;
                  break;
                }
                state.offset = here_val;
                state.extra = here_op & 15;
                state.mode = DISTEXT;
              case DISTEXT:
                if (state.extra) {
                  n = state.extra;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.offset += hold & (1 << state.extra) - 1;
                  hold >>>= state.extra;
                  bits -= state.extra;
                  state.back += state.extra;
                }
                if (state.offset > state.dmax) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break;
                }
                state.mode = MATCH;
              case MATCH:
                if (left === 0) {
                  break inf_leave;
                }
                copy = _out - left;
                if (state.offset > copy) {
                  copy = state.offset - copy;
                  if (copy > state.whave) {
                    if (state.sane) {
                      strm.msg = "invalid distance too far back";
                      state.mode = BAD;
                      break;
                    }
                  }
                  if (copy > state.wnext) {
                    copy -= state.wnext;
                    from = state.wsize - copy;
                  } else {
                    from = state.wnext - copy;
                  }
                  if (copy > state.length) {
                    copy = state.length;
                  }
                  from_source = state.window;
                } else {
                  from_source = output;
                  from = put - state.offset;
                  copy = state.length;
                }
                if (copy > left) {
                  copy = left;
                }
                left -= copy;
                state.length -= copy;
                do {
                  output[put++] = from_source[from++];
                } while (--copy);
                if (state.length === 0) {
                  state.mode = LEN;
                }
                break;
              case LIT:
                if (left === 0) {
                  break inf_leave;
                }
                output[put++] = state.length;
                left--;
                state.mode = LEN;
                break;
              case CHECK:
                if (state.wrap) {
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold |= input[next++] << bits;
                    bits += 8;
                  }
                  _out -= left;
                  strm.total_out += _out;
                  state.total += _out;
                  if (state.wrap & 4 && _out) {
                    strm.adler = state.check = state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
                  }
                  _out = left;
                  if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
                    strm.msg = "incorrect data check";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                state.mode = LENGTH;
              case LENGTH:
                if (state.wrap && state.flags) {
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
                    strm.msg = "incorrect length check";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                state.mode = DONE;
              case DONE:
                ret = Z_STREAM_END$1;
                break inf_leave;
              case BAD:
                ret = Z_DATA_ERROR$1;
                break inf_leave;
              case MEM:
                return Z_MEM_ERROR$1;
              case SYNC:
              default:
                return Z_STREAM_ERROR$1;
            }
          }
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
          if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out))
            ;
        }
        _in -= strm.avail_in;
        _out -= strm.avail_out;
        strm.total_in += _in;
        strm.total_out += _out;
        state.total += _out;
        if (state.wrap & 4 && _out) {
          strm.adler = state.check = state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
        }
        strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
        if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
          ret = Z_BUF_ERROR;
        }
        return ret;
      };
      inflateEnd = (strm) => {
        if (inflateStateCheck(strm)) {
          return Z_STREAM_ERROR$1;
        }
        let state = strm.state;
        if (state.window) {
          state.window = null;
        }
        strm.state = null;
        return Z_OK$1;
      };
      inflateGetHeader = (strm, head) => {
        if (inflateStateCheck(strm)) {
          return Z_STREAM_ERROR$1;
        }
        const state = strm.state;
        if ((state.wrap & 2) === 0) {
          return Z_STREAM_ERROR$1;
        }
        state.head = head;
        head.done = false;
        return Z_OK$1;
      };
      inflateSetDictionary = (strm, dictionary) => {
        const dictLength = dictionary.length;
        let state;
        let dictid;
        let ret;
        if (inflateStateCheck(strm)) {
          return Z_STREAM_ERROR$1;
        }
        state = strm.state;
        if (state.wrap !== 0 && state.mode !== DICT) {
          return Z_STREAM_ERROR$1;
        }
        if (state.mode === DICT) {
          dictid = 1;
          dictid = adler32_1(dictid, dictionary, dictLength, 0);
          if (dictid !== state.check) {
            return Z_DATA_ERROR$1;
          }
        }
        ret = updatewindow(strm, dictionary, dictLength, dictLength);
        if (ret) {
          state.mode = MEM;
          return Z_MEM_ERROR$1;
        }
        state.havedict = 1;
        return Z_OK$1;
      };
      inflateReset_1 = inflateReset;
      inflateReset2_1 = inflateReset2;
      inflateResetKeep_1 = inflateResetKeep;
      inflateInit_1 = inflateInit;
      inflateInit2_1 = inflateInit2;
      inflate_2$1 = inflate$2;
      inflateEnd_1 = inflateEnd;
      inflateGetHeader_1 = inflateGetHeader;
      inflateSetDictionary_1 = inflateSetDictionary;
      inflateInfo = "pako inflate (from Nodeca project)";
      inflate_1$2 = {
        inflateReset: inflateReset_1,
        inflateReset2: inflateReset2_1,
        inflateResetKeep: inflateResetKeep_1,
        inflateInit: inflateInit_1,
        inflateInit2: inflateInit2_1,
        inflate: inflate_2$1,
        inflateEnd: inflateEnd_1,
        inflateGetHeader: inflateGetHeader_1,
        inflateSetDictionary: inflateSetDictionary_1,
        inflateInfo
      };
      gzheader = GZheader;
      toString = Object.prototype.toString;
      ({
        Z_NO_FLUSH,
        Z_FINISH,
        Z_OK,
        Z_STREAM_END,
        Z_NEED_DICT,
        Z_STREAM_ERROR,
        Z_DATA_ERROR,
        Z_MEM_ERROR
      } = constants$2);
      Inflate$1.prototype.push = function(data, flush_mode) {
        const strm = this.strm;
        const chunkSize = this.options.chunkSize;
        const dictionary = this.options.dictionary;
        let status, _flush_mode, last_avail_out;
        if (this.ended)
          return false;
        if (flush_mode === ~~flush_mode)
          _flush_mode = flush_mode;
        else
          _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
        if (toString.call(data) === "[object ArrayBuffer]") {
          strm.input = new Uint8Array(data);
        } else {
          strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        for (; ; ) {
          if (strm.avail_out === 0) {
            strm.output = new Uint8Array(chunkSize);
            strm.next_out = 0;
            strm.avail_out = chunkSize;
          }
          status = inflate_1$2.inflate(strm, _flush_mode);
          if (status === Z_NEED_DICT && dictionary) {
            status = inflate_1$2.inflateSetDictionary(strm, dictionary);
            if (status === Z_OK) {
              status = inflate_1$2.inflate(strm, _flush_mode);
            } else if (status === Z_DATA_ERROR) {
              status = Z_NEED_DICT;
            }
          }
          while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
            inflate_1$2.inflateReset(strm);
            status = inflate_1$2.inflate(strm, _flush_mode);
          }
          switch (status) {
            case Z_STREAM_ERROR:
            case Z_DATA_ERROR:
            case Z_NEED_DICT:
            case Z_MEM_ERROR:
              this.onEnd(status);
              this.ended = true;
              return false;
          }
          last_avail_out = strm.avail_out;
          if (strm.next_out) {
            if (strm.avail_out === 0 || status === Z_STREAM_END) {
              if (this.options.to === "string") {
                let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
                let tail = strm.next_out - next_out_utf8;
                let utf8str = strings.buf2string(strm.output, next_out_utf8);
                strm.next_out = tail;
                strm.avail_out = chunkSize - tail;
                if (tail)
                  strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
                this.onData(utf8str);
              } else {
                this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
              }
            }
          }
          if (status === Z_OK && last_avail_out === 0)
            continue;
          if (status === Z_STREAM_END) {
            status = inflate_1$2.inflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return true;
          }
          if (strm.avail_in === 0)
            break;
        }
        return true;
      };
      Inflate$1.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
      };
      Inflate$1.prototype.onEnd = function(status) {
        if (status === Z_OK) {
          if (this.options.to === "string") {
            this.result = this.chunks.join("");
          } else {
            this.result = common.flattenChunks(this.chunks);
          }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
      };
      Inflate_1$1 = Inflate$1;
      inflate_2 = inflate$1;
      inflateRaw_1$1 = inflateRaw$1;
      ungzip$1 = inflate$1;
      constants = constants$2;
      inflate_1$1 = {
        Inflate: Inflate_1$1,
        inflate: inflate_2,
        inflateRaw: inflateRaw_1$1,
        ungzip: ungzip$1,
        constants
      };
      ({ Deflate, deflate, deflateRaw, gzip } = deflate_1$1);
      ({ Inflate, inflate, inflateRaw, ungzip } = inflate_1$1);
      Deflate_1 = Deflate;
      deflate_1 = deflate;
      deflateRaw_1 = deflateRaw;
      gzip_1 = gzip;
      Inflate_1 = Inflate;
      inflate_1 = inflate;
      inflateRaw_1 = inflateRaw;
      ungzip_1 = ungzip;
      constants_1 = constants$2;
      pako = {
        Deflate: Deflate_1,
        deflate: deflate_1,
        deflateRaw: deflateRaw_1,
        gzip: gzip_1,
        Inflate: Inflate_1,
        inflate: inflate_1,
        inflateRaw: inflateRaw_1,
        ungzip: ungzip_1,
        constants: constants_1
      };
    }
  });

  // node_modules/spark-md5/spark-md5.js
  var require_spark_md5 = __commonJS({
    "node_modules/spark-md5/spark-md5.js"(exports, module) {
      (function(factory) {
        if (typeof exports === "object") {
          module.exports = factory();
        } else if (typeof define === "function" && define.amd) {
          define(factory);
        } else {
          var glob;
          try {
            glob = window;
          } catch (e) {
            glob = self;
          }
          glob.SparkMD5 = factory();
        }
      })(function(undefined2) {
        "use strict";
        var add32 = function(a, b) {
          return a + b & 4294967295;
        }, hex_chr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        function cmn(q, a, b, x, s, t) {
          a = add32(add32(a, q), add32(x, t));
          return add32(a << s | a >>> 32 - s, b);
        }
        function md5cycle(x, k) {
          var a = x[0], b = x[1], c = x[2], d = x[3];
          a += (b & c | ~b & d) + k[0] - 680876936 | 0;
          a = (a << 7 | a >>> 25) + b | 0;
          d += (a & b | ~a & c) + k[1] - 389564586 | 0;
          d = (d << 12 | d >>> 20) + a | 0;
          c += (d & a | ~d & b) + k[2] + 606105819 | 0;
          c = (c << 17 | c >>> 15) + d | 0;
          b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
          b = (b << 22 | b >>> 10) + c | 0;
          a += (b & c | ~b & d) + k[4] - 176418897 | 0;
          a = (a << 7 | a >>> 25) + b | 0;
          d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
          d = (d << 12 | d >>> 20) + a | 0;
          c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
          c = (c << 17 | c >>> 15) + d | 0;
          b += (c & d | ~c & a) + k[7] - 45705983 | 0;
          b = (b << 22 | b >>> 10) + c | 0;
          a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
          a = (a << 7 | a >>> 25) + b | 0;
          d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
          d = (d << 12 | d >>> 20) + a | 0;
          c += (d & a | ~d & b) + k[10] - 42063 | 0;
          c = (c << 17 | c >>> 15) + d | 0;
          b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
          b = (b << 22 | b >>> 10) + c | 0;
          a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
          a = (a << 7 | a >>> 25) + b | 0;
          d += (a & b | ~a & c) + k[13] - 40341101 | 0;
          d = (d << 12 | d >>> 20) + a | 0;
          c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
          c = (c << 17 | c >>> 15) + d | 0;
          b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
          b = (b << 22 | b >>> 10) + c | 0;
          a += (b & d | c & ~d) + k[1] - 165796510 | 0;
          a = (a << 5 | a >>> 27) + b | 0;
          d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
          d = (d << 9 | d >>> 23) + a | 0;
          c += (d & b | a & ~b) + k[11] + 643717713 | 0;
          c = (c << 14 | c >>> 18) + d | 0;
          b += (c & a | d & ~a) + k[0] - 373897302 | 0;
          b = (b << 20 | b >>> 12) + c | 0;
          a += (b & d | c & ~d) + k[5] - 701558691 | 0;
          a = (a << 5 | a >>> 27) + b | 0;
          d += (a & c | b & ~c) + k[10] + 38016083 | 0;
          d = (d << 9 | d >>> 23) + a | 0;
          c += (d & b | a & ~b) + k[15] - 660478335 | 0;
          c = (c << 14 | c >>> 18) + d | 0;
          b += (c & a | d & ~a) + k[4] - 405537848 | 0;
          b = (b << 20 | b >>> 12) + c | 0;
          a += (b & d | c & ~d) + k[9] + 568446438 | 0;
          a = (a << 5 | a >>> 27) + b | 0;
          d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
          d = (d << 9 | d >>> 23) + a | 0;
          c += (d & b | a & ~b) + k[3] - 187363961 | 0;
          c = (c << 14 | c >>> 18) + d | 0;
          b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
          b = (b << 20 | b >>> 12) + c | 0;
          a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
          a = (a << 5 | a >>> 27) + b | 0;
          d += (a & c | b & ~c) + k[2] - 51403784 | 0;
          d = (d << 9 | d >>> 23) + a | 0;
          c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
          c = (c << 14 | c >>> 18) + d | 0;
          b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
          b = (b << 20 | b >>> 12) + c | 0;
          a += (b ^ c ^ d) + k[5] - 378558 | 0;
          a = (a << 4 | a >>> 28) + b | 0;
          d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
          d = (d << 11 | d >>> 21) + a | 0;
          c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
          c = (c << 16 | c >>> 16) + d | 0;
          b += (c ^ d ^ a) + k[14] - 35309556 | 0;
          b = (b << 23 | b >>> 9) + c | 0;
          a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
          a = (a << 4 | a >>> 28) + b | 0;
          d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
          d = (d << 11 | d >>> 21) + a | 0;
          c += (d ^ a ^ b) + k[7] - 155497632 | 0;
          c = (c << 16 | c >>> 16) + d | 0;
          b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
          b = (b << 23 | b >>> 9) + c | 0;
          a += (b ^ c ^ d) + k[13] + 681279174 | 0;
          a = (a << 4 | a >>> 28) + b | 0;
          d += (a ^ b ^ c) + k[0] - 358537222 | 0;
          d = (d << 11 | d >>> 21) + a | 0;
          c += (d ^ a ^ b) + k[3] - 722521979 | 0;
          c = (c << 16 | c >>> 16) + d | 0;
          b += (c ^ d ^ a) + k[6] + 76029189 | 0;
          b = (b << 23 | b >>> 9) + c | 0;
          a += (b ^ c ^ d) + k[9] - 640364487 | 0;
          a = (a << 4 | a >>> 28) + b | 0;
          d += (a ^ b ^ c) + k[12] - 421815835 | 0;
          d = (d << 11 | d >>> 21) + a | 0;
          c += (d ^ a ^ b) + k[15] + 530742520 | 0;
          c = (c << 16 | c >>> 16) + d | 0;
          b += (c ^ d ^ a) + k[2] - 995338651 | 0;
          b = (b << 23 | b >>> 9) + c | 0;
          a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
          a = (a << 6 | a >>> 26) + b | 0;
          d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
          d = (d << 10 | d >>> 22) + a | 0;
          c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
          c = (c << 15 | c >>> 17) + d | 0;
          b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
          b = (b << 21 | b >>> 11) + c | 0;
          a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
          a = (a << 6 | a >>> 26) + b | 0;
          d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
          d = (d << 10 | d >>> 22) + a | 0;
          c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
          c = (c << 15 | c >>> 17) + d | 0;
          b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
          b = (b << 21 | b >>> 11) + c | 0;
          a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
          a = (a << 6 | a >>> 26) + b | 0;
          d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
          d = (d << 10 | d >>> 22) + a | 0;
          c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
          c = (c << 15 | c >>> 17) + d | 0;
          b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
          b = (b << 21 | b >>> 11) + c | 0;
          a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
          a = (a << 6 | a >>> 26) + b | 0;
          d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
          d = (d << 10 | d >>> 22) + a | 0;
          c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
          c = (c << 15 | c >>> 17) + d | 0;
          b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
          b = (b << 21 | b >>> 11) + c | 0;
          x[0] = a + x[0] | 0;
          x[1] = b + x[1] | 0;
          x[2] = c + x[2] | 0;
          x[3] = d + x[3] | 0;
        }
        function md5blk(s) {
          var md5blks = [], i;
          for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
          }
          return md5blks;
        }
        function md5blk_array(a) {
          var md5blks = [], i;
          for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
          }
          return md5blks;
        }
        function md51(s) {
          var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i, length, tail, tmp, lo, hi;
          for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
          }
          s = s.substring(i - 64);
          length = s.length;
          tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
          }
          tail[i >> 2] |= 128 << (i % 4 << 3);
          if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
              tail[i] = 0;
            }
          }
          tmp = n * 8;
          tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
          lo = parseInt(tmp[2], 16);
          hi = parseInt(tmp[1], 16) || 0;
          tail[14] = lo;
          tail[15] = hi;
          md5cycle(state, tail);
          return state;
        }
        function md51_array(a) {
          var n = a.length, state = [1732584193, -271733879, -1732584194, 271733878], i, length, tail, tmp, lo, hi;
          for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
          }
          a = i - 64 < n ? a.subarray(i - 64) : new Uint8Array(0);
          length = a.length;
          tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= a[i] << (i % 4 << 3);
          }
          tail[i >> 2] |= 128 << (i % 4 << 3);
          if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
              tail[i] = 0;
            }
          }
          tmp = n * 8;
          tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
          lo = parseInt(tmp[2], 16);
          hi = parseInt(tmp[1], 16) || 0;
          tail[14] = lo;
          tail[15] = hi;
          md5cycle(state, tail);
          return state;
        }
        function rhex(n) {
          var s = "", j;
          for (j = 0; j < 4; j += 1) {
            s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
          }
          return s;
        }
        function hex(x) {
          var i;
          for (i = 0; i < x.length; i += 1) {
            x[i] = rhex(x[i]);
          }
          return x.join("");
        }
        if (hex(md51("hello")) !== "5d41402abc4b2a76b9719d911017c592") {
          add32 = function(x, y) {
            var lsw = (x & 65535) + (y & 65535), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return msw << 16 | lsw & 65535;
          };
        }
        if (typeof ArrayBuffer !== "undefined" && !ArrayBuffer.prototype.slice) {
          (function() {
            function clamp(val, length) {
              val = val | 0 || 0;
              if (val < 0) {
                return Math.max(val + length, 0);
              }
              return Math.min(val, length);
            }
            ArrayBuffer.prototype.slice = function(from, to) {
              var length = this.byteLength, begin = clamp(from, length), end = length, num, target, targetArray, sourceArray;
              if (to !== undefined2) {
                end = clamp(to, length);
              }
              if (begin > end) {
                return new ArrayBuffer(0);
              }
              num = end - begin;
              target = new ArrayBuffer(num);
              targetArray = new Uint8Array(target);
              sourceArray = new Uint8Array(this, begin, num);
              targetArray.set(sourceArray);
              return target;
            };
          })();
        }
        function toUtf8(str) {
          if (/[\u0080-\uFFFF]/.test(str)) {
            str = unescape(encodeURIComponent(str));
          }
          return str;
        }
        function utf8Str2ArrayBuffer(str, returnUInt8Array) {
          var length = str.length, buff = new ArrayBuffer(length), arr = new Uint8Array(buff), i;
          for (i = 0; i < length; i += 1) {
            arr[i] = str.charCodeAt(i);
          }
          return returnUInt8Array ? arr : buff;
        }
        function arrayBuffer2Utf8Str(buff) {
          return String.fromCharCode.apply(null, new Uint8Array(buff));
        }
        function concatenateArrayBuffers(first, second, returnUInt8Array) {
          var result = new Uint8Array(first.byteLength + second.byteLength);
          result.set(new Uint8Array(first));
          result.set(new Uint8Array(second), first.byteLength);
          return returnUInt8Array ? result : result.buffer;
        }
        function hexToBinaryString(hex2) {
          var bytes = [], length = hex2.length, x;
          for (x = 0; x < length - 1; x += 2) {
            bytes.push(parseInt(hex2.substr(x, 2), 16));
          }
          return String.fromCharCode.apply(String, bytes);
        }
        function SparkMD52() {
          this.reset();
        }
        SparkMD52.prototype.append = function(str) {
          this.appendBinary(toUtf8(str));
          return this;
        };
        SparkMD52.prototype.appendBinary = function(contents) {
          this._buff += contents;
          this._length += contents.length;
          var length = this._buff.length, i;
          for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
          }
          this._buff = this._buff.substring(i - 64);
          return this;
        };
        SparkMD52.prototype.end = function(raw) {
          var buff = this._buff, length = buff.length, i, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ret;
          for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff.charCodeAt(i) << (i % 4 << 3);
          }
          this._finish(tail, length);
          ret = hex(this._hash);
          if (raw) {
            ret = hexToBinaryString(ret);
          }
          this.reset();
          return ret;
        };
        SparkMD52.prototype.reset = function() {
          this._buff = "";
          this._length = 0;
          this._hash = [1732584193, -271733879, -1732584194, 271733878];
          return this;
        };
        SparkMD52.prototype.getState = function() {
          return {
            buff: this._buff,
            length: this._length,
            hash: this._hash.slice()
          };
        };
        SparkMD52.prototype.setState = function(state) {
          this._buff = state.buff;
          this._length = state.length;
          this._hash = state.hash;
          return this;
        };
        SparkMD52.prototype.destroy = function() {
          delete this._hash;
          delete this._buff;
          delete this._length;
        };
        SparkMD52.prototype._finish = function(tail, length) {
          var i = length, tmp, lo, hi;
          tail[i >> 2] |= 128 << (i % 4 << 3);
          if (i > 55) {
            md5cycle(this._hash, tail);
            for (i = 0; i < 16; i += 1) {
              tail[i] = 0;
            }
          }
          tmp = this._length * 8;
          tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
          lo = parseInt(tmp[2], 16);
          hi = parseInt(tmp[1], 16) || 0;
          tail[14] = lo;
          tail[15] = hi;
          md5cycle(this._hash, tail);
        };
        SparkMD52.hash = function(str, raw) {
          return SparkMD52.hashBinary(toUtf8(str), raw);
        };
        SparkMD52.hashBinary = function(content, raw) {
          var hash = md51(content), ret = hex(hash);
          return raw ? hexToBinaryString(ret) : ret;
        };
        SparkMD52.ArrayBuffer = function() {
          this.reset();
        };
        SparkMD52.ArrayBuffer.prototype.append = function(arr) {
          var buff = concatenateArrayBuffers(this._buff.buffer, arr, true), length = buff.length, i;
          this._length += arr.byteLength;
          for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
          }
          this._buff = i - 64 < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);
          return this;
        };
        SparkMD52.ArrayBuffer.prototype.end = function(raw) {
          var buff = this._buff, length = buff.length, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], i, ret;
          for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff[i] << (i % 4 << 3);
          }
          this._finish(tail, length);
          ret = hex(this._hash);
          if (raw) {
            ret = hexToBinaryString(ret);
          }
          this.reset();
          return ret;
        };
        SparkMD52.ArrayBuffer.prototype.reset = function() {
          this._buff = new Uint8Array(0);
          this._length = 0;
          this._hash = [1732584193, -271733879, -1732584194, 271733878];
          return this;
        };
        SparkMD52.ArrayBuffer.prototype.getState = function() {
          var state = SparkMD52.prototype.getState.call(this);
          state.buff = arrayBuffer2Utf8Str(state.buff);
          return state;
        };
        SparkMD52.ArrayBuffer.prototype.setState = function(state) {
          state.buff = utf8Str2ArrayBuffer(state.buff, true);
          return SparkMD52.prototype.setState.call(this, state);
        };
        SparkMD52.ArrayBuffer.prototype.destroy = SparkMD52.prototype.destroy;
        SparkMD52.ArrayBuffer.prototype._finish = SparkMD52.prototype._finish;
        SparkMD52.ArrayBuffer.hash = function(arr, raw) {
          var hash = md51_array(new Uint8Array(arr)), ret = hex(hash);
          return raw ? hexToBinaryString(ret) : ret;
        };
        return SparkMD52;
      });
    }
  });

  // src/utils/Hasher.ts
  function md5(input) {
    return import_spark_md5.default.hash(input);
  }
  function spotifyHex(base62) {
    const base62chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let num = BigInt(0);
    for (const char of base62) {
      const index = base62chars.indexOf(char);
      if (index === -1)
        throw new Error("Invalid character in base62 string");
      num = num * BigInt(62) + BigInt(index);
    }
    return num.toString(16).padStart(32, "0");
  }
  var import_spark_md5;
  var init_Hasher = __esm({
    "src/utils/Hasher.ts"() {
      import_spark_md5 = __toESM(require_spark_md5());
    }
  });

  // src/utils/API/SpicyFetch.ts
  async function SpicyFetch(path, IsExternal = false, cache = false, cosmos = false) {
    const url = path;
    try {
      const CachedContent = await GetCachedContent(url);
      if (CachedContent) {
        if (Array.isArray(CachedContent)) {
          const content = typeof CachedContent[0] === "string" ? JSON.parse(CachedContent[0]) : CachedContent[0];
          return [content, CachedContent[1]];
        }
        return [CachedContent, 200];
      }
      const SpotifyAccessToken = await Platform_default.GetSpotifyAccessToken();
      if (cosmos) {
        const res = await Spicetify.CosmosAsync.get(url);
        let data;
        try {
          data = await res.json();
        } catch {
          data = {};
        }
        const sentData = [data, res.status];
        if (cache) {
          await CacheContent(url, sentData, 6048e5);
        }
        return sentData;
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
        const res = await fetch(url, {
          method: "GET",
          headers
        });
        if (res === null) {
          return [null, 500];
        }
        let data;
        try {
          data = await res.json();
        } catch {
          data = {};
        }
        const sentData = [data, res.status];
        if (cache) {
          await CacheContent(url, sentData, 6048e5);
        }
        return sentData;
      }
    } catch (err2) {
      console.error("SpicyFetch Error:", err2);
      throw err2;
    }
  }
  async function CacheContent(key, data, expirationTtl = 6048e5) {
    try {
      const expiresIn = Date.now() + expirationTtl;
      const processedKey = md5(key);
      const processedData = typeof data === "object" ? JSON.stringify(data) : data;
      const compressedData = pako.deflate(processedData, {
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
      const processedKey = md5(key);
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
          return JSON.parse(decompressedData);
        } else {
          await SpicyFetchCache.remove(key);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("ERR CC", error);
      return null;
    }
  }
  var SpicyFetchCache;
  var init_SpicyFetch = __esm({
    "src/utils/API/SpicyFetch.ts"() {
      init_SpikyCache();
      init_Platform();
      init_pako_esm();
      init_Hasher();
      SpicyFetchCache = new SpikyCache({
        name: "SpicyFetch__Cache"
      });
    }
  });

  // src/utils/EventManager.ts
  var eventRegistry, nextId, listen, unListen, evoke, Event2, EventManager_default;
  var init_EventManager = __esm({
    "src/utils/EventManager.ts"() {
      eventRegistry = /* @__PURE__ */ new Map();
      nextId = 1;
      listen = (eventName, callback) => {
        if (!eventRegistry.has(eventName)) {
          eventRegistry.set(
            eventName,
            /* @__PURE__ */ new Map()
          );
        }
        const id = nextId++;
        eventRegistry.get(eventName).set(id, callback);
        return id;
      };
      unListen = (id) => {
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
      evoke = (eventName, ...args) => {
        const listeners = eventRegistry.get(eventName);
        if (listeners) {
          for (const callback of listeners.values()) {
            callback(...args);
          }
        }
      };
      Event2 = {
        listen,
        unListen,
        evoke
      };
      EventManager_default = Event2;
    }
  });

  // src/components/Global/Global.ts
  var SCOPE_ROOT, Global, Global_default;
  var init_Global = __esm({
    "src/components/Global/Global.ts"() {
      init_EventManager();
      window._spicy_lyrics = {};
      SCOPE_ROOT = window._spicy_lyrics;
      Global = {
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
        GetScope: (key, fallback) => {
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
      Global_default = Global;
    }
  });

  // src/utils/Gets/GetProgress.ts
  var GetProgress_exports = {};
  __export(GetProgress_exports, {
    _DEPRECATED___GetProgress: () => _DEPRECATED___GetProgress,
    default: () => GetProgress,
    requestPositionSync: () => requestPositionSync
  });
  async function getLocalPosition(startedAt, SpotifyPlatform2) {
    const { position } = await SpotifyPlatform2.PlayerAPI._contextPlayer.getPositionState({});
    return {
      StartedSyncAt: startedAt,
      Position: Number(position)
    };
  }
  async function getNonLocalPosition(startedAt, SpotifyPlatform2) {
    if (canSyncNonLocalTimestamp > 0) {
      await SpotifyPlatform2.PlayerAPI._contextPlayer.resume({});
    }
    canSyncNonLocalTimestamp = Math.max(0, canSyncNonLocalTimestamp - 1);
    return {
      StartedSyncAt: startedAt,
      Position: SpotifyPlatform2.PlayerAPI._state.positionAsOfTimestamp + (Date.now() - SpotifyPlatform2.PlayerAPI._state.timestamp)
    };
  }
  async function requestPositionSync() {
    try {
      const SpotifyPlatform2 = Spicetify.Platform;
      const startedAt = performance.now();
      const isLocallyPlaying = SpotifyPlatform2.PlaybackAPI._isLocal;
      const delay = !Spicetify.Player.isPlaying() || canSyncNonLocalTimestamp === 0 ? 1 / 60 : isLocallyPlaying ? 1 / 60 : syncTimings[syncTimings.length - canSyncNonLocalTimestamp];
      let pos;
      if (isLocallyPlaying) {
        pos = await getLocalPosition(startedAt, SpotifyPlatform2);
      } else {
        pos = await getNonLocalPosition(startedAt, SpotifyPlatform2);
      }
      syncedPosition.StartedSyncAt = pos.StartedSyncAt;
      syncedPosition.Position = pos.Position;
      setTimeout(requestPositionSync, delay * 1e3);
    } catch (error) {
      console.error("Sync Position: Fail, More Details:", error);
    }
  }
  function GetProgress() {
    if (!syncedPosition.StartedSyncAt && !syncedPosition.Position) {
      if (SpotifyPlayer?._DEPRECATED_?.GetTrackPosition) {
        return SpotifyPlayer._DEPRECATED_.GetTrackPosition();
      }
      console.warn("[GetProgress] Synced Position: Skip, Returning 0");
      return 0;
    }
    const platform = Spicetify.Platform;
    const isPlaying = Spicetify.Player.isPlaying();
    const isLocal = platform.PlaybackAPI._isLocal;
    const startedAt = syncedPosition.StartedSyncAt;
    const basePosition = syncedPosition.Position;
    const delta = performance.now() - startedAt;
    if (!isPlaying) {
      return platform.PlayerAPI._state.positionAsOfTimestamp;
    }
    const calculated = basePosition + delta;
    return isLocal ? calculated : calculated + Global_default.NonLocalTimeOffset;
  }
  function _DEPRECATED___GetProgress() {
    const state = Spicetify?.Player?.origin?._state;
    if (!state) {
      console.error("Spicetify Player state is not available.");
      return 0;
    }
    const { positionAsOfTimestamp, timestamp, isPaused } = state;
    if (positionAsOfTimestamp == null || timestamp == null) {
      console.error("Playback state is incomplete.");
      return null;
    }
    const now = Date.now();
    if (isPaused) {
      return positionAsOfTimestamp;
    } else {
      return positionAsOfTimestamp + (now - timestamp);
    }
  }
  var syncTimings, canSyncNonLocalTimestamp, syncedPosition;
  var init_GetProgress = __esm({
    "src/utils/Gets/GetProgress.ts"() {
      init_Global();
      init_SpotifyPlayer();
      syncTimings = [0.05, 0.1, 0.15, 0.75];
      canSyncNonLocalTimestamp = Spicetify.Player.isPlaying() ? syncTimings.length : 0;
      syncedPosition = {
        StartedSyncAt: 0,
        Position: 0
      };
    }
  });

  // src/components/Global/SpotifyPlayer.ts
  async function getOrFetchTrackData(trackId) {
    if (TrackData_Map.has(trackId)) {
      const cached = TrackData_Map.get(trackId);
      if (cached instanceof Promise || cached && typeof cached === "object") {
        return cached;
      }
    }
    const fetchPromise = (async () => {
      const URL2 = `https://spclient.wg.spotify.com/metadata/4/track/${trackId}?market=from_token`;
      const [data, status] = await SpicyFetch(URL2, true, true, false);
      if (status !== 200)
        return null;
      TrackData_Map.set(trackId, data);
      return data;
    })();
    TrackData_Map.set(trackId, fetchPromise);
    return fetchPromise;
  }
  var TrackData_Map, SpotifyPlayer;
  var init_SpotifyPlayer = __esm({
    "src/components/Global/SpotifyPlayer.ts"() {
      init_SpicyFetch();
      init_Hasher();
      init_GetProgress();
      TrackData_Map = /* @__PURE__ */ new Map();
      if (typeof Spicetify !== "undefined" && Spicetify?.Player) {
      }
      SpotifyPlayer = {
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
            const spotifyHexString = spotifyHex(SpotifyPlayer.GetSongId());
            return getOrFetchTrackData(spotifyHexString);
          },
          SortImages: (images) => {
            const sizeMap = {
              s: "SMALL",
              l: "DEFAULT",
              xl: "LARGE"
            };
            return images.reduce(
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
          }
        },
        Seek: (position) => {
          Spicetify.Player.origin.seekTo(position);
        },
        Artwork: {
          Get: async (size) => {
            if (Spicetify.Player.data?.item?.metadata?.image_url) {
              return Spicetify.Player.data.item.metadata.image_url;
            }
            const psize = size === "d" ? null : size?.toLowerCase() ?? null;
            const Data = await SpotifyPlayer.Track.GetTrackInfo();
            const trackData = Data;
            if (!trackData || !trackData.album?.cover_group?.image)
              return "";
            const Images = SpotifyPlayer.Track.SortImages(
              trackData.album.cover_group.image
            );
            switch (psize) {
              case "s":
                return Images.s[0] ? `spotify:image:${Images.s[0].file_id}` : "";
              case "l":
                return Images.l[0] ? `spotify:image:${Images.l[0].file_id}` : "";
              case "xl":
                return Images.xl[0] ? `spotify:image:${Images.xl[0].file_id}` : "";
              default:
                return Images.l[0] ? `spotify:image:${Images.l[0].file_id}` : "";
            }
          }
        },
        GetSongName: async () => {
          if (Spicetify.Player.data?.item?.metadata?.title) {
            return Spicetify.Player.data.item.metadata.title;
          }
          const Data = await SpotifyPlayer.Track.GetTrackInfo();
          const trackData = Data;
          return trackData?.name || "";
        },
        GetAlbumName: () => {
          return Spicetify.Player.data.item.metadata.album_title;
        },
        GetSongId: () => {
          return Spicetify.Player.data.item.uri?.split(":")[2] ?? null;
        },
        GetArtists: async () => {
          if (Spicetify.Player.data?.item?.metadata?.artist_name) {
            return Spicetify.Player.data.item.metadata.artist_name.split(",").map((artist) => artist.trim());
          }
          const data = await SpotifyPlayer.Track.GetTrackInfo();
          const trackData = data;
          return trackData?.artist?.map((a) => a.name) ?? [];
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
    }
  });

  // src/utils/Lyrics/Animator/Shared.ts
  var IdleLyricsScale, IdleEmphasisLyricsScale, timeOffset, BlurMultiplier;
  var init_Shared = __esm({
    "src/utils/Lyrics/Animator/Shared.ts"() {
      IdleLyricsScale = 0.95;
      IdleEmphasisLyricsScale = 0.95;
      timeOffset = 0;
      BlurMultiplier = 1;
    }
  });

  // src/utils/Lyrics/Animator/Lyrics/LyricsAnimator.ts
  function setBlurringLastLine(c) {
    Blurring_LastLine = c;
  }
  function animateLetter(letter, percentage, emphasisScale, emphasisBlurRadius, emphasisTextShadowOpacity) {
    let translateY;
    if (percentage <= 0.5) {
      translateY = -0.1 * (percentage / 0.5);
    } else {
      translateY = -0.1 + (0 - -0.1) * ((percentage - 0.5) / 0.5);
    }
    const letterGradientPosition = `${percentage * 100}%`;
    setStyleIfChanged(
      letter.HTMLElement,
      "transform",
      `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`
    );
    setStyleIfChanged(letter.HTMLElement, "scale", `${emphasisScale * 1.04}`);
    setStyleIfChanged(letter.HTMLElement, "--text-shadow-blur-radius", `${emphasisBlurRadius}px`);
    setStyleIfChanged(letter.HTMLElement, "--text-shadow-opacity", `${emphasisTextShadowOpacity}%`);
    setStyleIfChanged(letter.HTMLElement, "--gradient-position", letterGradientPosition);
  }
  function resetLetterStyles(letter, status, scaleValue, gradientPosition) {
    if (status === "NotSung") {
      setStyleIfChanged(
        letter.HTMLElement,
        "transform",
        "translateY(calc(var(--DefaultLyricsSize) * 0.02))"
      );
      setStyleIfChanged(letter.HTMLElement, "scale", scaleValue);
      setStyleIfChanged(letter.HTMLElement, "--text-shadow-blur-radius", "4px");
      setStyleIfChanged(letter.HTMLElement, "--text-shadow-opacity", "0%");
      setStyleIfChanged(letter.HTMLElement, "--gradient-position", gradientPosition);
    } else if (status === "Sung") {
      setStyleIfChanged(
        letter.HTMLElement,
        "transform",
        `translateY(calc(var(--DefaultLyricsSize) * 0))`
      );
      setStyleIfChanged(letter.HTMLElement, "scale", "1");
      setStyleIfChanged(letter.HTMLElement, "--text-shadow-blur-radius", "4px");
      setStyleIfChanged(letter.HTMLElement, "--text-shadow-opacity", "0%");
      setStyleIfChanged(letter.HTMLElement, "--gradient-position", gradientPosition);
    }
  }
  function animateDot(dot, percentage, blurRadius, textShadowOpacity, scale, translateY) {
    dot.HTMLElement.style.setProperty("--opacity-size", `${0.2 + percentage}`);
    dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY}))`;
    dot.HTMLElement.style.scale = `${0.2 + scale}`;
    dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
    dot.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
  }
  function animateWord(word, totalDuration, percentage, gradientPosition, translateY, scale, blurRadius, textShadowOpacity) {
    setStyleIfChanged(word.HTMLElement, "--gradient-position", `${gradientPosition}%`);
    if (totalDuration > 230) {
      setStyleIfChanged(
        word.HTMLElement,
        "transform",
        `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`
      );
      setStyleIfChanged(word.HTMLElement, "scale", `${scale}`);
      setStyleIfChanged(word.HTMLElement, "--text-shadow-blur-radius", `${blurRadius}px`);
      setStyleIfChanged(word.HTMLElement, "--text-shadow-opacity", `${textShadowOpacity}%`);
      word.scale = scale;
      word.glow = textShadowOpacity / 100;
      word.translateY = translateY;
    } else {
      const blurRadiusShort = 4 + (0 - 4) * percentage;
      const textShadowOpacityShort = 0;
      const translateYShort = 0.01 + (0 - 0.01) * percentage;
      const scaleShort = IdleLyricsScale + (1 - IdleLyricsScale) * percentage;
      setStyleIfChanged(
        word.HTMLElement,
        "transform",
        `translateY(calc(var(--DefaultLyricsSize) * ${translateYShort}))`
      );
      setStyleIfChanged(word.HTMLElement, "scale", `${scaleShort}`);
      setStyleIfChanged(word.HTMLElement, "--text-shadow-blur-radius", `${blurRadiusShort}px`);
      setStyleIfChanged(word.HTMLElement, "--text-shadow-opacity", `${textShadowOpacityShort}%`);
      word.scale = scaleShort;
      word.glow = textShadowOpacityShort;
      word.translateY = 0;
    }
  }
  function resetWordAnimationTracking(word) {
    word.AnimatorStoreTime_glow = void 0;
    word.AnimatorStoreTime_translateY = void 0;
    word.AnimatorStoreTime_scale = void 0;
  }
  function Animate(position) {
    const CurrentLyricsType = Defaults_default.CurrentLyricsType;
    const edtrackpos = position + timeOffset;
    if (!CurrentLyricsType || CurrentLyricsType === "None")
      return;
    const Credits = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits"
    );
    if (CurrentLyricsType === "Syllable") {
      const arr = LyricsObject.Types.Syllable.Lines;
      for (let index = 0; index < arr.length; index++) {
        const line = arr[index];
        if (line.Status === "Active") {
          if (!SpotifyPlayer.IsPlaying)
            applyBlur(arr, index, BlurMultiplier);
          if (Blurring_LastLine !== index) {
            applyBlur(arr, index, BlurMultiplier);
            Blurring_LastLine = index;
          }
          line.HTMLElement.classList.add("Active");
          line.HTMLElement.classList.remove("NotSung", "Sung", "OverridenByScroller");
          const words = line.Syllables.Lead;
          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            const isLetterGroup = word?.LetterGroup;
            const isDot = word?.Dot;
            if (word.Status === "Active") {
              const totalDuration = word.EndTime - word.StartTime;
              const elapsedDuration = edtrackpos - word.StartTime;
              const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1));
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
                    const percentage2 = Math.max(0, Math.min(elapsedDuration2 / totalDuration2, 1));
                    animateLetter(
                      letter,
                      percentage2,
                      emphasisScale,
                      emphasisBlurRadius,
                      emphasisTextShadowOpacity
                    );
                    animateLetter(
                      letter,
                      percentage2,
                      emphasisScale,
                      emphasisBlurRadius,
                      emphasisTextShadowOpacity
                    );
                    resetLetterStyles(letter, "NotSung", IdleEmphasisLyricsScale, "-20%");
                  } else if (letter.Status === "Sung") {
                    resetLetterStyles(letter, "Sung", "1", "100%");
                  }
                }
                setStyleIfChanged(word.HTMLElement, "scale", `${emphasisScale}`);
                setStyleIfChanged(
                  word.HTMLElement,
                  "transform",
                  `translateY(calc(var(--DefaultLyricsSize) * ${emphasisTranslateY}))`
                );
                word.scale = emphasisScale;
                word.glow = 0;
              } else if (isDot) {
                let dotTranslateY;
                if (percentage <= 0) {
                  dotTranslateY = -0.07 * percentage;
                } else if (percentage <= 0.88) {
                  dotTranslateY = -0.07 + (0.2 - -0.07) * ((percentage - 0.88) / 0.88);
                } else {
                  dotTranslateY = 0.2 + (0 - 0.2) * ((percentage - 0.22) / 0.88);
                }
                const dotScale = 0.75 + (1 - 0.75) * percentage;
                const dotTextShadowOpacity = calculateOpacity(percentage, word) * 1.5;
                animateDot(
                  word,
                  percentage,
                  blurRadius,
                  dotTextShadowOpacity,
                  dotScale,
                  dotTranslateY
                );
                word.scale = dotScale;
                word.glow = dotTextShadowOpacity / 100;
              } else {
                animateWord(
                  word,
                  totalDuration,
                  percentage,
                  gradientPosition,
                  translateY,
                  scale,
                  blurRadius,
                  textShadowOpacity
                );
                resetWordAnimationTracking(word);
              }
            } else if (word.Status === "NotSung") {
              if (isLetterGroup) {
                for (let k = 0; k < word.Letters.length; k++) {
                  resetLetterStyles(word.Letters[k], "NotSung", IdleEmphasisLyricsScale, "-20%");
                }
                setStyleIfChanged(
                  word.HTMLElement,
                  "transform",
                  "translateY(calc(var(--DefaultLyricsSize) * 0.02))"
                );
                word.translateY = 0.02;
              } else if (!isDot) {
                setStyleIfChanged(
                  word.HTMLElement,
                  "transform",
                  "translateY(calc(var(--DefaultLyricsSize) * 0.01))"
                );
                word.translateY = 0.01;
              }
              if (isDot) {
                setStyleIfChanged(word.HTMLElement, "--opacity-size", `${0.2}`);
                setStyleIfChanged(
                  word.HTMLElement,
                  "transform",
                  "translateY(calc(var(--font-size) * 0.01))"
                );
                word.translateY = 0.01;
                setStyleIfChanged(word.HTMLElement, "scale", "0.75");
              } else {
                setStyleIfChanged(
                  word.HTMLElement,
                  "scale",
                  `${isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale}`
                );
                word.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                setStyleIfChanged(word.HTMLElement, "--gradient-position", "-20%");
              }
              resetWordAnimationTracking(word);
              setStyleIfChanged(word.HTMLElement, "--text-shadow-blur-radius", "4px");
              setStyleIfChanged(word.HTMLElement, "--text-shadow-opacity", "0%");
              word.glow = 0;
            } else if (word.Status === "Sung") {
              if (isLetterGroup) {
                for (let k = 0; k < word.Letters.length; k++) {
                  resetLetterStyles(word.Letters[k], "Sung", "1", "100%");
                }
                setStyleIfChanged(
                  word.HTMLElement,
                  "transform",
                  `translateY(calc(var(--DefaultLyricsSize) * 0))`
                );
                setStyleIfChanged(word.HTMLElement, "scale", "1");
              }
              if (isDot) {
                setStyleIfChanged(word.HTMLElement, "--opacity-size", `${0.2 + 1}`);
                setStyleIfChanged(
                  word.HTMLElement,
                  "transform",
                  `translateY(calc(var(--font-size) * 0))`
                );
                setStyleIfChanged(word.HTMLElement, "scale", "1.2");
                setStyleIfChanged(word.HTMLElement, "--text-shadow-opacity", `50%`);
                setStyleIfChanged(word.HTMLElement, "--text-shadow-blur-radius", `12px`);
              } else if (!isLetterGroup) {
                setStyleIfChanged(word.HTMLElement, "--text-shadow-blur-radius", "4px");
                const element = word.HTMLElement;
                const currentTranslateY = word.translateY;
                const currentScale = word.scale;
                const currentGlow = word.glow;
                if (!word.AnimatorStoreTime_translateY)
                  word.AnimatorStoreTime_translateY = performance.now();
                if (!word.AnimatorStoreTime_scale)
                  word.AnimatorStoreTime_scale = performance.now();
                if (!word.AnimatorStoreTime_glow)
                  word.AnimatorStoreTime_glow = performance.now();
                const now = performance.now();
                const elapsed_translateY = now - word.AnimatorStoreTime_translateY;
                const elapsed_scale = now - word.AnimatorStoreTime_scale;
                const elapsed_glow = now - word.AnimatorStoreTime_glow;
                const duration_translateY = 550;
                const progress_translateY = Math.min(elapsed_translateY / duration_translateY, 1);
                const duration_scale = 1100;
                const progress_scale = Math.min(elapsed_scale / duration_scale, 1);
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
                const newScale = interpolate(currentScale, targetScale, progress_scale);
                const newGlow = interpolate(currentGlow, targetGlow, progress_glow);
                setStyleIfChanged(element, "--text-shadow-opacity", `${newGlow * 100}%`);
                setStyleIfChanged(
                  element,
                  "transform",
                  `translateY(calc(var(--DefaultLyricsSize) * ${newTranslateY}))`
                );
                setStyleIfChanged(element, "scale", `${newScale}`);
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
              setStyleIfChanged(word.HTMLElement, "--gradient-position", "100%");
            }
          }
          if (Credits)
            Credits.classList.remove("Active");
        } else if (line.Status === "NotSung") {
          line.HTMLElement.classList.add("NotSung");
          line.HTMLElement.classList.remove("Sung");
          if (line.HTMLElement.classList.contains("Active") && !line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("Active");
          }
        } else if (line.Status === "Sung") {
          line.HTMLElement.classList.add("Sung");
          line.HTMLElement.classList.remove("Active", "NotSung");
          if (arr.length === index + 1 && Credits) {
            Credits.classList.add("Active");
          }
        }
      }
    } else if (CurrentLyricsType === "Line") {
      const arr = LyricsObject.Types.Line.Lines;
      for (let index = 0; index < arr.length; index++) {
        const line = arr[index];
        if (line.Status === "Active") {
          if (!SpotifyPlayer.IsPlaying)
            applyBlur(arr, index, BlurMultiplier);
          if (Blurring_LastLine !== index) {
            applyBlur(arr, index, BlurMultiplier);
            Blurring_LastLine = index;
          }
          line.HTMLElement.classList.add("Active");
          line.HTMLElement.classList.remove("NotSung", "OverridenByScroller", "Sung");
          const percentage = 1;
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i = 0; i < Array2.length; i++) {
              const dot = Array2[i];
              if (dot.Status === "Active") {
                const totalDuration = dot.EndTime - dot.StartTime;
                const elapsedDuration = edtrackpos - dot.StartTime;
                const percentage2 = Math.max(0, Math.min(elapsedDuration / totalDuration, 1));
                const blurRadius = 4 + (16 - 4) * percentage2;
                const textShadowOpacity = calculateOpacity(percentage2, dot) * 1.5;
                const scale = 0.75 + (1 - 0.75) * percentage2;
                let translateY;
                if (percentage2 <= 0) {
                  translateY = -0.07 * percentage2;
                } else if (percentage2 <= 0.88) {
                  translateY = -0.07 + (0.2 - -0.07) * ((percentage2 - 0.88) / 0.88);
                } else {
                  translateY = 0.2 + (0 - 0.2) * ((percentage2 - 0.22) / 0.88);
                }
                animateDot(dot, percentage2, blurRadius, textShadowOpacity, scale, translateY);
              } else if (dot.Status === "NotSung") {
                dot.HTMLElement.style.setProperty("--opacity-size", `${0.2}`);
                dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                dot.HTMLElement.style.scale = `0.75`;
                dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `4px`);
                dot.HTMLElement.style.setProperty("--text-shadow-opacity", `0%`);
              } else if (dot.Status === "Sung") {
                dot.HTMLElement.style.setProperty("--opacity-size", `${0.2 + 1}`);
                dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                dot.HTMLElement.style.scale = `1.2`;
                dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `12px`);
                dot.HTMLElement.style.setProperty("--text-shadow-opacity", `50%`);
              }
            }
          } else {
            line.HTMLElement.style.setProperty("--gradient-position", `${percentage * 100}%`);
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
  var Blurring_LastLine, setStyleIfChanged, applyBlur, calculateOpacity;
  var init_LyricsAnimator = __esm({
    "src/utils/Lyrics/Animator/Lyrics/LyricsAnimator.ts"() {
      init_Defaults();
      init_SpotifyPlayer();
      init_lyrics();
      init_Shared();
      Blurring_LastLine = null;
      setStyleIfChanged = (element, property, value) => {
        if (element.style.getPropertyValue(property) !== value) {
          element.style.setProperty(property, value);
        }
      };
      applyBlur = (arr, activeIndex, BlurMultiplier2) => {
        const isPlaying = SpotifyPlayer.IsPlaying;
        for (let i = 0; i < arr.length; i++) {
          const distance = Math.abs(i - activeIndex);
          const blurAmountRaw = BlurMultiplier2 * distance;
          const blurAmount = blurAmountRaw >= 5 ? 5 : blurAmountRaw;
          const blurValue = isPlaying && arr[i].Status !== "Active" ? `${blurAmount}px` : `0px`;
          setStyleIfChanged(arr[i].HTMLElement, "--BlurAmount", blurValue);
        }
      };
      calculateOpacity = (percentage, word) => {
        if (word?.BGWord)
          return 0;
        if (percentage <= 0.5) {
          return percentage * 100;
        } else {
          return (1 - percentage) * 100;
        }
      };
    }
  });

  // src/utils/Lyrics/Animator/Lyrics/LyricsSetter.ts
  function getStatus(start, end, current) {
    if (start <= current && current <= end) {
      return "Active";
    } else if (start >= current) {
      return "NotSung";
    } else {
      return "Sung";
    }
  }
  function updateCollectionStatus(collection, current, deep = false) {
    for (const item of collection) {
      item.Status = getStatus(item.StartTime, item.EndTime, current);
      if (deep && item?.LetterGroup && Array.isArray(item.Letters)) {
        for (const letter of item.Letters) {
          letter.Status = getStatus(letter.StartTime, letter.EndTime, current);
        }
      }
    }
  }
  function TimeSetter(PreCurrentPosition) {
    const CurrentPosition = PreCurrentPosition + timeOffset;
    const CurrentLyricsType = Defaults_default.CurrentLyricsType;
    if (CurrentLyricsType && CurrentLyricsType === "None")
      return;
    const lines = LyricsObject.Types[CurrentLyricsType].Lines;
    if (CurrentLyricsType === "Syllable") {
      for (const line of lines) {
        const start = line.StartTime;
        const end = line.EndTime;
        if (start <= CurrentPosition && CurrentPosition <= end) {
          line.Status = "Active";
          updateCollectionStatus(line.Syllables.Lead, CurrentPosition, true);
        } else if (start >= CurrentPosition) {
          line.Status = "NotSung";
          for (const word of line.Syllables.Lead) {
            word.Status = "NotSung";
            if (word?.LetterGroup && Array.isArray(word.Letters)) {
              for (const letter of word.Letters) {
                letter.Status = "NotSung";
              }
            }
          }
        } else if (end <= CurrentPosition) {
          line.Status = "Sung";
          for (const word of line.Syllables.Lead) {
            word.Status = "Sung";
            if (word?.LetterGroup && Array.isArray(word.Letters)) {
              for (const letter of word.Letters) {
                letter.Status = "Sung";
              }
            }
          }
        }
      }
    } else if (CurrentLyricsType === "Line") {
      for (const line of lines) {
        const start = line.StartTime;
        const end = line.EndTime;
        if (start <= CurrentPosition && CurrentPosition <= end) {
          line.Status = "Active";
          if (line.DotLine) {
            updateCollectionStatus(line.Syllables.Lead, CurrentPosition);
          }
        } else if (start >= CurrentPosition) {
          line.Status = "NotSung";
          if (line.DotLine) {
            for (const dot of line.Syllables.Lead) {
              dot.Status = "NotSung";
            }
          }
        } else if (end <= CurrentPosition) {
          line.Status = "Sung";
          if (line.DotLine) {
            for (const dot of line.Syllables.Lead) {
              dot.Status = "Sung";
            }
          }
        }
      }
    }
  }
  var init_LyricsSetter = __esm({
    "src/utils/Lyrics/Animator/Lyrics/LyricsSetter.ts"() {
      init_Defaults();
      init_lyrics();
      init_Shared();
    }
  });

  // src/utils/Lyrics/Animator/Main.ts
  var Lyrics;
  var init_Main = __esm({
    "src/utils/Lyrics/Animator/Main.ts"() {
      init_LyricsAnimator();
      init_LyricsSetter();
      Lyrics = {
        Animate,
        TimeSetter
      };
    }
  });

  // src/utils/Lyrics/lyrics.ts
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
    lineElementToStartTimeMap.clear();
    syllableElementToStartTimeMap.clear();
  }
  function populateElementTimeMaps() {
    lineElementToStartTimeMap.clear();
    syllableElementToStartTimeMap.clear();
    LyricsObject.Types.Line.Lines.forEach((line) => {
      if (line.HTMLElement && typeof line.StartTime === "number") {
        lineElementToStartTimeMap.set(line.HTMLElement, line.StartTime);
      }
    });
    LyricsObject.Types.Syllable.Lines.forEach((line) => {
      const lineStartTime = line.StartTime;
      if (typeof lineStartTime !== "number") {
        return;
      }
      line.Syllables.Lead.forEach((word) => {
        if (word.HTMLElement) {
          syllableElementToStartTimeMap.set(word.HTMLElement, lineStartTime);
        }
        if (word?.Letters) {
          word.Letters.forEach((letter) => {
            if (letter.HTMLElement) {
              syllableElementToStartTimeMap.set(letter.HTMLElement, lineStartTime);
            }
          });
        }
      });
    });
  }
  function LinesEvListener(e) {
    let target = e.target;
    let startTime;
    if (target.tagName.toLowerCase() === "rt") {
      if (target.parentElement) {
        target = target.parentElement;
      }
    }
    if (target.tagName.toLowerCase() === "ruby" || target.classList.contains("translation")) {
      if (target.parentElement) {
        target = target.parentElement;
      }
    }
    if (target.classList.contains("line")) {
      startTime = lineElementToStartTimeMap.get(target);
    } else if (target.classList.contains("word")) {
      startTime = syllableElementToStartTimeMap.get(target);
    } else if (target.classList.contains("Emphasis")) {
      startTime = syllableElementToStartTimeMap.get(target);
    }
    if (typeof startTime === "number") {
      Spicetify.Player.seek(startTime);
    }
  }
  function addLinesEvListener() {
    if (LinesEvListenerExists) {
      removeLinesEvListener();
    }
    populateElementTimeMaps();
    LinesEvListenerExists = true;
    LinesEvListenerMaid = new Maid();
    const el = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    if (!el) {
      LinesEvListenerExists = false;
      return;
    }
    el.addEventListener("click", LinesEvListener);
    LinesEvListenerMaid.Give(() => {
      el.removeEventListener("click", LinesEvListener);
    });
  }
  function removeLinesEvListener() {
    if (!LinesEvListenerExists)
      return;
    LinesEvListenerExists = false;
    if (LinesEvListenerMaid) {
      LinesEvListenerMaid.Destroy();
    }
  }
  var ScrollingIntervalTime, lyricsBetweenShow, LyricsObject, lineElementToStartTimeMap, syllableElementToStartTimeMap, CurrentLineLyricsObject, LINE_SYNCED_CurrentLineLyricsObject, THROTTLE_TIME, LinesEvListenerMaid, LinesEvListenerExists;
  var init_lyrics = __esm({
    "src/utils/Lyrics/lyrics.ts"() {
      init_Maid();
      init_IntervalManager();
      init_Defaults();
      init_SpotifyPlayer();
      init_Main();
      ScrollingIntervalTime = 0.1;
      lyricsBetweenShow = 3;
      LyricsObject = {
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
      lineElementToStartTimeMap = /* @__PURE__ */ new Map();
      syllableElementToStartTimeMap = /* @__PURE__ */ new Map();
      CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;
      LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;
      THROTTLE_TIME = 0.05;
      new IntervalManager(THROTTLE_TIME, () => {
        if (!Defaults_default.LyricsContainerExists)
          return;
        const progress = SpotifyPlayer.GetTrackPosition();
        Lyrics.TimeSetter(progress);
        Lyrics.Animate(progress);
      }).Start();
    }
  });

  // src/utils/Addons.ts
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
  var ArabicPersianRegex;
  var init_Addons = __esm({
    "src/utils/Addons.ts"() {
      ArabicPersianRegex = /[\u0600-\u06FF]/;
    }
  });

  // node_modules/lodash/isObject.js
  var require_isObject = __commonJS({
    "node_modules/lodash/isObject.js"(exports, module) {
      function isObject(value) {
        var type = typeof value;
        return value != null && (type == "object" || type == "function");
      }
      module.exports = isObject;
    }
  });

  // node_modules/lodash/_freeGlobal.js
  var require_freeGlobal = __commonJS({
    "node_modules/lodash/_freeGlobal.js"(exports, module) {
      var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
      module.exports = freeGlobal;
    }
  });

  // node_modules/lodash/_root.js
  var require_root = __commonJS({
    "node_modules/lodash/_root.js"(exports, module) {
      var freeGlobal = require_freeGlobal();
      var freeSelf = typeof self == "object" && self && self.Object === Object && self;
      var root = freeGlobal || freeSelf || Function("return this")();
      module.exports = root;
    }
  });

  // node_modules/lodash/now.js
  var require_now = __commonJS({
    "node_modules/lodash/now.js"(exports, module) {
      var root = require_root();
      var now = function() {
        return root.Date.now();
      };
      module.exports = now;
    }
  });

  // node_modules/lodash/_trimmedEndIndex.js
  var require_trimmedEndIndex = __commonJS({
    "node_modules/lodash/_trimmedEndIndex.js"(exports, module) {
      var reWhitespace = /\s/;
      function trimmedEndIndex(string) {
        var index = string.length;
        while (index-- && reWhitespace.test(string.charAt(index))) {
        }
        return index;
      }
      module.exports = trimmedEndIndex;
    }
  });

  // node_modules/lodash/_baseTrim.js
  var require_baseTrim = __commonJS({
    "node_modules/lodash/_baseTrim.js"(exports, module) {
      var trimmedEndIndex = require_trimmedEndIndex();
      var reTrimStart = /^\s+/;
      function baseTrim(string) {
        return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
      }
      module.exports = baseTrim;
    }
  });

  // node_modules/lodash/_Symbol.js
  var require_Symbol = __commonJS({
    "node_modules/lodash/_Symbol.js"(exports, module) {
      var root = require_root();
      var Symbol2 = root.Symbol;
      module.exports = Symbol2;
    }
  });

  // node_modules/lodash/_getRawTag.js
  var require_getRawTag = __commonJS({
    "node_modules/lodash/_getRawTag.js"(exports, module) {
      var Symbol2 = require_Symbol();
      var objectProto = Object.prototype;
      var hasOwnProperty = objectProto.hasOwnProperty;
      var nativeObjectToString = objectProto.toString;
      var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
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
      module.exports = getRawTag;
    }
  });

  // node_modules/lodash/_objectToString.js
  var require_objectToString = __commonJS({
    "node_modules/lodash/_objectToString.js"(exports, module) {
      var objectProto = Object.prototype;
      var nativeObjectToString = objectProto.toString;
      function objectToString(value) {
        return nativeObjectToString.call(value);
      }
      module.exports = objectToString;
    }
  });

  // node_modules/lodash/_baseGetTag.js
  var require_baseGetTag = __commonJS({
    "node_modules/lodash/_baseGetTag.js"(exports, module) {
      var Symbol2 = require_Symbol();
      var getRawTag = require_getRawTag();
      var objectToString = require_objectToString();
      var nullTag = "[object Null]";
      var undefinedTag = "[object Undefined]";
      var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
      function baseGetTag(value) {
        if (value == null) {
          return value === void 0 ? undefinedTag : nullTag;
        }
        return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
      }
      module.exports = baseGetTag;
    }
  });

  // node_modules/lodash/isObjectLike.js
  var require_isObjectLike = __commonJS({
    "node_modules/lodash/isObjectLike.js"(exports, module) {
      function isObjectLike(value) {
        return value != null && typeof value == "object";
      }
      module.exports = isObjectLike;
    }
  });

  // node_modules/lodash/isSymbol.js
  var require_isSymbol = __commonJS({
    "node_modules/lodash/isSymbol.js"(exports, module) {
      var baseGetTag = require_baseGetTag();
      var isObjectLike = require_isObjectLike();
      var symbolTag = "[object Symbol]";
      function isSymbol(value) {
        return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
      }
      module.exports = isSymbol;
    }
  });

  // node_modules/lodash/toNumber.js
  var require_toNumber = __commonJS({
    "node_modules/lodash/toNumber.js"(exports, module) {
      var baseTrim = require_baseTrim();
      var isObject = require_isObject();
      var isSymbol = require_isSymbol();
      var NAN = 0 / 0;
      var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
      var reIsBinary = /^0b[01]+$/i;
      var reIsOctal = /^0o[0-7]+$/i;
      var freeParseInt = parseInt;
      function toNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol(value)) {
          return NAN;
        }
        if (isObject(value)) {
          var other = typeof value.valueOf == "function" ? value.valueOf() : value;
          value = isObject(other) ? other + "" : other;
        }
        if (typeof value != "string") {
          return value === 0 ? value : +value;
        }
        value = baseTrim(value);
        var isBinary = reIsBinary.test(value);
        return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
      }
      module.exports = toNumber;
    }
  });

  // node_modules/lodash/debounce.js
  var require_debounce = __commonJS({
    "node_modules/lodash/debounce.js"(exports, module) {
      var isObject = require_isObject();
      var now = require_now();
      var toNumber = require_toNumber();
      var FUNC_ERROR_TEXT = "Expected a function";
      var nativeMax = Math.max;
      var nativeMin = Math.min;
      function debounce3(func, wait, options) {
        var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
        if (typeof func != "function") {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
        wait = toNumber(wait) || 0;
        if (isObject(options)) {
          leading = !!options.leading;
          maxing = "maxWait" in options;
          maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
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
          var time = now();
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
          return timerId === void 0 ? result : trailingEdge(now());
        }
        function debounced() {
          var time = now(), isInvoking = shouldInvoke(time);
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
      module.exports = debounce3;
    }
  });

  // node_modules/lodash/throttle.js
  var require_throttle = __commonJS({
    "node_modules/lodash/throttle.js"(exports, module) {
      var debounce3 = require_debounce();
      var isObject = require_isObject();
      var FUNC_ERROR_TEXT = "Expected a function";
      function throttle2(func, wait, options) {
        var leading = true, trailing = true;
        if (typeof func != "function") {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
        if (isObject(options)) {
          leading = "leading" in options ? !!options.leading : leading;
          trailing = "trailing" in options ? !!options.trailing : trailing;
        }
        return debounce3(func, wait, {
          "leading": leading,
          "maxWait": wait,
          "trailing": trailing
        });
      }
      module.exports = throttle2;
    }
  });

  // node_modules/simplebar-core/dist/index.mjs
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
  var import_debounce, import_throttle, __assign, getOptions$1, canUseDOM, helpers, cachedScrollbarWidth, cachedDevicePixelRatio, getElementWindow, getElementDocument, getOptions, addClasses, removeClasses, classNamesToQuery, SimpleBarCore;
  var init_dist = __esm({
    "node_modules/simplebar-core/dist/index.mjs"() {
      import_debounce = __toESM(require_debounce(), 1);
      import_throttle = __toESM(require_throttle(), 1);
      __assign = function() {
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
      getOptions$1 = function(obj) {
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
      canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);
      helpers = /* @__PURE__ */ Object.freeze({
        __proto__: null,
        addClasses: addClasses$1,
        canUseDOM,
        classNamesToQuery: classNamesToQuery$1,
        getElementDocument: getElementDocument$1,
        getElementWindow: getElementWindow$1,
        getOptions: getOptions$1,
        removeClasses: removeClasses$1
      });
      cachedScrollbarWidth = null;
      cachedDevicePixelRatio = null;
      if (canUseDOM) {
        window.addEventListener("resize", function() {
          if (cachedDevicePixelRatio !== window.devicePixelRatio) {
            cachedDevicePixelRatio = window.devicePixelRatio;
            cachedScrollbarWidth = null;
          }
        });
      }
      getElementWindow = getElementWindow$1;
      getElementDocument = getElementDocument$1;
      getOptions = getOptions$1;
      addClasses = addClasses$1;
      removeClasses = removeClasses$1;
      classNamesToQuery = classNamesToQuery$1;
      SimpleBarCore = function() {
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
          this.onMouseMove = (0, import_throttle.default)(this._onMouseMove, 64);
          this.onWindowResize = (0, import_debounce.default)(this._onWindowResize, 64, { leading: true });
          this.onStopScrolling = (0, import_debounce.default)(this._onStopScrolling, this.stopScrollDelay);
          this.onMouseEntered = (0, import_debounce.default)(this._onMouseEntered, this.stopScrollDelay);
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
    }
  });

  // node_modules/simplebar/dist/index.mjs
  function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var extendStatics, _a, getOptions2, addClasses2, canUseDOM2, SimpleBar;
  var init_dist2 = __esm({
    "node_modules/simplebar/dist/index.mjs"() {
      init_dist();
      extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (Object.prototype.hasOwnProperty.call(b2, p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      _a = SimpleBarCore.helpers;
      getOptions2 = _a.getOptions;
      addClasses2 = _a.addClasses;
      canUseDOM2 = _a.canUseDOM;
      SimpleBar = function(_super) {
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
    }
  });

  // src/utils/Gets/GetElementHeight.ts
  function GetElementHeight(element) {
    const beforeStyles = getComputedStyle(element, "::before");
    const afterStyles = getComputedStyle(element, "::after");
    return element.offsetHeight + parseFloat(beforeStyles.height) + parseFloat(afterStyles.height);
  }
  var init_GetElementHeight = __esm({
    "src/utils/Gets/GetElementHeight.ts"() {
    }
  });

  // src/utils/Scrolling/Page/IsHovering.ts
  function LyricsPageMouseEnter() {
    IsMouseInLyricsPage = true;
  }
  function LyricsPageMouseLeave() {
    IsMouseInLyricsPage = false;
  }
  function SetIsMouseInLyricsPage(value) {
    IsMouseInLyricsPage = value;
  }
  var IsMouseInLyricsPage;
  var init_IsHovering = __esm({
    "src/utils/Scrolling/Page/IsHovering.ts"() {
      IsMouseInLyricsPage = false;
    }
  });

  // src/utils/Scrolling/Simplebar/ScrollSimplebar.ts
  function MountScrollSimplebar() {
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    LyricsContainer.style.height = `${GetElementHeight(LyricsContainer)}px`;
    ScrollSimplebar = new SimpleBar(LyricsContainer, { autoHide: false });
    const container = document.querySelector(ElementEventQuery);
    container?.addEventListener("mouseenter", () => {
      LyricsPageMouseEnter();
      updateScrollbarVisibility();
    });
    container?.addEventListener("mouseleave", () => {
      LyricsPageMouseLeave();
      updateScrollbarVisibility();
    });
    LyricsContainer.addEventListener("simplebar-dragstart", () => {
      isDragging = true;
      updateScrollbarVisibility();
    });
    LyricsContainer.addEventListener("simplebar-dragend", () => {
      isDragging = false;
      updateScrollbarVisibility();
    });
  }
  function ClearScrollSimplebar() {
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    const container = document.querySelector(ElementEventQuery);
    ScrollSimplebar?.unMount();
    ScrollSimplebar = null;
    SetIsMouseInLyricsPage(false);
    container?.removeEventListener("mouseenter", LyricsPageMouseEnter);
    container?.removeEventListener("mouseleave", LyricsPageMouseLeave);
    LyricsContainer?.removeEventListener("simplebar-dragstart", () => {
    });
    LyricsContainer?.removeEventListener("simplebar-dragend", () => {
    });
  }
  function RecalculateScrollSimplebar() {
    ScrollSimplebar?.recalculate();
  }
  function updateScrollbarVisibility() {
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    if (!LyricsContainer)
      return;
    if (IsMouseInLyricsPage || isDragging) {
      LyricsContainer.classList.remove("hide-scrollbar");
    } else {
      LyricsContainer.classList.add("hide-scrollbar");
    }
  }
  var ScrollSimplebar, isDragging, ElementEventQuery;
  var init_ScrollSimplebar = __esm({
    "src/utils/Scrolling/Simplebar/ScrollSimplebar.ts"() {
      init_dist2();
      init_GetElementHeight();
      init_IsHovering();
      isDragging = false;
      ElementEventQuery = "#SpicyLyricsPage .ContentBox .LyricsContainer";
    }
  });

  // src/utils/storage.ts
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
    return Spicetify.LocalStorage.get(`${prefix}${key}`);
  }
  var prefix, currentlyFetching, storage_default;
  var init_storage = __esm({
    "src/utils/storage.ts"() {
      prefix = "SpicyLyrics-";
      currentlyFetching = false;
      storage_default = {
        set,
        get
      };
    }
  });

  // src/utils/Whentil.ts
  function Until(statement, callback, maxRepeats = Infinity) {
    const delay = 10;
    let isCancelled = false;
    let executedCount = 0;
    const resolveStatement = () => typeof statement === "function" ? statement() : statement;
    const runner = () => {
      if (isCancelled || executedCount >= maxRepeats)
        return;
      const conditionMet = resolveStatement();
      if (!conditionMet) {
        callback();
        executedCount++;
        setTimeout(runner, delay);
      }
    };
    setTimeout(runner, delay);
    return {
      Cancel() {
        isCancelled = true;
      },
      Reset() {
        if (executedCount >= maxRepeats || isCancelled) {
          isCancelled = false;
          executedCount = 0;
          runner();
        }
      }
    };
  }
  function When(statement, callback, repeater = 1) {
    const delay = 10;
    let isCancelled = false;
    let executionsRemaining = repeater;
    const resolveStatement = () => typeof statement === "function" ? statement() : statement;
    const runner = () => {
      if (isCancelled || executionsRemaining <= 0)
        return;
      try {
        const resolved = resolveStatement();
        if (resolved) {
          callback(resolved);
          executionsRemaining--;
          if (executionsRemaining > 0)
            setTimeout(runner, delay);
        } else {
          setTimeout(runner, delay);
        }
      } catch {
        setTimeout(runner, delay);
      }
    };
    setTimeout(runner, delay);
    return {
      Cancel() {
        isCancelled = true;
      },
      Reset() {
        if (executionsRemaining <= 0 || isCancelled) {
          isCancelled = false;
          executionsRemaining = repeater;
          runner();
        }
      }
    };
  }
  var Whentil, Whentil_default;
  var init_Whentil = __esm({
    "src/utils/Whentil.ts"() {
      Whentil = {
        When,
        Until
      };
      Whentil_default = Whentil;
    }
  });

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

  // src/utils/Animator.ts
  var Animator;
  var init_Animator = __esm({
    "src/utils/Animator.ts"() {
      init_Maid();
      Animator = class {
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
          const now = performance.now();
          const elapsed = now - this.startTime;
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
    }
  });

  // node_modules/fastdom/fastdom.js
  var require_fastdom = __commonJS({
    "node_modules/fastdom/fastdom.js"(exports, module) {
      !function(win) {
        "use strict";
        var debug = 0 ? console.log.bind(console, "[fastdom]") : function() {
        };
        var raf = win.requestAnimationFrame || win.webkitRequestAnimationFrame || win.mozRequestAnimationFrame || win.msRequestAnimationFrame || function(cb) {
          return setTimeout(cb, 16);
        };
        function FastDom() {
          var self2 = this;
          self2.reads = [];
          self2.writes = [];
          self2.raf = raf.bind(win);
          debug("initialized", self2);
        }
        FastDom.prototype = {
          constructor: FastDom,
          runTasks: function(tasks) {
            debug("run tasks");
            var task;
            while (task = tasks.shift())
              task();
          },
          measure: function(fn, ctx) {
            debug("measure");
            var task = !ctx ? fn : fn.bind(ctx);
            this.reads.push(task);
            scheduleFlush(this);
            return task;
          },
          mutate: function(fn, ctx) {
            debug("mutate");
            var task = !ctx ? fn : fn.bind(ctx);
            this.writes.push(task);
            scheduleFlush(this);
            return task;
          },
          clear: function(task) {
            debug("clear", task);
            return remove(this.reads, task) || remove(this.writes, task);
          },
          extend: function(props) {
            debug("extend", props);
            if (typeof props != "object")
              throw new Error("expected object");
            var child = Object.create(this);
            mixin(child, props);
            child.fastdom = this;
            if (child.initialize)
              child.initialize();
            return child;
          },
          catch: null
        };
        function scheduleFlush(fastdom8) {
          if (!fastdom8.scheduled) {
            fastdom8.scheduled = true;
            fastdom8.raf(flush.bind(null, fastdom8));
            debug("flush scheduled");
          }
        }
        function flush(fastdom8) {
          debug("flush");
          var writes = fastdom8.writes;
          var reads = fastdom8.reads;
          var error;
          try {
            debug("flushing reads", reads.length);
            fastdom8.runTasks(reads);
            debug("flushing writes", writes.length);
            fastdom8.runTasks(writes);
          } catch (e) {
            error = e;
          }
          fastdom8.scheduled = false;
          if (reads.length || writes.length)
            scheduleFlush(fastdom8);
          if (error) {
            debug("task errored", error.message);
            if (fastdom8.catch)
              fastdom8.catch(error);
            else
              throw error;
          }
        }
        function remove(array, item) {
          var index = array.indexOf(item);
          return !!~index && !!array.splice(index, 1);
        }
        function mixin(target, source) {
          for (var key in source) {
            if (source.hasOwnProperty(key))
              target[key] = source[key];
          }
        }
        var exports2 = win.fastdom = win.fastdom || new FastDom();
        if (typeof define == "function")
          define(function() {
            return exports2;
          });
        else if (typeof module == "object")
          module.exports = exports2;
      }(typeof window !== "undefined" ? window : typeof exports != "undefined" ? exports : globalThis);
    }
  });

  // src/utils/ScrollIntoView/index.ts
  function cubicEaseInOut(progress) {
    return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }
  function smoothScrollIntoView(options) {
    const {
      container,
      element,
      duration = 150,
      offset = 0,
      align = "top",
      axis = "vertical"
    } = options;
    let cancelAnimation = () => {
    };
    const controller = {
      cancel: () => cancelAnimation()
    };
    new Promise((resolve) => {
      import_fastdom.default.measure(() => {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        let targetScroll;
        let startScroll;
        if (axis === "vertical") {
          startScroll = container.scrollTop;
          if (align === "center") {
            targetScroll = elementRect.top - containerRect.top + container.scrollTop - (container.clientHeight / 2 - element.clientHeight / 2) - offset;
          } else {
            targetScroll = elementRect.top - containerRect.top + container.scrollTop - offset;
          }
        } else {
          startScroll = container.scrollLeft;
          if (align === "center") {
            targetScroll = elementRect.left - containerRect.left + container.scrollLeft - (container.clientWidth / 2 - element.clientWidth / 2) - offset;
          } else {
            targetScroll = elementRect.left - containerRect.left + container.scrollLeft - offset;
          }
        }
        const distance = targetScroll - startScroll;
        resolve({ startScroll, distance });
      });
    }).then(({ startScroll, distance }) => {
      import_fastdom.default.mutate(() => {
        const startTime = performance.now();
        let animationFrameId;
        function animate(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = cubicEaseInOut(progress);
          const newScroll = startScroll + distance * easedProgress;
          import_fastdom.default.mutate(() => {
            if (axis === "vertical") {
              container.scrollTop = newScroll;
            } else {
              container.scrollLeft = newScroll;
            }
          });
          if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
          }
        }
        animationFrameId = requestAnimationFrame(animate);
        cancelAnimation = () => {
          cancelAnimationFrame(animationFrameId);
        };
      });
    });
    return controller;
  }
  function scrollIntoCenterView(container, element, duration = 150, offset = 0, axis = "vertical") {
    return smoothScrollIntoView({
      container,
      element,
      duration,
      offset,
      align: "center",
      axis
    });
  }
  var import_fastdom;
  var init_ScrollIntoView = __esm({
    "src/utils/ScrollIntoView/index.ts"() {
      import_fastdom = __toESM(require_fastdom());
    }
  });

  // src/utils/Scrolling/ScrollToActiveLine.ts
  var ScrollToActiveLine_exports = {};
  __export(ScrollToActiveLine_exports, {
    ResetLastLine: () => ResetLastLine,
    ScrollToActiveLine: () => ScrollToActiveLine
  });
  function ScrollToActiveLine(ScrollSimplebar2) {
    if (!SpotifyPlayer.IsPlaying)
      return;
    if (!Defaults_default.LyricsContainerExists)
      return;
    if (Spicetify.Platform.History.location.pathname === "/AmaiLyrics") {
      const Lines = LyricsObject.Types[Defaults_default.CurrentLyricsType]?.Lines;
      const Position = SpotifyPlayer.GetTrackPosition();
      const PositionOffset = 370;
      const ProcessedPosition = Position + PositionOffset;
      if (!Lines)
        return;
      let currentLine = null;
      for (let i = 0; i < Lines.length; i++) {
        const line = Lines[i];
        if (line.StartTime <= ProcessedPosition && line.EndTime >= ProcessedPosition) {
          currentLine = line;
          break;
        }
      }
      if (currentLine) {
        new Promise((resolve) => {
          import_fastdom2.default.measure(() => {
            const LineElem = currentLine.HTMLElement;
            const container = ScrollSimplebar2?.getScrollElement();
            resolve({ LineElem, container });
          });
        }).then(({ LineElem, container }) => {
          import_fastdom2.default.mutate(() => {
            if (!container || !LineElem)
              return;
            if (lastLine && lastLine === LineElem)
              return;
            lastLine = LineElem;
            scrollIntoCenterView(container, LineElem, 270, -50);
            LineElem.classList.add("Active", "OverridenByScroller");
          });
        });
      }
    }
  }
  function ResetLastLine() {
    lastLine = null;
  }
  var import_fastdom2, lastLine;
  var init_ScrollToActiveLine = __esm({
    "src/utils/Scrolling/ScrollToActiveLine.ts"() {
      init_Defaults();
      init_SpotifyPlayer();
      init_lyrics();
      init_ScrollIntoView();
      import_fastdom2 = __toESM(require_fastdom());
      lastLine = null;
    }
  });

  // C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb4f8/DotLoader.css
  var init_ = __esm({
    "C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb4f8/DotLoader.css"() {
    }
  });

  // src/components/DynamicBG/dynamicBackground.ts
  var dynamicBackground_exports = {};
  __export(dynamicBackground_exports, {
    default: () => ApplyDynamicBackground
  });
  async function setupDynamicBackground(element, imageUrl) {
    let bgContainer = element.querySelector(".sweet-dynamic-bg");
    if (!bgContainer) {
      bgContainer = document.createElement("div");
      bgContainer.className = "sweet-dynamic-bg";
      bgContainer.setAttribute("current-img", imageUrl);
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder";
      bgContainer.appendChild(placeholder);
      const imgA = document.createElement("img");
      imgA.id = "bg-img-a";
      imgA.className = "bg-image primary active";
      imgA.decoding = "async";
      imgA.loading = "eager";
      imgA.src = imageUrl;
      imgA.addEventListener(
        "load",
        () => {
          if (placeholder.parentNode)
            placeholder.parentNode.removeChild(placeholder);
        },
        { once: true, passive: true }
      );
      bgContainer.appendChild(imgA);
      const imgB = document.createElement("img");
      imgB.id = "bg-img-b";
      imgB.className = "bg-image secondary";
      imgB.decoding = "async";
      imgB.loading = "lazy";
      bgContainer.appendChild(imgB);
      element.appendChild(bgContainer);
      const rotationPrimary = Math.floor(Math.random() * 360);
      const rotationSecondary = (Math.floor(Math.random() * 360) + 15) % 360;
      document.documentElement.style.setProperty("--bg-rotation-primary", `${rotationPrimary}deg`);
      document.documentElement.style.setProperty(
        "--bg-rotation-secondary",
        `${rotationSecondary}deg`
      );
      const scalePrimary = 1 + Math.random() * 0.2;
      const scaleSecondary = 1.1 + Math.random() * 0.2;
      document.documentElement.style.setProperty("--bg-scale-primary", `${scalePrimary}`);
      document.documentElement.style.setProperty("--bg-scale-secondary", `${scaleSecondary}`);
      const hueShift = Math.floor(Math.random() * 30);
      document.documentElement.style.setProperty("--bg-hue-shift", `${hueShift}deg`);
    }
    return bgContainer;
  }
  function debounce2(fn, delay) {
    let timer;
    return (...args) => {
      if (timer)
        clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }
  async function ApplyDynamicBackground(element) {
    if (!element)
      return;
    let currentImgCover = await SpotifyPlayer.Artwork.Get("d");
    if (currentImgCover.startsWith("spotify:image:")) {
      const imageId = currentImgCover.replace("spotify:image:", "");
      currentImgCover = `https://i.scdn.co/image/${imageId}`;
    }
    const bgContainer = await setupDynamicBackground(element, currentImgCover);
    const displayedImg = bgContainer.getAttribute("current-img");
    if (displayedImg !== currentImgCover) {
      updateDynamicBackground(bgContainer, currentImgCover);
    }
  }
  var updateDynamicBackground;
  var init_dynamicBackground = __esm({
    "src/components/DynamicBG/dynamicBackground.ts"() {
      init_SpotifyPlayer();
      updateDynamicBackground = debounce2(
        (bgContainer, newImageUrl) => {
          const imgA = bgContainer.querySelector("#bg-img-a");
          const imgB = bgContainer.querySelector("#bg-img-b");
          if (!imgA || !imgB) {
            console.error("Dynamic background image elements not found!");
            return;
          }
          const activeImg = imgA.classList.contains("active") ? imgA : imgB;
          const inactiveImg = activeImg === imgA ? imgB : imgA;
          if (inactiveImg.src === newImageUrl)
            return;
          inactiveImg.src = newImageUrl;
          inactiveImg.onload = () => {
            activeImg.classList.remove("active");
            inactiveImg.classList.add("active");
            const rotationPrimary = Math.floor(Math.random() * 360);
            const rotationSecondary = (Math.floor(Math.random() * 360) + 15) % 360;
            document.documentElement.style.setProperty("--bg-rotation-primary", `${rotationPrimary}deg`);
            document.documentElement.style.setProperty(
              "--bg-rotation-secondary",
              `${rotationSecondary}deg`
            );
            const scalePrimary = 1 + Math.random() * 0.2;
            const scaleSecondary = 1.1 + Math.random() * 0.2;
            document.documentElement.style.setProperty("--bg-scale-primary", `${scalePrimary}`);
            document.documentElement.style.setProperty("--bg-scale-secondary", `${scaleSecondary}`);
            const hueShift = Math.floor(Math.random() * 30);
            document.documentElement.style.setProperty("--bg-hue-shift", `${hueShift}deg`);
          };
          inactiveImg.onerror = () => {
            console.error("Error loading new background image:", newImageUrl);
          };
          bgContainer.setAttribute("current-img", newImageUrl);
        },
        100
      );
    }
  });

  // src/utils/CSS/Styles.ts
  function applyStyles(element, styles) {
    if (!element) {
      console.warn("Element not found for applying styles");
      return false;
    }
    try {
      for (const key in styles) {
        if (Object.prototype.hasOwnProperty.call(styles, key)) {
          element.style.setProperty(key, String(styles[key]));
        }
      }
      return true;
    } catch (error) {
      console.error("Error applying styles:", error);
      return false;
    }
  }
  function removeAllStyles(element) {
    if (!element) {
      console.warn("Element not found for removing styles");
      return false;
    }
    try {
      element.removeAttribute("style");
      return true;
    } catch (error) {
      console.error("Error removing styles:", error);
      return false;
    }
  }
  var init_Styles = __esm({
    "src/utils/CSS/Styles.ts"() {
    }
  });

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
  var init_ApplyLyricsCredits = __esm({
    "src/utils/Lyrics/Applyer/Credits/ApplyLyricsCredits.ts"() {
    }
  });

  // src/utils/Lyrics/Applyer/Info/ApplyInfo.ts
  function ApplyInfo(data) {
    const DEFAULT_WPM = 200;
    const DEFAULT_DURATION = 8e3;
    const TopBarContainer = document.querySelector(
      "header.main-topBar-container"
    );
    if (!data?.Info || !TopBarContainer)
      return;
    TopBarContainer.querySelectorAll(".amai-info").forEach((el) => el.remove());
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
    let duration = data.InfoDuration;
    if (!duration) {
      const words = data.Info.split(/\s+/).length;
      const readingTimeSeconds = words / DEFAULT_WPM * 60;
      duration = readingTimeSeconds * 1e3 || DEFAULT_DURATION;
    }
    setTimeout(() => {
      if (TopBarContainer.contains(infoElement)) {
        TopBarContainer.removeChild(infoElement);
      }
    }, duration);
  }
  var init_ApplyInfo = __esm({
    "src/utils/Lyrics/Applyer/Info/ApplyInfo.ts"() {
    }
  });

  // src/utils/Lyrics/isRtl.ts
  function isRtl(text) {
    if (!text || text.length === 0)
      return false;
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFB4F\uFB50-\uFDFF\uFE70-\uFEFF]/;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[\d\s,.;:?!()[\]{}"'\\/<>@#$%^&*_=+-]/.test(char)) {
        continue;
      }
      return rtlRegex.test(char);
    }
    return false;
  }
  var isRtl_default;
  var init_isRtl = __esm({
    "src/utils/Lyrics/isRtl.ts"() {
      isRtl_default = isRtl;
    }
  });

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
    const fragment = document.createDocumentFragment();
    data.Lines.forEach((line, index) => {
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
          /((?:\([0-9\uAC00-\uD7AF\u1100-\u11FF]+\)|[\uAC00-\uD7AF\u1100-\u11FF]+)(?:[a-zA-Z]*)[?.!,"']?){([^\}]+)}/g,
          '<ruby class="romaja">$1<rt>$2</rt></ruby>'
        );
      }
      const mainTextContainer = document.createElement("span");
      mainTextContainer.classList.add("main-lyrics-text");
      if (line.Text?.includes("[DEF=font_size:small]")) {
        lineElem.style.fontSize = "35px";
        mainTextContainer.innerHTML = line.Text.replace(
          "[DEF=font_size:small]",
          ""
        );
      } else {
        mainTextContainer.innerHTML = line.Text;
      }
      lineElem.appendChild(mainTextContainer);
      if (line.Translation && line.Translation.trim() !== "" && line.Translation.trim() !== data.Raw[index].trim()) {
        const translationElem = document.createElement("div");
        translationElem.classList.add("translation");
        translationElem.textContent = line.Translation;
        lineElem.appendChild(translationElem);
      }
      if (isRtl_default(line.Text) && !lineElem.classList.contains("rtl")) {
        lineElem.classList.add("rtl");
      }
      lineElem.classList.add("line", "static");
      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn");
      }
      LyricsObject.Types.Static.Lines.push({
        HTMLElement: lineElem
      });
      fragment.appendChild(lineElem);
    });
    LyricsContainer.appendChild(fragment);
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
  var init_Static = __esm({
    "src/utils/Lyrics/Applyer/Static.ts"() {
      init_Addons();
      init_Defaults();
      init_Styles();
      init_ScrollSimplebar();
      init_lyrics();
      init_ApplyLyricsCredits();
      init_ApplyInfo();
      init_isRtl();
      init_storage();
    }
  });

  // src/utils/Lyrics/ConvertTime.ts
  function ConvertTime(time) {
    return time * 1e3;
  }
  var init_ConvertTime = __esm({
    "src/utils/Lyrics/ConvertTime.ts"() {
    }
  });

  // src/utils/Lyrics/Applyer/Synced/Line.ts
  function ApplyLineLyrics(data) {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    if (!LyricsContainer) {
      console.error("Lyrics container not found");
      return;
    }
    LyricsContainer.setAttribute("data-lyrics-type", "Line");
    ClearLyricsContentArrays();
    ClearScrollSimplebar();
    TOP_ApplyLyricsSpacer(LyricsContainer);
    const fragment = document.createDocumentFragment();
    const convertStartTime = ConvertTime(data.StartTime);
    function createDotGroup(startTime, endTime) {
      const dotGroup = document.createElement("div");
      dotGroup.classList.add("dotGroup");
      const totalTime = endTime - startTime;
      const dotTime = totalTime / 3;
      const dots = [];
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement("span");
        dot.classList.add("word", "dot");
        dot.textContent = "\u2022";
        LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: dot,
          StartTime: startTime + dotTime * i,
          EndTime: i === 2 ? endTime - 400 : startTime + dotTime * (i + 1),
          TotalTime: dotTime,
          Dot: true
        });
        dots.push(dot);
      }
      dots.forEach((d) => dotGroup.appendChild(d));
      return dotGroup;
    }
    if (data.StartTime >= lyricsBetweenShow) {
      const musicalLine = document.createElement("div");
      musicalLine.classList.add("line", "musical-line");
      LyricsObject.Types.Line.Lines.push({
        HTMLElement: musicalLine,
        StartTime: 0,
        EndTime: convertStartTime,
        TotalTime: convertStartTime,
        DotLine: true
      });
      SetWordArrayInCurentLine_LINE_SYNCED();
      if (data.Content[0]?.OppositeAligned) {
        musicalLine.classList.add("OppositeAligned");
      }
      const dotGroup = createDotGroup(0, convertStartTime);
      musicalLine.appendChild(dotGroup);
      fragment.appendChild(musicalLine);
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
          /((?:\([0-9\uAC00-\uD7AF\u1100-\u11FF]+\)|[\uAC00-\uD7AF\u1100-\u11FF]+)(?:[a-zA-Z]*)[?.!,"']?){([^\}]+)}/g,
          '<ruby class="romaja">$1<rt>$2</rt></ruby>'
        );
      }
      const mainTextContainer = document.createElement("span");
      mainTextContainer.classList.add("main-lyrics-text");
      mainTextContainer.classList.add("line");
      mainTextContainer.innerHTML = line.Text;
      lineElem.appendChild(mainTextContainer);
      const hasDistinctTranslation = line.Translation && line.Translation.trim() !== "" && (!data.Raw || line.Translation.trim() !== data.Raw[index]?.trim());
      if (hasDistinctTranslation) {
        const translationElem = document.createElement("div");
        translationElem.classList.add("translation");
        translationElem.textContent = line.Translation;
        mainTextContainer.appendChild(translationElem);
      }
      if (isRtl_default(line.Text) && !lineElem.classList.contains("rtl")) {
        lineElem.classList.add("rtl");
      }
      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn");
      }
      const startTime = ConvertTime(line.StartTime);
      const endTime = ConvertTime(line.EndTime);
      LyricsObject.Types.Line.Lines.push({
        HTMLElement: mainTextContainer,
        StartTime: startTime,
        EndTime: endTime,
        TotalTime: endTime - startTime
      });
      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned");
      }
      fragment.appendChild(lineElem);
      const nextLine = arr[index + 1];
      const hasMusicalBreak = nextLine && nextLine.StartTime - line.EndTime >= lyricsBetweenShow;
      if (hasMusicalBreak) {
        const musicalLine = document.createElement("div");
        musicalLine.classList.add("line", "musical-line");
        const nextStartTime = ConvertTime(nextLine.StartTime);
        const curEndTime = endTime;
        LyricsObject.Types.Line.Lines.push({
          HTMLElement: musicalLine,
          StartTime: curEndTime,
          EndTime: nextStartTime,
          TotalTime: nextStartTime - curEndTime,
          DotLine: true
        });
        SetWordArrayInCurentLine_LINE_SYNCED();
        if (nextLine.OppositeAligned) {
          musicalLine.classList.add("OppositeAligned");
        }
        const dotGroup = createDotGroup(curEndTime, nextStartTime);
        musicalLine.appendChild(dotGroup);
        fragment.appendChild(musicalLine);
      }
    });
    LyricsContainer.appendChild(fragment);
    ApplyInfo(data);
    ApplyLyricsCredits(data);
    BOTTOM_ApplyLyricsSpacer(LyricsContainer);
    if (ScrollSimplebar) {
      RecalculateScrollSimplebar();
    } else {
      MountScrollSimplebar();
    }
    const LyricsStylingContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content"
    );
    if (LyricsStylingContainer) {
      removeAllStyles(LyricsStylingContainer);
      if (data.classes) {
        LyricsStylingContainer.className = data.classes;
      }
      if (data.styles) {
        applyStyles(LyricsStylingContainer, data.styles);
      }
    }
  }
  var init_Line = __esm({
    "src/utils/Lyrics/Applyer/Synced/Line.ts"() {
      init_Addons();
      init_Defaults();
      init_Styles();
      init_ScrollSimplebar();
      init_ConvertTime();
      init_lyrics();
      init_ApplyLyricsCredits();
      init_ApplyInfo();
      init_isRtl();
      init_storage();
    }
  });

  // src/utils/Lyrics/Applyer/Utils/IsLetterCapable.ts
  function IsLetterCapable(letterLength, totalDuration) {
    if (letterLength > 12) {
      return false;
    }
    const minDuration = 1500 + (letterLength - 1) / 1 * 25;
    return totalDuration >= minDuration;
  }
  var init_IsLetterCapable = __esm({
    "src/utils/Lyrics/Applyer/Utils/IsLetterCapable.ts"() {
    }
  });

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
  var init_Emphasize = __esm({
    "src/utils/Lyrics/Applyer/Utils/Emphasize.ts"() {
      init_Addons();
      init_Shared();
      init_ConvertTime();
      init_lyrics();
    }
  });

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
  var init_Syllable = __esm({
    "src/utils/Lyrics/Applyer/Synced/Syllable.ts"() {
      init_SpotifyPlayer();
      init_Addons();
      init_Defaults();
      init_Styles();
      init_ScrollSimplebar();
      init_ConvertTime();
      init_lyrics();
      init_ApplyLyricsCredits();
      init_ApplyInfo();
      init_IsLetterCapable();
      init_Emphasize();
      init_Shared();
      init_isRtl();
    }
  });

  // src/constants/PageViewSelectors.ts
  var PageViewSelectors;
  var init_PageViewSelectors = __esm({
    "src/constants/PageViewSelectors.ts"() {
      PageViewSelectors = {
        PageRoot: ".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]",
        SpicyLyricsPage: "#SpicyLyricsPage",
        ContentBox: "#SpicyLyricsPage .ContentBox",
        MediaImage: "#SpicyLyricsPage .MediaImage",
        SongName: "#SpicyLyricsPage .SongName span",
        Artists: "#SpicyLyricsPage .Artists span",
        ViewControls: "#SpicyLyricsPage .ContentBox .ViewControls",
        Header: "#SpicyLyricsPage .ContentBox .NowBar .Header",
        HeaderViewControls: "#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls",
        RefreshLyricsButton: "#RefreshLyrics",
        WatchMusicVideoButton: "#WatchMusicVideoButton",
        CloseButton: "#Close",
        FullscreenToggleButton: "#FullscreenToggle",
        LoaderContainer: "#SpicyLyricsPage .loaderContainer",
        LyricsContent: "#SpicyLyricsPage .LyricsContent",
        NowBar: "#SpicyLyricsPage .NowBar",
        NotificationContainer: "#SpicyLyricsPage .NotificationContainer"
      };
    }
  });

  // src/utils/Lyrics/cache.ts
  async function cacheLyrics(trackId, lyricsJson) {
    if (!lyricsCache)
      return;
    const expiresAt = new Date().getTime() + CACHE_EXPIRATION_TIME;
    try {
      await lyricsCache.set(trackId, {
        ...lyricsJson,
        expiresAt
      });
    } catch (error) {
      console.error("Error saving lyrics to cache:", error);
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
        return await noLyricsMessage();
      }
      storage_default.set("currentLyricsData", JSON.stringify(lyricsFromCache));
      HideLoaderContainer();
      ClearLyricsPageContainer();
      Defaults_default.CurrentLyricsType = lyricsFromCache.Type;
      return { ...lyricsFromCache, fromCache: true };
    } catch (error) {
      ClearLyricsPageContainer();
      console.log("Error parsing saved lyrics data:", error);
      return await noLyricsMessage();
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
          return await noLyricsMessage();
        }
      } else {
        const lyricsData = JSON.parse(savedLyricsData);
        if (lyricsData?.id === trackId) {
          HideLoaderContainer();
          ClearLyricsPageContainer();
          Defaults_default.CurrentLyricsType = lyricsData.Type;
          return lyricsData;
        }
      }
    } catch (error) {
      console.error("Error parsing saved lyrics data:", error);
      HideLoaderContainer();
      ClearLyricsPageContainer();
    }
    return null;
  }
  async function removeLyricsFromCache(trackId) {
    if (!lyricsCache)
      return;
    try {
      await lyricsCache.remove(trackId);
    } catch (error) {
      console.error("Error removing lyrics from cache:", error);
    }
  }
  var CACHE_EXPIRATION_TIME, lyricsCache;
  var init_cache = __esm({
    "src/utils/Lyrics/cache.ts"() {
      init_SpikyCache();
      init_storage();
      init_Defaults();
      init_ui();
      CACHE_EXPIRATION_TIME = 1e3 * 60 * 60 * 24 * 7;
      lyricsCache = new SpikyCache({
        name: "Cache_Lyrics"
      });
    }
  });

  // src/components/Pages/pageButtons.ts
  function setupActionButtons(maid2) {
    setupRefreshButton(maid2);
    setupWatchMusicVideoButton(maid2);
  }
  function setupRefreshButton(maid2) {
    const refreshButton = document.querySelector(
      PageViewSelectors.RefreshLyricsButton
    );
    if (!refreshButton)
      return;
    const clickHandler = async () => {
      const currentUri = Spicetify.Player.data?.item?.uri;
      if (!currentUri) {
        Spicetify.showNotification("No track playing", false, 1e3);
        return;
      }
      await new Promise((resolve) => {
        import_fastdom3.default.mutate(() => {
          refreshButton.classList.add("hidden");
          resolve();
        });
      });
      try {
        const trackId = currentUri.split(":")[2];
        removeLyricsFromCache(trackId);
        storage_default.set("currentLyricsData", null);
        const lyrics = await fetchLyrics(currentUri);
        ApplyLyrics(lyrics);
      } catch (error) {
        console.error("Error refreshing lyrics:", error);
        Spicetify.showNotification("Error refreshing lyrics", false, 2e3);
      }
    };
    refreshButton.addEventListener("click", clickHandler);
    maid2?.Give(() => refreshButton.removeEventListener("click", clickHandler));
  }
  function setupWatchMusicVideoButton(maid2) {
    const watchMusicVideoButton = document.querySelector(
      PageViewSelectors.WatchMusicVideoButton
    );
    if (!watchMusicVideoButton)
      return;
    const clickHandler = async () => {
      const songName = await SpotifyPlayer.GetSongName();
      const artists = await SpotifyPlayer.GetArtists();
      if (!songName || !artists || artists.length === 0) {
        Spicetify.showNotification("No track playing or artist information available", false, 1e3);
        return;
      }
      const artistNames = SpotifyPlayer.JoinArtists(artists);
      const searchQuery = encodeURIComponent(`${artistNames} ${songName} music video`);
      const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
      window.open(youtubeUrl, "_blank");
    };
    watchMusicVideoButton.addEventListener("click", clickHandler);
    maid2?.Give(() => watchMusicVideoButton.removeEventListener("click", clickHandler));
  }
  function showRefreshButton() {
    const refreshButton = document.querySelector(
      PageViewSelectors.RefreshLyricsButton
    );
    if (refreshButton) {
      new Promise((resolve) => {
        import_fastdom3.default.mutate(() => {
          refreshButton.classList.remove("hidden");
          resolve();
        });
      });
    }
  }
  function hideRefreshButton() {
    const refreshButton = document.querySelector(
      PageViewSelectors.RefreshLyricsButton
    );
    if (refreshButton) {
      new Promise((resolve) => {
        import_fastdom3.default.mutate(() => {
          refreshButton.classList.add("hidden");
          resolve();
        });
      });
    }
  }
  var import_fastdom3;
  var init_pageButtons = __esm({
    "src/components/Pages/pageButtons.ts"() {
      init_PageViewSelectors();
      import_fastdom3 = __toESM(require_fastdom());
      init_storage();
      init_cache();
      init_fetchLyrics();
      init_Applyer();
      init_SpotifyPlayer();
    }
  });

  // src/utils/Lyrics/Global/Applyer.ts
  var Applyer_exports = {};
  __export(Applyer_exports, {
    default: () => ApplyLyrics
  });
  function ApplyLyrics(lyrics) {
    if (!document.querySelector("#SpicyLyricsPage"))
      return;
    setBlurringLastLine(null);
    if (!lyrics || !lyrics?.id)
      return;
    const currentTrackId = Spicetify.Player.data.item?.uri?.split(":")[2];
    if (currentTrackId !== lyrics?.id) {
      fetchLyrics(Spicetify.Player.data.item?.uri).then(ApplyLyrics);
      return;
    }
    const lyricsHandlers = {
      Syllable: ApplySyllableLyrics,
      Line: ApplyLineLyrics,
      Static: ApplyStaticLyrics
    };
    const applyHandler = lyricsHandlers[lyrics.Type];
    if (applyHandler) {
      applyHandler(lyrics);
      showRefreshButton();
      addLinesEvListener();
    }
  }
  var init_Applyer = __esm({
    "src/utils/Lyrics/Global/Applyer.ts"() {
      init_LyricsAnimator();
      init_Static();
      init_Line();
      init_Syllable();
      init_fetchLyrics();
      init_pageButtons();
      init_lyrics();
    }
  });

  // src/components/Pages/PageHTML.ts
  var PageHTML, NowBarHTML;
  var init_PageHTML = __esm({
    "src/components/Pages/PageHTML.ts"() {
      init_Defaults();
      PageHTML = `
<div class="NotificationContainer"></div>
<div class="ContentBox">
    <div class="NowBar"></div>
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
      NowBarHTML = `
<div class="CenteredView">
    <div class="Header">
        <div class="MediaBox">
            <div class="MediaContent" draggable="true"></div>
            <div class="MediaImagePlaceholder"></div>
            <img class="MediaImage"
                 src=""
                 data-high-res=""
                 fetchpriority="high"
                 loading="eager"
                 decoding="sync"
                 draggable="true"  alt=""/>
        </div>
        <div class="Metadata">
            <div class="SongName">
                <span></span>
            </div>
            <div class="Artists">
                <span></span>
            </div>
        </div>
    </div>
    <div class="AmaiPageButtonContainer">
        <button id="RefreshLyrics" class="AmaiPageButton">
            Reload Current Lyrics
        </button>
        <button id="WatchMusicVideoButton" class="AmaiPageButton">
            Watch Music Video
        </button>
        <span onclick="window.open('https://github.com/hudzax/amai-lyrics/releases')" class="amai-version-number">Amai Lyrics v${Defaults_default.Version}</span>
    </div>
</div>
`;
    }
  });

  // src/components/Pages/pageContent.ts
  function setupImageLoading(imageElement, maid2) {
    if (imageElement._setupImageLoading)
      return;
    imageElement._setupImageLoading = true;
    const onloadHandler = () => {
      import_fastdom4.default.mutate(() => {
        imageElement.classList.add("loaded");
      });
      const highResUrl = imageElement.getAttribute("data-high-res");
      if (highResUrl) {
        const highResImage = new Image();
        highResImage.onload = () => {
          import_fastdom4.default.mutate(() => {
            if (imageElement.src !== highResUrl) {
              imageElement.src = highResUrl;
            }
          });
        };
        highResImage.src = highResUrl;
      }
    };
    imageElement.onload = onloadHandler;
    maid2?.Give(() => {
      imageElement.onload = null;
    });
  }
  async function UpdatePageContent(isOpened) {
    if (!isOpened)
      return;
    const mediaImage = document.querySelector(PageViewSelectors.MediaImage);
    if (mediaImage) {
      const mutationPromise = new Promise((resolve) => {
        import_fastdom4.default.mutate(() => {
          if (mediaImage.classList.contains("loaded")) {
            mediaImage.classList.remove("loaded");
          }
          resolve();
        });
      });
      await Promise.all([mutationPromise, updateSongInfo(), updateArtwork(mediaImage)]);
    }
  }
  async function updateSongInfo() {
    const songNamePromise = SpotifyPlayer.GetSongName();
    const artistsPromise = SpotifyPlayer.GetArtists();
    const [songName, artists] = await Promise.all([songNamePromise, artistsPromise]);
    const songNameElem = document.querySelector(PageViewSelectors.SongName);
    const artistsElem = document.querySelector(PageViewSelectors.Artists);
    const joinedArtists = SpotifyPlayer.JoinArtists(artists);
    return new Promise((resolve) => {
      import_fastdom4.default.mutate(() => {
        if (songNameElem && songNameElem.textContent !== songName) {
          songNameElem.textContent = songName;
        }
        if (artistsElem && artistsElem.textContent !== joinedArtists) {
          artistsElem.textContent = joinedArtists;
        }
        resolve();
      });
    });
  }
  async function updateArtwork(mediaImage) {
    try {
      const [standardUrl, highResUrl] = await Promise.all([
        SpotifyPlayer.Artwork.Get("l"),
        SpotifyPlayer.Artwork.Get("xl")
      ]);
      return new Promise((resolve) => {
        import_fastdom4.default.mutate(() => {
          if (standardUrl && mediaImage.src !== standardUrl) {
            mediaImage.src = standardUrl;
          }
          if (highResUrl && mediaImage.getAttribute("data-high-res") !== highResUrl) {
            mediaImage.setAttribute("data-high-res", highResUrl);
          }
          resolve();
        });
      });
    } catch (error) {
      console.error("Failed to load artwork:", error);
    }
  }
  var import_fastdom4;
  var init_pageContent = __esm({
    "src/components/Pages/pageContent.ts"() {
      init_SpotifyPlayer();
      import_fastdom4 = __toESM(require_fastdom());
      init_PageViewSelectors();
    }
  });

  // src/components/Styling/Icons.ts
  var TrackSkip, Icons;
  var init_Icons = __esm({
    "src/components/Styling/Icons.ts"() {
      TrackSkip = `
	<div class="PlaybackControl TrackSkip REPLACEME">
		<svg viewBox="0 0 35 20" xmlns="http://www.w3.org/2000/svg">
			<path d="M 19.467 19.905 C 20.008 19.905 20.463 19.746 21.005 19.426 L 33.61 12.023 C 34.533 11.482 35 10.817 35 9.993 C 35 9.158 34.545 8.53 33.61 7.977 L 21.005 0.574 C 20.463 0.254 19.998 0.094 19.456 0.094 C 18.374 0.094 17.475 0.917 17.475 2.418 L 17.475 9.49 C 17.315 8.898 16.873 8.408 16.135 7.977 L 3.529 0.574 C 3 0.254 2.533 0.094 1.993 0.094 C 0.911 0.094 0 0.917 0 2.418 L 0 17.582 C 0 19.083 0.91 19.906 1.993 19.906 C 2.533 19.906 3 19.746 3.529 19.426 L 16.135 12.023 C 16.861 11.593 17.315 11.088 17.475 10.485 L 17.475 17.582 C 17.475 19.083 18.386 19.906 19.467 19.906 L 19.467 19.905 Z" fill-rule="nonzero"/>
		</svg>
	</div>
`;
      Icons = {
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
    }
  });

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
  var init_TransferElement = __esm({
    "src/components/Utils/TransferElement.ts"() {
    }
  });

  // src/components/Global/Session.ts
  var sessionHistory, Session, Session_default;
  var init_Session = __esm({
    "src/components/Global/Session.ts"() {
      init_Global();
      sessionHistory = [];
      Session = {
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
          sessionHistory = sessionHistory.filter(
            (location) => location.pathname !== data.pathname && location.search !== data?.search && location.hash !== data?.hash
          );
        },
        PushToHistory: (data) => {
          sessionHistory.push(data);
        }
      };
      window._spicy_lyrics_session = Session;
      Session_default = Session;
    }
  });

  // src/components/Pages/pageControls.ts
  async function AppendViewControls(maid2, ReAppend = false) {
    const elem = document.querySelector(PageViewSelectors.ViewControls);
    if (!elem)
      return;
    await new Promise((resolve) => {
      import_fastdom5.default.mutate(() => {
        if (ReAppend)
          elem.innerHTML = "";
        elem.innerHTML = `
            <button id="Close" class="ViewControl">${Icons.Close}</button>
            <button id="FullscreenToggle" class="ViewControl">${Fullscreen_default.IsOpen ? Icons.CloseFullscreen : Icons.Fullscreen}</button>
        `;
        resolve();
      });
    });
    if (Fullscreen_default.IsOpen) {
      const headerElem = document.querySelector(PageViewSelectors.Header);
      if (headerElem) {
        await new Promise((resolve) => {
          import_fastdom5.default.mutate(() => {
            TransferElement(elem, headerElem, 0);
            resolve();
          });
        });
      }
      Object.values(Tooltips).forEach((a) => a?.destroy());
      const viewControlsElem = document.querySelector(
        PageViewSelectors.HeaderViewControls
      );
      SetupTippy(viewControlsElem, maid2);
    } else {
      const headerViewControlsElem = document.querySelector(
        PageViewSelectors.HeaderViewControls
      );
      if (headerViewControlsElem) {
        const contentBoxElem = document.querySelector(PageViewSelectors.ContentBox);
        if (contentBoxElem) {
          await new Promise((resolve) => {
            import_fastdom5.default.mutate(() => {
              TransferElement(elem, contentBoxElem);
              resolve();
            });
          });
        }
      }
      Object.values(Tooltips).forEach((a) => a?.destroy());
      SetupTippy(elem, maid2);
    }
  }
  function SetupTippy(elem, maid2) {
    if (!elem)
      return;
    const closeButton = elem.querySelector(PageViewSelectors.CloseButton);
    if (closeButton) {
      Tooltips.Close = Spicetify.Tippy(closeButton, {
        ...Spicetify.TippyProps,
        content: `Exit Lyrics Page`
      });
      const closeClickHandler = () => Session_default.GoBack();
      closeButton.addEventListener("click", closeClickHandler);
      maid2?.Give(() => closeButton.removeEventListener("click", closeClickHandler));
    }
    const fullscreenBtn = elem.querySelector(
      PageViewSelectors.FullscreenToggleButton
    );
    if (fullscreenBtn) {
      Tooltips.FullscreenToggle = Spicetify.Tippy(fullscreenBtn, {
        ...Spicetify.TippyProps,
        content: `Toggle Fullscreen View`
      });
      const fullscreenClickHandler = () => Fullscreen_default.Toggle();
      fullscreenBtn.addEventListener("click", fullscreenClickHandler);
      maid2?.Give(() => fullscreenBtn.removeEventListener("click", fullscreenClickHandler));
    }
  }
  var import_fastdom5, Tooltips;
  var init_pageControls = __esm({
    "src/components/Pages/pageControls.ts"() {
      init_PageViewSelectors();
      init_Icons();
      init_Fullscreen();
      init_TransferElement();
      init_Session();
      import_fastdom5 = __toESM(require_fastdom());
      Tooltips = {
        Close: null,
        Kofi: null,
        FullscreenToggle: null,
        LyricsToggle: null
      };
    }
  });

  // src/components/Pages/PageView.ts
  var PageView_exports = {};
  __export(PageView_exports, {
    PageRoot: () => PageRoot,
    default: () => PageView_default
  });
  async function initializePageRoot() {
    return new Promise((resolve) => {
      import_fastdom6.default.measure(() => {
        PageRoot = document.querySelector(PageViewSelectors.PageRoot);
        resolve();
      });
    });
  }
  async function OpenPage() {
    if (PageView.IsOpened)
      return;
    maid = new Maid();
    await initializePageRoot();
    await createPageElement();
    Defaults_default.LyricsContainerExists = true;
    const contentBox = document.querySelector(PageViewSelectors.ContentBox);
    if (contentBox) {
      await ApplyDynamicBackground(contentBox);
    }
    const mediaImage = document.querySelector(PageViewSelectors.MediaImage);
    if (mediaImage) {
      setupImageLoading(mediaImage, maid);
    }
    await PageView.UpdatePageContent();
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (currentUri) {
      fetchLyrics(currentUri).then(ApplyLyrics);
    }
    Session_OpenNowBar();
    Session_NowBar_SetSide();
    await PageView.AppendViewControls();
    setupActionButtons(maid);
    PageView.IsOpened = true;
  }
  async function createPageElement() {
    return new Promise((resolve) => {
      import_fastdom6.default.mutate(() => {
        const elem = document.createElement("div");
        elem.id = "SpicyLyricsPage";
        elem.innerHTML = PageHTML;
        if (PageRoot) {
          PageRoot.appendChild(elem);
        }
        const nowBar = document.querySelector(PageViewSelectors.NowBar);
        if (nowBar) {
          nowBar.innerHTML = NowBarHTML;
        }
        resolve();
      });
    });
  }
  async function DestroyPage() {
    if (!PageView.IsOpened)
      return;
    if (Fullscreen_default.IsOpen)
      Fullscreen_default.Close();
    const spicyLyricsPage = document.querySelector(PageViewSelectors.SpicyLyricsPage);
    if (!spicyLyricsPage)
      return;
    import_fastdom6.default.mutate(() => {
      spicyLyricsPage?.remove();
    });
    Defaults_default.LyricsContainerExists = false;
    removeLinesEvListener();
    Object.values(Tooltips).forEach((a) => a?.destroy());
    ResetLastLine();
    ScrollSimplebar?.unMount();
    maid?.CleanUp();
    maid = null;
    PageView.IsOpened = false;
  }
  var import_fastdom6, maid, PageView, PageRoot, PageView_default;
  var init_PageView = __esm({
    "src/components/Pages/PageView.ts"() {
      init_fetchLyrics();
      init_();
      init_lyrics();
      init_dynamicBackground();
      init_Defaults();
      init_ScrollSimplebar();
      init_Applyer();
      init_NowBar2();
      init_Fullscreen();
      init_ScrollToActiveLine();
      import_fastdom6 = __toESM(require_fastdom());
      init_Maid();
      init_PageViewSelectors();
      init_PageHTML();
      init_pageContent();
      init_pageControls();
      init_pageButtons();
      maid = null;
      PageView = {
        Open: OpenPage,
        Destroy: DestroyPage,
        AppendViewControls: () => AppendViewControls(maid),
        UpdatePageContent: () => UpdatePageContent(PageView.IsOpened),
        IsOpened: false
      };
      PageRoot = null;
      PageView_default = PageView;
    }
  });

  // src/components/Utils/Fullscreen.ts
  function Open() {
    const SpicyPage = document.querySelector(".Root__main-view #SpicyLyricsPage");
    const Root = document.body;
    if (SpicyPage) {
      let setupFullscreenUI = function() {
        PageView_default.AppendViewControls();
        OpenNowBar();
        ResetLastLine();
        const MediaBox = document.querySelector(
          "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox"
        );
        const MediaImage = document.querySelector(
          "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage"
        );
        if (MediaBox && MediaImage) {
          MediaBox_Data.Functions.Eventify(MediaImage);
          MediaBox.removeEventListener("mouseenter", MediaBox_Data.Functions.MouseIn);
          MediaBox.removeEventListener("mouseleave", MediaBox_Data.Functions.MouseOut);
          MediaBox.addEventListener("mouseenter", MediaBox_Data.Functions.MouseIn);
          MediaBox.addEventListener("mouseleave", MediaBox_Data.Functions.MouseOut);
        }
        Global_default.Event.evoke("fullscreen:open", null);
      };
      TransferElement(SpicyPage, Root);
      SpicyPage.classList.add("Fullscreen");
      Fullscreen.IsOpen = true;
      if (!document.fullscreenElement) {
        Root.querySelector("#SpicyLyricsPage").requestFullscreen().then(() => {
          setupFullscreenUI();
        }).catch((err2) => {
          setupFullscreenUI();
          alert(`Error attempting to enable fullscreen mode: ${err2.message} (${err2.name})`);
        });
      } else {
        setupFullscreenUI();
      }
    }
  }
  function Close() {
    const SpicyPage = document.querySelector("#SpicyLyricsPage");
    if (SpicyPage) {
      let restoreUI = function() {
        TransferElement(SpicyPage, PageRoot);
        SpicyPage.classList.remove("Fullscreen");
        Fullscreen.IsOpen = false;
        PageView_default.AppendViewControls();
        const currentLyrics = storage_default.get("currentLyricsData");
        const NoLyrics = typeof currentLyrics === "string" && currentLyrics.includes("NO_LYRICS");
        if (NoLyrics) {
          OpenNowBar();
          const lyricsContainer = document.querySelector(
            "#SpicyLyricsPage .ContentBox .LyricsContainer"
          );
          if (lyricsContainer) {
            lyricsContainer.classList.add("Hidden");
          }
          DeregisterNowBarBtn();
        }
        ResetLastLine();
        const MediaBox = document.querySelector(
          "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox"
        );
        const MediaImage = document.querySelector(
          "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage"
        );
        if (MediaBox) {
          MediaBox.removeEventListener("mouseenter", MediaBox_Data.Functions.MouseIn);
          MediaBox.removeEventListener("mouseleave", MediaBox_Data.Functions.MouseOut);
        }
        if (MediaImage) {
          MediaBox_Data.Functions.Reset(MediaImage);
        }
        Global_default.Event.evoke("fullscreen:exit", null);
      };
      if (document.fullscreenElement) {
        document.exitFullscreen().then(() => {
          restoreUI();
        }).catch((err2) => {
          console.error("Error exiting fullscreen:", err2);
          restoreUI();
        });
      } else {
        restoreUI();
      }
    }
  }
  function Toggle() {
    const SpicyPage = document.querySelector("#SpicyLyricsPage");
    if (SpicyPage) {
      if (SpicyPage.classList.contains("fullscreen-transition")) {
        return;
      }
      SpicyPage.classList.add("fullscreen-transition");
      if (Fullscreen.IsOpen) {
        Close();
      } else {
        Open();
      }
      setTimeout(() => {
        SpicyPage.classList.remove("fullscreen-transition");
      }, 1e3);
    }
  }
  var Fullscreen, MediaBox_Data, Fullscreen_default;
  var init_Fullscreen = __esm({
    "src/components/Utils/Fullscreen.ts"() {
      init_Animator();
      init_ScrollToActiveLine();
      init_storage();
      init_Global();
      init_PageView();
      init_NowBar2();
      init_TransferElement();
      Fullscreen = {
        Open,
        Close,
        Toggle,
        IsOpen: false,
        handleEscapeKey: function(event) {
          if (event.key === "Escape" && this.IsOpen) {
            this.Close();
          }
        }
      };
      document.addEventListener("fullscreenchange", () => {
        const wasFullscreen = Fullscreen.IsOpen;
        const isNowFullscreen = !!document.fullscreenElement;
        Fullscreen.IsOpen = isNowFullscreen;
        if (wasFullscreen && !isNowFullscreen) {
          Fullscreen.Close();
        }
      });
      document.addEventListener("keydown", Fullscreen.handleEscapeKey.bind(Fullscreen));
      MediaBox_Data = {
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
      Fullscreen_default = Fullscreen;
    }
  });

  // src/components/NowBar/DragAndDrop.ts
  function setupDragAndDrop() {
    const DragBox = Fullscreen_default.IsOpen ? document.querySelector("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent") : document.querySelector("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage");
    if (!DragBox)
      return;
    const dropZones = document.querySelectorAll(
      "#SpicyLyricsPage .ContentBox .DropZone"
    );
    if (!DragBox._dragEventsAdded) {
      DragBox.addEventListener("dragstart", () => {
        setTimeout(() => {
          document.querySelector("#SpicyLyricsPage").classList.add("SomethingDragging");
          const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
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
      DragBox._dragEventsAdded = true;
    }
    dropZones.forEach((zone) => {
      if (!zone._dropEventsAdded) {
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
          const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
          const currentClass = NowBar.classList.contains("LeftSide") ? "LeftSide" : "RightSide";
          const newClass = zone.classList.contains("RightSide") ? "RightSide" : "LeftSide";
          if (currentClass !== newClass) {
            NowBar.classList.remove(currentClass);
            NowBar.classList.add(newClass);
            const side = zone.classList.contains("RightSide") ? "right" : "left";
            storage_default.set("NowBarSide", side);
          }
        });
        zone._dropEventsAdded = true;
      }
    });
  }
  var init_DragAndDrop = __esm({
    "src/components/NowBar/DragAndDrop.ts"() {
      init_storage();
      init_Fullscreen();
    }
  });

  // src/components/NowBar/state.ts
  function setActivePlaybackControlsInstance(instance) {
    ActivePlaybackControlsInstance = instance;
  }
  function setActiveSetupSongProgressBarInstance(instance) {
    ActiveSetupSongProgressBarInstance = instance;
  }
  var ActivePlaybackControlsInstance, progressBarState, ActiveSetupSongProgressBarInstance;
  var init_state = __esm({
    "src/components/NowBar/state.ts"() {
      ActivePlaybackControlsInstance = null;
      progressBarState = {
        lastKnownPosition: 0,
        lastUpdateTime: 0
      };
      ActiveSetupSongProgressBarInstance = null;
    }
  });

  // src/components/NowBar/EventListeners.ts
  function setupEventListeners() {
    Global_default.Event.listen("playback:playpause", (e) => {
      handlePlayPauseEvent(e);
    });
    Global_default.Event.listen("playback:loop", (e) => {
      handleLoopEvent(e);
    });
    Global_default.Event.listen("playback:shuffle", (e) => {
      handleShuffleEvent(e);
    });
    Global_default.Event.listen("playback:position", handlePositionUpdate);
    Global_default.Event.listen("playback:progress", handlePositionUpdate);
    Global_default.Event.listen("fullscreen:exit", () => {
      CleanUpActiveComponents();
    });
  }
  function handlePlayPauseEvent(e) {
    if (!Fullscreen_default.IsOpen)
      return;
    updatePlayPauseUI(e);
    updateProgressBarState();
  }
  function updatePlayPauseUI(e) {
    if (!ActivePlaybackControlsInstance)
      return;
    const playbackControls = ActivePlaybackControlsInstance.GetElement();
    const playPauseButton = playbackControls?.querySelector(".PlayStateToggle");
    if (!playPauseButton)
      return;
    const isPaused = e?.data?.isPaused;
    const svg = playPauseButton.querySelector("svg");
    if (isPaused) {
      playPauseButton.classList.remove("Playing");
      playPauseButton.classList.add("Paused");
      if (svg)
        svg.innerHTML = Icons.Play;
    } else {
      playPauseButton.classList.remove("Paused");
      playPauseButton.classList.add("Playing");
      if (svg)
        svg.innerHTML = Icons.Pause;
    }
  }
  function updateProgressBarState() {
    if (!ActiveSetupSongProgressBarInstance)
      return;
    const actualPosition = SpotifyPlayer.GetTrackPosition() || 0;
    progressBarState.lastKnownPosition = actualPosition;
    progressBarState.lastUpdateTime = performance.now();
    const updateTimelineState = progressBarState.updateTimelineState_Function;
    if (updateTimelineState) {
      updateTimelineState(actualPosition);
    }
  }
  function handleLoopEvent(e) {
    if (!Fullscreen_default.IsOpen || !ActivePlaybackControlsInstance)
      return;
    const playbackControls = ActivePlaybackControlsInstance.GetElement();
    const loopButton = playbackControls.querySelector(".LoopToggle");
    if (!loopButton)
      return;
    const svg = loopButton.querySelector("svg");
    if (!svg)
      return;
    svg.style.filter = "";
    svg.innerHTML = e === "track" ? Icons.LoopTrack : Icons.Loop;
    if (e !== "none") {
      loopButton.classList.add("Enabled");
      svg.style.filter = "drop-shadow(0 0 5px white)";
    } else {
      loopButton.classList.remove("Enabled");
    }
  }
  function handleShuffleEvent(e) {
    if (!Fullscreen_default.IsOpen || !ActivePlaybackControlsInstance)
      return;
    const playbackControls = ActivePlaybackControlsInstance.GetElement();
    const shuffleButton = playbackControls.querySelector(".ShuffleToggle");
    if (!shuffleButton)
      return;
    const svg = shuffleButton.querySelector("svg");
    if (!svg)
      return;
    svg.style.filter = "";
    if (e !== "none") {
      shuffleButton.classList.add("Enabled");
      svg.style.filter = "drop-shadow(0 0 5px white)";
    } else {
      shuffleButton.classList.remove("Enabled");
    }
  }
  function handlePositionUpdate(e) {
    if (!Fullscreen_default.IsOpen || !ActiveSetupSongProgressBarInstance)
      return;
    let position = null;
    if (typeof e === "number") {
      position = e;
    } else if (e && e.data && typeof e.data === "number") {
      position = e.data;
    }
    if (position !== null) {
      if (progressBarState.lastKnownPosition !== position) {
        progressBarState.lastKnownPosition = position;
        progressBarState.lastUpdateTime = performance.now();
        const lastInterpolationUpdate = progressBarState.lastInterpolationUpdate || 0;
        if (performance.now() - lastInterpolationUpdate > 500) {
          const updateTimelineState = progressBarState.updateTimelineState_Function;
          if (updateTimelineState) {
            updateTimelineState(position);
          }
        }
      }
    }
  }
  function CleanUpActiveComponents() {
    if (ActivePlaybackControlsInstance) {
      ActivePlaybackControlsInstance.CleanUp();
      setActivePlaybackControlsInstance(null);
    }
    if (ActiveSetupSongProgressBarInstance) {
      ActiveSetupSongProgressBarInstance.CleanUp();
      setActiveSetupSongProgressBarInstance(null);
    }
    Object.keys(progressBarState).forEach((key) => {
      if (key !== "lastKnownPosition" && key !== "lastUpdateTime") {
        delete progressBarState[key];
      }
    });
    progressBarState.lastKnownPosition = 0;
    progressBarState.lastUpdateTime = 0;
    removeLeftoverElements();
  }
  function removeLeftoverElements() {
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
  var init_EventListeners = __esm({
    "src/components/NowBar/EventListeners.ts"() {
      init_Global();
      init_SpotifyPlayer();
      init_Icons();
      init_Fullscreen();
      init_state();
    }
  });

  // src/components/NowBar/PlaybackControls.ts
  function createControlsElement() {
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
    return ControlsElement;
  }
  function setupInitialControlState(element) {
    if (SpotifyPlayer.LoopType !== "none") {
      const loopToggle = element.querySelector(".LoopToggle");
      const loopSvg = element.querySelector(".LoopToggle svg");
      if (loopToggle)
        loopToggle.classList.add("Enabled");
      if (loopSvg)
        loopSvg.style.filter = "drop-shadow(0 0 5px white)";
    }
    if (SpotifyPlayer.ShuffleType !== "none") {
      const shuffleToggle = element.querySelector(".ShuffleToggle");
      const shuffleSvg = element.querySelector(".ShuffleToggle svg");
      if (shuffleToggle)
        shuffleToggle.classList.add("Enabled");
      if (shuffleSvg)
        shuffleSvg.style.filter = "drop-shadow(0 0 5px white)";
    }
  }
  function setupEventHandlers(element) {
    const eventHandlers = {
      pressHandlers: /* @__PURE__ */ new Map(),
      releaseHandlers: /* @__PURE__ */ new Map(),
      clickHandlers: /* @__PURE__ */ new Map()
    };
    setupPressReleaseHandlers(element, eventHandlers);
    setupClickHandlers(element, eventHandlers);
    return eventHandlers;
  }
  function setupPressReleaseHandlers(element, eventHandlers) {
    const playbackControls = element.querySelectorAll(".PlaybackControl");
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
  }
  function setupClickHandlers(element, eventHandlers) {
    const PlayPauseControl = element.querySelector(".PlayStateToggle");
    const PrevTrackControl = element.querySelector(".PrevTrack");
    const NextTrackControl = element.querySelector(".NextTrack");
    const ShuffleControl = element.querySelector(".ShuffleToggle");
    const LoopControl = element.querySelector(".LoopToggle");
    if (!PlayPauseControl || !PrevTrackControl || !NextTrackControl || !ShuffleControl || !LoopControl) {
      console.error("Missing required control elements");
      return;
    }
    const playPauseHandler = createPlayPauseHandler(PlayPauseControl);
    const prevTrackHandler = () => SpotifyPlayer.Skip.Prev();
    const nextTrackHandler = () => SpotifyPlayer.Skip.Next();
    const shuffleHandler = createShuffleHandler(ShuffleControl);
    const loopHandler = createLoopHandler(LoopControl);
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
  }
  function createPlayPauseHandler(control) {
    return () => {
      const playSvg = control.querySelector("svg");
      if (SpotifyPlayer.IsPlaying) {
        SpotifyPlayer.IsPlaying = false;
        SpotifyPlayer.Pause();
        control.classList.remove("Playing");
        control.classList.add("Paused");
        if (playSvg) {
          playSvg.innerHTML = Icons.Play;
        }
      } else {
        SpotifyPlayer.IsPlaying = true;
        SpotifyPlayer.Play();
        control.classList.remove("Paused");
        control.classList.add("Playing");
        if (playSvg) {
          playSvg.innerHTML = Icons.Pause;
        }
      }
    };
  }
  function createShuffleHandler(control) {
    return () => {
      const shuffleSvg = control.querySelector("svg");
      if (SpotifyPlayer.ShuffleType === "none") {
        SpotifyPlayer.ShuffleType = "normal";
        control.classList.add("Enabled");
        if (shuffleSvg instanceof HTMLElement) {
          shuffleSvg.style.filter = "drop-shadow(0 0 5px white)";
        }
        Spicetify.Player.setShuffle(true);
      } else if (SpotifyPlayer.ShuffleType === "normal") {
        SpotifyPlayer.ShuffleType = "none";
        control.classList.remove("Enabled");
        if (shuffleSvg instanceof HTMLElement) {
          shuffleSvg.style.filter = "";
        }
        Spicetify.Player.setShuffle(false);
      }
    };
  }
  function createLoopHandler(control) {
    return () => {
      const loopSvg = control.querySelector("svg");
      if (!loopSvg)
        return;
      if (SpotifyPlayer.LoopType === "none") {
        SpotifyPlayer.LoopType = "context";
        Spicetify.Player.setRepeat(1);
        control.classList.add("Enabled");
        if (loopSvg instanceof HTMLElement) {
          loopSvg.innerHTML = Icons.Loop;
          loopSvg.style.filter = "drop-shadow(0 0 5px white)";
        }
      } else if (SpotifyPlayer.LoopType === "context") {
        SpotifyPlayer.LoopType = "track";
        Spicetify.Player.setRepeat(2);
        if (loopSvg instanceof HTMLElement) {
          loopSvg.innerHTML = Icons.LoopTrack;
          loopSvg.style.filter = "drop-shadow(0 0 5px white)";
        }
      } else if (SpotifyPlayer.LoopType === "track") {
        SpotifyPlayer.LoopType = "none";
        Spicetify.Player.setRepeat(0);
        control.classList.remove("Enabled");
        if (loopSvg instanceof HTMLElement) {
          loopSvg.innerHTML = Icons.Loop;
          loopSvg.style.filter = "";
        }
      }
    };
  }
  function cleanupEventHandlers(element, eventHandlers) {
    const playbackControls = element.querySelectorAll(".PlaybackControl");
    const PlayPauseControl = element.querySelector(".PlayStateToggle");
    const PrevTrackControl = element.querySelector(".PrevTrack");
    const NextTrackControl = element.querySelector(".NextTrack");
    const ShuffleControl = element.querySelector(".ShuffleToggle");
    const LoopControl = element.querySelector(".LoopToggle");
    playbackControls.forEach((control) => {
      const pressHandler = eventHandlers.pressHandlers.get(control);
      const releaseHandler = eventHandlers.releaseHandlers.get(control);
      if (pressHandler) {
        control.removeEventListener("mousedown", pressHandler);
        control.removeEventListener("touchstart", pressHandler);
      }
      if (releaseHandler) {
        control.removeEventListener("mouseup", releaseHandler);
        control.removeEventListener("mouseleave", releaseHandler);
        control.removeEventListener("touchend", releaseHandler);
      }
    });
    if (PlayPauseControl) {
      const handler = eventHandlers.clickHandlers.get(PlayPauseControl);
      if (handler)
        PlayPauseControl.removeEventListener("click", handler);
    }
    if (PrevTrackControl) {
      const handler = eventHandlers.clickHandlers.get(PrevTrackControl);
      if (handler)
        PrevTrackControl.removeEventListener("click", handler);
    }
    if (NextTrackControl) {
      const handler = eventHandlers.clickHandlers.get(NextTrackControl);
      if (handler)
        NextTrackControl.removeEventListener("click", handler);
    }
    if (ShuffleControl) {
      const handler = eventHandlers.clickHandlers.get(ShuffleControl);
      if (handler)
        ShuffleControl.removeEventListener("click", handler);
    }
    if (LoopControl) {
      const handler = eventHandlers.clickHandlers.get(LoopControl);
      if (handler)
        LoopControl.removeEventListener("click", handler);
    }
    eventHandlers.pressHandlers.clear();
    eventHandlers.releaseHandlers.clear();
    eventHandlers.clickHandlers.clear();
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  var SetupPlaybackControls;
  var init_PlaybackControls = __esm({
    "src/components/NowBar/PlaybackControls.ts"() {
      init_Icons();
      init_SpotifyPlayer();
      SetupPlaybackControls = (AppendQueue) => {
        const ControlsElement = createControlsElement();
        setupInitialControlState(ControlsElement);
        const eventHandlers = setupEventHandlers(ControlsElement);
        return {
          Apply: () => {
            AppendQueue.push(ControlsElement);
          },
          CleanUp: () => cleanupEventHandlers(ControlsElement, eventHandlers),
          GetElement: () => ControlsElement
        };
      };
    }
  });

  // src/utils/Lyrics/SongProgressBar.ts
  var SongProgressBar;
  var init_SongProgressBar = __esm({
    "src/utils/Lyrics/SongProgressBar.ts"() {
      SongProgressBar = class {
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
          return Math.floor(percentage * this.duration);
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
    }
  });

  // src/components/NowBar/ProgressBar.ts
  function createProgressBarElements() {
    const songProgressBar = new SongProgressBar();
    songProgressBar.Update({
      duration: SpotifyPlayer.GetTrackDuration() ?? 0,
      position: SpotifyPlayer.GetTrackPosition() ?? 0
    });
    const timelineElement = document.createElement("div");
    timelineElement.classList.add("Timeline");
    timelineElement.innerHTML = `
          <span class="Time Position">${songProgressBar.GetFormattedPosition() ?? "0:00"}</span>
          <div class="SliderBar" style="--SliderProgress: ${songProgressBar.GetProgressPercentage() ?? 0}">
            <div class="Handle"></div>
          </div>
          <span class="Time Duration">${songProgressBar.GetFormattedDuration() ?? "0:00"}</span>
        `;
    const sliderBar = timelineElement.querySelector(".SliderBar");
    return { songProgressBar, timelineElement, sliderBar };
  }
  function createUpdateFunction(songProgressBar, timelineElement, sliderBar) {
    return (e = null) => {
      const positionElement = timelineElement.querySelector(".Time.Position");
      const durationElement = timelineElement.querySelector(".Time.Duration");
      if (!positionElement || !durationElement || !sliderBar) {
        console.error("Missing required elements for timeline update");
        return;
      }
      let currentPosition;
      if (e === null) {
        currentPosition = SpotifyPlayer.GetTrackPosition();
      } else if (typeof e === "number") {
        currentPosition = e;
      } else if (e && e.data && typeof e.data === "number") {
        currentPosition = e.data;
      } else {
        currentPosition = SpotifyPlayer.GetTrackPosition();
      }
      songProgressBar.Update({
        duration: SpotifyPlayer.GetTrackDuration() ?? 0,
        position: currentPosition ?? 0
      });
      const sliderPercentage = songProgressBar.GetProgressPercentage();
      const formattedPosition = songProgressBar.GetFormattedPosition();
      const formattedDuration = songProgressBar.GetFormattedDuration();
      sliderBar.style.setProperty("--SliderProgress", sliderPercentage.toString());
      durationElement.textContent = formattedDuration;
      positionElement.textContent = formattedPosition;
    };
  }
  function createSliderClickHandler(songProgressBar, sliderBar, timelineElement) {
    return (event) => {
      if (!Fullscreen_default.IsOpen)
        return;
      const positionMs = songProgressBar.CalculatePositionFromClick({
        sliderBar,
        event
      });
      if (typeof SpotifyPlayer !== "undefined" && SpotifyPlayer.Seek) {
        SpotifyPlayer.Seek(positionMs);
        progressBarState.lastKnownPosition = positionMs;
        progressBarState.lastUpdateTime = performance.now();
        songProgressBar.Update({
          duration: SpotifyPlayer.GetTrackDuration() ?? 0,
          position: positionMs
        });
        const sliderPercentage = songProgressBar.GetProgressPercentage();
        const formattedPosition = songProgressBar.GetFormattedPosition();
        sliderBar.style.setProperty("--SliderProgress", sliderPercentage.toString());
        const positionElement = timelineElement.querySelector(".Time.Position");
        if (positionElement) {
          positionElement.textContent = formattedPosition;
        }
      }
    };
  }
  function initializeTrackingVariables() {
    progressBarState.lastKnownPosition = SpotifyPlayer.GetTrackPosition() || 0;
    progressBarState.lastUpdateTime = performance.now();
  }
  function setupUpdateInterval(updateTimelineState) {
    return setInterval(() => {
      if (SpotifyPlayer.IsPlaying) {
        const { lastKnownPosition, lastUpdateTime } = progressBarState;
        const now = performance.now();
        const elapsed = now - (lastUpdateTime || now);
        if (elapsed > 3e3) {
          const actualPosition = SpotifyPlayer.GetTrackPosition() || 0;
          progressBarState.lastKnownPosition = actualPosition;
          progressBarState.lastUpdateTime = now;
          updateTimelineState(actualPosition);
        } else {
          const interpolatedPosition = (lastKnownPosition || 0) + elapsed;
          progressBarState.lastInterpolationUpdate = now;
          updateTimelineState(interpolatedPosition);
        }
      }
    }, 100);
  }
  function cleanupProgressBar(sliderBar, sliderBarHandler) {
    if (sliderBar) {
      sliderBar.removeEventListener("click", sliderBarHandler);
    }
    const { updateInterval, SongProgressBar_ClassInstance, TimeLineElement } = progressBarState;
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    if (SongProgressBar_ClassInstance) {
      SongProgressBar_ClassInstance.Destroy();
    }
    if (TimeLineElement && TimeLineElement.parentNode) {
      TimeLineElement.parentNode.removeChild(TimeLineElement);
    }
    Object.keys(progressBarState).forEach((key) => {
      delete progressBarState[key];
    });
    progressBarState.lastKnownPosition = 0;
    progressBarState.lastUpdateTime = 0;
  }
  var SetupSongProgressBar;
  var init_ProgressBar = __esm({
    "src/components/NowBar/ProgressBar.ts"() {
      init_SongProgressBar();
      init_SpotifyPlayer();
      init_Fullscreen();
      init_state();
      SetupSongProgressBar = (AppendQueue) => {
        const { songProgressBar, timelineElement, sliderBar } = createProgressBarElements();
        if (!sliderBar) {
          console.error("Could not find SliderBar element");
          return null;
        }
        const updateTimelineState = createUpdateFunction(
          songProgressBar,
          timelineElement,
          sliderBar
        );
        const sliderBarHandler = createSliderClickHandler(
          songProgressBar,
          sliderBar,
          timelineElement
        );
        sliderBar.addEventListener("click", sliderBarHandler);
        updateTimelineState();
        initializeTrackingVariables();
        const updateInterval = setupUpdateInterval(updateTimelineState);
        progressBarState.SongProgressBar_ClassInstance = songProgressBar;
        progressBarState.TimeLineElement = timelineElement;
        progressBarState.updateTimelineState_Function = updateTimelineState;
        progressBarState.updateInterval = updateInterval;
        return {
          Apply: () => {
            AppendQueue.push(timelineElement);
          },
          GetElement: () => timelineElement,
          CleanUp: () => cleanupProgressBar(sliderBar, sliderBarHandler)
        };
      };
    }
  });

  // src/components/NowBar/NowBar.ts
  function OpenNowBar() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    UpdateNowBar(true);
    if (!NowBar.classList.contains("Active"))
      NowBar.classList.add("Active");
    storage_default.set("IsNowBarOpen", "true");
    if (Fullscreen_default.IsOpen) {
      const MediaBox = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent"
      );
      if (!MediaBox)
        return;
      const existingAlbumData = MediaBox.querySelector(".AlbumData");
      if (existingAlbumData)
        MediaBox.removeChild(existingAlbumData);
      const existingPlaybackControls = MediaBox.querySelector(".PlaybackControls");
      if (existingPlaybackControls)
        MediaBox.removeChild(existingPlaybackControls);
      {
        const AppendQueue = [];
        {
          const AlbumNameElement = document.createElement("div");
          AlbumNameElement.classList.add("AlbumData");
          AlbumNameElement.innerHTML = `<span>${SpotifyPlayer.GetAlbumName()}</span>`;
          AppendQueue.push(AlbumNameElement);
        }
        const playbackControlsInstance = SetupPlaybackControls(AppendQueue);
        setActivePlaybackControlsInstance(playbackControlsInstance);
        ActivePlaybackControlsInstance.Apply();
        const songProgressBarInstance = SetupSongProgressBar(AppendQueue);
        setActiveSetupSongProgressBarInstance(songProgressBarInstance);
        if (ActiveSetupSongProgressBarInstance) {
          ActiveSetupSongProgressBarInstance.Apply();
        }
        Whentil_default.When(
          () => document.querySelector("#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls"),
          () => {
            const viewControls = MediaBox.querySelector(".ViewControls");
            const fragment = document.createDocumentFragment();
            AppendQueue.forEach((element) => {
              fragment.appendChild(element);
            });
            if (fragment.childNodes.length > 0) {
              MediaBox.innerHTML = "";
              if (viewControls)
                MediaBox.appendChild(viewControls);
              MediaBox.appendChild(fragment);
            }
          }
        );
      }
    }
    setupDragAndDrop();
    setupEventListeners();
  }
  function CloseNowBar() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    NowBar.classList.remove("Active");
    storage_default.set("IsNowBarOpen", "false");
    CleanUpActiveComponents();
  }
  function Session_OpenNowBar() {
    OpenNowBar();
  }
  function UpdateNowBar(force = false) {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    const ArtistsDiv = NowBar.querySelector(".Header .Metadata .Artists");
    const ArtistsSpan = NowBar.querySelector(".Header .Metadata .Artists span");
    const MediaImage = NowBar.querySelector(".Header .MediaBox .MediaImage");
    const SongNameSpan = NowBar.querySelector(".Header .Metadata .SongName span");
    const MediaBox = NowBar.querySelector(".Header .MediaBox");
    const SongName = NowBar.querySelector(".Header .Metadata .SongName");
    if (!ArtistsDiv || !MediaBox || !SongName) {
      console.error("Required elements not found in UpdateNowBar");
      return;
    }
    ArtistsDiv.classList.add("Skeletoned");
    MediaBox.classList.add("Skeletoned");
    SongName.classList.add("Skeletoned");
    const IsNowBarOpen = storage_default.get("IsNowBarOpen");
    if (IsNowBarOpen == "false" && !force)
      return;
    if (MediaImage) {
      SpotifyPlayer.Artwork.Get("xl").then((artwork) => {
        if (MediaImage.src !== artwork) {
          MediaImage.src = artwork;
        }
        MediaBox.classList.remove("Skeletoned");
      }).catch((err2) => {
        console.error("Failed to load artwork:", err2);
      });
    }
    if (SongNameSpan && SongName) {
      SpotifyPlayer.GetSongName().then((title) => {
        if (SongNameSpan.textContent !== title) {
          SongNameSpan.textContent = title;
        }
        SongName.classList.remove("Skeletoned");
      }).catch((err2) => {
        console.error("Failed to get song name:", err2);
      });
    }
    if (ArtistsSpan && ArtistsDiv) {
      SpotifyPlayer.GetArtists().then((artists) => {
        const joined = SpotifyPlayer.JoinArtists(artists);
        if (ArtistsSpan.textContent !== joined) {
          ArtistsSpan.textContent = joined;
        }
        ArtistsDiv.classList.remove("Skeletoned");
      }).catch((err2) => {
        console.error("Failed to get artists:", err2);
      });
    }
    if (Fullscreen_default.IsOpen) {
      const NowBarAlbum = NowBar.querySelector(".Header .MediaBox .AlbumData");
      if (NowBarAlbum) {
        NowBarAlbum.classList.add("Skeletoned");
        const AlbumSpan = NowBarAlbum.querySelector("span");
        if (AlbumSpan) {
          AlbumSpan.textContent = SpotifyPlayer.GetAlbumName();
        }
        NowBarAlbum.classList.remove("Skeletoned");
      }
    }
  }
  function NowBar_SwapSides() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    const CurrentSide = storage_default.get("NowBarSide");
    if (CurrentSide === "left") {
      storage_default.set("NowBarSide", "right");
      NowBar.classList.remove("LeftSide");
      NowBar.classList.add("RightSide");
    } else if (CurrentSide === "right") {
      storage_default.set("NowBarSide", "left");
      NowBar.classList.remove("RightSide");
      NowBar.classList.add("LeftSide");
    } else {
      storage_default.set("NowBarSide", "right");
      NowBar.classList.remove("LeftSide");
      NowBar.classList.add("RightSide");
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
    const nowBarButton = document.querySelector(
      "#SpicyLyricsPage .ContentBox .ViewControls #NowBarToggle"
    );
    if (nowBarButton) {
      nowBarButton.remove();
    }
  }
  var init_NowBar = __esm({
    "src/components/NowBar/NowBar.ts"() {
      init_storage();
      init_Whentil();
      init_SpotifyPlayer();
      init_Fullscreen();
      init_DragAndDrop();
      init_EventListeners();
      init_PlaybackControls();
      init_ProgressBar();
      init_state();
    }
  });

  // src/components/Utils/NowBar.ts
  var NowBar_exports = {};
  __export(NowBar_exports, {
    CloseNowBar: () => CloseNowBar,
    DeregisterNowBarBtn: () => DeregisterNowBarBtn,
    NowBar_SwapSides: () => NowBar_SwapSides,
    OpenNowBar: () => OpenNowBar,
    Session_NowBar_SetSide: () => Session_NowBar_SetSide,
    Session_OpenNowBar: () => Session_OpenNowBar,
    UpdateNowBar: () => UpdateNowBar
  });
  var init_NowBar2 = __esm({
    "src/components/Utils/NowBar.ts"() {
      init_NowBar();
    }
  });

  // src/utils/Lyrics/ui.ts
  function resetLyricsUI() {
    const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (lyricsContent?.classList.contains("offline")) {
      lyricsContent.classList.remove("offline");
    }
    document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.remove("Hidden");
    if (!Fullscreen_default.IsOpen)
      PageView_default.AppendViewControls();
  }
  async function noLyricsMessage(trackId) {
    try {
      storage_default.set("currentlyFetching", "false");
      if (Spicetify.Player.data.item.uri?.split(":")[2] === trackId) {
        Spicetify.showNotification("Lyrics unavailable", false, 1e3);
        HideLoaderContainer();
        Defaults_default.CurrentLyricsType = "None";
        document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.add("Hidden");
        document.querySelector("#SpicyLyricsPage .ContentBox")?.classList.add("LyricsHidden");
        OpenNowBar();
        DeregisterNowBarBtn();
        showRefreshButton();
      }
    } catch (error) {
      console.error("Amai Lyrics: Error showing no lyrics message", error);
      storage_default.set("currentlyFetching", "false");
    }
    return "1";
  }
  function ShowLoaderContainer() {
    const loaderContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .loaderContainer"
    );
    if (loaderContainer) {
      ContainerShowLoaderTimeout = window.setTimeout(
        () => loaderContainer.classList.add("active"),
        1e3
      );
    }
  }
  function HideLoaderContainer() {
    const loaderContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .loaderContainer"
    );
    if (loaderContainer) {
      if (ContainerShowLoaderTimeout) {
        clearTimeout(ContainerShowLoaderTimeout);
        ContainerShowLoaderTimeout = null;
      }
      loaderContainer.classList.remove("active");
    }
  }
  function ClearLyricsPageContainer() {
    const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (lyricsContent) {
      lyricsContent.innerHTML = "";
    }
  }
  var ContainerShowLoaderTimeout;
  var init_ui = __esm({
    "src/utils/Lyrics/ui.ts"() {
      init_storage();
      init_Defaults();
      init_NowBar2();
      init_PageView();
      init_Fullscreen();
      init_pageButtons();
      ContainerShowLoaderTimeout = null;
    }
  });

  // src/utils/API/Lyrics.ts
  async function getLyrics(id, headers = {}) {
    const userData = await fetchUserData();
    const { data, status } = await fetchLyricsData(id, userData, headers);
    return { response: data, status };
  }
  async function fetchUserData() {
    try {
      const [data, status] = await SpicyFetch(
        "https://api.spotify.com/v1/me",
        true,
        true,
        false
      );
      return status === 200 ? data : {};
    } catch (error) {
      console.error("Error fetching user data:", error);
      return {};
    }
  }
  async function fetchLyricsData(id, userData, headers) {
    try {
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
      const status = res.status;
      if (!res.ok) {
        throw new Error(`Request failed with status ${status}`);
      }
      let data = {};
      try {
        data = await res.json();
      } catch (error) {
        console.error("Error parsing response JSON:", error);
      }
      return { data, status };
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      throw error;
    }
  }
  var API_URL;
  var init_Lyrics = __esm({
    "src/utils/API/Lyrics.ts"() {
      init_Defaults();
      init_SpicyFetch();
      API_URL = Defaults_default.lyrics.api.url;
    }
  });

  // node_modules/@google/genai/dist/web/index.mjs
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
    const fromThinkingBudget = getValueByPath(fromObject, [
      "thinkingBudget"
    ]);
    if (fromThinkingBudget != null) {
      setValueByPath(toObject, ["thinkingBudget"], fromThinkingBudget);
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
  function getModelParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "name"], tModel(apiClient, fromModel));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
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
  function imageToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["gcsUri"]) !== void 0) {
      throw new Error("gcsUri parameter is not supported in Gemini API.");
    }
    const fromImageBytes = getValueByPath(fromObject, ["imageBytes"]);
    if (fromImageBytes != null) {
      setValueByPath(toObject, ["bytesBase64Encoded"], tBytes(apiClient, fromImageBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function generateVideosConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromNumberOfVideos = getValueByPath(fromObject, [
      "numberOfVideos"
    ]);
    if (parentObject !== void 0 && fromNumberOfVideos != null) {
      setValueByPath(parentObject, ["parameters", "sampleCount"], fromNumberOfVideos);
    }
    if (getValueByPath(fromObject, ["outputGcsUri"]) !== void 0) {
      throw new Error("outputGcsUri parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["fps"]) !== void 0) {
      throw new Error("fps parameter is not supported in Gemini API.");
    }
    const fromDurationSeconds = getValueByPath(fromObject, [
      "durationSeconds"
    ]);
    if (parentObject !== void 0 && fromDurationSeconds != null) {
      setValueByPath(parentObject, ["parameters", "durationSeconds"], fromDurationSeconds);
    }
    if (getValueByPath(fromObject, ["seed"]) !== void 0) {
      throw new Error("seed parameter is not supported in Gemini API.");
    }
    const fromAspectRatio = getValueByPath(fromObject, ["aspectRatio"]);
    if (parentObject !== void 0 && fromAspectRatio != null) {
      setValueByPath(parentObject, ["parameters", "aspectRatio"], fromAspectRatio);
    }
    if (getValueByPath(fromObject, ["resolution"]) !== void 0) {
      throw new Error("resolution parameter is not supported in Gemini API.");
    }
    const fromPersonGeneration = getValueByPath(fromObject, [
      "personGeneration"
    ]);
    if (parentObject !== void 0 && fromPersonGeneration != null) {
      setValueByPath(parentObject, ["parameters", "personGeneration"], fromPersonGeneration);
    }
    if (getValueByPath(fromObject, ["pubsubTopic"]) !== void 0) {
      throw new Error("pubsubTopic parameter is not supported in Gemini API.");
    }
    const fromNegativePrompt = getValueByPath(fromObject, [
      "negativePrompt"
    ]);
    if (parentObject !== void 0 && fromNegativePrompt != null) {
      setValueByPath(parentObject, ["parameters", "negativePrompt"], fromNegativePrompt);
    }
    if (getValueByPath(fromObject, ["enhancePrompt"]) !== void 0) {
      throw new Error("enhancePrompt parameter is not supported in Gemini API.");
    }
    return toObject;
  }
  function generateVideosParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromPrompt = getValueByPath(fromObject, ["prompt"]);
    if (fromPrompt != null) {
      setValueByPath(toObject, ["instances[0]", "prompt"], fromPrompt);
    }
    const fromImage = getValueByPath(fromObject, ["image"]);
    if (fromImage != null) {
      setValueByPath(toObject, ["instances[0]", "image"], imageToMldev(apiClient, fromImage));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], generateVideosConfigToMldev(apiClient, fromConfig, toObject));
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
    const fromThinkingBudget = getValueByPath(fromObject, [
      "thinkingBudget"
    ]);
    if (fromThinkingBudget != null) {
      setValueByPath(toObject, ["thinkingBudget"], fromThinkingBudget);
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
  function getModelParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "name"], tModel(apiClient, fromModel));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
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
  function imageToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGcsUri = getValueByPath(fromObject, ["gcsUri"]);
    if (fromGcsUri != null) {
      setValueByPath(toObject, ["gcsUri"], fromGcsUri);
    }
    const fromImageBytes = getValueByPath(fromObject, ["imageBytes"]);
    if (fromImageBytes != null) {
      setValueByPath(toObject, ["bytesBase64Encoded"], tBytes(apiClient, fromImageBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function generateVideosConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromNumberOfVideos = getValueByPath(fromObject, [
      "numberOfVideos"
    ]);
    if (parentObject !== void 0 && fromNumberOfVideos != null) {
      setValueByPath(parentObject, ["parameters", "sampleCount"], fromNumberOfVideos);
    }
    const fromOutputGcsUri = getValueByPath(fromObject, ["outputGcsUri"]);
    if (parentObject !== void 0 && fromOutputGcsUri != null) {
      setValueByPath(parentObject, ["parameters", "storageUri"], fromOutputGcsUri);
    }
    const fromFps = getValueByPath(fromObject, ["fps"]);
    if (parentObject !== void 0 && fromFps != null) {
      setValueByPath(parentObject, ["parameters", "fps"], fromFps);
    }
    const fromDurationSeconds = getValueByPath(fromObject, [
      "durationSeconds"
    ]);
    if (parentObject !== void 0 && fromDurationSeconds != null) {
      setValueByPath(parentObject, ["parameters", "durationSeconds"], fromDurationSeconds);
    }
    const fromSeed = getValueByPath(fromObject, ["seed"]);
    if (parentObject !== void 0 && fromSeed != null) {
      setValueByPath(parentObject, ["parameters", "seed"], fromSeed);
    }
    const fromAspectRatio = getValueByPath(fromObject, ["aspectRatio"]);
    if (parentObject !== void 0 && fromAspectRatio != null) {
      setValueByPath(parentObject, ["parameters", "aspectRatio"], fromAspectRatio);
    }
    const fromResolution = getValueByPath(fromObject, ["resolution"]);
    if (parentObject !== void 0 && fromResolution != null) {
      setValueByPath(parentObject, ["parameters", "resolution"], fromResolution);
    }
    const fromPersonGeneration = getValueByPath(fromObject, [
      "personGeneration"
    ]);
    if (parentObject !== void 0 && fromPersonGeneration != null) {
      setValueByPath(parentObject, ["parameters", "personGeneration"], fromPersonGeneration);
    }
    const fromPubsubTopic = getValueByPath(fromObject, ["pubsubTopic"]);
    if (parentObject !== void 0 && fromPubsubTopic != null) {
      setValueByPath(parentObject, ["parameters", "pubsubTopic"], fromPubsubTopic);
    }
    const fromNegativePrompt = getValueByPath(fromObject, [
      "negativePrompt"
    ]);
    if (parentObject !== void 0 && fromNegativePrompt != null) {
      setValueByPath(parentObject, ["parameters", "negativePrompt"], fromNegativePrompt);
    }
    const fromEnhancePrompt = getValueByPath(fromObject, [
      "enhancePrompt"
    ]);
    if (parentObject !== void 0 && fromEnhancePrompt != null) {
      setValueByPath(parentObject, ["parameters", "enhancePrompt"], fromEnhancePrompt);
    }
    return toObject;
  }
  function generateVideosParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromPrompt = getValueByPath(fromObject, ["prompt"]);
    if (fromPrompt != null) {
      setValueByPath(toObject, ["instances[0]", "prompt"], fromPrompt);
    }
    const fromImage = getValueByPath(fromObject, ["image"]);
    if (fromImage != null) {
      setValueByPath(toObject, ["instances[0]", "image"], imageToVertex(apiClient, fromImage));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], generateVideosConfigToVertex(apiClient, fromConfig, toObject));
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
  function tunedModelInfoFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromBaseModel = getValueByPath(fromObject, ["baseModel"]);
    if (fromBaseModel != null) {
      setValueByPath(toObject, ["baseModel"], fromBaseModel);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    return toObject;
  }
  function modelFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromVersion = getValueByPath(fromObject, ["version"]);
    if (fromVersion != null) {
      setValueByPath(toObject, ["version"], fromVersion);
    }
    const fromTunedModelInfo = getValueByPath(fromObject, ["_self"]);
    if (fromTunedModelInfo != null) {
      setValueByPath(toObject, ["tunedModelInfo"], tunedModelInfoFromMldev(apiClient, fromTunedModelInfo));
    }
    const fromInputTokenLimit = getValueByPath(fromObject, [
      "inputTokenLimit"
    ]);
    if (fromInputTokenLimit != null) {
      setValueByPath(toObject, ["inputTokenLimit"], fromInputTokenLimit);
    }
    const fromOutputTokenLimit = getValueByPath(fromObject, [
      "outputTokenLimit"
    ]);
    if (fromOutputTokenLimit != null) {
      setValueByPath(toObject, ["outputTokenLimit"], fromOutputTokenLimit);
    }
    const fromSupportedActions = getValueByPath(fromObject, [
      "supportedGenerationMethods"
    ]);
    if (fromSupportedActions != null) {
      setValueByPath(toObject, ["supportedActions"], fromSupportedActions);
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
  function videoFromMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromUri = getValueByPath(fromObject, ["video", "uri"]);
    if (fromUri != null) {
      setValueByPath(toObject, ["uri"], fromUri);
    }
    const fromVideoBytes = getValueByPath(fromObject, [
      "video",
      "encodedVideo"
    ]);
    if (fromVideoBytes != null) {
      setValueByPath(toObject, ["videoBytes"], tBytes(apiClient, fromVideoBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["encoding"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function generatedVideoFromMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromVideo = getValueByPath(fromObject, ["_self"]);
    if (fromVideo != null) {
      setValueByPath(toObject, ["video"], videoFromMldev$1(apiClient, fromVideo));
    }
    return toObject;
  }
  function generateVideosResponseFromMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromGeneratedVideos = getValueByPath(fromObject, [
      "generatedSamples"
    ]);
    if (fromGeneratedVideos != null) {
      if (Array.isArray(fromGeneratedVideos)) {
        setValueByPath(toObject, ["generatedVideos"], fromGeneratedVideos.map((item) => {
          return generatedVideoFromMldev$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["generatedVideos"], fromGeneratedVideos);
      }
    }
    const fromRaiMediaFilteredCount = getValueByPath(fromObject, [
      "raiMediaFilteredCount"
    ]);
    if (fromRaiMediaFilteredCount != null) {
      setValueByPath(toObject, ["raiMediaFilteredCount"], fromRaiMediaFilteredCount);
    }
    const fromRaiMediaFilteredReasons = getValueByPath(fromObject, [
      "raiMediaFilteredReasons"
    ]);
    if (fromRaiMediaFilteredReasons != null) {
      setValueByPath(toObject, ["raiMediaFilteredReasons"], fromRaiMediaFilteredReasons);
    }
    return toObject;
  }
  function generateVideosOperationFromMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromMetadata = getValueByPath(fromObject, ["metadata"]);
    if (fromMetadata != null) {
      setValueByPath(toObject, ["metadata"], fromMetadata);
    }
    const fromDone = getValueByPath(fromObject, ["done"]);
    if (fromDone != null) {
      setValueByPath(toObject, ["done"], fromDone);
    }
    const fromError = getValueByPath(fromObject, ["error"]);
    if (fromError != null) {
      setValueByPath(toObject, ["error"], fromError);
    }
    const fromResponse = getValueByPath(fromObject, [
      "response",
      "generateVideoResponse"
    ]);
    if (fromResponse != null) {
      setValueByPath(toObject, ["response"], generateVideosResponseFromMldev$1(apiClient, fromResponse));
    }
    const fromResult = getValueByPath(fromObject, [
      "response",
      "generateVideoResponse"
    ]);
    if (fromResult != null) {
      setValueByPath(toObject, ["result"], generateVideosResponseFromMldev$1(apiClient, fromResult));
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
  function endpointFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["endpoint"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDeployedModelId = getValueByPath(fromObject, [
      "deployedModelId"
    ]);
    if (fromDeployedModelId != null) {
      setValueByPath(toObject, ["deployedModelId"], fromDeployedModelId);
    }
    return toObject;
  }
  function tunedModelInfoFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromBaseModel = getValueByPath(fromObject, [
      "labels",
      "google-vertex-llm-tuning-base-model-id"
    ]);
    if (fromBaseModel != null) {
      setValueByPath(toObject, ["baseModel"], fromBaseModel);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    return toObject;
  }
  function modelFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromVersion = getValueByPath(fromObject, ["versionId"]);
    if (fromVersion != null) {
      setValueByPath(toObject, ["version"], fromVersion);
    }
    const fromEndpoints = getValueByPath(fromObject, ["deployedModels"]);
    if (fromEndpoints != null) {
      if (Array.isArray(fromEndpoints)) {
        setValueByPath(toObject, ["endpoints"], fromEndpoints.map((item) => {
          return endpointFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["endpoints"], fromEndpoints);
      }
    }
    const fromLabels = getValueByPath(fromObject, ["labels"]);
    if (fromLabels != null) {
      setValueByPath(toObject, ["labels"], fromLabels);
    }
    const fromTunedModelInfo = getValueByPath(fromObject, ["_self"]);
    if (fromTunedModelInfo != null) {
      setValueByPath(toObject, ["tunedModelInfo"], tunedModelInfoFromVertex(apiClient, fromTunedModelInfo));
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
  function videoFromVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromUri = getValueByPath(fromObject, ["gcsUri"]);
    if (fromUri != null) {
      setValueByPath(toObject, ["uri"], fromUri);
    }
    const fromVideoBytes = getValueByPath(fromObject, [
      "bytesBase64Encoded"
    ]);
    if (fromVideoBytes != null) {
      setValueByPath(toObject, ["videoBytes"], tBytes(apiClient, fromVideoBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function generatedVideoFromVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromVideo = getValueByPath(fromObject, ["_self"]);
    if (fromVideo != null) {
      setValueByPath(toObject, ["video"], videoFromVertex$1(apiClient, fromVideo));
    }
    return toObject;
  }
  function generateVideosResponseFromVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromGeneratedVideos = getValueByPath(fromObject, ["videos"]);
    if (fromGeneratedVideos != null) {
      if (Array.isArray(fromGeneratedVideos)) {
        setValueByPath(toObject, ["generatedVideos"], fromGeneratedVideos.map((item) => {
          return generatedVideoFromVertex$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["generatedVideos"], fromGeneratedVideos);
      }
    }
    const fromRaiMediaFilteredCount = getValueByPath(fromObject, [
      "raiMediaFilteredCount"
    ]);
    if (fromRaiMediaFilteredCount != null) {
      setValueByPath(toObject, ["raiMediaFilteredCount"], fromRaiMediaFilteredCount);
    }
    const fromRaiMediaFilteredReasons = getValueByPath(fromObject, [
      "raiMediaFilteredReasons"
    ]);
    if (fromRaiMediaFilteredReasons != null) {
      setValueByPath(toObject, ["raiMediaFilteredReasons"], fromRaiMediaFilteredReasons);
    }
    return toObject;
  }
  function generateVideosOperationFromVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromMetadata = getValueByPath(fromObject, ["metadata"]);
    if (fromMetadata != null) {
      setValueByPath(toObject, ["metadata"], fromMetadata);
    }
    const fromDone = getValueByPath(fromObject, ["done"]);
    if (fromDone != null) {
      setValueByPath(toObject, ["done"], fromDone);
    }
    const fromError = getValueByPath(fromObject, ["error"]);
    if (fromError != null) {
      setValueByPath(toObject, ["error"], fromError);
    }
    const fromResponse = getValueByPath(fromObject, ["response"]);
    if (fromResponse != null) {
      setValueByPath(toObject, ["response"], generateVideosResponseFromVertex$1(apiClient, fromResponse));
    }
    const fromResult = getValueByPath(fromObject, ["response"]);
    if (fromResult != null) {
      setValueByPath(toObject, ["result"], generateVideosResponseFromVertex$1(apiClient, fromResult));
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
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != void 0 && fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], usageMetadataFromMldev(apiClient, fromUsageMetadata));
    }
    const fromGoAway = getValueByPath(fromObject, ["goAway"]);
    if (fromGoAway !== void 0 && fromGoAway !== null) {
      setValueByPath(toObject, ["goAway"], liveServerGoAwayFromMldev(fromGoAway));
    }
    const fromSessionResumptionUpdate = getValueByPath(fromObject, [
      "sessionResumptionUpdate"
    ]);
    if (fromSessionResumptionUpdate !== void 0 && fromSessionResumptionUpdate !== null) {
      setValueByPath(toObject, ["sessionResumptionUpdate"], liveServerSessionResumptionUpdateFromMldev(fromSessionResumptionUpdate));
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
    const fromGoAway = getValueByPath(fromObject, ["goAway"]);
    if (fromGoAway !== void 0 && fromGoAway !== null) {
      setValueByPath(toObject, ["goAway"], liveServerGoAwayFromVertex(fromGoAway));
    }
    const fromSessionResumptionUpdate = getValueByPath(fromObject, [
      "sessionResumptionUpdate"
    ]);
    if (fromSessionResumptionUpdate !== void 0 && fromSessionResumptionUpdate !== null) {
      setValueByPath(toObject, ["sessionResumptionUpdate"], liveServerSessionResumptionUpdateFromVertex(fromSessionResumptionUpdate));
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != void 0 && fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], usageMetadataFromVertex(apiClient, fromUsageMetadata));
    }
    return toObject;
  }
  function slidingWindowToMldev(fromObject) {
    const toObject = {};
    const fromTargetTokens = getValueByPath(fromObject, ["targetTokens"]);
    if (fromTargetTokens !== void 0 && fromTargetTokens !== null) {
      setValueByPath(toObject, ["targetTokens"], fromTargetTokens);
    }
    return toObject;
  }
  function slidingWindowToVertex(fromObject) {
    const toObject = {};
    const fromTargetTokens = getValueByPath(fromObject, ["targetTokens"]);
    if (fromTargetTokens !== void 0 && fromTargetTokens !== null) {
      setValueByPath(toObject, ["targetTokens"], fromTargetTokens);
    }
    return toObject;
  }
  function contextWindowCompressionToMldev(fromObject) {
    const toObject = {};
    const fromTriggerTokens = getValueByPath(fromObject, [
      "triggerTokens"
    ]);
    if (fromTriggerTokens !== void 0 && fromTriggerTokens !== null) {
      setValueByPath(toObject, ["triggerTokens"], fromTriggerTokens);
    }
    const fromSlidingWindow = getValueByPath(fromObject, [
      "slidingWindow"
    ]);
    if (fromSlidingWindow !== void 0 && fromSlidingWindow !== null) {
      setValueByPath(toObject, ["slidingWindow"], slidingWindowToMldev(fromSlidingWindow));
    }
    return toObject;
  }
  function contextWindowCompressionToVertex(fromObject) {
    const toObject = {};
    const fromTriggerTokens = getValueByPath(fromObject, [
      "triggerTokens"
    ]);
    if (fromTriggerTokens !== void 0 && fromTriggerTokens !== null) {
      setValueByPath(toObject, ["triggerTokens"], fromTriggerTokens);
    }
    const fromSlidingWindow = getValueByPath(fromObject, [
      "slidingWindow"
    ]);
    if (fromSlidingWindow !== void 0 && fromSlidingWindow !== null) {
      setValueByPath(toObject, ["slidingWindow"], slidingWindowToVertex(fromSlidingWindow));
    }
    return toObject;
  }
  function automaticActivityDetectionToMldev(fromObject) {
    const toObject = {};
    const fromDisabled = getValueByPath(fromObject, ["disabled"]);
    if (fromDisabled !== void 0 && fromDisabled !== null) {
      setValueByPath(toObject, ["disabled"], fromDisabled);
    }
    const fromStartOfSpeechSensitivity = getValueByPath(fromObject, [
      "startOfSpeechSensitivity"
    ]);
    if (fromStartOfSpeechSensitivity !== void 0 && fromStartOfSpeechSensitivity !== null) {
      setValueByPath(toObject, ["startOfSpeechSensitivity"], fromStartOfSpeechSensitivity);
    }
    const fromEndOfSpeechSensitivity = getValueByPath(fromObject, [
      "endOfSpeechSensitivity"
    ]);
    if (fromEndOfSpeechSensitivity !== void 0 && fromEndOfSpeechSensitivity !== null) {
      setValueByPath(toObject, ["endOfSpeechSensitivity"], fromEndOfSpeechSensitivity);
    }
    const fromPrefixPaddingMs = getValueByPath(fromObject, [
      "prefixPaddingMs"
    ]);
    if (fromPrefixPaddingMs !== void 0 && fromPrefixPaddingMs !== null) {
      setValueByPath(toObject, ["prefixPaddingMs"], fromPrefixPaddingMs);
    }
    const fromSilenceDurationMs = getValueByPath(fromObject, [
      "silenceDurationMs"
    ]);
    if (fromSilenceDurationMs !== void 0 && fromSilenceDurationMs !== null) {
      setValueByPath(toObject, ["silenceDurationMs"], fromSilenceDurationMs);
    }
    return toObject;
  }
  function automaticActivityDetectionToVertex(fromObject) {
    const toObject = {};
    const fromDisabled = getValueByPath(fromObject, ["disabled"]);
    if (fromDisabled !== void 0 && fromDisabled !== null) {
      setValueByPath(toObject, ["disabled"], fromDisabled);
    }
    const fromStartOfSpeechSensitivity = getValueByPath(fromObject, [
      "startOfSpeechSensitivity"
    ]);
    if (fromStartOfSpeechSensitivity !== void 0 && fromStartOfSpeechSensitivity !== null) {
      setValueByPath(toObject, ["startOfSpeechSensitivity"], fromStartOfSpeechSensitivity);
    }
    const fromEndOfSpeechSensitivity = getValueByPath(fromObject, [
      "endOfSpeechSensitivity"
    ]);
    if (fromEndOfSpeechSensitivity !== void 0 && fromEndOfSpeechSensitivity !== null) {
      setValueByPath(toObject, ["endOfSpeechSensitivity"], fromEndOfSpeechSensitivity);
    }
    const fromPrefixPaddingMs = getValueByPath(fromObject, [
      "prefixPaddingMs"
    ]);
    if (fromPrefixPaddingMs !== void 0 && fromPrefixPaddingMs !== null) {
      setValueByPath(toObject, ["prefixPaddingMs"], fromPrefixPaddingMs);
    }
    const fromSilenceDurationMs = getValueByPath(fromObject, [
      "silenceDurationMs"
    ]);
    if (fromSilenceDurationMs !== void 0 && fromSilenceDurationMs !== null) {
      setValueByPath(toObject, ["silenceDurationMs"], fromSilenceDurationMs);
    }
    return toObject;
  }
  function realtimeInputConfigToMldev(fromObject) {
    const toObject = {};
    const fromAutomaticActivityDetection = getValueByPath(fromObject, [
      "automaticActivityDetection"
    ]);
    if (fromAutomaticActivityDetection !== void 0 && fromAutomaticActivityDetection !== null) {
      setValueByPath(toObject, ["automaticActivityDetection"], automaticActivityDetectionToMldev(fromAutomaticActivityDetection));
    }
    const fromActivityHandling = getValueByPath(fromObject, [
      "activityHandling"
    ]);
    if (fromActivityHandling !== void 0 && fromActivityHandling !== null) {
      setValueByPath(toObject, ["activityHandling"], fromActivityHandling);
    }
    const fromTurnCoverage = getValueByPath(fromObject, ["turnCoverage"]);
    if (fromTurnCoverage !== void 0 && fromTurnCoverage !== null) {
      setValueByPath(toObject, ["turnCoverage"], fromTurnCoverage);
    }
    return toObject;
  }
  function realtimeInputConfigToVertex(fromObject) {
    const toObject = {};
    const fromAutomaticActivityDetection = getValueByPath(fromObject, [
      "automaticActivityDetection"
    ]);
    if (fromAutomaticActivityDetection !== void 0 && fromAutomaticActivityDetection !== null) {
      setValueByPath(toObject, ["automaticActivityDetection"], automaticActivityDetectionToVertex(fromAutomaticActivityDetection));
    }
    const fromActivityHandling = getValueByPath(fromObject, [
      "activityHandling"
    ]);
    if (fromActivityHandling !== void 0 && fromActivityHandling !== null) {
      setValueByPath(toObject, ["activityHandling"], fromActivityHandling);
    }
    const fromTurnCoverage = getValueByPath(fromObject, ["turnCoverage"]);
    if (fromTurnCoverage !== void 0 && fromTurnCoverage !== null) {
      setValueByPath(toObject, ["turnCoverage"], fromTurnCoverage);
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
    const fromSessionResumption = getValueByPath(fromObject, [
      "sessionResumption"
    ]);
    if (fromSessionResumption !== void 0 && fromSessionResumption !== null) {
      setValueByPath(toObject, ["sessionResumption"], liveClientSessionResumptionConfigToMldev(fromSessionResumption));
    }
    const fromContextWindowCompression = getValueByPath(fromObject, [
      "contextWindowCompression"
    ]);
    if (fromContextWindowCompression !== void 0 && fromContextWindowCompression !== null) {
      setValueByPath(toObject, ["contextWindowCompression"], contextWindowCompressionToMldev(fromContextWindowCompression));
    }
    const fromRealtimeInputConfig = getValueByPath(fromObject, [
      "realtimeInputConfig"
    ]);
    if (fromRealtimeInputConfig !== void 0 && fromRealtimeInputConfig !== null) {
      setValueByPath(toObject, ["realtimeInputConfig"], realtimeInputConfigToMldev(fromRealtimeInputConfig));
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
    const fromSessionResumption = getValueByPath(fromObject, [
      "sessionResumption"
    ]);
    if (fromSessionResumption !== void 0 && fromSessionResumption !== null) {
      setValueByPath(toObject, ["sessionResumption"], liveClientSessionResumptionConfigToVertex(fromSessionResumption));
    }
    const fromContextWindowCompression = getValueByPath(fromObject, [
      "contextWindowCompression"
    ]);
    if (fromContextWindowCompression !== void 0 && fromContextWindowCompression !== null) {
      setValueByPath(toObject, ["contextWindowCompression"], contextWindowCompressionToVertex(fromContextWindowCompression));
    }
    const fromRealtimeInputConfig = getValueByPath(fromObject, [
      "realtimeInputConfig"
    ]);
    if (fromRealtimeInputConfig !== void 0 && fromRealtimeInputConfig !== null) {
      setValueByPath(toObject, ["realtimeInputConfig"], realtimeInputConfigToVertex(fromRealtimeInputConfig));
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
    const fromGenerationComplete = getValueByPath(fromObject, [
      "generationComplete"
    ]);
    if (fromGenerationComplete != null) {
      setValueByPath(toObject, ["generationComplete"], fromGenerationComplete);
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
    const fromGenerationComplete = getValueByPath(fromObject, [
      "generationComplete"
    ]);
    if (fromGenerationComplete != null) {
      setValueByPath(toObject, ["generationComplete"], fromGenerationComplete);
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
  function liveServerGoAwayFromMldev(fromObject) {
    const toObject = {};
    const fromTimeLeft = getValueByPath(fromObject, ["timeLeft"]);
    if (fromTimeLeft !== void 0) {
      setValueByPath(toObject, ["timeLeft"], fromTimeLeft);
    }
    return toObject;
  }
  function liveServerGoAwayFromVertex(fromObject) {
    const toObject = {};
    const fromTimeLeft = getValueByPath(fromObject, ["timeLeft"]);
    if (fromTimeLeft !== void 0) {
      setValueByPath(toObject, ["timeLeft"], fromTimeLeft);
    }
    return toObject;
  }
  function liveServerSessionResumptionUpdateFromMldev(fromObject) {
    const toObject = {};
    const fromNewHandle = getValueByPath(fromObject, ["newHandle"]);
    if (fromNewHandle !== void 0) {
      setValueByPath(toObject, ["newHandle"], fromNewHandle);
    }
    const fromResumable = getValueByPath(fromObject, ["resumable"]);
    if (fromResumable !== void 0) {
      setValueByPath(toObject, ["resumable"], fromResumable);
    }
    const fromLastConsumedClientMessageIndex = getValueByPath(fromObject, [
      "lastConsumedClientMessageIndex"
    ]);
    if (fromLastConsumedClientMessageIndex !== void 0) {
      setValueByPath(toObject, ["lastConsumedClientMessageIndex"], fromLastConsumedClientMessageIndex);
    }
    return toObject;
  }
  function liveServerSessionResumptionUpdateFromVertex(fromObject) {
    const toObject = {};
    const fromNewHandle = getValueByPath(fromObject, ["newHandle"]);
    if (fromNewHandle !== void 0) {
      setValueByPath(toObject, ["newHandle"], fromNewHandle);
    }
    const fromResumable = getValueByPath(fromObject, ["resumable"]);
    if (fromResumable !== void 0) {
      setValueByPath(toObject, ["resumable"], fromResumable);
    }
    const fromLastConsumedClientMessageIndex = getValueByPath(fromObject, [
      "lastConsumedClientMessageIndex"
    ]);
    if (fromLastConsumedClientMessageIndex !== void 0) {
      setValueByPath(toObject, ["lastConsumedClientMessageIndex"], fromLastConsumedClientMessageIndex);
    }
    return toObject;
  }
  function liveClientSessionResumptionConfigToMldev(fromObject) {
    const toObject = {};
    const fromHandle = getValueByPath(fromObject, ["handle"]);
    if (fromHandle !== void 0) {
      setValueByPath(toObject, ["handle"], fromHandle);
    }
    if (getValueByPath(fromObject, ["transparent"]) !== void 0) {
      throw new Error("transparent parameter is not supported in Gemini API.");
    }
    return toObject;
  }
  function liveClientSessionResumptionConfigToVertex(fromObject) {
    const toObject = {};
    const fromHandle = getValueByPath(fromObject, ["handle"]);
    if (fromHandle !== void 0) {
      setValueByPath(toObject, ["handle"], fromHandle);
    }
    const fromTransparent = getValueByPath(fromObject, ["transparent"]);
    if (fromTransparent !== void 0) {
      setValueByPath(toObject, ["transparent"], fromTransparent);
    }
    return toObject;
  }
  function modalityTokenCountFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModality = getValueByPath(fromObject, ["modality"]);
    if (fromModality != null) {
      setValueByPath(toObject, ["modality"], fromModality);
    }
    const fromTokenCount = getValueByPath(fromObject, ["tokenCount"]);
    if (fromTokenCount != null) {
      setValueByPath(toObject, ["tokenCount"], fromTokenCount);
    }
    return toObject;
  }
  function usageMetadataFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromPromptTokenCount = getValueByPath(fromObject, [
      "promptTokenCount"
    ]);
    if (fromPromptTokenCount != null) {
      setValueByPath(toObject, ["promptTokenCount"], fromPromptTokenCount);
    }
    const fromCachedContentTokenCount = getValueByPath(fromObject, [
      "cachedContentTokenCount"
    ]);
    if (fromCachedContentTokenCount != null) {
      setValueByPath(toObject, ["cachedContentTokenCount"], fromCachedContentTokenCount);
    }
    const fromResponseTokenCount = getValueByPath(fromObject, [
      "responseTokenCount"
    ]);
    if (fromResponseTokenCount != null) {
      setValueByPath(toObject, ["responseTokenCount"], fromResponseTokenCount);
    }
    const fromToolUsePromptTokenCount = getValueByPath(fromObject, [
      "toolUsePromptTokenCount"
    ]);
    if (fromToolUsePromptTokenCount != null) {
      setValueByPath(toObject, ["toolUsePromptTokenCount"], fromToolUsePromptTokenCount);
    }
    const fromThoughtsTokenCount = getValueByPath(fromObject, [
      "thoughtsTokenCount"
    ]);
    if (fromThoughtsTokenCount != null) {
      setValueByPath(toObject, ["thoughtsTokenCount"], fromThoughtsTokenCount);
    }
    const fromTotalTokenCount = getValueByPath(fromObject, [
      "totalTokenCount"
    ]);
    if (fromTotalTokenCount != null) {
      setValueByPath(toObject, ["totalTokenCount"], fromTotalTokenCount);
    }
    const fromPromptTokensDetails = getValueByPath(fromObject, [
      "promptTokensDetails"
    ]);
    if (fromPromptTokensDetails != null) {
      if (Array.isArray(fromPromptTokensDetails)) {
        setValueByPath(toObject, ["promptTokensDetails"], fromPromptTokensDetails.map((item) => {
          return modalityTokenCountFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["promptTokensDetails"], fromPromptTokensDetails);
      }
    }
    const fromCacheTokensDetails = getValueByPath(fromObject, [
      "cacheTokensDetails"
    ]);
    if (fromCacheTokensDetails != null) {
      if (Array.isArray(fromCacheTokensDetails)) {
        setValueByPath(toObject, ["cacheTokensDetails"], fromCacheTokensDetails.map((item) => {
          return modalityTokenCountFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["cacheTokensDetails"], fromCacheTokensDetails);
      }
    }
    const fromResponseTokensDetails = getValueByPath(fromObject, [
      "responseTokensDetails"
    ]);
    if (fromResponseTokensDetails != null) {
      if (Array.isArray(fromResponseTokensDetails)) {
        setValueByPath(toObject, ["responseTokensDetails"], fromResponseTokensDetails.map((item) => {
          return modalityTokenCountFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["responseTokensDetails"], fromResponseTokensDetails);
      }
    }
    const fromToolUsePromptTokensDetails = getValueByPath(fromObject, [
      "toolUsePromptTokensDetails"
    ]);
    if (fromToolUsePromptTokensDetails != null) {
      if (Array.isArray(fromToolUsePromptTokensDetails)) {
        setValueByPath(toObject, ["toolUsePromptTokensDetails"], fromToolUsePromptTokensDetails.map((item) => {
          return modalityTokenCountFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["toolUsePromptTokensDetails"], fromToolUsePromptTokensDetails);
      }
    }
    return toObject;
  }
  function modalityTokenCountFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModality = getValueByPath(fromObject, ["modality"]);
    if (fromModality != null) {
      setValueByPath(toObject, ["modality"], fromModality);
    }
    const fromTokenCount = getValueByPath(fromObject, ["tokenCount"]);
    if (fromTokenCount != null) {
      setValueByPath(toObject, ["tokenCount"], fromTokenCount);
    }
    return toObject;
  }
  function usageMetadataFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromPromptTokenCount = getValueByPath(fromObject, [
      "promptTokenCount"
    ]);
    if (fromPromptTokenCount != null) {
      setValueByPath(toObject, ["promptTokenCount"], fromPromptTokenCount);
    }
    const fromCachedContentTokenCount = getValueByPath(fromObject, [
      "cachedContentTokenCount"
    ]);
    if (fromCachedContentTokenCount != null) {
      setValueByPath(toObject, ["cachedContentTokenCount"], fromCachedContentTokenCount);
    }
    const fromResponseTokenCount = getValueByPath(fromObject, [
      "candidatesTokenCount"
    ]);
    if (fromResponseTokenCount != null) {
      setValueByPath(toObject, ["responseTokenCount"], fromResponseTokenCount);
    }
    const fromToolUsePromptTokenCount = getValueByPath(fromObject, [
      "toolUsePromptTokenCount"
    ]);
    if (fromToolUsePromptTokenCount != null) {
      setValueByPath(toObject, ["toolUsePromptTokenCount"], fromToolUsePromptTokenCount);
    }
    const fromThoughtsTokenCount = getValueByPath(fromObject, [
      "thoughtsTokenCount"
    ]);
    if (fromThoughtsTokenCount != null) {
      setValueByPath(toObject, ["thoughtsTokenCount"], fromThoughtsTokenCount);
    }
    const fromTotalTokenCount = getValueByPath(fromObject, [
      "totalTokenCount"
    ]);
    if (fromTotalTokenCount != null) {
      setValueByPath(toObject, ["totalTokenCount"], fromTotalTokenCount);
    }
    const fromPromptTokensDetails = getValueByPath(fromObject, [
      "promptTokensDetails"
    ]);
    if (fromPromptTokensDetails != null) {
      if (Array.isArray(fromPromptTokensDetails)) {
        setValueByPath(toObject, ["promptTokensDetails"], fromPromptTokensDetails.map((item) => {
          return modalityTokenCountFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["promptTokensDetails"], fromPromptTokensDetails);
      }
    }
    const fromCacheTokensDetails = getValueByPath(fromObject, [
      "cacheTokensDetails"
    ]);
    if (fromCacheTokensDetails != null) {
      if (Array.isArray(fromCacheTokensDetails)) {
        setValueByPath(toObject, ["cacheTokensDetails"], fromCacheTokensDetails.map((item) => {
          return modalityTokenCountFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["cacheTokensDetails"], fromCacheTokensDetails);
      }
    }
    const fromToolUsePromptTokensDetails = getValueByPath(fromObject, [
      "toolUsePromptTokensDetails"
    ]);
    if (fromToolUsePromptTokensDetails != null) {
      if (Array.isArray(fromToolUsePromptTokensDetails)) {
        setValueByPath(toObject, ["toolUsePromptTokensDetails"], fromToolUsePromptTokensDetails.map((item) => {
          return modalityTokenCountFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["toolUsePromptTokensDetails"], fromToolUsePromptTokensDetails);
      }
    }
    const fromResponseTokensDetails = getValueByPath(fromObject, [
      "candidatesTokensDetails"
    ]);
    if (fromResponseTokensDetails != null) {
      if (Array.isArray(fromResponseTokensDetails)) {
        setValueByPath(toObject, ["responseTokensDetails"], fromResponseTokensDetails.map((item) => {
          return modalityTokenCountFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["responseTokensDetails"], fromResponseTokensDetails);
      }
    }
    const fromTrafficType = getValueByPath(fromObject, ["trafficType"]);
    if (fromTrafficType != null) {
      setValueByPath(toObject, ["trafficType"], fromTrafficType);
    }
    return toObject;
  }
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
  function getOperationParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromOperationName = getValueByPath(fromObject, [
      "operationName"
    ]);
    if (fromOperationName != null) {
      setValueByPath(toObject, ["_url", "operationName"], fromOperationName);
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function getOperationParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromOperationName = getValueByPath(fromObject, [
      "operationName"
    ]);
    if (fromOperationName != null) {
      setValueByPath(toObject, ["_url", "operationName"], fromOperationName);
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function fetchPredictOperationParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromOperationName = getValueByPath(fromObject, [
      "operationName"
    ]);
    if (fromOperationName != null) {
      setValueByPath(toObject, ["operationName"], fromOperationName);
    }
    const fromResourceName = getValueByPath(fromObject, ["resourceName"]);
    if (fromResourceName != null) {
      setValueByPath(toObject, ["_url", "resourceName"], fromResourceName);
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function videoFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromUri = getValueByPath(fromObject, ["video", "uri"]);
    if (fromUri != null) {
      setValueByPath(toObject, ["uri"], fromUri);
    }
    const fromVideoBytes = getValueByPath(fromObject, [
      "video",
      "encodedVideo"
    ]);
    if (fromVideoBytes != null) {
      setValueByPath(toObject, ["videoBytes"], tBytes(apiClient, fromVideoBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["encoding"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function generatedVideoFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromVideo = getValueByPath(fromObject, ["_self"]);
    if (fromVideo != null) {
      setValueByPath(toObject, ["video"], videoFromMldev(apiClient, fromVideo));
    }
    return toObject;
  }
  function generateVideosResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromGeneratedVideos = getValueByPath(fromObject, [
      "generatedSamples"
    ]);
    if (fromGeneratedVideos != null) {
      if (Array.isArray(fromGeneratedVideos)) {
        setValueByPath(toObject, ["generatedVideos"], fromGeneratedVideos.map((item) => {
          return generatedVideoFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["generatedVideos"], fromGeneratedVideos);
      }
    }
    const fromRaiMediaFilteredCount = getValueByPath(fromObject, [
      "raiMediaFilteredCount"
    ]);
    if (fromRaiMediaFilteredCount != null) {
      setValueByPath(toObject, ["raiMediaFilteredCount"], fromRaiMediaFilteredCount);
    }
    const fromRaiMediaFilteredReasons = getValueByPath(fromObject, [
      "raiMediaFilteredReasons"
    ]);
    if (fromRaiMediaFilteredReasons != null) {
      setValueByPath(toObject, ["raiMediaFilteredReasons"], fromRaiMediaFilteredReasons);
    }
    return toObject;
  }
  function generateVideosOperationFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromMetadata = getValueByPath(fromObject, ["metadata"]);
    if (fromMetadata != null) {
      setValueByPath(toObject, ["metadata"], fromMetadata);
    }
    const fromDone = getValueByPath(fromObject, ["done"]);
    if (fromDone != null) {
      setValueByPath(toObject, ["done"], fromDone);
    }
    const fromError = getValueByPath(fromObject, ["error"]);
    if (fromError != null) {
      setValueByPath(toObject, ["error"], fromError);
    }
    const fromResponse = getValueByPath(fromObject, [
      "response",
      "generateVideoResponse"
    ]);
    if (fromResponse != null) {
      setValueByPath(toObject, ["response"], generateVideosResponseFromMldev(apiClient, fromResponse));
    }
    const fromResult = getValueByPath(fromObject, [
      "response",
      "generateVideoResponse"
    ]);
    if (fromResult != null) {
      setValueByPath(toObject, ["result"], generateVideosResponseFromMldev(apiClient, fromResult));
    }
    return toObject;
  }
  function videoFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromUri = getValueByPath(fromObject, ["gcsUri"]);
    if (fromUri != null) {
      setValueByPath(toObject, ["uri"], fromUri);
    }
    const fromVideoBytes = getValueByPath(fromObject, [
      "bytesBase64Encoded"
    ]);
    if (fromVideoBytes != null) {
      setValueByPath(toObject, ["videoBytes"], tBytes(apiClient, fromVideoBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function generatedVideoFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVideo = getValueByPath(fromObject, ["_self"]);
    if (fromVideo != null) {
      setValueByPath(toObject, ["video"], videoFromVertex(apiClient, fromVideo));
    }
    return toObject;
  }
  function generateVideosResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGeneratedVideos = getValueByPath(fromObject, ["videos"]);
    if (fromGeneratedVideos != null) {
      if (Array.isArray(fromGeneratedVideos)) {
        setValueByPath(toObject, ["generatedVideos"], fromGeneratedVideos.map((item) => {
          return generatedVideoFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["generatedVideos"], fromGeneratedVideos);
      }
    }
    const fromRaiMediaFilteredCount = getValueByPath(fromObject, [
      "raiMediaFilteredCount"
    ]);
    if (fromRaiMediaFilteredCount != null) {
      setValueByPath(toObject, ["raiMediaFilteredCount"], fromRaiMediaFilteredCount);
    }
    const fromRaiMediaFilteredReasons = getValueByPath(fromObject, [
      "raiMediaFilteredReasons"
    ]);
    if (fromRaiMediaFilteredReasons != null) {
      setValueByPath(toObject, ["raiMediaFilteredReasons"], fromRaiMediaFilteredReasons);
    }
    return toObject;
  }
  function generateVideosOperationFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromMetadata = getValueByPath(fromObject, ["metadata"]);
    if (fromMetadata != null) {
      setValueByPath(toObject, ["metadata"], fromMetadata);
    }
    const fromDone = getValueByPath(fromObject, ["done"]);
    if (fromDone != null) {
      setValueByPath(toObject, ["done"], fromDone);
    }
    const fromError = getValueByPath(fromObject, ["error"]);
    if (fromError != null) {
      setValueByPath(toObject, ["error"], fromError);
    }
    const fromResponse = getValueByPath(fromObject, ["response"]);
    if (fromResponse != null) {
      setValueByPath(toObject, ["response"], generateVideosResponseFromVertex(apiClient, fromResponse));
    }
    const fromResult = getValueByPath(fromObject, ["response"]);
    if (fromResult != null) {
      setValueByPath(toObject, ["result"], generateVideosResponseFromVertex(apiClient, fromResult));
    }
    return toObject;
  }
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
  var BaseModule, PagedItem, Pager, Outcome, Language, Type, HarmCategory, HarmBlockMethod, HarmBlockThreshold, Mode, FinishReason, HarmProbability, HarmSeverity, BlockedReason, TrafficType, Modality, MediaResolution, DynamicRetrievalConfigMode, FunctionCallingConfigMode, SafetyFilterLevel, PersonGeneration, ImagePromptLanguage, FileState, FileSource, MaskReferenceMode, ControlReferenceType, SubjectReferenceType, MediaModality, StartSensitivity, EndSensitivity, ActivityHandling, TurnCoverage, GenerateContentResponse, EmbedContentResponse, GenerateImagesResponse, CountTokensResponse, ComputeTokensResponse, DeleteCachedContentResponse, ListCachedContentsResponse, ListFilesResponse, HttpResponse, CreateFileResponse, DeleteFileResponse, Caches, Chats, Chat, Files, FUNCTION_RESPONSE_REQUIRES_ID, Live, defaultLiveSendClientContentParamerters, Session2, Models, Operations, CONTENT_TYPE_HEADER, SERVER_TIMEOUT_HEADER, USER_AGENT_HEADER, GOOGLE_API_CLIENT_HEADER, SDK_VERSION, LIBRARY_LABEL, VERTEX_AI_API_DEFAULT_VERSION, GOOGLE_AI_API_DEFAULT_VERSION, responseLineRE, ClientError, ServerError, ApiClient, MAX_CHUNK_SIZE, BrowserUploader, BrowserWebSocketFactory, BrowserWebSocket, GOOGLE_API_KEY_HEADER, WebAuth, LANGUAGE_LABEL_PREFIX, GoogleGenAI;
  var init_web = __esm({
    "node_modules/@google/genai/dist/web/index.mjs"() {
      BaseModule = class {
      };
      (function(PagedItem2) {
        PagedItem2["PAGED_ITEM_BATCH_JOBS"] = "batchJobs";
        PagedItem2["PAGED_ITEM_MODELS"] = "models";
        PagedItem2["PAGED_ITEM_TUNING_JOBS"] = "tuningJobs";
        PagedItem2["PAGED_ITEM_FILES"] = "files";
        PagedItem2["PAGED_ITEM_CACHED_CONTENTS"] = "cachedContents";
      })(PagedItem || (PagedItem = {}));
      Pager = class {
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
      (function(Outcome2) {
        Outcome2["OUTCOME_UNSPECIFIED"] = "OUTCOME_UNSPECIFIED";
        Outcome2["OUTCOME_OK"] = "OUTCOME_OK";
        Outcome2["OUTCOME_FAILED"] = "OUTCOME_FAILED";
        Outcome2["OUTCOME_DEADLINE_EXCEEDED"] = "OUTCOME_DEADLINE_EXCEEDED";
      })(Outcome || (Outcome = {}));
      (function(Language2) {
        Language2["LANGUAGE_UNSPECIFIED"] = "LANGUAGE_UNSPECIFIED";
        Language2["PYTHON"] = "PYTHON";
      })(Language || (Language = {}));
      (function(Type2) {
        Type2["TYPE_UNSPECIFIED"] = "TYPE_UNSPECIFIED";
        Type2["STRING"] = "STRING";
        Type2["NUMBER"] = "NUMBER";
        Type2["INTEGER"] = "INTEGER";
        Type2["BOOLEAN"] = "BOOLEAN";
        Type2["ARRAY"] = "ARRAY";
        Type2["OBJECT"] = "OBJECT";
      })(Type || (Type = {}));
      (function(HarmCategory2) {
        HarmCategory2["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
        HarmCategory2["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
        HarmCategory2["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
        HarmCategory2["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
        HarmCategory2["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
        HarmCategory2["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
      })(HarmCategory || (HarmCategory = {}));
      (function(HarmBlockMethod2) {
        HarmBlockMethod2["HARM_BLOCK_METHOD_UNSPECIFIED"] = "HARM_BLOCK_METHOD_UNSPECIFIED";
        HarmBlockMethod2["SEVERITY"] = "SEVERITY";
        HarmBlockMethod2["PROBABILITY"] = "PROBABILITY";
      })(HarmBlockMethod || (HarmBlockMethod = {}));
      (function(HarmBlockThreshold2) {
        HarmBlockThreshold2["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
        HarmBlockThreshold2["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
        HarmBlockThreshold2["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
        HarmBlockThreshold2["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
        HarmBlockThreshold2["BLOCK_NONE"] = "BLOCK_NONE";
        HarmBlockThreshold2["OFF"] = "OFF";
      })(HarmBlockThreshold || (HarmBlockThreshold = {}));
      (function(Mode2) {
        Mode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
        Mode2["MODE_DYNAMIC"] = "MODE_DYNAMIC";
      })(Mode || (Mode = {}));
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
      (function(HarmProbability2) {
        HarmProbability2["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
        HarmProbability2["NEGLIGIBLE"] = "NEGLIGIBLE";
        HarmProbability2["LOW"] = "LOW";
        HarmProbability2["MEDIUM"] = "MEDIUM";
        HarmProbability2["HIGH"] = "HIGH";
      })(HarmProbability || (HarmProbability = {}));
      (function(HarmSeverity2) {
        HarmSeverity2["HARM_SEVERITY_UNSPECIFIED"] = "HARM_SEVERITY_UNSPECIFIED";
        HarmSeverity2["HARM_SEVERITY_NEGLIGIBLE"] = "HARM_SEVERITY_NEGLIGIBLE";
        HarmSeverity2["HARM_SEVERITY_LOW"] = "HARM_SEVERITY_LOW";
        HarmSeverity2["HARM_SEVERITY_MEDIUM"] = "HARM_SEVERITY_MEDIUM";
        HarmSeverity2["HARM_SEVERITY_HIGH"] = "HARM_SEVERITY_HIGH";
      })(HarmSeverity || (HarmSeverity = {}));
      (function(BlockedReason2) {
        BlockedReason2["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
        BlockedReason2["SAFETY"] = "SAFETY";
        BlockedReason2["OTHER"] = "OTHER";
        BlockedReason2["BLOCKLIST"] = "BLOCKLIST";
        BlockedReason2["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
      })(BlockedReason || (BlockedReason = {}));
      (function(TrafficType2) {
        TrafficType2["TRAFFIC_TYPE_UNSPECIFIED"] = "TRAFFIC_TYPE_UNSPECIFIED";
        TrafficType2["ON_DEMAND"] = "ON_DEMAND";
        TrafficType2["PROVISIONED_THROUGHPUT"] = "PROVISIONED_THROUGHPUT";
      })(TrafficType || (TrafficType = {}));
      (function(Modality2) {
        Modality2["MODALITY_UNSPECIFIED"] = "MODALITY_UNSPECIFIED";
        Modality2["TEXT"] = "TEXT";
        Modality2["IMAGE"] = "IMAGE";
        Modality2["AUDIO"] = "AUDIO";
      })(Modality || (Modality = {}));
      (function(MediaResolution2) {
        MediaResolution2["MEDIA_RESOLUTION_UNSPECIFIED"] = "MEDIA_RESOLUTION_UNSPECIFIED";
        MediaResolution2["MEDIA_RESOLUTION_LOW"] = "MEDIA_RESOLUTION_LOW";
        MediaResolution2["MEDIA_RESOLUTION_MEDIUM"] = "MEDIA_RESOLUTION_MEDIUM";
        MediaResolution2["MEDIA_RESOLUTION_HIGH"] = "MEDIA_RESOLUTION_HIGH";
      })(MediaResolution || (MediaResolution = {}));
      (function(DynamicRetrievalConfigMode2) {
        DynamicRetrievalConfigMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
        DynamicRetrievalConfigMode2["MODE_DYNAMIC"] = "MODE_DYNAMIC";
      })(DynamicRetrievalConfigMode || (DynamicRetrievalConfigMode = {}));
      (function(FunctionCallingConfigMode2) {
        FunctionCallingConfigMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
        FunctionCallingConfigMode2["AUTO"] = "AUTO";
        FunctionCallingConfigMode2["ANY"] = "ANY";
        FunctionCallingConfigMode2["NONE"] = "NONE";
      })(FunctionCallingConfigMode || (FunctionCallingConfigMode = {}));
      (function(SafetyFilterLevel2) {
        SafetyFilterLevel2["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
        SafetyFilterLevel2["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
        SafetyFilterLevel2["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
        SafetyFilterLevel2["BLOCK_NONE"] = "BLOCK_NONE";
      })(SafetyFilterLevel || (SafetyFilterLevel = {}));
      (function(PersonGeneration2) {
        PersonGeneration2["DONT_ALLOW"] = "DONT_ALLOW";
        PersonGeneration2["ALLOW_ADULT"] = "ALLOW_ADULT";
        PersonGeneration2["ALLOW_ALL"] = "ALLOW_ALL";
      })(PersonGeneration || (PersonGeneration = {}));
      (function(ImagePromptLanguage2) {
        ImagePromptLanguage2["auto"] = "auto";
        ImagePromptLanguage2["en"] = "en";
        ImagePromptLanguage2["ja"] = "ja";
        ImagePromptLanguage2["ko"] = "ko";
        ImagePromptLanguage2["hi"] = "hi";
      })(ImagePromptLanguage || (ImagePromptLanguage = {}));
      (function(FileState2) {
        FileState2["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
        FileState2["PROCESSING"] = "PROCESSING";
        FileState2["ACTIVE"] = "ACTIVE";
        FileState2["FAILED"] = "FAILED";
      })(FileState || (FileState = {}));
      (function(FileSource2) {
        FileSource2["SOURCE_UNSPECIFIED"] = "SOURCE_UNSPECIFIED";
        FileSource2["UPLOADED"] = "UPLOADED";
        FileSource2["GENERATED"] = "GENERATED";
      })(FileSource || (FileSource = {}));
      (function(MaskReferenceMode2) {
        MaskReferenceMode2["MASK_MODE_DEFAULT"] = "MASK_MODE_DEFAULT";
        MaskReferenceMode2["MASK_MODE_USER_PROVIDED"] = "MASK_MODE_USER_PROVIDED";
        MaskReferenceMode2["MASK_MODE_BACKGROUND"] = "MASK_MODE_BACKGROUND";
        MaskReferenceMode2["MASK_MODE_FOREGROUND"] = "MASK_MODE_FOREGROUND";
        MaskReferenceMode2["MASK_MODE_SEMANTIC"] = "MASK_MODE_SEMANTIC";
      })(MaskReferenceMode || (MaskReferenceMode = {}));
      (function(ControlReferenceType2) {
        ControlReferenceType2["CONTROL_TYPE_DEFAULT"] = "CONTROL_TYPE_DEFAULT";
        ControlReferenceType2["CONTROL_TYPE_CANNY"] = "CONTROL_TYPE_CANNY";
        ControlReferenceType2["CONTROL_TYPE_SCRIBBLE"] = "CONTROL_TYPE_SCRIBBLE";
        ControlReferenceType2["CONTROL_TYPE_FACE_MESH"] = "CONTROL_TYPE_FACE_MESH";
      })(ControlReferenceType || (ControlReferenceType = {}));
      (function(SubjectReferenceType2) {
        SubjectReferenceType2["SUBJECT_TYPE_DEFAULT"] = "SUBJECT_TYPE_DEFAULT";
        SubjectReferenceType2["SUBJECT_TYPE_PERSON"] = "SUBJECT_TYPE_PERSON";
        SubjectReferenceType2["SUBJECT_TYPE_ANIMAL"] = "SUBJECT_TYPE_ANIMAL";
        SubjectReferenceType2["SUBJECT_TYPE_PRODUCT"] = "SUBJECT_TYPE_PRODUCT";
      })(SubjectReferenceType || (SubjectReferenceType = {}));
      (function(MediaModality2) {
        MediaModality2["MODALITY_UNSPECIFIED"] = "MODALITY_UNSPECIFIED";
        MediaModality2["TEXT"] = "TEXT";
        MediaModality2["IMAGE"] = "IMAGE";
        MediaModality2["VIDEO"] = "VIDEO";
        MediaModality2["AUDIO"] = "AUDIO";
        MediaModality2["DOCUMENT"] = "DOCUMENT";
      })(MediaModality || (MediaModality = {}));
      (function(StartSensitivity2) {
        StartSensitivity2["START_SENSITIVITY_UNSPECIFIED"] = "START_SENSITIVITY_UNSPECIFIED";
        StartSensitivity2["START_SENSITIVITY_HIGH"] = "START_SENSITIVITY_HIGH";
        StartSensitivity2["START_SENSITIVITY_LOW"] = "START_SENSITIVITY_LOW";
      })(StartSensitivity || (StartSensitivity = {}));
      (function(EndSensitivity2) {
        EndSensitivity2["END_SENSITIVITY_UNSPECIFIED"] = "END_SENSITIVITY_UNSPECIFIED";
        EndSensitivity2["END_SENSITIVITY_HIGH"] = "END_SENSITIVITY_HIGH";
        EndSensitivity2["END_SENSITIVITY_LOW"] = "END_SENSITIVITY_LOW";
      })(EndSensitivity || (EndSensitivity = {}));
      (function(ActivityHandling2) {
        ActivityHandling2["ACTIVITY_HANDLING_UNSPECIFIED"] = "ACTIVITY_HANDLING_UNSPECIFIED";
        ActivityHandling2["START_OF_ACTIVITY_INTERRUPTS"] = "START_OF_ACTIVITY_INTERRUPTS";
        ActivityHandling2["NO_INTERRUPTION"] = "NO_INTERRUPTION";
      })(ActivityHandling || (ActivityHandling = {}));
      (function(TurnCoverage2) {
        TurnCoverage2["TURN_COVERAGE_UNSPECIFIED"] = "TURN_COVERAGE_UNSPECIFIED";
        TurnCoverage2["TURN_INCLUDES_ONLY_ACTIVITY"] = "TURN_INCLUDES_ONLY_ACTIVITY";
        TurnCoverage2["TURN_INCLUDES_ALL_INPUT"] = "TURN_INCLUDES_ALL_INPUT";
      })(TurnCoverage || (TurnCoverage = {}));
      GenerateContentResponse = class {
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
      EmbedContentResponse = class {
      };
      GenerateImagesResponse = class {
      };
      CountTokensResponse = class {
      };
      ComputeTokensResponse = class {
      };
      DeleteCachedContentResponse = class {
      };
      ListCachedContentsResponse = class {
      };
      ListFilesResponse = class {
      };
      HttpResponse = class {
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
      CreateFileResponse = class {
      };
      DeleteFileResponse = class {
      };
      Caches = class extends BaseModule {
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
      Chats = class {
        constructor(modelsModule, apiClient) {
          this.modelsModule = modelsModule;
          this.apiClient = apiClient;
        }
        create(params) {
          return new Chat(this.apiClient, this.modelsModule, params.model, params.config, params.history);
        }
      };
      Chat = class {
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
      Files = class extends BaseModule {
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
      FUNCTION_RESPONSE_REQUIRES_ID = "FunctionResponse request must have an `id` field from the response of a ToolCall.FunctionalCalls in Google AI.";
      Live = class {
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
      defaultLiveSendClientContentParamerters = {
        turnComplete: true
      };
      Session2 = class {
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
          clientMessage = {
            realtimeInput: {
              mediaChunks: [params.media],
              activityStart: params.activityStart,
              activityEnd: params.activityEnd
            }
          };
          return clientMessage;
        }
        tLiveClienttToolResponse(apiClient, params) {
          let functionResponses = [];
          if (params.functionResponses == null) {
            throw new Error("functionResponses is required.");
          }
          if (!Array.isArray(params.functionResponses)) {
            functionResponses = [params.functionResponses];
          } else {
            functionResponses = params.functionResponses;
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
      Models = class extends BaseModule {
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
        async get(params) {
          var _a2, _b;
          let response;
          let path = "";
          let queryParams = {};
          if (this.apiClient.isVertexAI()) {
            const body = getModelParametersToVertex(this.apiClient, params);
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
              const resp = modelFromVertex(this.apiClient, apiResponse);
              return resp;
            });
          } else {
            const body = getModelParametersToMldev(this.apiClient, params);
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
              const resp = modelFromMldev(this.apiClient, apiResponse);
              return resp;
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
        async generateVideos(params) {
          var _a2, _b;
          let response;
          let path = "";
          let queryParams = {};
          if (this.apiClient.isVertexAI()) {
            const body = generateVideosParametersToVertex(this.apiClient, params);
            path = formatMap("{model}:predictLongRunning", body["_url"]);
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
              const resp = generateVideosOperationFromVertex$1(this.apiClient, apiResponse);
              return resp;
            });
          } else {
            const body = generateVideosParametersToMldev(this.apiClient, params);
            path = formatMap("{model}:predictLongRunning", body["_url"]);
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
              const resp = generateVideosOperationFromMldev$1(this.apiClient, apiResponse);
              return resp;
            });
          }
        }
      };
      Operations = class extends BaseModule {
        constructor(apiClient) {
          super();
          this.apiClient = apiClient;
        }
        async getVideosOperation(parameters) {
          const operation = parameters.operation;
          const config = parameters.config;
          if (operation.name === void 0 || operation.name === "") {
            throw new Error("Operation name is required.");
          }
          if (this.apiClient.isVertexAI()) {
            const resourceName2 = operation.name.split("/operations/")[0];
            var httpOptions = void 0;
            if (config && "httpOptions" in config) {
              httpOptions = config.httpOptions;
            }
            return this.fetchPredictVideosOperationInternal({
              operationName: operation.name,
              resourceName: resourceName2,
              config: { httpOptions }
            });
          } else {
            return this.getVideosOperationInternal({
              operationName: operation.name,
              config
            });
          }
        }
        async getVideosOperationInternal(params) {
          var _a2, _b;
          let response;
          let path = "";
          let queryParams = {};
          if (this.apiClient.isVertexAI()) {
            const body = getOperationParametersToVertex(this.apiClient, params);
            path = formatMap("{operationName}", body["_url"]);
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
              const resp = generateVideosOperationFromVertex(this.apiClient, apiResponse);
              return resp;
            });
          } else {
            const body = getOperationParametersToMldev(this.apiClient, params);
            path = formatMap("{operationName}", body["_url"]);
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
              const resp = generateVideosOperationFromMldev(this.apiClient, apiResponse);
              return resp;
            });
          }
        }
        async fetchPredictVideosOperationInternal(params) {
          var _a2;
          let response;
          let path = "";
          let queryParams = {};
          if (this.apiClient.isVertexAI()) {
            const body = fetchPredictOperationParametersToVertex(this.apiClient, params);
            path = formatMap("{resourceName}:fetchPredictOperation", body["_url"]);
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
              const resp = generateVideosOperationFromVertex(this.apiClient, apiResponse);
              return resp;
            });
          } else {
            throw new Error("This method is only supported by the Vertex AI.");
          }
        }
      };
      CONTENT_TYPE_HEADER = "Content-Type";
      SERVER_TIMEOUT_HEADER = "X-Server-Timeout";
      USER_AGENT_HEADER = "User-Agent";
      GOOGLE_API_CLIENT_HEADER = "x-goog-api-client";
      SDK_VERSION = "0.8.0";
      LIBRARY_LABEL = `google-genai-sdk/${SDK_VERSION}`;
      VERTEX_AI_API_DEFAULT_VERSION = "v1beta1";
      GOOGLE_AI_API_DEFAULT_VERSION = "v1beta";
      responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
      ClientError = class extends Error {
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
      ServerError = class extends Error {
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
      ApiClient = class {
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
        constructUrl(path, httpOptions, prependProjectLocation) {
          const urlElement = [this.getRequestUrlInternal(httpOptions)];
          if (prependProjectLocation) {
            urlElement.push(this.getBaseResourcePath());
          }
          if (path !== "") {
            urlElement.push(path);
          }
          const url = new URL(`${urlElement.join("/")}`);
          return url;
        }
        shouldPrependVertexProjectPath(request) {
          if (this.clientOptions.apiKey) {
            return false;
          }
          if (!this.clientOptions.vertexai) {
            return false;
          }
          if (request.path.startsWith("projects/")) {
            return false;
          }
          if (request.httpMethod === "GET" && request.path.startsWith("publishers/google/models")) {
            return false;
          }
          return true;
        }
        async request(request) {
          let patchedHttpOptions = this.clientOptions.httpOptions;
          if (request.httpOptions) {
            patchedHttpOptions = this.patchHttpOptions(this.clientOptions.httpOptions, request.httpOptions);
          }
          const prependProjectLocation = this.shouldPrependVertexProjectPath(request);
          const url = this.constructUrl(request.path, patchedHttpOptions, prependProjectLocation);
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
          const prependProjectLocation = this.shouldPrependVertexProjectPath(request);
          const url = this.constructUrl(request.path, patchedHttpOptions, prependProjectLocation);
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
            if (httpOptions.timeout && httpOptions.timeout > 0) {
              headers.append(SERVER_TIMEOUT_HEADER, String(Math.ceil(httpOptions.timeout / 1e3)));
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
          fileToUpload.sizeBytes = String(fileStat.size);
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
      MAX_CHUNK_SIZE = 1024 * 1024 * 8;
      BrowserUploader = class {
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
      BrowserWebSocketFactory = class {
        create(url, headers, callbacks) {
          return new BrowserWebSocket(url, headers, callbacks);
        }
      };
      BrowserWebSocket = class {
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
      GOOGLE_API_KEY_HEADER = "x-goog-api-key";
      WebAuth = class {
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
      LANGUAGE_LABEL_PREFIX = "gl-node/";
      GoogleGenAI = class {
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
          this.operations = new Operations(this.apiClient);
        }
      };
    }
  });

  // src/utils/Lyrics/ai.ts
  async function getPhoneticLyrics(lyricsJson, hasKanji, hasKorean, lyricsOnly) {
    if (hasKanji) {
      if (storage_default.get("enable_romaji") === "true") {
        return await generateRomaji(lyricsJson, lyricsOnly);
      } else {
        return await generateFurigana(lyricsJson, lyricsOnly);
      }
    } else if (hasKorean) {
      return await generateRomaja(lyricsJson, lyricsOnly);
    } else {
      return lyricsJson;
    }
  }
  async function fetchTranslationsWithGemini(lyricsOnly) {
    if (storage_default.get("disable_translation") === "true") {
      console.log("Amai Lyrics: Translation disabled");
      return lyricsOnly.map(() => "");
    }
    try {
      console.log("[Amai Lyrics] Translation fetch started");
      const geminiApiKey = storage_default.get("GEMINI_API_KEY")?.toString();
      if (!geminiApiKey || geminiApiKey === "") {
        console.error("Amai Lyrics: Gemini API Key missing for translation");
        return lyricsOnly.map(() => "");
      }
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const generationConfig = createGeminiConfig(Defaults_default.systemInstruction, 0.85);
      const targetLang = storage_default.get("translation_language")?.toString() || Defaults_default.translationLanguage;
      const prompt = createTranslationPrompt(targetLang);
      const response = await ai.models.generateContent({
        config: generationConfig,
        model: AI_MODELS.TRANSLATION,
        contents: `${prompt}${JSON.stringify(lyricsOnly)}`
      });
      try {
        const translations = JSON.parse(response.text.replace(/\\n/g, ""));
        return translations.lines || lyricsOnly.map(() => "");
      } catch (parseError) {
        console.error("Amai Lyrics: Error parsing translation response", parseError);
        return lyricsOnly.map(() => "");
      }
    } catch (error) {
      console.error("Amai Lyrics: Translation fetch error", error);
      return [];
    }
  }
  function createTranslationPrompt(targetLang) {
    const escapedLang = targetLang.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return Defaults_default.translationPrompt.replace(/{language}/g, escapedLang) + ` Translate the following lyrics into ${targetLang}:
`;
  }
  function createGeminiConfig(systemInstruction, temperature) {
    return {
      temperature,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseModalities: [],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lines: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      },
      systemInstruction,
      thinkingConfig: {
        thinkingBudget: 1024
      }
    };
  }
  async function generateFurigana(lyricsJson, lyricsOnly) {
    return await generateLyricsWithPrompt(lyricsJson, lyricsOnly, Defaults_default.furiganaPrompt);
  }
  async function generateRomaja(lyricsJson, lyricsOnly) {
    return await generateLyricsWithPrompt(lyricsJson, lyricsOnly, Defaults_default.romajaPrompt);
  }
  async function generateRomaji(lyricsJson, lyricsOnly) {
    return await generateLyricsWithPrompt(lyricsJson, lyricsOnly, Defaults_default.romajiPrompt);
  }
  async function generateLyricsWithPrompt(lyricsJson, lyricsOnly, prompt) {
    if (!await checkGeminiAPIKey(lyricsJson)) {
      return lyricsJson;
    }
    return await processLyricsWithGemini(lyricsJson, lyricsOnly, Defaults_default.systemInstruction, prompt);
  }
  async function checkGeminiAPIKey(lyricsJson) {
    const geminiApiKey = storage_default.get("GEMINI_API_KEY")?.toString();
    if (!geminiApiKey || geminiApiKey === "") {
      console.error("Amai Lyrics: Gemini API Key missing");
      lyricsJson.Info = "Amai Lyrics: Gemini API Key missing. Click here to add your own API key.";
      return false;
    }
    return true;
  }
  async function processLyricsWithGemini(lyricsJson, lyricsOnly, systemInstruction, prompt) {
    try {
      const geminiApiKey = storage_default.get("GEMINI_API_KEY")?.toString();
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const generationConfig = createGeminiConfig(systemInstruction, 0.258);
      if (lyricsOnly.length === 0)
        return lyricsJson;
      const makeRequest = async () => {
        const response = await ai.models.generateContent({
          config: generationConfig,
          model: AI_MODELS.PHONETIC,
          contents: `${prompt} Here are the lyrics:
${JSON.stringify(lyricsOnly)}`
        });
        return response.text;
      };
      let retries = 2;
      let lines;
      while (retries >= 0) {
        try {
          const responseText = await makeRequest();
          const parsed = JSON.parse(responseText.replace(/\\n/g, ""));
          if (parsed && Array.isArray(parsed.lines)) {
            lines = parsed.lines;
            break;
          } else {
            if (retries === 0) {
              console.error("Amai Lyrics: Invalid response format", parsed);
            }
          }
        } catch (err2) {
          if (retries === 0) {
            console.error("Amai Lyrics: Error parsing response", err2);
          }
        }
        retries--;
      }
      if (lines) {
        updateLyricsText(lyricsJson, lines);
      }
    } catch (error) {
      console.error("Amai Lyrics:", error);
      lyricsJson.Info = "Amai Lyrics: Fetch Error. Please double check your API key. Click here to open settings page.";
    }
    return lyricsJson;
  }
  function updateLyricsText(lyricsJson, lines) {
    if (lyricsJson.Type === "Line" && lyricsJson.Content) {
      lyricsJson.Content = lyricsJson.Content.map((item, index) => ({
        ...item,
        Text: lines[index] || item.Text
      }));
    } else if (lyricsJson.Type === "Static" && lyricsJson.Lines) {
      lyricsJson.Lines = lyricsJson.Lines.map((item, index) => ({
        ...item,
        Text: lines[index] || item.Text
      }));
    }
  }
  var AI_MODELS;
  var init_ai = __esm({
    "src/utils/Lyrics/ai.ts"() {
      init_storage();
      init_Defaults();
      init_web();
      AI_MODELS = {
        TRANSLATION: "gemini-2.5-flash-lite",
        PHONETIC: "gemini-2.5-flash"
      };
    }
  });

  // src/utils/Lyrics/conversion.ts
  function convertLyrics(data) {
    console.log("Converting Syllable to Line type");
    return data.map((item) => {
      let leadText = "";
      let prevIsJapanese = null;
      if (!item.Lead || !item.Lead.Syllables || !Array.isArray(item.Lead.Syllables)) {
        console.error("Amai Lyrics: Invalid lyrics structure", item);
        return {
          Type: item.Type,
          OppositeAligned: item.OppositeAligned,
          Text: "",
          StartTime: 0,
          EndTime: 0
        };
      }
      let i = 0;
      while (i < item.Lead.Syllables.length) {
        let syl = item.Lead.Syllables[i];
        let word = syl.Text;
        while (syl.IsPartOfWord && i + 1 < item.Lead.Syllables.length) {
          i++;
          syl = item.Lead.Syllables[i];
          word += syl.Text;
          if (!syl.IsPartOfWord)
            break;
        }
        if (JAPANESE_REGEX.test(word)) {
          if (prevIsJapanese === false && leadText) {
            leadText += " ";
          }
          leadText += word;
          prevIsJapanese = true;
        } else {
          leadText += (leadText ? " " : "") + word;
          prevIsJapanese = false;
        }
        i++;
      }
      let startTime = item.Lead.StartTime;
      let endTime = item.Lead.EndTime;
      let fullText = leadText;
      if (item.Background && Array.isArray(item.Background)) {
        const bgTexts = item.Background.map((bg) => {
          if (typeof bg.StartTime === "number") {
            startTime = Math.min(startTime, bg.StartTime);
          }
          if (typeof bg.EndTime === "number") {
            endTime = Math.max(endTime, bg.EndTime);
          }
          let bgText = "";
          let prevIsJapanese2 = null;
          if (!bg.Syllables || !Array.isArray(bg.Syllables)) {
            return "";
          }
          let i2 = 0;
          while (i2 < bg.Syllables.length) {
            let syl = bg.Syllables[i2];
            let word = syl.Text;
            while (syl.IsPartOfWord && i2 + 1 < bg.Syllables.length) {
              i2++;
              syl = bg.Syllables[i2];
              word += syl.Text;
              if (!syl.IsPartOfWord)
                break;
            }
            if (JAPANESE_REGEX.test(word)) {
              if (prevIsJapanese2 === false && bgText) {
                bgText += " ";
              }
              bgText += word;
              prevIsJapanese2 = true;
            } else {
              bgText += (bgText ? " " : "") + word;
              prevIsJapanese2 = false;
            }
            i2++;
          }
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
  var JAPANESE_REGEX;
  var init_conversion = __esm({
    "src/utils/Lyrics/conversion.ts"() {
      JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;
    }
  });

  // src/utils/Lyrics/processing.ts
  async function processAndEnhanceLyrics(trackId, lyricsJson) {
    const id = lyricsJson.id || trackId;
    const type = lyricsJson.Type || "Static";
    let initialLyricsData;
    if (type === "Syllable") {
      initialLyricsData = {
        id,
        Type: type,
        Content: lyricsJson.Content || [],
        Raw: lyricsJson.Raw || []
      };
    } else if (type === "Line") {
      initialLyricsData = {
        id,
        Type: type,
        Content: lyricsJson.Content || [],
        Lines: lyricsJson.Lines || [],
        Raw: lyricsJson.Raw || []
      };
    } else {
      initialLyricsData = {
        id,
        Type: type,
        Lines: lyricsJson.Lines || [],
        Raw: lyricsJson.Raw || []
      };
    }
    const { lyricsJson: preparedLyricsJson, lyricsOnly } = await prepareLyricsForGemini(initialLyricsData);
    const { hasKanji, hasKorean } = detectLanguages(preparedLyricsJson);
    const phoneticLyricsJson = JSON.parse(
      JSON.stringify(preparedLyricsJson)
    );
    const [processedLyricsJson, translations] = await Promise.all([
      getPhoneticLyrics(phoneticLyricsJson, hasKanji, hasKorean, lyricsOnly),
      fetchTranslationsWithGemini(lyricsOnly)
    ]);
    attachTranslations(processedLyricsJson, translations);
    await cacheLyrics(trackId, { ...processedLyricsJson, id });
    storage_default.set("currentlyFetching", "false");
    if (Spicetify.Player.data.item.uri?.split(":")[2] === trackId) {
      Spicetify.showNotification("Completed", false, 1e3);
      Defaults_default.CurrentLyricsType = processedLyricsJson.Type;
      storage_default.set("currentLyricsData", JSON.stringify(processedLyricsJson));
      HideLoaderContainer();
      ClearLyricsPageContainer();
    }
    return {
      ...processedLyricsJson,
      id: lyricsJson.id,
      fromCache: false
    };
  }
  function detectLanguages(lyricsJson) {
    let hasKanji = false;
    let hasKorean = false;
    if (lyricsJson.Type === "Syllable" && lyricsJson.Content) {
      hasKanji = lyricsJson.Content.some(
        (item) => item.Lead?.Syllables?.some(
          (syl) => JAPANESE_REGEX2.test(syl.Text)
        )
      );
      hasKorean = lyricsJson.Content.some(
        (item) => item.Lead?.Syllables?.some(
          (syl) => KOREAN_REGEX.test(syl.Text)
        )
      );
    } else if (lyricsJson.Type === "Line" && lyricsJson.Content) {
      hasKanji = lyricsJson.Content.some(
        (item) => JAPANESE_REGEX2.test(item.Text)
      );
      hasKorean = lyricsJson.Content.some((item) => KOREAN_REGEX.test(item.Text));
    } else if (lyricsJson.Type === "Static" && lyricsJson.Lines) {
      hasKanji = lyricsJson.Lines.some((item) => JAPANESE_REGEX2.test(item.Text));
      hasKorean = lyricsJson.Lines.some((item) => KOREAN_REGEX.test(item.Text));
    }
    return { hasKanji, hasKorean };
  }
  function attachTranslations(lyricsJson, translations) {
    if (lyricsJson.Type === "Line" && lyricsJson.Content) {
      lyricsJson.Content.forEach((line, idx) => {
        line.Translation = translations[idx] || "";
      });
    } else if (lyricsJson.Type === "Static" && lyricsJson.Lines) {
      lyricsJson.Lines.forEach((line, idx) => {
        line.Translation = translations[idx] || "";
      });
    }
  }
  async function prepareLyricsForGemini(lyricsJson) {
    if (lyricsJson.Type === "Syllable") {
      const syllableData = lyricsJson;
      const convertedContent = convertLyrics(
        syllableData.Content || []
      );
      lyricsJson = {
        ...lyricsJson,
        Type: "Line",
        Content: convertedContent
      };
    }
    const lyricsOnly = await extractLyrics(lyricsJson);
    if (lyricsOnly.length > 0) {
      lyricsJson.Raw = lyricsOnly;
    }
    return { lyricsJson, lyricsOnly };
  }
  async function extractLyrics(lyricsJson) {
    const removeEmptyLinesAndCharacters = (items) => {
      items = items.filter((item) => item.Text?.trim() !== "");
      items = items.map((item) => {
        if (item.Text) {
          item.Text = item.Text.replace(/[「」",.!]/g, "");
          item.Text = item.Text.normalize("NFKC");
        }
        return item;
      });
      return items;
    };
    if (lyricsJson.Type === "Line" && lyricsJson.Content) {
      const lineData = lyricsJson;
      lineData.Content = removeEmptyLinesAndCharacters(
        lineData.Content || []
      );
      lineData.Content = lineData.Content.map((item) => ({
        ...item,
        StartTime: Math.max(0, (item.StartTime || 0) - LYRICS_TIMING_OFFSET)
      }));
      return lineData.Content.map((item) => item.Text);
    }
    if (lyricsJson.Type === "Static" && lyricsJson.Lines) {
      const staticData = lyricsJson;
      staticData.Lines = removeEmptyLinesAndCharacters(
        staticData.Lines || []
      );
      return staticData.Lines.map((item) => item.Text);
    }
    return [];
  }
  var JAPANESE_REGEX2, KOREAN_REGEX, LYRICS_TIMING_OFFSET;
  var init_processing = __esm({
    "src/utils/Lyrics/processing.ts"() {
      init_storage();
      init_Defaults();
      init_ui();
      init_cache();
      init_ai();
      init_conversion();
      JAPANESE_REGEX2 = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;
      KOREAN_REGEX = /[\uAC00-\uD7AF]/;
      LYRICS_TIMING_OFFSET = 0.55;
    }
  });

  // src/utils/Lyrics/api.ts
  async function fetchLyricsFromAPI(trackId) {
    try {
      Spicetify.showNotification("Fetching lyrics..", false, 1e3);
      const spotifyAccessToken = await Platform_default.GetSpotifyAccessToken();
      const { response: lyricsJson, status } = await getLyrics(trackId, {
        Authorization: `Bearer ${spotifyAccessToken}`
      });
      if (status !== 200) {
        return await handleErrorStatus(status);
      }
      if (!isValidLyricsResponse(lyricsJson)) {
        return await noLyricsMessage(trackId);
      }
      return await processAndEnhanceLyrics(trackId, lyricsJson);
    } catch (error) {
      console.error(
        "Error fetching lyrics:",
        error instanceof Error ? { message: error.message, stack: error.stack } : error
      );
      storage_default.set("currentlyFetching", "false");
      ClearLyricsPageContainer();
      Spicetify.showNotification("Error loading lyrics", false, 2e3);
      return await noLyricsMessage();
    }
  }
  async function handleErrorStatus(status) {
    storage_default.set("currentlyFetching", "false");
    ClearLyricsPageContainer();
    console.warn(`Lyrics API error: HTTP status ${status}`);
    switch (status) {
      case 401:
        Spicetify.showNotification("Authentication error", false, 2e3);
        break;
      case 404:
        Spicetify.showNotification("Lyrics not found", false, 2e3);
        break;
      case 429:
        Spicetify.showNotification(
          "Rate limited, please try again later",
          false,
          2e3
        );
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        Spicetify.showNotification("Lyrics service unavailable", false, 2e3);
        break;
      default:
        Spicetify.showNotification(
          `Error fetching lyrics (${status})`,
          false,
          2e3
        );
    }
    return await noLyricsMessage();
  }
  function isValidLyricsResponse(lyricsJson) {
    if (lyricsJson === null || lyricsJson === void 0) {
      return false;
    }
    if (typeof lyricsJson === "object") {
      if (!("id" in lyricsJson)) {
        return false;
      }
      const type = lyricsJson.Type;
      if (type === "Syllable" || type === "Line") {
        const content = lyricsJson.Content;
        if (!Array.isArray(content) || content.length === 0) {
          return false;
        }
      } else if (type === "Static") {
        const lines = lyricsJson.Lines;
        if (!Array.isArray(lines) || lines.length === 0) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  var init_api = __esm({
    "src/utils/Lyrics/api.ts"() {
      init_storage();
      init_Platform();
      init_Lyrics();
      init_ui();
      init_processing();
    }
  });

  // src/utils/Lyrics/fetchLyrics.ts
  var fetchLyrics_exports = {};
  __export(fetchLyrics_exports, {
    default: () => fetchLyrics,
    lyricsCache: () => lyricsCache
  });
  async function fetchLyrics(uri) {
    resetLyricsUI();
    ClearLyricsPageContainer();
    document.querySelector("#SpicyLyricsPage .ContentBox")?.classList.remove("LyricsHidden");
    const trackId = uri.split(":")[2];
    const localLyrics = await getLyricsFromLocalStorage(trackId);
    if (localLyrics)
      return localLyrics;
    const cachedLyrics = await getLyricsFromCache(trackId);
    if (cachedLyrics)
      return cachedLyrics;
    hideRefreshButton();
    const currFetching = storage_default.get("currentlyFetching");
    if (currFetching === "true") {
      Spicetify.showNotification("Currently fetching, please wait..");
      return "Currently fetching lyrics";
    }
    storage_default.set("currentlyFetching", "true");
    ShowLoaderContainer();
    return await fetchLyricsFromAPI(trackId);
  }
  var init_fetchLyrics = __esm({
    "src/utils/Lyrics/fetchLyrics.ts"() {
      init_storage();
      init_ui();
      init_cache();
      init_api();
      init_pageButtons();
    }
  });

  // src/app.tsx
  init_lyrics();
  init_IntervalManager();
  init_SpotifyPlayer();
  init_Addons();
  init_ScrollSimplebar();
  init_storage();
  init_Whentil();

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
  init_storage();
  init_fetchLyrics();
  init_Defaults();
  init_fetchLyrics();
  init_Applyer();
  function setSettingsMenu() {
    generalSettings();
    devSettings();
    infos();
  }
  function devSettings() {
    const settings = new SettingsSection("Amai - Dev Settings", "amai-dev-settings");
    settings.addButton("remove-cached-lyrics", "Remove Cached Lyrics", "Remove Cached Lyrics", () => {
      lyricsCache.destroy();
      storage_default.set("currentLyricsData", null);
      Spicetify.showNotification("Cache Destroyed Successfully!", false, 2e3);
    });
    settings.addButton("reload", "Reload UI", "Reload", () => {
      window.location.reload();
    });
    settings.pushSettings();
  }
  function generalSettings() {
    const settings = new SettingsSection("Amai - Settings", "amai-settings");
    settings.addInput("gemini-api-key", "Gemini API Key", "", () => {
      storage_default.set("GEMINI_API_KEY", settings.getFieldValue("gemini-api-key"));
      lyricsCache.destroy();
      storage_default.set("currentLyricsData", null);
      const playerData = Spicetify.Player.data;
      if (!playerData?.item?.uri)
        return;
      const currentUri = playerData.item.uri;
      fetchLyrics(currentUri).then(ApplyLyrics);
    });
    settings.addButton("get-gemini-api", "Get your own Gemini API here", "get API Key", () => {
      window.location.href = "https://aistudio.google.com/app/apikey/";
    });
    settings.addToggle(
      "enableRomaji",
      "Enable Romaji for Japanese Lyrics",
      Defaults_default.enableRomaji,
      () => {
        lyricsCache.destroy();
        storage_default.set("currentLyricsData", null);
        storage_default.set("enable_romaji", settings.getFieldValue("enableRomaji"));
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
    settings.addDropDown(
      "translation-language",
      "Translation Language",
      [
        "English",
        "Spanish",
        "French",
        "German",
        "Portuguese",
        "Chinese (Simplified)",
        "Thai",
        "Indonesian",
        "Malay",
        "Japanese",
        "Korean"
      ],
      0,
      () => {
        const selected = settings.getFieldValue("translation-language");
        storage_default.set("translation_language", selected);
        lyricsCache.destroy();
        storage_default.set("currentLyricsData", null);
      }
    );
    settings.addToggle(
      "disableTranslation",
      "Disable Translation",
      Defaults_default.disableTranslation,
      () => {
        lyricsCache.destroy();
        storage_default.set("currentLyricsData", null);
        storage_default.set("disable_translation", settings.getFieldValue("disableTranslation"));
      }
    );
    settings.pushSettings();
  }
  function infos() {
    const settings = new SettingsSection("Amai - Info", "amai-info");
    settings.addButton(
      "more-info",
      "Enhances your Spotify experience with Furigana for Japanese Kanji, Romaji for Japanese lyrics, Romanization for Korean lyrics, and line-by-line translations powered by Google Gemini AI.",
      `v${Defaults_default.Version}`,
      () => {
        window.location.href = "https://github.com/hudzax/amai-lyrics";
      }
    );
    settings.addButton(
      "report-issue",
      "Found a bug or have a feature request?",
      "Report Issue",
      () => {
        window.location.href = "https://github.com/hudzax/amai-lyrics/issues";
      }
    );
    settings.pushSettings();
  }

  // src/managers/AppInitializer.ts
  init_Platform();
  init_cache();
  var AppInitializer = class {
    static async initializeCore() {
      lyricsCache.destroy();
      await this.injectGoogleFonts();
      await this.initializePlatformAndSettings();
    }
    static async injectGoogleFonts() {
      const fontLink = document.createElement("link");
      fontLink.rel = "preload";
      fontLink.as = "style";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Display:ital,wght@0,100..900;1,100..900&display=swap";
      document.head.appendChild(fontLink);
      fontLink.onload = () => {
        fontLink.rel = "stylesheet";
      };
    }
    static async initializePlatformAndSettings() {
      await Platform_default.OnSpotifyReady;
      setSettingsMenu();
    }
    static setupPostLoadOptimizations() {
      window.addEventListener("load", () => {
        if (window.requestIdleCallback) {
          requestIdleCallback(
            () => {
              document.querySelectorAll(".sweet-dynamic-bg").forEach((bg) => {
                bg.classList.add("sweet-dynamic-bg-loaded");
              });
            },
            { timeout: 2e3 }
          );
        } else {
          setTimeout(() => {
            document.querySelectorAll(".sweet-dynamic-bg").forEach((bg) => {
              bg.classList.add("sweet-dynamic-bg-loaded");
            });
          }, 1e3);
        }
      });
    }
    static setupSkeletonStyles() {
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
    }
  };

  // src/managers/ButtonManager.ts
  init_Icons();
  init_Session();
  init_Whentil();
  var ButtonManager = class {
    constructor() {
      this.buttonRegistered = false;
      this.button = this.createButton();
      this.setupEventListeners();
    }
    createButton() {
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
      button.tippy.setContent("Amai Lyrics");
      return button;
    }
    setupEventListeners() {
      Whentil_default.When(
        () => Spicetify.Player.data.item?.type,
        () => this.updateRegistration()
      );
    }
    updateRegistration() {
      const IsSomethingElseThanTrack = Spicetify.Player.data.item?.type !== "track";
      if (IsSomethingElseThanTrack) {
        this.button.deregister();
        this.buttonRegistered = false;
      } else {
        if (!this.buttonRegistered) {
          this.button.register();
          this.buttonRegistered = true;
        }
      }
    }
    getButton() {
      return this.button;
    }
    setActive(active) {
      this.button.active = active;
    }
  };

  // src/managers/EventManager.ts
  init_SpotifyPlayer();
  init_IntervalManager();
  init_Global();
  init_Session();
  init_Whentil();
  var EventManager = class {
    static initialize(button) {
      this.button = button;
      this.setupPlayerStateEvents();
      this.setupNavigationEvents();
      this.setupPlayerEvents();
    }
    static setupPlayerStateEvents() {
      const initialLoopState = Spicetify.Player.getRepeat();
      SpotifyPlayer.LoopType = initialLoopState === 1 ? "context" : initialLoopState === 2 ? "track" : "none";
      Global_default.Event.evoke("playback:loop", SpotifyPlayer.LoopType);
      const initialShuffleState = Spicetify.Player.origin._state.shuffle;
      const initialSmartShuffleState = Spicetify.Player.origin._state.smartShuffle;
      SpotifyPlayer.ShuffleType = initialSmartShuffleState ? "smart" : initialShuffleState ? "normal" : "none";
      Global_default.Event.evoke("playback:shuffle", SpotifyPlayer.ShuffleType);
      let lastPosition = 0;
      new IntervalManager(0.5, () => {
        const pos = SpotifyPlayer.GetTrackPosition();
        if (pos !== lastPosition) {
          Global_default.Event.evoke("playback:position", pos);
        }
        lastPosition = pos;
      }).Start();
    }
    static setupPlayerEvents() {
      Spicetify.Player.addEventListener("onplaypause", (e) => {
        SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
        Global_default.Event.evoke("playback:playpause", e);
      });
      Spicetify.Player.addEventListener(
        "onprogress",
        (e) => Global_default.Event.evoke("playback:progress", e)
      );
      Spicetify.Player.addEventListener("songchange", (e) => {
        Global_default.Event.evoke("playback:songchange", e);
        this.updatePlayerStatesOnSongChange();
      });
      Spicetify.Player.addEventListener("repeat_mode_changed", () => {
        const LoopState = Spicetify.Player.getRepeat();
        const LoopType = LoopState === 1 ? "context" : LoopState === 2 ? "track" : "none";
        if (SpotifyPlayer.LoopType !== LoopType) {
          SpotifyPlayer.LoopType = LoopType;
          Global_default.Event.evoke("playback:loop", LoopType);
        }
      });
      Spicetify.Player.addEventListener("shuffle_changed", () => {
        const shuffleState = Spicetify.Player.origin._state.shuffle;
        const smartShuffleState = Spicetify.Player.origin._state.smartShuffle;
        const ShuffleType = smartShuffleState ? "smart" : shuffleState ? "normal" : "none";
        if (SpotifyPlayer.ShuffleType !== ShuffleType) {
          SpotifyPlayer.ShuffleType = ShuffleType;
          Global_default.Event.evoke("playback:shuffle", ShuffleType);
        }
      });
    }
    static updatePlayerStatesOnSongChange() {
      const currentLoopState = Spicetify.Player.getRepeat();
      const newLoopType = currentLoopState === 1 ? "context" : currentLoopState === 2 ? "track" : "none";
      if (SpotifyPlayer.LoopType !== newLoopType) {
        SpotifyPlayer.LoopType = newLoopType;
        Global_default.Event.evoke("playback:loop", newLoopType);
      }
      const currentShuffleState = Spicetify.Player.origin._state.shuffle;
      const currentSmartShuffleState = Spicetify.Player.origin._state.smartShuffle;
      const newShuffleType = currentSmartShuffleState ? "smart" : currentShuffleState ? "normal" : "none";
      if (SpotifyPlayer.ShuffleType !== newShuffleType) {
        SpotifyPlayer.ShuffleType = newShuffleType;
        Global_default.Event.evoke("playback:shuffle", newShuffleType);
      }
    }
    static setupNavigationEvents() {
      Whentil_default.When(
        () => document.querySelector(
          ".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"
        ),
        () => {
          Global_default.Event.evoke(
            "pagecontainer:available",
            document.querySelector(
              ".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"
            )
          );
        }
      );
      Spicetify.Platform.History.listen(Session_default.RecordNavigation);
      Session_default.RecordNavigation(Spicetify.Platform.History.location);
    }
  };

  // src/managers/PageManager.ts
  init_Global();
  var PageManager = class {
    constructor(buttonManager) {
      this.lastLocation = null;
      this.buttonManager = buttonManager;
      this.setupPageNavigation();
    }
    setupPageNavigation() {
      Spicetify.Platform.History.listen((location) => {
        this.loadPage(location);
      });
      if (Spicetify.Platform.History.location.pathname === "/AmaiLyrics") {
        Global_default.Event.listen("pagecontainer:available", () => {
          this.loadPage(Spicetify.Platform.History.location);
          this.buttonManager.setActive(true);
        });
      }
    }
    async loadPage(location) {
      const { default: PageView2 } = await Promise.resolve().then(() => (init_PageView(), PageView_exports));
      if (location.pathname === "/AmaiLyrics") {
        PageView2.Open();
        this.buttonManager.setActive(true);
      } else {
        if (this.lastLocation?.pathname === "/AmaiLyrics") {
          PageView2.Destroy();
          this.buttonManager.setActive(false);
        }
      }
      this.lastLocation = location;
    }
  };

  // src/utils/sleep.ts
  async function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
  }
  var sleep_default = sleep;

  // src/managers/SongChangeManager.ts
  var SongChangeManager = class {
    constructor(buttonManager, backgroundManager) {
      this.buttonManager = buttonManager;
      this.backgroundManager = backgroundManager;
    }
    async handleSongChange(event) {
      let attempts = 0;
      const maxAttempts = 5;
      let currentUri = event?.data?.item?.uri;
      while (!currentUri && attempts < maxAttempts) {
        await sleep_default(0.1);
        currentUri = Spicetify.Player.data?.item?.uri;
        attempts++;
      }
      if (!currentUri)
        return;
      const { default: fetchLyrics2 } = await Promise.resolve().then(() => (init_fetchLyrics(), fetchLyrics_exports));
      const { default: ApplyLyrics2 } = await Promise.resolve().then(() => (init_Applyer(), Applyer_exports));
      fetchLyrics2(currentUri).then(ApplyLyrics2);
      this.buttonManager.updateRegistration();
      this.backgroundManager.apply(Spicetify.Player.data?.item?.metadata?.image_url);
      if (Spicetify.Player.data.item?.type === "track") {
        if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar")) {
          const { UpdateNowBar: UpdateNowBar2 } = await Promise.resolve().then(() => (init_NowBar2(), NowBar_exports));
          UpdateNowBar2();
        }
      }
      if (document.querySelector("#SpicyLyricsPage .LyricsContainer")) {
        const { default: PageView2 } = await Promise.resolve().then(() => (init_PageView(), PageView_exports));
        PageView2.UpdatePageContent();
        const { default: ApplyDynamicBackground2 } = await Promise.resolve().then(() => (init_dynamicBackground(), dynamicBackground_exports));
        ApplyDynamicBackground2(document.querySelector("#SpicyLyricsPage .ContentBox"));
      }
    }
  };

  // src/components/DynamicBG/NowPlayingBarBackground.ts
  var import_fastdom7 = __toESM(require_fastdom());
  var NowPlayingBarBackground = class {
    constructor() {
      this.cached = {
        nowPlayingBar: null,
        dynamicBg: null,
        lastImgUrl: null
      };
    }
    apply(coverUrl) {
      if (!coverUrl)
        return;
      if (coverUrl.startsWith("spotify:image:")) {
        const imageId = coverUrl.replace("spotify:image:", "");
        coverUrl = `https://i.scdn.co/image/${imageId}`;
      }
      try {
        if (coverUrl === this.cached.lastImgUrl && this.cached.dynamicBg)
          return;
        new Promise((resolve) => {
          import_fastdom7.default.measure(() => {
            const nowPlayingBar = document.querySelector(".Root__right-sidebar aside.NowPlayingView");
            const hasDynamicBg = !!this.cached.dynamicBg;
            const images = this.cached.dynamicBg ? {
              imgA: this.cached.dynamicBg.querySelector("#bg-img-a"),
              imgB: this.cached.dynamicBg.querySelector("#bg-img-b")
            } : null;
            resolve({ nowPlayingBar, hasDynamicBg, images });
          });
        }).then(({ nowPlayingBar, hasDynamicBg, images }) => {
          import_fastdom7.default.mutate(() => {
            if (!nowPlayingBar) {
              this.clearCache();
              return;
            }
            if (this.cached.nowPlayingBar !== nowPlayingBar) {
              this.cached.nowPlayingBar = nowPlayingBar;
            }
            if (!hasDynamicBg) {
              this.createNewBackground(nowPlayingBar, coverUrl);
            } else if (images) {
              this.updateExistingBackground(images, coverUrl);
            }
            this.cached.lastImgUrl = coverUrl;
          });
        });
      } catch (error) {
        console.error("Error Applying the Dynamic BG to the NowPlayingBar:", error);
      }
    }
    clearCache() {
      this.cached.lastImgUrl = null;
      this.cached.dynamicBg = null;
      this.cached.nowPlayingBar = null;
    }
    createNewBackground(nowPlayingBar, coverUrl) {
      this.setRandomCSSVariables();
      const dynamicBackground = document.createElement("div");
      dynamicBackground.className = "sweet-dynamic-bg";
      dynamicBackground.setAttribute("current-img", coverUrl);
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder";
      dynamicBackground.appendChild(placeholder);
      const imgA = this.createBackgroundImage(
        "bg-img-a",
        "bg-image primary active",
        coverUrl,
        "eager"
      );
      dynamicBackground.appendChild(imgA);
      const imgB = this.createBackgroundImage("bg-img-b", "bg-image secondary", "", "lazy");
      dynamicBackground.appendChild(imgB);
      nowPlayingBar.classList.add("sweet-dynamic-bg-in-this");
      nowPlayingBar.appendChild(dynamicBackground);
      imgA.onload = () => {
        requestAnimationFrame(() => {
          dynamicBackground.classList.add("sweet-dynamic-bg-loaded");
        });
      };
      this.cached.dynamicBg = dynamicBackground;
    }
    updateExistingBackground(images, coverUrl) {
      const { imgA, imgB } = images;
      const activeImg = imgA.classList.contains("active") ? imgA : imgB;
      const inactiveImg = activeImg === imgA ? imgB : imgA;
      inactiveImg.src = coverUrl;
      inactiveImg.onload = () => {
        requestAnimationFrame(() => {
          activeImg.classList.remove("active");
          inactiveImg.classList.add("active");
          this.cached.dynamicBg?.setAttribute("current-img", coverUrl);
        });
      };
    }
    createBackgroundImage(id, className, src, loading) {
      const img = document.createElement("img");
      img.id = id;
      img.className = className;
      img.decoding = "async";
      img.loading = loading;
      if (src)
        img.src = src;
      return img;
    }
    setRandomCSSVariables() {
      const rotationPrimary = Math.floor(Math.random() * 360);
      const rotationSecondary = Math.floor(Math.random() * 360);
      document.documentElement.style.setProperty("--bg-rotation-primary", `${rotationPrimary}deg`);
      document.documentElement.style.setProperty(
        "--bg-rotation-secondary",
        `${rotationSecondary}deg`
      );
      const scalePrimary = 0.9 + Math.random() * 0.3;
      const scaleSecondary = 0.9 + Math.random() * 0.3;
      document.documentElement.style.setProperty("--bg-scale-primary", `${scalePrimary}`);
      document.documentElement.style.setProperty("--bg-scale-secondary", `${scaleSecondary}`);
      const hueShift = Math.floor(Math.random() * 30);
      document.documentElement.style.setProperty("--bg-hue-shift", `${hueShift}deg`);
    }
  };

  // src/constants/intervals.ts
  var INTERVALS = {
    POSITION_SYNC: 0.5,
    DYNAMIC_BG_UPDATE: 1,
    SLEEP_RETRY: 0.1
  };

  // src/app.tsx
  function setupUI() {
    AppInitializer.setupSkeletonStyles();
    return new ButtonManager();
  }
  async function initializeAmaiLyrics(buttonManager) {
    const [{ requestPositionSync: requestPositionSync2 }] = await Promise.all([Promise.resolve().then(() => (init_GetProgress(), GetProgress_exports))]);
    const { ScrollToActiveLine: ScrollToActiveLine2 } = await Promise.resolve().then(() => (init_ScrollToActiveLine(), ScrollToActiveLine_exports));
    Whentil_default.When(
      () => Spicetify.Platform.PlaybackAPI,
      () => {
        requestPositionSync2();
      }
    );
    const backgroundManager = new NowPlayingBarBackground();
    const songChangeManager = new SongChangeManager(buttonManager, backgroundManager);
    new PageManager(buttonManager);
    new IntervalManager(INTERVALS.DYNAMIC_BG_UPDATE, () => {
      const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
      backgroundManager.apply(coverUrl);
    }).Start();
    Spicetify.Player.addEventListener("songchange", (event) => {
      songChangeManager.handleSongChange(event);
    });
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (currentUri) {
      const { default: fetchLyrics2 } = await Promise.resolve().then(() => (init_fetchLyrics(), fetchLyrics_exports));
      const { default: ApplyLyrics2 } = await Promise.resolve().then(() => (init_Applyer(), Applyer_exports));
      fetchLyrics2(currentUri).then(ApplyLyrics2);
    }
    window.addEventListener("online", async () => {
      storage_default.set("lastFetchedUri", null);
      const currentUri2 = Spicetify.Player.data?.item?.uri;
      if (currentUri2) {
        const { default: fetchLyrics2 } = await Promise.resolve().then(() => (init_fetchLyrics(), fetchLyrics_exports));
        const { default: ApplyLyrics2 } = await Promise.resolve().then(() => (init_Applyer(), Applyer_exports));
        fetchLyrics2(currentUri2).then(ApplyLyrics2);
      }
    });
    new IntervalManager(ScrollingIntervalTime, () => ScrollToActiveLine2(ScrollSimplebar)).Start();
    SpotifyPlayer.IsPlaying = IsPlaying();
    EventManager.initialize(buttonManager.getButton());
  }
  async function main() {
    await AppInitializer.initializeCore();
    const buttonManager = setupUI();
    await initializeAmaiLyrics(buttonManager);
    AppInitializer.setupPostLoadOptimizations();
  }
  var app_default = main;

  // C:/Users/Hathaway/AppData/Local/Temp/spicetify-creator/index.jsx
  (async () => {
    await app_default();
  })();
})();
/*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) */
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
(async () => {
    if (!document.getElementById(`amaiDlyrics`)) {
      var el = document.createElement('style');
      el.id = `amaiDlyrics`;
      el.textContent = (String.raw`
  /* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb4f8/DotLoader.css */
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

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbac10/default.css */
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
#SpicyLyricsPage {
  font-family: "Noto Sans Display", sans-serif;
}
[font=Vazirmatn] {
  font-family: "Vazirmatn", sans-serif;
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
  background: #ffffff36;
  border: none;
  border-radius: 100rem;
  display: flex;
  height: var(--ViewControlHeight);
  width: var(--ViewControlHeight);
  -webkit-app-region: no-drag;
  align-items: center;
  color: white;
  justify-content: center;
  text-align: center;
  -webkit-box-align: center;
  -webkit-box-pack: center;
}
#SpicyLyricsPage .ViewControls .ViewControl:hover {
  background: rgba(0, 0, 0, .3);
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
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .sweet-dynamic-bg div[data-overlayscrollbars-viewport],
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .sweet-dynamic-bg div[data-overlayscrollbars-viewport] > div {
  background: transparent;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .sweet-dynamic-bg .main-nowPlayingView-coverArtContainer div:has(video):after,
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .sweet-dynamic-bg .main-nowPlayingView-coverArtContainer div:has(video):before {
  display: none;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .sweet-dynamic-bg .main-trackInfo-artists {
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

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbafd1/Simplebar.css */
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

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb072/ContentBox.css */
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
@keyframes vinyl-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
#SpicyLyricsPage .ContentBox {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  --default-font-size: clamp(0.5rem, calc(0.8cqw * 3), 3rem);
  --songname-font-size: clamp(0.5rem, calc(0.7cqw * 3), 3rem);
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
  margin: 0 3.5cqw 0 3.5cqw;
  transition: opacity 0.2s ease-in-out;
  opacity: 0;
}
#SpicyLyricsPage .ContentBox .NowBar.RightSide {
  margin: 0 3.5cqw 0 3.5cqw;
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
  width: 20cqw;
  height: 20cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, transparent 15%, rgba(255, 255, 255, 0.02) 15.5%, transparent 16%),
    radial-gradient(circle at center, transparent 20%, rgba(255, 255, 255, 0.02) 20.5%, transparent 21%),
    radial-gradient(circle at center, transparent 25%, rgba(255, 255, 255, 0.02) 25.5%, transparent 26%),
    radial-gradient(circle at center, transparent 30%, rgba(255, 255, 255, 0.02) 30.5%, transparent 31%),
    radial-gradient(circle at center, transparent 35%, rgba(255, 255, 255, 0.02) 35.5%, transparent 36%),
    radial-gradient(circle at center, transparent 40%, rgba(255, 255, 255, 0.02) 40.5%, transparent 41%),
    radial-gradient(circle at center, transparent 45%, rgba(255, 255, 255, 0.02) 45.5%, transparent 46%),
    radial-gradient(circle at center, #1a1a1a 0%, #0d0d0d 70%, #000000 100%);
  z-index: 1;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8), 0 9px 20px 0 rgba(0, 0, 0, .271);
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox::after {
  content: "";
  position: absolute;
  width: 8%;
  height: 8%;
  border-radius: 50%;
  background: radial-gradient(circle at center, #000000 0%, #1a1a1a 50%, #333333 100%);
  z-index: 4;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0, 0, 0, 0.5);
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox {
  width: 25cqw;
  height: 25cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImagePlaceholder {
  position: absolute;
  border-radius: 50%;
  width: 42%;
  height: 42%;
  background-color: rgba(30, 30, 30, 0.3);
  z-index: 2;
  transition: opacity 0.3s ease-in-out;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage.loaded + .MediaImagePlaceholder,
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox:has(.MediaImage.loaded) .MediaImagePlaceholder {
  opacity: 0;
}
#SpicyLyricsPage .ContentBox .NowBar .AmaiPageButtonContainer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
#SpicyLyricsPage .ContentBox .NowBar .AmaiPageButtonContainer .AmaiPageButton {
  width: 24cqh;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage {
  --ArtworkBrightness: 1;
  --ArtworkBlur: 0px;
  border-radius: 50%;
  width: 42%;
  height: 42%;
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, .4);
  opacity: .95;
  transition: opacity, scale .1s cubic-bezier(.24, .01, .97, 1.41);
  cursor: grab;
  z-index: 3;
  position: absolute;
  will-change: transform;
  contain: paint layout;
  animation: vinyl-spin 12s linear infinite;
  filter: brightness(var(--ArtworkBrightness));
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage.loaded {
  filter: brightness(var(--ArtworkBrightness)) blur(var(--ArtworkBlur));
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
  width: 20cqw;
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
  font-weight: 700;
  font-size: var(--songname-font-size);
  color: white;
  text-align: center;
  opacity: .95;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 20cqw;
  display: inline-block;
  text-align: center;
  line-height: var(--title-height);
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists {
  font-size: calc(var(--default-font-size)* 0.65);
  line-height: calc(var(--title-height) * 0.65);
  font-weight: 400;
  color: white;
  opacity: .7;
  animation: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 20cqw;
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
  width: 20cqw;
  height: 20cqw;
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
  padding: 0 5cqh 0;
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

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb1b3/sweet-dynamic-bg.css */
.sweet-dynamic-bg {
  --bg-hue-shift: 0deg;
  --bg-saturation: 2.2;
  --bg-brightness: 0.5;
  --bg-blur-primary: 35px;
  --bg-blur-secondary: 55px;
  --bg-rotation-primary: 0deg;
  --bg-rotation-secondary: 15deg;
  --bg-scale-primary: 1.1;
  --bg-scale-secondary: 1.2;
  height: 100%;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
  filter: saturate(var(--bg-saturation)) brightness(var(--bg-brightness));
  isolation: isolate;
  will-change: transform;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.sweet-dynamic-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 15, 35, 0.4) 0%, rgba(30, 10, 70, 0.3) 50%, rgba(10, 20, 50, 0.4) 100%);
  z-index: 10;
  pointer-events: none;
  animation: gradientShift 30s linear infinite;
}
.sweet-dynamic-bg .placeholder {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(60, 40, 80, 0.6) 0%, rgba(30, 20, 50, 0.4) 50%, rgba(15, 15, 30, 0.2) 90%);
  z-index: 1;
  border-radius: 50%;
  transform: scale(2);
  opacity: 0.9;
  filter: blur(8px);
}
.sweet-dynamic-bg > img.bg-image {
  position: absolute;
  width: 200%;
  height: 200%;
  border-radius: 100em;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  will-change: transform, opacity;
  transform-style: flat;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.sweet-dynamic-bg > img.primary {
  position: absolute;
  right: 0;
  top: 0;
  width: 200%;
  height: 200%;
  border-radius: 100em;
  z-index: 3;
  transform: rotate(var(--bg-rotation-primary, 0deg)) scale(var(--bg-scale-primary, 1));
  filter: blur(var(--bg-blur-primary)) hue-rotate(var(--bg-hue-shift)) brightness(1.1);
  animation: bgAnimPrimary 60s linear infinite;
  mix-blend-mode: overlay;
}
.sweet-dynamic-bg > img.secondary {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 200%;
  border-radius: 100em;
  z-index: 2;
  transform: rotate(var(--bg-rotation-secondary, 0deg)) scale(var(--bg-scale-secondary, 1));
  filter: blur(var(--bg-blur-secondary)) hue-rotate(calc(var(--bg-hue-shift) + 30deg)) brightness(1.2);
  animation: bgAnimSecondary 75s linear infinite reverse;
  mix-blend-mode: soft-light;
}
.sweet-dynamic-bg > img.primary.active {
  opacity: 1;
}
.sweet-dynamic-bg > img.secondary.active {
  opacity: 0.8;
}
#SpicyLyricsPage.Fullscreen .sweet-dynamic-bg {
  max-height: 60%;
  max-width: 20%;
  scale: 500% 170%;
}
.sweet-dynamic-bg-in-this {
  overflow: hidden;
  position: relative;
}
.sweet-dynamic-bg-in-this:is(aside) .sweet-dynamic-bg {
  --bg-saturation: 2;
  --bg-brightness: 0.45;
  max-height: 100%;
  max-width: 100%;
}
.sweet-dynamic-bg-in-this:is(aside) video {
  filter: opacity(0.75) brightness(0.5);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0) 90%);
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0) 90%);
}
.main-nowPlayingView-coverArtContainer div:has(video)::before,
.main-nowPlayingView-coverArtContainer div:has(video)::after {
  display: none;
}
.sweet-dynamic-bg-in-this:is(aside) .AAdBM1nhG73supMfnYX7 {
  z-index: 10;
  position: relative;
}
#SpicyLyricsPage .sweet-dynamic-bg {
  --bg-saturation: 2.5;
  --bg-brightness: 0.45;
  max-height: 55%;
  max-width: 35%;
  scale: 290% 185%;
  transform-origin: left top;
}
@keyframes bgAnimPrimary {
  0% {
    transform: rotate(var(--bg-rotation-primary, 0deg)) scale(var(--bg-scale-primary, 1));
  }
  to {
    transform: rotate(calc(var(--bg-rotation-primary, 0deg) + 1turn)) scale(var(--bg-scale-primary, 1));
  }
}
@keyframes gradientShift {
  0% {
    background-position: 0% 0%;
    opacity: 0.7;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    background-position: 100% 100%;
    opacity: 0.7;
  }
}
@keyframes bgAnimSecondary {
  0% {
    transform: rotate(var(--bg-rotation-secondary, 0deg)) scale(var(--bg-scale-secondary, 1));
  }
  to {
    transform: rotate(calc(var(--bg-rotation-secondary, 0deg) + 1turn)) scale(var(--bg-scale-secondary, 1));
  }
}
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .sweet-dynamic-bg-in-this) .sweet-dynamic-bg,
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .sweet-dynamic-bg-in-this) .sweet-dynamic-bg * {
  display: none !important;
  animation: none !important;
  filter: none !important;
}
@media (prefers-reduced-motion), (max-width: 768px) {
  .sweet-dynamic-bg {
    --bg-saturation: 1.2;
    --bg-brightness: 0.5;
  }
  .sweet-dynamic-bg > img.primary {
    animation-duration: 120s;
    filter: blur(20px) hue-rotate(var(--bg-hue-shift));
  }
  .sweet-dynamic-bg > img.secondary {
    animation-duration: 120s;
    filter: blur(20px) hue-rotate(calc(var(--bg-hue-shift) + 30deg));
  }
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb234/main.css */
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
  --ActiveTextGlowDef: rgba(255,255,255,0.25) 0px 0px 16px;
  --StrongTextGlowDef: rgba(255,255,255,0.68) 0px 0px 16px;
  --StrongerTextGlowDef: rgba(255,255,255,0.74) 0px 0px 16px;
  --DefaultLyricsSize: clamp(1.5rem,calc(.425cqw * 7), 3rem);
  --DefaultLyricsSize-Small: clamp(1.1rem,calc(1cqw* 6), 1.5rem);
  --Simplebar-Scrollbar-Color: rgba(255, 255, 255, 0.6);
  overflow-x: hidden !important;
  overflow-y: auto !important;
  height: 100cqh;
  width: 100%;
  font-size: var(--DefaultLyricsSize);
  font-weight: 700;
  transition:
    opacity,
    transform,
    scale 0.2s linear;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  z-index: 9;
  --ImageMask: linear-gradient( 180deg, transparent 0, var(--spice-sidebar) 128px, var(--spice-sidebar) calc(100% - 128px), transparent calc(100% - 8px), transparent );
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
  padding: 0 5cqw 0 3.5cqw !important;
}
#SpicyLyricsPage .ContentBox .NowBar.Active:is(.RightSide) + .LyricsContainer .LyricsContent .simplebar-content-wrapper .simplebar-content {
  padding: 0 3.5cqw 0 5cqw !important;
}
#SpicyLyricsPage .AmaiPageButtonContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
  margin-top: 8px;
}
#SpicyLyricsPage .AmaiPageButton {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: .9em;
}
#SpicyLyricsPage .AmaiPageButton:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 1);
}
#SpicyLyricsPage .AmaiPageButton:active {
  transform: scale(0.95);
}
#SpicyLyricsPage .AmaiPageButton.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
}
#SpicyLyricsPage .ContentBox.LyricsHidden .AmaiPageButtonContainer {
  display: none;
}
#SpicyLyricsPage.Fullscreen .AmaiPageButtonContainer {
  display: none;
}
#SpicyLyricsPage .amai-version-number {
  font-size: .85em;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-weight: normal;
}
#SpicyLyricsPage .amai-version-number:hover {
  color: rgba(255, 255, 255, 1);
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
  opacity: 0.9;
  padding-top: 8px;
  padding-bottom: 8px;
  min-block-size: 38px;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: white;
}
#SpicyLyricsPage .ContentBox .NowBar .Header {
  padding: 0 2cqh;
}
#SpicyLyricsPage .ContentBox .NowBar.Active + .LyricsContainer .LyricsContent .simplebar-content-wrapper .simplebar-content {
  padding: 3cqh 3cqh 1.8cqh 3cqh;
  background-color: rgba(255, 255, 255, 0.1);
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
  margin: 1.8cqh 0 0 0;
}
ruby {
  margin-top: -0.5rem;
}
ruby.romaja {
  margin-right: 0.25rem;
}
ruby > rt {
  margin-bottom: 0.15rem;
  font-size: 55%;
}
.Button-buttonSecondary-small-useBrowserDefaultFocusStyle {
  border: 1px solid rgba(255, 255, 255, 0.65);
}
.amai-settings-header {
  color: var(--text-base,#ffffff);
  font-size: 1.25rem;
  font-weight: 700;
}
.translation {
  display: block;
  font-size: 1.15rem;
  line-height: 1.35rem;
  font-weight: 500;
}
.line {
  display: flex;
  flex-direction: column;
}
.main-lyrics-text {
  display: block;
  width: 100%;
}
.main-trackList-trackListRow:focus-within,
.main-trackList-trackListRow:hover,
.BoxComponent-group-card-naked-isInteractive-draggable:hover::after {
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.main-nowPlayingView-credits .HeaderArea {
  flex-direction: column;
  align-items: start;
}
.main-nowPlayingView-credits > *:not(:first-child)::before {
  content: "";
  display: block;
  height: .25px;
  background: rgb(255 255 255 / 25%);
  margin-bottom: .55rem;
}
#main-view > div > div[data-testid=test-ref-div] {
  display: none;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb2e5/Mixed.css */
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
  font-weight: 700;
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
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.static {
  background-image: linear-gradient(var(--gradient-degrees), rgba(255, 255, 255, 0.8) var(--gradient-position), rgba(255, 255, 255, var(--gradient-alpha-end)) calc(var(--gradient-position) + 20% + var(--gradient-offset)));
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line {
  --BlurAmount: 0px;
  --DefaultLyricsScale: 0.95;
  --DefaultEmphasisLyricsScale: 0.95;
  --DefaultLineScale: 1;
  --Vocal-NotSung-opacity: 1;
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
  font-family: SpicyLyrics, sans-serif;
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
  margin: 1cqw 0 0 0;
  display: inline-block;
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

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb376/LoaderContainer.css */
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

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-18688-78LuIfxB5fmq/198818fbb3d7/FullscreenTransition.css */
#SpicyLyricsPage.fullscreen-transition {
  pointer-events: none;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .ViewControls,
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls {
  opacity: 1 !important;
  visibility: visible !important;
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
}
#SpicyLyricsPage.fullscreen-transition.Fullscreen .ContentBox .NowBar .CenteredView .Header .ViewControls,
#SpicyLyricsPage.fullscreen-transition.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls {
  opacity: 1 !important;
  visibility: visible !important;
  z-index: 9999;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent {
  display: flex !important;
}
#SpicyLyricsPage.Fullscreen .ContentBox .ViewControls,
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .ViewControls {
  z-index: 1000;
}
#SpicyLyricsPage .ViewControls #FullscreenToggle {
  opacity: 1 !important;
}

      `).trim();
      document.head.appendChild(el);
    }
  })()
      })();