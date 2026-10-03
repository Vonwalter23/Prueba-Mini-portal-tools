import { expect, test, type Page } from '@playwright/test'

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8z8Dwn4GBgYGJAQoAHxcCAk+Uzr4AAAAASUVORK5CYII=', 'base64')

async function uploadTinyPng(page: Page) {
  await page.getByLabel('Archivo de imagen').setInputFiles({
    name: 'tiny.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  })
}

async function createExifOrientationSixJpeg(page: Page): Promise<Buffer> {
  const jpegDataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 3
    canvas.height = 2
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D is unavailable')
    context.fillStyle = '#e33'
    context.fillRect(0, 0, 1, 2)
    context.fillStyle = '#36c'
    context.fillRect(1, 0, 2, 2)
    return canvas.toDataURL('image/jpeg', 1)
  })
  const jpeg = Buffer.from(jpegDataUrl.split(',')[1], 'base64')
  // EXIF APP1 segment: little-endian TIFF, orientation tag 0x0112 = 6 (rotate 90° CW).
  const exifPayload = Buffer.from([
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01, 0x00,
    0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ])
  const segmentLength = exifPayload.length + 2
  const app1 = Buffer.concat([
    Buffer.from([0xff, 0xe1, segmentLength >> 8, segmentLength & 0xff]),
    exifPayload,
  ])
  return Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)])
}

test('image compressor processes a PNG locally and offers a correctly typed download', async ({ page }) => {
  await page.goto('/herramientas/comprimir-imagen')
  await expect(page.getByRole('heading', { name: 'Compresor de imágenes' })).toBeVisible()
  await uploadTinyPng(page)
  await expect(page.locator('img.image-preview').first()).toBeVisible()
  await page.getByRole('button', { name: 'Comprimir imagen' }).click()
  await expect(page.getByRole('heading', { name: 'Resultado' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Descargar imagen' })).toHaveAttribute('download', 'tiny-microportal.webp')
})

test('image resizer changes dimensions and can reset', async ({ page }) => {
  await page.goto('/herramientas/redimensionar-imagen')
  await uploadTinyPng(page)
  await page.getByLabel('Escala porcentual opcional (1–800 %)').fill('50')
  await page.getByRole('button', { name: 'Redimensionar imagen' }).click()
  await expect(page.getByRole('heading', { name: 'Resultado' })).toBeVisible()
  await expect(page.locator('.image-result .image-meta').first()).toHaveText(/1 × 1 px/)
  await page.getByRole('button', { name: 'Procesar otra imagen' }).click()
  await expect(page.getByText('Elegí o arrastrá una imagen')).toBeVisible()
})

test('image converter warns about JPEG transparency and processes a PNG', async ({ page }) => {
  await page.goto('/herramientas/convertir-imagen')
  await uploadTinyPng(page)
  await page.getByLabel('Formato de salida').selectOption('image/jpeg')
  await expect(page.getByText(/JPEG no admite transparencia/)).toBeVisible()
  await page.getByRole('button', { name: 'Convertir imagen' }).click()
  await expect(page.getByRole('heading', { name: 'Resultado' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Descargar imagen' })).toHaveAttribute('download', 'tiny-microportal.jpg')
})

test('unsupported formats are rejected without breaking the page', async ({ page }) => {
  await page.goto('/herramientas/comprimir-imagen')
  await page.getByLabel('Archivo de imagen').setInputFiles({
    name: 'vector.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'),
  })
  await expect(page.getByRole('alert')).toContainText('Formato no compatible')
})

test('corrupt replacement clears the previous valid image and cannot process it accidentally', async ({ page }) => {
  await page.goto('/herramientas/comprimir-imagen')
  await uploadTinyPng(page)
  await expect(page.getByText('tiny.png')).toBeVisible()
  await page.getByLabel('Archivo de imagen').setInputFiles({
    name: 'corrupt.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not a real PNG image'),
  })
  await expect(page.getByRole('alert')).toContainText('No se pudo abrir la imagen')
  await expect(page.getByText('tiny.png')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Comprimir imagen' })).toHaveCount(0)
})

test('EXIF orientation is applied to source dimensions', async ({ page }) => {
  await page.goto('/herramientas/redimensionar-imagen')
  const orientedJpeg = await createExifOrientationSixJpeg(page)
  await page.getByLabel('Archivo de imagen').setInputFiles({
    name: 'oriented.jpg',
    mimeType: 'image/jpeg',
    buffer: orientedJpeg,
  })
  await expect(page.getByText('oriented.jpg')).toBeVisible()
  await expect(page.locator('.image-preview-grid .image-meta').first()).toHaveText(/2 × 3 px/)
  await page.getByRole('button', { name: 'Redimensionar imagen' }).click()
  await expect(page.getByRole('heading', { name: 'Resultado' })).toBeVisible()
  await expect(page.locator('.image-result .image-meta').first()).toHaveText(/2 × 3 px/)
})

test('replacing the selected image while processing discards the stale result', async ({ page }) => {
  await page.addInitScript(() => {
    const originalToBlob = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      originalToBlob.call(this, (blob) => {
        window.setTimeout(() => callback(blob), 700)
      }, type, quality)
    }
  })
  await page.goto('/herramientas/comprimir-imagen')
  await uploadTinyPng(page)
  await page.getByRole('button', { name: 'Comprimir imagen' }).click()
  await expect(page.getByRole('button', { name: 'Procesando…' })).toBeDisabled()

  await page.getByLabel('Archivo de imagen').setInputFiles({
    name: 'replacement.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  })
  await expect(page.getByText('replacement.png')).toBeVisible()
  await page.waitForTimeout(900)

  await expect(page.getByRole('heading', { name: 'Resultado' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Comprimir imagen' })).toBeEnabled()
})

test('image picker is keyboard accessible', async ({ page }) => {
  await page.goto('/herramientas/comprimir-imagen')
  const picker = page.getByRole('button', { name: 'Seleccionar imagen' })
  await picker.focus()
  await expect(picker).toBeFocused()
  const chooserPromise = page.waitForEvent('filechooser')
  await page.keyboard.press('Enter')
  const chooser = await chooserPromise
  await chooser.setFiles({
    name: 'tiny.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  })
  await expect(page.getByText('tiny.png')).toBeVisible()
})

test('image tools fit a mobile viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/herramientas/convertir-imagen')
  await uploadTinyPng(page)
  await expect(page.getByText('tiny.png')).toBeVisible()
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})
