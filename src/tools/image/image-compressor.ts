import type { ImageFormat } from './shared/image-processing'

export interface CompressionOptions {
  format: ImageFormat
  quality: number
}

export function normalizeCompressionQuality(quality: number): number {
  if (!Number.isFinite(quality)) throw new Error('Elegí una calidad válida.')
  return Math.min(1, Math.max(0.1, quality))
}
