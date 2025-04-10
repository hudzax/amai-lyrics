/**
 * Lyrics conversion functions for Amai Lyrics
 */

// Japanese character detection regex
const JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;

/**
 * Converts syllable-based lyrics to line-based format
 *
 * @param data - Syllable-based lyrics data
 * @returns Line-based lyrics data
 */
export function convertLyrics(data: any[]): any[] {
  console.log('Converting Syllable to Line type');

  return data.map((item) => {
    let leadText = '';
    let prevIsJapanese: boolean | null = null;

    if (
      !item.Lead ||
      !item.Lead.Syllables ||
      !Array.isArray(item.Lead.Syllables)
    ) {
      console.error('Amai Lyrics: Invalid lyrics structure', item);
      return {
        Type: item.Type,
        OppositeAligned: item.OppositeAligned,
        Text: '',
        StartTime: 0,
        EndTime: 0,
      };
    }

    item.Lead.Syllables.forEach((syl: any) => {
      const currentIsJapanese = JAPANESE_REGEX.test(syl.Text);

      if (currentIsJapanese) {
        if (prevIsJapanese === false && leadText) {
          leadText += ' ';
        }
        leadText += syl.Text;
      } else {
        leadText += (leadText ? ' ' : '') + syl.Text;
      }

      prevIsJapanese = currentIsJapanese;
    });

    let startTime = item.Lead.StartTime;
    let endTime = item.Lead.EndTime;
    let fullText = leadText;

    if (item.Background && Array.isArray(item.Background)) {
      const bgTexts = item.Background.map((bg: any) => {
        if (typeof bg.StartTime === 'number') {
          startTime = Math.min(startTime, bg.StartTime);
        }
        if (typeof bg.EndTime === 'number') {
          endTime = Math.max(endTime, bg.EndTime);
        }

        let bgText = '';
        let prevIsJapanese: boolean | null = null;

        if (!bg.Syllables || !Array.isArray(bg.Syllables)) {
          return '';
        }

        bg.Syllables.forEach((syl: any) => {
          const currentIsJapanese = JAPANESE_REGEX.test(syl.Text);

          if (currentIsJapanese) {
            if (prevIsJapanese === false && bgText) {
              bgText += ' ';
            }
            bgText += syl.Text;
          } else {
            bgText += (bgText ? ' ' : '') + syl.Text;
          }

          prevIsJapanese = currentIsJapanese;
        });

        return bgText;
      });

      fullText += ' (' + bgTexts.join(' ') + ')';
    }

    return {
      Type: item.Type,
      OppositeAligned: item.OppositeAligned,
      Text: fullText,
      StartTime: startTime,
      EndTime: endTime,
    };
  });
}
