export type ToolCategory =
  | 'calculators'
  | 'text'
  | 'developer'
  | 'images'

export interface ToolDefinition {
  id: string
  slug: string
  name: string
  description: string
  category: ToolCategory
  localProcessing: boolean
  seo: {
    title: string
    description: string
  }
}

export interface ToolImplementation<TInput = unknown, TOutput = unknown> {
  definition: ToolDefinition
  process: (input: TInput) => TOutput
}
