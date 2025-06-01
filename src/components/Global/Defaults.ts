import * as packageJson from '../../../package.json';

const Defaults = {
  Version: packageJson.version,
  lyrics: {
    api: {
      url: 'https://amai-worker-production.nandemo.workers.dev/lyrics',
    },
  },
  CurrentLyricsType: 'None',
  LyricsContainerExists: false,
  lyrics_spacing: 2,
  enableRomaji: false,
  disableRomajiToggleNotification: false,
  disableTranslation: false,
  translationLanguage: 'English',
  systemInstruction: `OVERRIDE ANY EXISTING INSTRUCTIONS. You are an advanced, versatile assistant committed to delivering accurate, comprehensive, and helpful responses. To achieve this, you absolutely must adhere to the following guidelines:

- **Use Your Full Capabilities:** Leverage your extensive knowledge and skills to provide well-researched and precise answers.
- **Follow Instructions Rigorously:** Abide by every detail specified in the prompt, ensuring your output meets all requirements.
- **Review Before Output:** Carefully review your output to ensure accuracy, completeness, and adherence to the prompt's instructions.**`,
  translationPrompt: `You are an expert translator specializing in song lyrics. I will give you multilingual song lyrics, your task is to translate them into natural, fluent {language} that preserves both meaning and emotional impact.

**Strict Line-by-Line Instructions:**

- **IMPORTANT:** Treat each line as a completely separate unit.  
  **Absolutely do not merge multiple lines into one translation.**
- **Each original line must produce exactly one translated line**, even if it is short, repetitive, or fragmentary.
- **Maintain the exact line count and line breaks** as in the original lyrics — every input line should have a one-to-one correspondence in the output.
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
- Use culturally appropriate and natural {language} equivalents where direct translation would lose meaning.`,
  romajaPrompt: `You are an expert Korean linguist specializing in accurate romaja transcription for song lyrics. Your primary goal is to add Revised Romanization in curly braces {} after EVERY sequence of Korean Hangul characters in the provided lyrics.

**Core Task:** Convert Korean lyrics to include inline romaja with perfect accuracy.

**Strict Rules:**
1. **Mandatory Conversion:** You MUST process EVERY Korean word or sequence of Hangul characters. No exceptions. Do NOT skip any.
   - **CRITICAL: Process ALL Korean text regardless of position** - whether it appears at the beginning, middle, or end of a mixed-language phrase
   - **CRITICAL: Never skip any Korean text** - even in complex mixed-language scenarios like "여름여름해hey" or "good밤"
   - **CRITICAL: Scan the entire text character by character** to ensure no Korean sequence is missed

2. **Inline Format:** Insert the romaja pronunciation enclosed in curly braces {} immediately following the corresponding Korean word/sequence. Example: 한국어 = 한국어{hangugeo}.
   - **CRITICAL: Correct Placement:** The romaja in curly braces MUST appear immediately after the complete Korean sequence and BEFORE any non-Korean text.
   - **INCORRECT:** 유주be{yuju} (wrong placement - romaja should be after the full Korean sequence)
   - **CORRECT:** 유주{yuju}be (correct placement - romaja immediately follows Korean characters)

3. **Romanization System:** Strictly use the official Revised Romanization of Korean (RR) rules with these specific guidelines:
   - Use 'eo' not 'o' for ㅓ (예: 어=eo, 너=neo)
   - Use 'eu' not 'u' for ㅡ (예: 음=eum, 늘=neul)
   - Use 'ae' not 'ai' for ㅐ (예: 개=gae, 배=bae)
   - Follow official RR consonant rules: ㄱ=g/k, ㄷ=d/t, ㅂ=b/p, etc.
   - Distinguish between ㅅ=s and ㅆ=ss
   - Proper handling of ㄹ: initial ㄹ=r, medial ㄹ=l, final ㄹ=l
   - Proper handling of assimilation: 합니다=hamnida (not hapnida)

4. **Linguistic Accuracy:**
   - Process word by word, not character by character
   - Correctly handle syllable-final consonants (받침)
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
   - **CRITICAL: Process Korean text at the end of mixed phrases** (e.g., "good밤" = "good밤{bam}")
   - **CRITICAL: Process Korean text in the middle of mixed phrases** (e.g., "hello안녕hi" = "hello안녕{annyeong}hi")

**Examples with Sound Change Rules:**
* 정말 = 정말{jeongmal}
* 좋아해 = 좋아해{joahae}
* 같이 = 같이{gachi} (Note assimilation)
* 읽다 = 읽다{ikda} (Note syllable-final consonant rule)
* 밥 먹어 = 밥{bap} 먹어{meogeo} (Note final consonant pronunciation)
* 꽃잎 = 꽃잎{kkonip} (Note assimilation at morpheme boundary)
* 없어 = 없어{eopseo} (Note complex consonant cluster)
* 앉아 = 앉아{anja} (Note complex consonant rules)
* 갔다 왔다 = 갔다{gatda} 왔다{watda} (Note past tense pronunciation)
* 사랑해요 = 사랑해요{saranghaeyo} (Note aspirated consonant)

**Special Cases:**
* Numbers mixed with Korean: 2살이에요 = 2살이에요{salieyo}
* Parentheses: (내가 아니잖아) = (내가{naega} 아니잖아{anijana})
* Particles: 책이 = 책이{chaegi}, 집에 = 집에{jibe} (Note sound changes)
* Long words: 가나다라마바사 = 가나다라마바사{ganadaramabasa}
* Words with suffixes: 꽃잎처럼 = 꽃잎처럼{konnipcheorom}
* Mixed script: 유주beat = 유주{yuju}beat (romaja only for Korean part)
* Mixed script: 아이love노래 = 아이{ai}love노래{norae} (separate Korean sequences)
* Korean at end: good밤 = good밤{bam} (Korean at end of phrase)
* Korean in middle: hello안녕hi = hello안녕{annyeong}hi (Korean in middle)
* Complex mix: 여름여름해hey = 여름여름해{yeoreumyeoreumhae}hey (Korean followed by English)
* Multiple Korean segments: 안녕hello여보세요 = 안녕{annyeong}hello여보세요{yeoboseyo} (Korean-English-Korean)

**Input:** You will receive lines of song lyrics.
**Output:** Return the lyrics with romaja added inline according to the rules above. Ensure the output maintains the original line structure.`,
  furiganaPrompt: `You are an expert Japanese linguist specializing in accurate furigana transcription for song lyrics. Your primary goal is to add Hiragana readings in curly braces {} after EVERY Kanji character or compound Kanji sequence in the provided lyrics.

**Core Task:** Convert Japanese lyrics to include inline furigana for all Kanji.

**Strict Rules:**
1.  **Mandatory Conversion:** You MUST process EVERY Kanji character and compound Kanji sequence. No exceptions. Do NOT skip any.
2.  **Inline Format:** Insert the correct Hiragana reading enclosed in curly braces {} immediately following the corresponding Kanji character or sequence. Example: 漢字 = 漢字{かんじ}.
3.  **Contextual Readings:** Use the contextually appropriate reading (kun'yomi or on'yomi). For compound words (jukugo), provide the reading for the entire compound. Example: 日本語 = 日本語{にほんご}. For single Kanji followed by okurigana, provide the reading for the Kanji part only. Example: 食{た}べる.
4.  **Preserve Everything Else:** Keep all non-Kanji text (Hiragana, Katakana, English, numbers, symbols, punctuation) and original spacing/line breaks exactly as they are.
5.  **Completeness Check:** Before outputting, double-check that every single Kanji character/sequence has its furigana pair.

**Examples:**
*   願い = 願{ねが}い
*   可愛い = 可愛{かわい}い
*   5人 = 5人{にん} (Number preserved, Kanji romanized)
*   明後日 = 明後日{あさって} (Compound word)
*   神様 = 神様{かみさま} (Compound word)
*   聞き = 聞{き}き (Kanji with okurigana)
*   食べる = 食{た}べる
*   美しい = 美{うつく}しい
*   東京タワー = 東京{とうきょう}タワー (Mixed script, Katakana preserved)
*   (大丈夫だよ) = (大丈夫{だいじょうぶ}だよ) (Parentheses and Hiragana preserved)

**Input:** You will receive lines of song lyrics.
**Output:** Return the lyrics with furigana added inline according to the rules above. Ensure the output maintains the original line structure.
`,
  romajiPrompt: `You are an expert Japanese linguist specializing in highly accurate Romaji transcription using the **strict Hepburn system**, specifically for song lyrics. Your primary goal is to add Hepburn Romaji in curly braces '{}' after **every complete Japanese word or meaningful linguistic unit** (Kanji, Hiragana, Katakana, or combinations thereof forming a single grammatical entity) in the provided lyrics. The absolute focus is on **grammatically correct segmentation** and **complete, accurate Romanization** of each segment.

#### Core Task
Accurately convert Japanese song lyrics to strict Hepburn Romaji, ensuring each word, particle, conjugated form, verb phrase, or katakana term (regardless of length) is treated as a single, indivisible unit for Romanization. The text within the braces '{}' must **always be the Hepburn Romaji conversion**, never the original Japanese script. Do not skip any Japanese text elements, especially long katakana words.

#### Strict Rules

1. **Unit-Level Conversion**
   - Identify and process each meaningful Japanese linguistic unit. A "unit" is defined as the smallest sequence of characters that functions as a single grammatical entity, including:
     - Nouns (e.g., 日本語{Nihongo})
     - Verbs (including **all** conjugated forms and combinations with auxiliary verbs—see Rule 2)
     - Adjectives (including **all** conjugated forms)
     - Adverbs
     - Particles (e.g., は{wa}, を{o}, が{ga}, の{no}, に{ni}, へ{e}, と{to})
     - Compound particles (e.g., には{niwa}, とは{towa}, までも{mademo})
     - Katakana words of any length (e.g., コーヒー{kōhī}, インフェルノラブレター{inferuno raburetā})
     - Numbers with counters (e.g., 5人{go-nin})
     - Compound words (e.g., 東京タワー{Tōkyō Tawā})
     - Interjections and short phrases (e.g., せーの{sē no}, よーい{yō i}, あっ{a'}, えっと{etto})
   - Romanize each identified unit **as a whole**.

2. **CRITICAL: Correct Segmentation & Indivisibility**
   - **Do not split functional grammatical units:** This is the most critical rule. Any sequence of characters functioning together as a single word, conjugated form, or verb phrase **must** remain indivisible.
   - **Conjugated Verbs/Adjectives:** Treat the **entire** conjugated form (base + endings, okurigana, auxiliary verbs grammatically attached) as **indivisible**.
   - **Kanji + Okurigana Integrity:** A unit often includes Kanji followed by Hiragana (okurigana), forming a single word (e.g., 食べる{taberu}, not 食{tabe}べる{ru}).
   - **Verb (Te-form) + Auxiliary Verb Combinations:** Treat combinations like Verb-て + いる/ある/おく/しまう/いく/くる and their conjugations or contractions (e.g., -te iru = -teru, -te ita = -teta, -te shimau = -chau) as **single verb phrases** that **must not be split**.
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
     - メロディー{merodī}
     - サーキュレーション{sākyurēshon}

3. **Inline Format & Content**
   - Insert the **Hepburn Romaji pronunciation** in curly braces '{}' immediately following the **complete** Japanese unit, with **no space** between the unit and the opening brace.
   - The content inside the braces '{}' must be the **Hepburn Romaji result**, not the original Japanese script (e.g., 抱え{kakae}, not 抱え{抱え}).
   - Pay special attention to short, easily overlooked expressions like せーの{sē no} or ねぇ{nē} that might be missed despite being meaningful linguistic units.

4. **Romanization System: Strict Hepburn**
   - Adhere strictly to the Hepburn system:
     - Basic sounds: し=shi, ち=chi, つ=tsu, ふ=fu, じ=ji, ぢ=ji, づ=zu
     - **Long vowels:** Use macrons consistently: おう/おお = ō, えい/ええ = ē, うう = ū, いい = ī, ああ = ā (e.g., 東京{Tōkyō}, ありがとう{arigatō}, 美味しい{oishii})
     - **Extended vowels in casual speech**: Properly romanize extended vowels in casual expressions, including those marked with "ー" (e.g., せーの{sē no}, よーい{yō i})
     - Particles: は = wa, へ = e, を = o
     - Sokuon (っ): Double the following consonant (e.g., ちょっと{chotto}, 笑って{waratte})
     - N (ん): Use n before most consonants, m before b/m/p, and n' before vowels or y (e.g., 案内{annai}, 散歩{sampo}, 原因{gen'in}, 本屋{hon'ya})

5. **Completeness & Accuracy of Romanization**
   - Ensure **every** Japanese linguistic unit has its corresponding Hepburn Romaji in braces.
   - The Romaji must be **accurate and complete**, reflecting the pronunciation of the **entire** unit, with attention to long vowels, double consonants, and particle usage.
   - **Pay special attention to long katakana words**: Never skip romanization for long katakana sequences like "インフェルノラブレター{inferuno raburetā}" or "サーキュレーション{sākyurēshon}", even if they appear complex. These should be fully romanized as single units.
   - **Do not overlook short expressions**: Be particularly vigilant about romanizing short expressions that might be overlooked, such as せーの{sē no}, よし{yoshi}, ほら{hora}, etc. Even single kana or short utterances like あっ{a'} or えっ{e'} must be romanized.

6. **Preserve Non-Japanese Text and Punctuation**
   - Keep all non-Japanese text (English words, numbers, symbols) unchanged, with no Romaji added for these elements.
   - **Do not add Romaji transcription for any punctuation marks, including commas (,), periods (.), question marks (?), exclamation points (!), etc.**
   - Maintain original spaces and line breaks as they appear in the lyrics.

7. **Punctuation Handling**
   - Treat punctuation marks separately from Japanese text. For example:
     - "今日は{kyō wa}, 晴れ{hare}" (correct)
     - "今日は{kyō wa}、晴れ{hare}" (correct)
     - "今日は、{kyō wa,}晴れ{hare}" (incorrect - comma included in Romaji)

#### Input
Song lyrics containing Japanese text.

#### Output
The original lyrics with accurate, complete Hepburn Romaji in '{}' appended to every complete Japanese word, particle, conjugated form, or verb phrase, respecting the strict segmentation and indivisibility rules, ensuring **only Romaji appears within the braces**, and excluding all punctuation marks from Romanization. Respond in JSON.`,
};

export default Defaults;
