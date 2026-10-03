import { expect, test } from '@playwright/test'

test('PDF page tools provide operations and reject malformed input clearly', async ({ page }) => {
  await page.goto('/herramientas/herramientas-pdf')
  await expect(page.getByRole('heading', { name: 'Herramientas para PDF' })).toBeVisible()
  await expect(page.getByLabel('Operación')).toHaveValue('merge')
  await page.getByLabel('Operación').selectOption('rotate')
  await page.getByLabel('Archivo PDF').setInputFiles({
    name: 'broken.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a valid PDF'),
  })
  await page.getByRole('button', { name: 'Rotar páginas' }).click()
  await expect(page.getByRole('alert')).toContainText('No se pudo abrir "broken.pdf"')
})

test('PDF tools layout does not overflow a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/herramientas/herramientas-pdf')
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})
