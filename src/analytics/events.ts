import { toolRegistry } from '../engine/registry'
import type { ToolCategory } from '../engine/types'

export const ANALYTICS_ERROR_CATEGORIES = [
  'validation',
  'unsupported-format',
  'processing-failed',
  'unexpected',
] as const

export type AnalyticsErrorCategory = (typeof ANALYTICS_ERROR_CATEGORIES)[number]
export type AnalyticsToolId = (typeof toolRegistry)[number]['id']

export type AnalyticsEvent =
  | { type: 'tool_view'; toolId: AnalyticsToolId }
  | { type: 'tool_complete'; toolId: AnalyticsToolId; category: ToolCategory }
  | { type: 'tool_error'; toolId: AnalyticsToolId; errorCategory: AnalyticsErrorCategory }

const toolIds = new Set<string>(toolRegistry.map(({ id }) => id))
const toolCategories = new Map<string, ToolCategory>(
  toolRegistry.map(({ id, category }) => [id, category]),
)
const errorCategories = new Set<string>(ANALYTICS_ERROR_CATEGORIES)

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * Runtime validation is intentional: TypeScript types do not protect this
 * boundary from JavaScript callers or unsafe casts. Exact keys prevent user
 * content, URLs, filenames, exceptions, and other arbitrary properties.
 */
export function isAllowedAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (!isPlainRecord(value) || typeof value.type !== 'string') return false
  if (typeof value.toolId !== 'string' || !toolIds.has(value.toolId)) return false

  const keys = Object.keys(value).sort()
  if (value.type === 'tool_view') {
    return keys.join(',') === 'toolId,type'
  }

  if (value.type === 'tool_complete') {
    return (
      keys.join(',') === 'category,toolId,type' &&
      typeof value.category === 'string' &&
      value.category === toolCategories.get(value.toolId)
    )
  }

  if (value.type === 'tool_error') {
    return (
      keys.join(',') === 'errorCategory,toolId,type' &&
      typeof value.errorCategory === 'string' &&
      errorCategories.has(value.errorCategory)
    )
  }

  return false
}

/**
 * Stage 7 deliberately has no transmitting or persistent adapter.
 * Valid events are accepted at the boundary and then discarded.
 */
export function track(event: unknown): void {
  if (!isAllowedAnalyticsEvent(event)) return
  // Intentionally no-op: do not add network, storage, cookies, or identifiers.
}
