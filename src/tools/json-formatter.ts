export type JsonFormatMode = 'pretty' | 'minify'

export function formatJson(input: string, mode: JsonFormatMode = 'pretty'): string {
  if (input.trim() === '') throw new Error('Ingresá un JSON para validar.')
  let parsed: unknown
  try {
    parsed = JSON.parse(input) as unknown
  } catch {
    throw new Error('El JSON no es válido. Revisá comas, comillas y llaves.')
  }
  return mode === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed)
}
