import { expect, test } from '@playwright/test'
import { toolRegistry } from '../../src/engine/registry'

test('home route exposes a page title, description, and skip link', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Microportal Tools — Herramientas online gratuitas')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Herramientas online gratuitas/)
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#main-content')
  await expect(page.locator('main#main-content')).toBeVisible()
})

for (const tool of toolRegistry) {
  test(`route metadata and main landmark: ${tool.slug}`, async ({ page }) => {
    await page.goto(`/herramientas/${tool.slug}/`)
    await expect(page).toHaveTitle(tool.seo.title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', tool.seo.description)
    await expect(page.getByRole('heading', { level: 1, name: tool.name })).toBeVisible()
    await expect(page.locator('main#main-content')).toBeVisible()
  })
}

test('unknown routes render a not-found page with its own metadata', async ({ page }) => {
  await page.goto('/ruta-inexistente')
  await expect(page).toHaveTitle('Página no encontrada | Microportal Tools')
  await expect(page.getByRole('heading', { name: 'No encontramos esa herramienta' })).toBeVisible()
})

test('trailing slash routes resolve to the same tool', async ({ page }) => {
  await page.goto('/herramientas/json-formatter/')
  await expect(page.getByRole('heading', { level: 1, name: 'Formateador y validador JSON' })).toBeVisible()
})
