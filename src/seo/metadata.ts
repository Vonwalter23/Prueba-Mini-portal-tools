import { getToolBySlug } from '../engine/registry'
import type { ToolDefinition } from '../engine/types'

export type RouteMetadata =
  | { kind: 'home'; pathname: '/'; title: string; description: string }
  | { kind: 'tool'; pathname: string; title: string; description: string; tool: ToolDefinition }
  | { kind: 'not-found'; pathname: string; title: string; description: string }

const homeMetadata = {
  kind: 'home' as const,
  pathname: '/' as const,
  title: 'Microportal Tools — Herramientas online gratuitas',
  description: 'Herramientas online gratuitas para cálculos, texto, desarrollo e imágenes. Procesá tus datos localmente en el navegador.',
}
const notFoundMetadata = {
  kind: 'not-found' as const,
  pathname: '/404' as const,
  title: 'Página no encontrada | Microportal Tools',
  description: 'No encontramos esa página. Volvé al inicio para explorar las herramientas gratuitas de Microportal Tools.',
}

/** Normalize trailing slashes without decoding or changing path segments. */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  const withoutTrailingSlashes = pathname.replace(/\/+$/u, '')
  return withoutTrailingSlashes || '/'
}

/** Resolve page metadata from a URL path. No production origin or canonical URL is assumed. */
export function resolveRouteMetadata(pathname: string): RouteMetadata {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/u, '')
  const appPath = basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))
    ? pathname.slice(basePath.length) || '/'
    : pathname
  const normalized = normalizePathname(appPath)
  if (normalized === '/') return homeMetadata

  const prefix = '/herramientas/'
  if (normalized.startsWith(prefix)) {
    const encodedSlug = normalized.slice(prefix.length)
    if (!encodedSlug || encodedSlug.includes('/')) return { ...notFoundMetadata, pathname: normalized }
    let slug: string
    try {
      slug = decodeURIComponent(encodedSlug)
    } catch {
      return { ...notFoundMetadata, pathname: normalized }
    }
    const tool = getToolBySlug(slug)
    if (tool) {
      return {
        kind: 'tool',
        pathname: `/herramientas/${tool.slug}`,
        title: tool.seo.title,
        description: tool.seo.description,
        tool,
      }
    }
  }

  return { ...notFoundMetadata, pathname: normalized }
}
