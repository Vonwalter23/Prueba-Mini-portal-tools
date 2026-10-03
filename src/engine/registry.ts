import type { ToolDefinition } from './types'

/** Central metadata registry. Implementations live in src/tools, not in this file. */
export const toolRegistry: readonly ToolDefinition[] = [
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'Formateador y validador JSON',
    description: 'Validá, formateá y compactá JSON directamente en tu navegador.',
    category: 'developer',
    localProcessing: true,
    seo: {
      title: 'Formateador y validador JSON gratis | Microportal Tools',
      description: 'Formateá, compactá y validá JSON gratis. Tus datos se procesan localmente en el navegador.',
    },
  },
  {
    id: 'word-counter',
    slug: 'contador-palabras-caracteres',
    name: 'Contador de palabras y caracteres',
    description: 'Contá palabras, caracteres y tiempo estimado de lectura.',
    category: 'text',
    localProcessing: true,
    seo: {
      title: 'Contador de palabras y caracteres gratis | Microportal Tools',
      description: 'Contá palabras y caracteres con y sin espacios en tiempo real, sin enviar tu texto a un servidor.',
    },
  },
  {
    id: 'percentage-discount',
    slug: 'calculadora-porcentajes-descuentos',
    name: 'Calculadora de porcentajes y descuentos',
    description: 'Calculá porcentajes, descuentos y variaciones porcentuales.',
    category: 'calculators',
    localProcessing: true,
    seo: {
      title: 'Calculadora de porcentajes y descuentos | Microportal Tools',
      description: 'Calculá porcentajes, precio con descuento y variación porcentual gratis.',
    },
  },
  {
    id: 'text-cleaner',
    slug: 'limpiador-de-texto',
    name: 'Limpiador de texto',
    description: 'Limpiá espacios, líneas vacías y líneas duplicadas.',
    category: 'text',
    localProcessing: true,
    seo: {
      title: 'Limpiador de texto online gratis | Microportal Tools',
      description: 'Limpiá espacios y líneas duplicadas con opciones claras. El texto no sale de tu navegador.',
    },
  },
  {
    id: 'base64',
    slug: 'codificador-decodificador-base64',
    name: 'Codificador y decodificador Base64',
    description: 'Convertí texto a Base64 y decodificá contenido UTF-8.',
    category: 'developer',
    localProcessing: true,
    seo: {
      title: 'Codificador y decodificador Base64 gratis | Microportal Tools',
      description: 'Codificá y decodificá texto Base64 compatible con UTF-8. Base64 no es cifrado.',
    },
  },
  {
    id: 'image-compressor',
    slug: 'comprimir-imagen',
    name: 'Compresor de imágenes',
    description: 'Reducí el peso de imágenes JPEG, PNG y WebP en tu navegador.',
    category: 'images',
    localProcessing: true,
    seo: {
      title: 'Compresor de imágenes gratis online | Microportal Tools',
      description: 'Comprimí imágenes JPEG, PNG y WebP gratis. Las imágenes se procesan localmente en tu navegador.',
    },
  },
  {
    id: 'image-resizer',
    slug: 'redimensionar-imagen',
    name: 'Redimensionador de imágenes',
    description: 'Cambiá las dimensiones de una imagen sin subirla a un servidor.',
    category: 'images',
    localProcessing: true,
    seo: {
      title: 'Redimensionador de imágenes gratis | Microportal Tools',
      description: 'Redimensioná imágenes por ancho, alto o porcentaje. Procesamiento local en el navegador.',
    },
  },
  {
    id: 'image-converter',
    slug: 'convertir-imagen',
    name: 'Conversor de imágenes',
    description: 'Convertí imágenes entre JPEG, PNG y WebP en forma local.',
    category: 'images',
    localProcessing: true,
    seo: {
      title: 'Conversor de imágenes JPEG, PNG y WebP | Microportal Tools',
      description: 'Convertí imágenes entre JPEG, PNG y WebP gratis. Tus archivos no se suben para su procesamiento.',
    },
  },
]

export function getToolById(id: string): ToolDefinition | undefined {
  return toolRegistry.find((tool) => tool.id === id)
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return toolRegistry.find((tool) => tool.slug === slug)
}

export function getToolsByCategory(
  category: ToolDefinition['category'],
): ToolDefinition[] {
  return toolRegistry.filter((tool) => tool.category === category)
}
