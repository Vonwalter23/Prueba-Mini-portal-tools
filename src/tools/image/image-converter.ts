import type { ImageFormat } from './shared/image-processing'

export function jpegNeedsBackground(format: ImageFormat): boolean {
  return format === 'image/jpeg'
}
