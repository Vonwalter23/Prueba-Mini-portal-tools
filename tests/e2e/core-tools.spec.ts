import { expect, test } from '@playwright/test'

test('JSON formatter validates and formats JSON', async ({ page }) => {
  await page.goto('/herramientas/json-formatter')
  await page.getByLabel('Entrada').fill('{"name":"Walter","active":true}')
  await page.getByRole('button', { name: 'Procesar JSON' }).click()
  await expect(page.getByLabel('Resultado')).toHaveValue(/\n  "name": "Walter"/)
})

test('word counter updates counts while typing', async ({ page }) => {
  await page.goto('/herramientas/contador-palabras-caracteres')
  await page.getByLabel('Entrada').fill('Hola mundo')
  await expect(page.locator('.count-grid')).toContainText('2')
  await expect(page.locator('.count-grid')).toContainText('10')
})

test('percentage calculator calculates a value', async ({ page }) => {
  await page.goto('/herramientas/calculadora-porcentajes-descuentos')
  await page.getByLabel('Valor ($ o número)').fill('200')
  await page.getByLabel('Porcentaje (%)').fill('15')
  await page.getByRole('button', { name: 'Calcular' }).click()
  await expect(page.getByLabel('Resultado')).toHaveValue('30')
})

test('text cleaner applies selected transformations', async ({ page }) => {
  await page.goto('/herramientas/limpiador-de-texto')
  await page.getByLabel('Entrada').fill('  alfa  \nbeta\nalfa')
  await page.getByLabel('Eliminar líneas duplicadas (conservar la primera)').check()
  await page.getByRole('button', { name: 'Limpiar texto' }).click()
  await expect(page.getByLabel('Resultado')).toHaveValue('alfa\nbeta')
})

test('Base64 encodes UTF-8 text and can decode it', async ({ page }) => {
  await page.goto('/herramientas/codificador-decodificador-base64')
  await page.getByLabel('Entrada').fill('Hola, Trelew!')
  await page.getByRole('button', { name: 'Codificar' }).click()
  await expect(page.getByLabel('Resultado')).toHaveValue('SG9sYSwgVHJlbGV3IQ==')
  await page.getByLabel('Operación').selectOption('decode')
  await page.getByLabel('Entrada').fill('SG9sYSwgVHJlbGV3IQ==')
  await page.getByRole('button', { name: 'Decodificar' }).click()
  await expect(page.getByLabel('Resultado')).toHaveValue('Hola, Trelew!')
})

test('unknown route shows a not-found page', async ({ page }) => {
  await page.goto('/herramientas/no-existe')
  await expect(page.getByRole('heading', { name: 'No encontramos esa herramienta' })).toBeVisible()
})

test('tool page remains within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/herramientas/contador-palabras-caracteres')
  await expect(page.getByRole('heading', { name: 'Contador de palabras y caracteres' })).toBeVisible()
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})

test('home navigation, keyboard focus, and browser history work', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toHaveText('Saltar al contenido')
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toHaveAttribute('aria-label', 'Microportal Tools, inicio')

  await page.getByRole('link', { name: 'Formateador y validador JSON' }).click()
  await expect(page.getByRole('heading', { name: 'Formateador y validador JSON' })).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('heading', { name: /todo lo útil/i })).toBeVisible()

  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Formateador y validador JSON' })).toBeVisible()
})
