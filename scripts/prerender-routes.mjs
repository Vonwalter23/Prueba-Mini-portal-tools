import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const shellPath = path.join(distDir, 'index.html')
const shell = await readFile(shellPath, 'utf8')
const vite = await createServer({
  configFile: path.join(rootDir, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
})

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function createHtml(metadata, markup) {
  return shell
    .replace(/<title>[^<]*<\/title>/u, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/u, `<meta name="description" content="${escapeHtml(metadata.description)}" />`)
    .replace('<div id="root"></div>', `<div id="root" data-prerendered="true">${markup}</div>`)
}

try {
  const { default: App } = await vite.ssrLoadModule('/src/app/App.tsx')
  const { resolveRouteMetadata } = await vite.ssrLoadModule('/src/seo/metadata.ts')
  const { toolRegistry } = await vite.ssrLoadModule('/src/engine/registry.ts')
  const routes = ['/', ...toolRegistry.map((tool) => `/herramientas/${tool.slug}`)]

  for (const routePath of routes) {
    const metadata = resolveRouteMetadata(routePath)
    const markup = renderToString(React.createElement(App, { pathname: routePath }))
    const html = createHtml(metadata, markup)
    const outputPath = routePath === '/' ? shellPath : path.join(distDir, routePath.slice(1), 'index.html')
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, html)
  }

  const notFoundPath = '/__not_found__'
  const notFoundMetadata = resolveRouteMetadata(notFoundPath)
  const notFoundMarkup = renderToString(React.createElement(App, { pathname: notFoundPath }))
  await writeFile(path.join(distDir, '404.html'), createHtml(notFoundMetadata, notFoundMarkup))
  console.log(`Prerendered ${routes.length} routes plus 404.html. No canonical URLs or sitemap generated because the production origin is not configured.`)
} finally {
  await vite.close()
}
