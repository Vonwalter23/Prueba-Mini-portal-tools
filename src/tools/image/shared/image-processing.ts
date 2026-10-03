export const IMAGE_LIMITS = {
  maxFileBytes: 20 * 1024 * 1024,
  maxPixels: 40_000_000,
} as const

export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp'

const EXTENSION_TO_MIME: Record<string, ImageFormat> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export const IMAGE_FORMATS: readonly ImageFormat[] = ['image/jpeg', 'image/png', 'image/webp']

export function formatLabel(format: ImageFormat): string {
  return format === 'image/jpeg' ? 'JPEG' : format === 'image/png' ? 'PNG' : 'WebP'
}

export function extensionForMime(mime: ImageFormat): string {
  return mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp'
}

export function validateImageFile(file: Pick<File, 'name' | 'size' | 'type'>): ImageFormat {
  if (file.size <= 0) throw new Error('El archivo está vacío.')
  if (file.size > IMAGE_LIMITS.maxFileBytes) throw new Error('La imagen supera el límite de 20 MiB.')
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const extensionMime = EXTENSION_TO_MIME[extension]
  if (!extensionMime) throw new Error('Formato no compatible. Usá una imagen JPEG, PNG o WebP estática.')
  if (file.type && !IMAGE_FORMATS.includes(file.type as ImageFormat)) {
    throw new Error('Formato no compatible. Usá una imagen JPEG, PNG o WebP estática.')
  }
  if (file.type && file.type !== extensionMime) {
    throw new Error('La extensión del archivo no coincide con su tipo de imagen.')
  }
  return extensionMime
}

export function calculateResizeDimensions(
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  lockAspectRatio: boolean,
): { width: number; height: number } {
  if (![sourceWidth, sourceHeight, width, height].every(Number.isFinite)
    || sourceWidth < 1 || sourceHeight < 1 || width < 1 || height < 1) {
    throw new Error('Ingresá un ancho y un alto válidos, mayores que cero.')
  }
  if (!lockAspectRatio) {
    const dimensions = { width: Math.round(width), height: Math.round(height) }
    if (dimensions.width * dimensions.height > IMAGE_LIMITS.maxPixels) {
      throw new Error('El resultado supera el límite de 40 megapíxeles.')
    }
    return dimensions
  }
  const widthScale = width / sourceWidth
  const heightScale = height / sourceHeight
  const scale = Math.min(widthScale, heightScale)
  const dimensions = {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  }
  if (dimensions.width * dimensions.height > IMAGE_LIMITS.maxPixels) {
    throw new Error('El resultado supera el límite de 40 megapíxeles.')
  }
  return dimensions
}

export function calculateScaleDimensions(
  sourceWidth: number,
  sourceHeight: number,
  percentage: number,
): { width: number; height: number } {
  if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 800) {
    throw new Error('El porcentaje debe estar entre 1 y 800.')
  }
  const width = Math.max(1, Math.round(sourceWidth * percentage / 100))
  const height = Math.max(1, Math.round(sourceHeight * percentage / 100))
  if (width * height > IMAGE_LIMITS.maxPixels) {
    throw new Error('El resultado supera el límite de 40 megapíxeles.')
  }
  return { width, height }
}

export function calculateSizeChange(originalBytes: number, outputBytes: number): {
  differenceBytes: number
  percentage: number
  reduced: boolean
} {
  if (originalBytes <= 0 || outputBytes < 0) throw new Error('Los tamaños de archivo no son válidos.')
  return {
    differenceBytes: originalBytes - outputBytes,
    percentage: ((originalBytes - outputBytes) / originalBytes) * 100,
    reduced: outputBytes < originalBytes,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('es-AR', { maximumFractionDigits: 1 })} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('es-AR', { maximumFractionDigits: 2 })} MiB`
}

export interface ImageProcessOptions {
  format: ImageFormat
  quality?: number
  width?: number
  height?: number
  background?: string
}

export interface ProcessedImage {
  blob: Blob
  width: number
  height: number
  format: ImageFormat
}

export async function processImage(file: File, options: ImageProcessOptions): Promise<ProcessedImage> {
  validateImageFile(file)
  let bitmap: ImageBitmap | undefined
  let canvas: HTMLCanvasElement | undefined
  try {
    bitmap = await createImageBitmap(file)
    if (!bitmap.width || !bitmap.height) throw new Error('No se pudieron leer las dimensiones de la imagen.')
    if (bitmap.width * bitmap.height > IMAGE_LIMITS.maxPixels) {
      throw new Error('La imagen supera el límite de 40 megapíxeles.')
    }
    const width = options.width ?? bitmap.width
    const height = options.height ?? bitmap.height
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1
      || width * height > IMAGE_LIMITS.maxPixels) {
      throw new Error('Las dimensiones de salida no son válidas o superan 40 megapíxeles.')
    }
    canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Este navegador no permite procesar la imagen.')
    if (options.format === 'image/jpeg') {
      context.fillStyle = options.background ?? '#ffffff'
      context.fillRect(0, 0, width, height)
    }
    context.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas?.toBlob(
        (result) => result ? resolve(result) : reject(new Error('No se pudo generar el archivo. Probá otro formato.')),
        options.format,
        options.format === 'image/png' ? undefined : Math.min(1, Math.max(0.1, options.quality ?? 0.82)),
      )
    })
    if (blob.size === 0) throw new Error('El archivo generado está vacío.')
    if (blob.type !== options.format) {
      throw new Error(`El navegador no pudo exportar ${formatLabel(options.format)}. Elegí otro formato.`)
    }
    return { blob, width, height, format: options.format }
  } catch (cause) {
    if (cause instanceof Error && /image|format|megapíxeles|dimensiones|navegador|archivo|20 MiB|40 megapíxeles|JPEG|PNG|WebP|vacío/i.test(cause.message)) {
      throw cause
    }
    throw new Error('No se pudo abrir la imagen. Verificá que el archivo no esté dañado y sea JPEG, PNG o WebP.')
  } finally {
    bitmap?.close()
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
