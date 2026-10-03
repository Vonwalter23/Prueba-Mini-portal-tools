import { describe, expect, it } from 'vitest'
import { normalizePathname, resolveRouteMetadata } from './metadata'
import { toolRegistry } from '../engine/registry'

describe('route metadata', () => {
  it('normalizes trailing slashes but preserves root', () => {
    expect(normalizePathname('/')).toBe('/')
    expect(normalizePathname('/herramientas/json-formatter/')).toBe('/herramientas/json-formatter')
    expect(normalizePathname('/herramientas/json-formatter///')).toBe('/herramientas/json-formatter')
  })

  it('provides stable home metadata', () => {
    const route = resolveRouteMetadata('/')
    expect(route.kind).toBe('home')
    expect(route.title).toContain('Microportal Tools')
    expect(route.description.length).toBeGreaterThan(40)
  })

  it('resolves every registered tool with unique non-empty SEO metadata', () => {
    const routes = toolRegistry.map((tool) => resolveRouteMetadata(`/herramientas/${tool.slug}/`))
    expect(routes).toHaveLength(9)
    expect(routes.every((route) => route.kind === 'tool')).toBe(true)
    expect(new Set(routes.map((route) => route.title)).size).toBe(9)
    expect(new Set(routes.map((route) => route.description)).size).toBe(9)
    expect(routes.every((route) => route.title.trim() && route.description.trim())).toBe(true)
  })

  it('safely handles unknown, nested, empty, and malformed encoded paths', () => {
    for (const pathname of ['/no-existe', '/herramientas/no-existe', '/herramientas/', '/herramientas/json-formatter/extra', '/herramientas/%E0%A4%A']) {
      expect(resolveRouteMetadata(pathname).kind).toBe('not-found')
    }
  })

  it('accepts a valid percent-encoded slug and does not assume a canonical origin', () => {
    expect(resolveRouteMetadata('/herramientas/json-%66ormatter').kind).toBe('tool')
    expect('canonical' in resolveRouteMetadata('/')).toBe(false)
  })
})
