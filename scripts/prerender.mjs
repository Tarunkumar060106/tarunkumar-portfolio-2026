// Runs after `vite build` + the SSR build: injects the rendered page and SEO head tags into
// dist/index.html, and writes robots.txt, sitemap.xml, llms.txt and the web manifest.

import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const ssrEntry = resolve(root, 'dist-ssr/entry-server.js')

const mod = await import(pathToFileURL(ssrEntry).href)
const base = (process.env.SITE_URL || mod.site.url).replace(/\/?$/, '/')

const indexPath = resolve(dist, 'index.html')
const template = readFileSync(indexPath, 'utf8')
if (!template.includes('<!--app-html-->') || !template.includes('<!--app-head-->')) {
  throw new Error('index.html is missing the <!--app-head--> / <!--app-html--> placeholders')
}

// Preload the two Latin font files so text paints without waiting for the stylesheet to discover them.
const fontPreloads = readdirSync(resolve(dist, 'assets'))
  .filter((f) => /^(manrope|jetbrains-mono)-latin-wght-normal-.*\.woff2$/.test(f))
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`)

const head = [...fontPreloads, mod.headTags(base)].join('\n    ')
const html = template.replace('<!--app-head-->', head).replace('<!--app-html-->', mod.render())

writeFileSync(indexPath, html)
writeFileSync(resolve(dist, 'robots.txt'), mod.robotsTxt(base))
writeFileSync(resolve(dist, 'sitemap.xml'), mod.sitemapXml(base))
writeFileSync(resolve(dist, 'llms.txt'), mod.llmsTxt(base))
writeFileSync(resolve(dist, 'site.webmanifest'), mod.webManifest())
rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true })

console.log(`[prerender] ${(html.length / 1024).toFixed(1)} kB index.html + robots.txt, sitemap.xml, llms.txt, site.webmanifest for ${base}`)
