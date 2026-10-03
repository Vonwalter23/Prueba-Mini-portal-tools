export interface TextCleanOptions {
  trimLines: boolean
  removeBlankLines: boolean
  collapseSpaces: boolean
  removeDuplicateLines: boolean
}

export function cleanText(input: string, options: TextCleanOptions): string {
  let lines = input.split(/\r?\n/u)
  if (options.trimLines) lines = lines.map((line) => line.trim())
  if (options.collapseSpaces) lines = lines.map((line) => line.replace(/[\t ]+/gu, ' '))
  if (options.removeBlankLines) lines = lines.filter((line) => line.trim() !== '')
  if (options.removeDuplicateLines) {
    const seen = new Set<string>()
    lines = lines.filter((line) => {
      if (seen.has(line)) return false
      seen.add(line)
      return true
    })
  }
  return lines.join('\n')
}
