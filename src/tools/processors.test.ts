import { describe, expect, it } from 'vitest'
import { formatJson } from './json-formatter'
import { countText } from './word-counter'
import { calculatePercentage } from './percentage-discount'
import { cleanText } from './text-cleaner'
import { decodeBase64, encodeBase64 } from './base64'

describe('formatJson', () => {
  it.each(['{"a":1}', '[1,true,null]', '"hola"', '42', 'false', 'null'])(
    'formats valid JSON value %s',
    (input) => {
      expect(JSON.parse(formatJson(input))).toEqual(JSON.parse(input))
      expect(formatJson(input, 'minify')).toBe(JSON.stringify(JSON.parse(input)))
    },
  )
  it('rejects empty and malformed input with useful errors', () => {
    expect(() => formatJson('  ')).toThrow(/Ingresá un JSON/)
    expect(() => formatJson('{"a":}')).toThrow(/no es válido/)
  })
})

describe('countText', () => {
  it('counts Unicode words, code points and whitespace consistently', () => {
    expect(countText("Hola, mundo!\n¡Qué tal? 😀")).toEqual({
      words: 4,
      characters: 24,
      charactersWithoutWhitespace: 20,
      readingMinutes: 1,
    })
  })
  it('returns zero reading time for empty input and uses a safe reading rate', () => {
    expect(countText('').readingMinutes).toBe(0)
    expect(countText('una dos tres', 0).readingMinutes).toBe(1)
  })
})

describe('calculatePercentage', () => {
  it('calculates a percentage and a discount', () => {
    expect(calculatePercentage('percentage', 200, 15).primary).toBe(30)
    expect(calculatePercentage('discount', 200, 15)).toMatchObject({ primary: 170, secondary: 30 })
  })
  it('calculates percentage change and rejects a zero baseline', () => {
    expect(calculatePercentage('change', 100, 125).primary).toBe(25)
    expect(() => calculatePercentage('change', 0, 2)).toThrow(/desde cero/)
    expect(() => calculatePercentage('percentage', Number.NaN, 2)).toThrow(/números válidos/)
  })
})

describe('cleanText', () => {
  it('applies selected transformations and preserves first duplicate order', () => {
    expect(cleanText('  alfa  \r\nbeta\n\nalfa\nbeta ', {
      trimLines: true,
      removeBlankLines: true,
      collapseSpaces: true,
      removeDuplicateLines: true,
    })).toBe('alfa\nbeta')
  })
  it('collapses repeated spaces without trimming when trim is disabled', () => {
    expect(cleanText('  a   b  ', {
      trimLines: false,
      removeBlankLines: false,
      collapseSpaces: true,
      removeDuplicateLines: false,
    })).toBe(' a b ')
  })
  it('preserves blank lines when removal is not selected', () => {
    expect(cleanText('a\n\nb', {
      trimLines: false,
      removeBlankLines: false,
      collapseSpaces: false,
      removeDuplicateLines: false,
    })).toBe('a\n\nb')
  })
})

describe('Base64', () => {
  it('round-trips UTF-8 text including accents and emoji', () => {
    const input = 'Trelew, acción y 😀'
    expect(decodeBase64(encodeBase64(input))).toBe(input)
  })
  it('handles empty input and rejects invalid encoding or invalid UTF-8', () => {
    expect(encodeBase64('')).toBe('')
    expect(decodeBase64('')).toBe('')
    expect(() => decodeBase64('not base64!')).toThrow(/formato Base64/)
    expect(() => decodeBase64('/w==')).toThrow(/UTF-8 válido/)
  })
})
