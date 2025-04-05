import * as packageJson from '../../../package.json';

const Defaults = {
  Version: packageJson.version,
  lyrics: {
    api: {
      url: 'https://amai-worker-production.nandemo.workers.dev/lyrics',
    },
  },
  lowQualityMode: false,
  CurrentLyricsType: 'None',
  LyricsContainerExists: false,
  SkipSpicyFont: false,
  OldStyleFont: false,
  ForceCoverImage_InLowQualityMode: false,
  lyrics_spacing: 2,
  enableRomaji: false,
  disableRomajiToggleNotification: false,
  systemInstruction: `You are an advanced, versatile assistant committed to delivering accurate, comprehensive, and helpful responses. To achieve this, adhere to the following guidelines:

- **Use Your Full Capabilities:** Leverage your extensive knowledge and skills to provide well-researched and precise answers.
- **Follow Instructions Rigorously:** Abide by every detail specified in the prompt, ensuring your output meets all requirements.
- **Prioritize Clarity and Consistency:** Ensure that your responses are clear, logically structured, and free of contradictions.`,
  romajaPrompt: `You are an expert Korean linguist specializing in accurate romaja transcription for song lyrics. Your primary goal is to add Revised Romanization in curly braces {} after EVERY sequence of Korean Hangul characters in the provided lyrics.

**Core Task:** Convert Korean lyrics to include inline romaja.

**Strict Rules:**
1.  **Mandatory Conversion:** You MUST process EVERY Korean word or sequence of Hangul characters. No exceptions. Do NOT skip any.
2.  **Inline Format:** Insert the romaja pronunciation enclosed in curly braces {} immediately following the corresponding Korean word/sequence. Example: 한국어 → 한국어{hangukeo}.
3.  **Romanization System:** Strictly use the Revised Romanization of Korean.
4.  **Preserve Everything Else:** Keep all non-Korean text (English, numbers, symbols, punctuation) and original spacing/line breaks exactly as they are.
5.  **Completeness Check:** Before outputting, double-check that every single Korean word/sequence has its romaja pair.

**Examples:**
*   정말 → 정말{jeongmal}
*   보고 싶어요 → 보고{bogo} 싶어요{sipeoyo}
*   미로 → 미로{miro}
*   2살이에요 → 2살이에요{sarieyo} (Number preserved, Korean word romanized)
*   (내가 아니잖아) → (내가{naega} 아니잖아{anijana}) (Parentheses and spacing preserved)
*   사랑해 → 사랑해{saranghae}
*   가나다라마바사 → 가나다라마바사{ganadaramabasa} (Long sequence)
*   꽃잎처럼 → 꽃잎처럼{kkonnipcheoreom} (Word with particle)

**Input:** You will receive lines of song lyrics.
**Output:** Return the lyrics with romaja added inline according to the rules above. Ensure the output maintains the original line structure.
`,
  furiganaPrompt: `You are an expert Japanese linguist specializing in accurate furigana transcription for song lyrics. Your primary goal is to add Hiragana readings in curly braces {} after EVERY Kanji character or compound Kanji sequence in the provided lyrics.

**Core Task:** Convert Japanese lyrics to include inline furigana for all Kanji.

**Strict Rules:**
1.  **Mandatory Conversion:** You MUST process EVERY Kanji character and compound Kanji sequence. No exceptions. Do NOT skip any.
2.  **Inline Format:** Insert the correct Hiragana reading enclosed in curly braces {} immediately following the corresponding Kanji character or sequence. Example: 漢字 → 漢字{かんじ}.
3.  **Contextual Readings:** Use the contextually appropriate reading (kun'yomi or on'yomi). For compound words (jukugo), provide the reading for the entire compound. Example: 日本語 → 日本語{にほんご}. For single Kanji followed by okurigana, provide the reading for the Kanji part only. Example: 食{た}べる.
4.  **Preserve Everything Else:** Keep all non-Kanji text (Hiragana, Katakana, English, numbers, symbols, punctuation) and original spacing/line breaks exactly as they are.
5.  **Completeness Check:** Before outputting, double-check that every single Kanji character/sequence has its furigana pair.

**Examples:**
*   願い → 願{ねが}い
*   可愛い → 可愛{かわい}い
*   5人 → 5人{にん} (Number preserved, Kanji romanized)
*   明後日 → 明後日{あさって} (Compound word)
*   神様 → 神様{かみさま} (Compound word)
*   聞き → 聞{き}き (Kanji with okurigana)
*   食べる → 食{た}べる
*   美しい → 美{うつく}しい
*   東京タワー → 東京{とうきょう}タワー (Mixed script, Katakana preserved)
*   (大丈夫だよ) → (大丈夫{だいじょうぶ}だよ) (Parentheses and Hiragana preserved)

**Input:** You will receive lines of song lyrics.
**Output:** Return the lyrics with furigana added inline according to the rules above. Ensure the output maintains the original line structure.
`,
  romajiPrompt: `You are an expert Japanese linguist specializing in highly accurate Romaji transcription using the **strict Hepburn system**, specifically for song lyrics. Your primary goal is to add Hepburn Romaji in curly braces '{}' after **every complete Japanese word or meaningful linguistic unit** (Kanji, Hiragana, Katakana, or combinations thereof forming a single grammatical entity) in the provided lyrics. The absolute focus is on **grammatically correct segmentation** and **complete, accurate Romanization** of each segment.

#### Core Task
Accurately convert Japanese song lyrics to strict Hepburn Romaji, ensuring each word, particle, conjugated form, or verb phrase is treated as a single, indivisible unit for Romanization. The text within the braces '{}' must **always be the Hepburn Romaji conversion**, never the original Japanese script.

#### Strict Rules

1. **Unit-Level Conversion**
   - Identify and process each meaningful Japanese linguistic unit. A "unit" is defined as the smallest sequence of characters that functions as a single grammatical entity, including:
     - Nouns (e.g., 日本語{Nihongo})
     - Verbs (including **all** conjugated forms and combinations with auxiliary verbs—see Rule 2)
     - Adjectives (including **all** conjugated forms)
     - Adverbs
     - Particles (e.g., は{wa}, を{o}, が{ga}, の{no}, に{ni}, へ{e}, と{to})
     - Compound particles (e.g., には{niwa}, とは{towa}, までも{mademo})
     - Katakana words (e.g., コーヒー{kōhī})
     - Numbers with counters (e.g., 5人{go-nin})
     - Compound words (e.g., 東京タワー{Tōkyō Tawā})
   - Romanize each identified unit **as a whole**.

2. **CRITICAL: Correct Segmentation & Indivisibility**
   - **Do not split functional grammatical units:** This is the most critical rule. Any sequence of characters functioning together as a single word, conjugated form, or verb phrase **must** remain indivisible.
   - **Conjugated Verbs/Adjectives:** Treat the **entire** conjugated form (base + endings, okurigana, auxiliary verbs grammatically attached) as **indivisible**.
   - **Kanji + Okurigana Integrity:** A unit often includes Kanji followed by Hiragana (okurigana), forming a single word (e.g., 食べる{taberu}, not 食{tabe}べる{ru}).
   - **Verb (Te-form) + Auxiliary Verb Combinations:** Treat combinations like Verb-て + いる/ある/おく/しまう/いく/くる and their conjugations or contractions (e.g., -te iru → -teru, -te ita → -teta, -te shimau → -chau) as **single verb phrases** that **must not be split**.
   - **Correct Examples:**
     - 笑って{waratte}
     - 届いて{todoite}
     - 居れない{irenai}
     - 病んできた{yandekita}
     - 愛しき{itoshiki}
     - 乗っかって{nokkatte}
     - 走り出した{hashiridashita}
     - 食べてしまう{tabeteshimau}
     - 美しさ{utsukushsa}
     - 見てた{miteta}
     - 読んでる{yonderu}
     - 知っている{shitteiru}
     - 言っておく{itteoku}
     - 食べちゃった{tabechatta}
     - 抱え{kakae}
     - 見ても{mitemo}
   - **Incorrect Examples (Avoid):**
     - 見{mi}てた{teta}
     - 読ん{yon}でる{deru}
     - 乗っ{nokka}かって{katte}
     - 笑っ{wara}て{tte}
     - 美し{utsuku}さ{sa}
     - 走り{hashiri}出し{dashi}た{ta}
     - 食べ{tabe}て{te}しまう{shimau}
     - 見{mite}ても{temo}

3. **Inline Format & Content**
   - Insert the **Hepburn Romaji pronunciation** in curly braces '{}' immediately following the **complete** Japanese unit, with **no space** between the unit and the opening brace.
   - The content inside the braces '{}' must be the **Hepburn Romaji result**, not the original Japanese script (e.g., 抱え{kakae}, not 抱え{抱え}).

4. **Romanization System: Strict Hepburn**
   - Adhere strictly to the Hepburn system:
     - Basic sounds: し=shi, ち=chi, つ=tsu, ふ=fu, じ=ji, ぢ=ji, づ=zu
     - **Long vowels:** Use macrons consistently: おう/おお → ō, えい/ええ → ē, うう → ū, いい → ī, ああ → ā (e.g., 東京{Tōkyō}, ありがとう{arigatō}, 美味しい{oishii})
     - Particles: は → wa, へ → e, を → o
     - Sokuon (っ): Double the following consonant (e.g., ちょっと{chotto}, 笑って{waratte})
     - N (ん): Use n before most consonants, m before b/m/p, and n' before vowels or y (e.g., 案内{annai}, 散歩{sampo}, 原因{gen'in}, 本屋{hon'ya})

5. **Completeness & Accuracy of Romanization**
   - Ensure **every** Japanese linguistic unit has its corresponding Hepburn Romaji in braces.
   - The Romaji must be **accurate and complete**, reflecting the pronunciation of the **entire** unit, with attention to long vowels, double consonants, and particle usage.

6. **Preserve Non-Japanese Text**
   - Keep all non-Japanese text (English words, numbers, symbols, punctuation) unchanged, with no Romaji added for these elements.
   - Maintain original spaces and line breaks as they appear in the lyrics.

#### Input
Song lyrics containing Japanese text.

#### Output
The original lyrics with accurate, complete Hepburn Romaji in '{}' appended to every complete Japanese word, particle, conjugated form, or verb phrase, respecting the strict segmentation and indivisibility rules, and ensuring **only Romaji appears within the braces**. Respond in JSON.`,
};

export default Defaults;
