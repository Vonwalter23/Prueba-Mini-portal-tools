export type CalculatorMode = 'percentage' | 'discount' | 'change'

export interface CalculatorResult {
  primary: number
  secondary: number
  label: string
}

export function calculatePercentage(
  mode: CalculatorMode,
  value: number,
  rate: number,
): CalculatorResult {
  if (!Number.isFinite(value) || !Number.isFinite(rate)) {
    throw new Error('Ingresá números válidos en ambos campos.')
  }
  if (mode === 'percentage') {
    return { primary: (value * rate) / 100, secondary: rate, label: `${rate}% de ${value}` }
  }
  if (mode === 'discount') {
    const discount = (value * rate) / 100
    return { primary: value - discount, secondary: discount, label: 'Precio final después del descuento' }
  }
  if (value === 0) throw new Error('No se puede calcular la variación porcentual desde cero.')
  return { primary: ((rate - value) / value) * 100, secondary: rate - value, label: 'Variación porcentual' }
}
