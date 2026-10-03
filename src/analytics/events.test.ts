import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAllowedAnalyticsEvent, track } from './events'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('analytics event allowlist', () => {
  it('accepts the fixed tool-view event shape', () => {
    expect(isAllowedAnalyticsEvent({ type: 'tool_view', toolId: 'json-formatter' })).toBe(true)
  })

  it('accepts completion only when the category matches the registry', () => {
    expect(isAllowedAnalyticsEvent({
      type: 'tool_complete',
      toolId: 'image-compressor',
      category: 'images',
    })).toBe(true)
    expect(isAllowedAnalyticsEvent({
      type: 'tool_complete',
      toolId: 'image-compressor',
      category: 'text',
    })).toBe(false)
  })

  it('accepts only fixed error categories', () => {
    expect(isAllowedAnalyticsEvent({
      type: 'tool_error',
      toolId: 'base64',
      errorCategory: 'unsupported-format',
    })).toBe(true)
    expect(isAllowedAnalyticsEvent({
      type: 'tool_error',
      toolId: 'base64',
      errorCategory: 'invalid input: user text',
    })).toBe(false)
  })

  it.each([
    null,
    [],
    'tool_view',
    { type: 'unknown-event', toolId: 'json-formatter' },
    { type: 'tool_view', toolId: 'unknown-tool' },
    { type: 'tool_view', toolId: 'json-formatter', input: 'private text' },
    { type: 'tool_view', toolId: 'json-formatter', url: '/?secret=value' },
    { type: 'tool_error', toolId: 'base64', errorCategory: 'unexpected', stack: 'private stack' },
  ])('rejects invalid or over-specified payloads: %j', (event) => {
    expect(isAllowedAnalyticsEvent(event)).toBe(false)
  })
})

describe('disabled analytics adapter', () => {
  it('does not transmit or persist an accepted event', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')

    track({ type: 'tool_view', toolId: 'json-formatter' })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
  })

  it('silently discards invalid payloads without side effects', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')

    track({ type: 'tool_error', toolId: 'base64', errorCategory: 'failure', message: 'private input' })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
  })
})
