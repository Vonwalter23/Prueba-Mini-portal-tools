function encodeUtf8Base64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

function decodeUtf8Base64(input: string): string {
  const normalized = input.replace(/[\t\n\r ]/gu, '')
  if (normalized.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(normalized)) {
    throw new Error('La entrada no tiene un formato Base64 válido.')
  }
  try {
    const binary = atob(normalized)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error('La entrada Base64 no contiene texto UTF-8 válido.')
  }
}

export function encodeBase64(input: string): string {
  return encodeUtf8Base64(input)
}

export function decodeBase64(input: string): string {
  return decodeUtf8Base64(input)
}
