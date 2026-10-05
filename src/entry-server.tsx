// Server entry used only at build time: renders the whole page to static HTML so crawlers,
// answer engines and link-preview bots see the real content without running JavaScript.
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

export { headTags, llmsTxt, robotsTxt, sitemapXml, webManifest } from './seo'
export { site } from './content'

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
