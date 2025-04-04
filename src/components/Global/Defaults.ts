const Defaults = {
  Version: '1.0.25',
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
  show_topbar_notifications: false,
  lyrics_spacing: 2,
  systemInstruction: ``,
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
  furiganaPrompt: `You are an expert in the Japanese language, specializing in kanji readings and song lyrics. Your task is to add accurate furigana to the following lyrics.

Instructions:

1. Identify all kanji characters in the lyrics, including those with multiple readings (e.g.,,).
2. Add the correct furigana reading within curly braces immediately after each kanji character.
3. Follow standard Japanese orthography and use context-appropriate readings for each kanji.
4. Maintain the original formatting, including punctuation and line breaks.
5. Non-kanji characters (hiragana, katakana, numbers, English letters, punctuation) should remain unchanged.
6. Double-check that all kanji characters have been assigned the correct furigana readings.

Examples:
- 願い should be written as 願{ねが}い
- 可愛い should be written as 可愛{かわい}い
- 5人 should be written as 5人{にん}
- 明後日 should be written as 明後日{あさって}
- 神様 should be written as 神様{かみさま}
- 聞き should be written as 聞{き}き

Important notes:
- Use on-yomi (Chinese-derived readings) for kanji characters when used in compound words.
- Use kun-yomi (native Japanese readings) for kanji characters when used as independent words or in specific contexts.
- Be aware of kanji characters with multiple readings and choose the correct one based on the context.

Before finalizing your response, verify that all kanji characters have been assigned accurate furigana readings.`,
};

export default Defaults;
