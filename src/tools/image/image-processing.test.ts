import { describe, expect, it } from 'vitest'
import {
  calculateResizeDimensions,
  calculateScaleDimensions,
  calculateSizeChange,
  IMAGE_LIMITS,
  validateImageFile,
} from './shared/image-processing'
import { normalizeCompressionQuality } from './image-compressor'
import { parsePositiveDimension } from './image-resizer'
import { jpegNeedsBackground } from './image-converter'

describe('image input validation', () => {
  it('accepts JPEG, PNG, and WebP with matching extensions and MIME types', () => {
    expect(validateImageFile({ name: 'photo.jpg', size: 12, type: 'image/jpeg' })).toBe('image/jpeg')
    expect(validateImageFile({ name: 'photo.png', size: 12, type: 'image/png' })).toBe('image/png')
    expect(validateImageFile({ name: 'photo.webp', size: 12, type: 'image/webp' })).toBe('image/webp')
  })
  it('rejects SVG, GIF, mismatched types, empty and oversized files', () => {
    expect(() => validateImageFile({ name: 'image.svg', size: 12, type: 'image/svg+xml' })).toThrow(/no compatible|no compatible/i)
    expect(() => validateImageFile({ name: 'image.gif', size: 12, type: 'image/gif' })).toThrow(/Formato no compatible/)
    expect(() => validateImageFile({ name: 'image.png', size: 12, type: 'image/jpeg' })).toThrow(/no coincide/)
    expect(() => validateImageFile({ name: 'image.png', size: 0, type: 'image/png' })).toThrow(/vacío/)
    expect(() => validateImageFile({ name: 'image.png', size: IMAGE_LIMITS.maxFileBytes + 1, type: 'image/png' })).toThrow(/20 MiB/)
  })
})

describe('image dimensions and metadata', () => {
  it('keeps aspect ratio within requested bounds and calculates scale', () => {
    expect(calculateResizeDimensions(400, 200, 100, 100, true)).toEqual({ width: 100, height: 50 })
    expect(calculateResizeDimensions(400, 200, 100, 100, false)).toEqual({ width: 100, height: 100 })
    expect(calculateScaleDimensions(400, 200, 50)).toEqual({ width: 200, height: 100 })
    expect(() => calculateScaleDimensions(400, 200, 0)).toThrow(/porcentaje/)
  })
  it('rejects output above the pixel limit', () => {
    expect(() => calculateResizeDimensions(100, 100, 7000, 7000, false)).toThrow(/40 megapíxeles/)
  })
  it('reports output size increases as well as reductions', () => {
    expect(calculateSizeChange(1000, 750)).toMatchObject({ differenceBytes: 250, percentage: 25, reduced: true })
    expect(calculateSizeChange(1000, 1250)).toMatchObject({ differenceBytes: -250, percentage: -25, reduced: false })
  })
  it('validates quality, dimensions, and JPEG background policy', () => {
    expect(normalizeCompressionQuality(1.2)).toBe(1)
    expect(() => normalizeCompressionQuality(Number.NaN)).toThrow()
    expect(parsePositiveDimension('120', 'ancho')).toBe(120)
    expect(() => parsePositiveDimension('0', 'alto')).toThrow(/mayor que cero/)
    expect(jpegNeedsBackground('image/jpeg')).toBe(true)
    expect(jpegNeedsBackground('image/png')).toBe(false)
  })
})
