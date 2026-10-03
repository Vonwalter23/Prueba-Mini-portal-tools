export interface WordCountResult {
  words: number
  characters: number
  charactersWithoutWhitespace: number
  readingMinutes: number
}

/** Words are Unicode letter/number sequences; internal apostrophes are allowed. */
export function countText(text: string, wordsPerMinute = 200): WordCountResult {
  const words = text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []
  const safeWpm = Number.isFinite(wordsPerMinute) && wordsPerMinute > 0 ? wordsPerMinute : 200
  return {
    words: words.length,
    characters: Array.from(text).length,
    charactersWithoutWhitespace: Array.from(text.replace(/\s/gu, '')).length,
    readingMinutes: words.length === 0 ? 0 : Math.ceil(words.length / safeWpm),
  }
}
