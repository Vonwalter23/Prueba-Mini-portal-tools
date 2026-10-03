export function parsePositiveDimension(value: string, label: string): number {
  const dimension = Number(value)
  if (!value.trim() || !Number.isInteger(dimension) || dimension < 1) {
    throw new Error(`Ingresá un ${label} entero mayor que cero.`)
  }
  return dimension
}
