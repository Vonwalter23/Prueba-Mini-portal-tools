import { describe, expect, it } from 'vitest'
import { getToolById, getToolBySlug, getToolsByCategory, toolRegistry } from './registry'

describe('tool registry', () => {
  it('registers the nine approved tools with stable unique slugs', () => {
    expect(toolRegistry).toHaveLength(9)
    expect(new Set(toolRegistry.map((tool) => tool.id)).size).toBe(9)
    expect(new Set(toolRegistry.map((tool) => tool.slug)).size).toBe(8)
    expect(toolRegistry.every((tool) => tool.localProcessing)).toBe(true)
  })

  it('looks up registered tools by id and slug', () => {
    expect(getToolById('json-formatter')?.slug).toBe('json-formatter')
    expect(getToolBySlug('contador-palabras-caracteres')?.id).toBe('word-counter')
    expect(getToolById('missing-tool')).toBeUndefined()
    expect(getToolBySlug('missing-tool')).toBeUndefined()
  })

  it('returns tools by category', () => {
    expect(getToolsByCategory('calculators').map((tool) => tool.id)).toEqual(['percentage-discount'])
    expect(getToolsByCategory('text').map((tool) => tool.id)).toEqual(['word-counter', 'text-cleaner'])
    expect(getToolsByCategory('developer').map((tool) => tool.id)).toEqual(['json-formatter', 'base64'])
    expect(getToolsByCategory('images').map((tool) => tool.id)).toEqual(['image-compressor', 'image-resizer', 'image-converter'])
    expect(getToolBySlug('comprimir-imagen')?.id).toBe('image-compressor')
    expect(getToolBySlug('herramientas-pdf')?.id).toBe('pdf-page-tools')
    expect(getToolsByCategory('documents').map((tool) => tool.id)).toEqual(['pdf-page-tools'])
  })
})
