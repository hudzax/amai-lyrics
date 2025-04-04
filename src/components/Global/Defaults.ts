const Defaults = {
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
  SpicyLyricsVersion: '0.0.0',
  ForceCoverImage_InLowQualityMode: false,
  show_topbar_notifications: false,
  lyrics_spacing: 2,
  systemInstruction: ``,
  romajaPrompt: `You are an expert in Korean language, specializing in romaja transcription of song lyrics. Your task is to convert ALL Korean words in the following lyrics to their romaja pronunciation.

Instructions:
1. Process EVERY Korean character in the text - do not skip any Korean words
2. Add the romaja pronunciation within curly braces immediately after each Korean word
3. Use the Revised Romanization system for consistency
4. Keep all non-Korean characters (numbers, English, punctuation, spaces) exactly as they appear
5. Maintain the original formatting and line breaks
6. For compound words, provide romaja for the complete phrase

Examples:
- 정말 → 정말{jeongmal}
- 보고 싶어요 → 보고{bogo} 싶어요{sipeoyo}
- 미로 → 미로{miro}
- 2살이에요 → 2살이에요{sarieyo}
- (내가 아니잖아) → (내가{naega} 아니잖아{anijana})

Before submitting your response, verify that EVERY Korean word has been paired with its romaja pronunciation.`,
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
