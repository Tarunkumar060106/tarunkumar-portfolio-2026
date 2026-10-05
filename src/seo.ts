// Everything search engines, answer engines and link-preview bots read, generated from content.ts
// at build time (see scripts/prerender.mjs). One source of truth: edit content.ts, rebuild, done.

import { about, certifications, experience, hero, projects, site, stack } from './content'

export const seo = {
  title: `${site.name} · Software Engineer (AI, Microservices, Full-Stack)`,
  description:
    'Tarunkumar Sivakumar is a software engineer and CS student at SRMIST, Chennai, building AI agents, microservices and full-stack products like Mailmind, an AI email client.',
  ogImage: '/og-image.jpg',
  ogImageAlt: `${site.name}, software engineer. A developer coding at a desk at night, city skyline behind.`,
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const abs = (base: string, path: string) => new URL(path, base).toString()

/** schema.org graph: WebSite + ProfilePage + Person + the featured projects. */
export function structuredData(base: string) {
  const personId = `${base}#person`
  const skills = [...new Set([...about.focus, ...stack.flatMap((g) => g.items)])]
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${base}#website`,
        url: base,
        name: `${site.name} · Portfolio`,
        inLanguage: 'en',
        publisher: { '@id': personId },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${base}#profile`,
        url: base,
        name: seo.title,
        description: seo.description,
        dateModified: new Date().toISOString(),
        isPartOf: { '@id': `${base}#website` },
        mainEntity: { '@id': personId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: site.name,
        alternateName: ['Tarunkumar S', 'Tarun'],
        url: base,
        image: abs(base, seo.ogImage),
        jobTitle: 'Software Engineer',
        description: about.statement,
        email: `mailto:${site.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'Chennai', addressRegion: 'Tamil Nadu', addressCountry: 'IN' },
        alumniOf: {
          '@type': 'CollegeOrUniversity',
          name: 'SRM Institute of Science and Technology',
          sameAs: 'https://www.srmist.edu.in/',
        },
        knowsAbout: skills,
        hasCredential: certifications.map((c) => ({
          '@type': 'EducationalOccupationalCredential',
          name: c.name,
          credentialCategory: 'certification',
          recognizedBy: { '@type': 'Organization', name: c.issuer },
        })),
        hasOccupation: experience.map((e) => ({
          '@type': 'Role',
          roleName: `${e.role}, ${e.org}`,
          description: `${e.period}. ${e.description}`,
        })),
        sameAs: site.socials.map((s) => s.href),
      },
      {
        '@type': 'ItemList',
        '@id': `${base}#projects`,
        name: 'Selected projects',
        itemListElement: projects.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'CreativeWork',
            name: p.name,
            description: p.summary,
            url: p.href,
            keywords: p.tags.join(', '),
            creator: { '@id': personId },
          },
        })),
      },
    ],
  }
}

/** <head> tags injected into the pre-rendered index.html. */
export function headTags(base: string) {
  const image = abs(base, seo.ogImage)
  const [first, ...rest] = site.name.split(' ')
  const tags = [
    `<link rel="canonical" href="${base}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<meta name="author" content="${esc(site.name)}" />`,
    `<link rel="manifest" href="/site.webmanifest" />`,
    `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`,
    `<link rel="alternate" type="text/plain" title="LLM summary" href="/llms.txt" />`,
    // Open Graph (LinkedIn, WhatsApp, Slack, Discord…)
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${esc(site.name)}" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:url" content="${base}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(seo.ogImageAlt)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="profile:first_name" content="${esc(first)}" />`,
    `<meta property="profile:last_name" content="${esc(rest.join(' '))}" />`,
    // X / Twitter
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(seo.ogImageAlt)}" />`,
    // Structured data for search + answer engines
    `<script type="application/ld+json">${JSON.stringify(structuredData(base)).replace(/</g, '\\u003c')}</script>`,
  ]
  return tags.join('\n    ')
}

/** /llms.txt: a plain-language summary that AI assistants and answer engines can read directly. */
export function llmsTxt(base: string) {
  const lines = [
    `# ${site.name}`,
    '',
    `> ${seo.description}`,
    '',
    `${about.statement} ${about.body.join(' ')}`,
    '',
    '## Quick facts',
    '',
    `- Role: ${site.role}`,
    `- Location: ${site.location} (${about.availability})`,
    `- Education: ${about.education.degree}, ${about.education.school} (${about.education.detail})`,
    `- Focus: ${about.focus.join(', ')}`,
    `- Currently: ${hero.footer}`,
    '',
    '## Projects',
    '',
    ...projects.map((p) => `- [${p.name}](${p.href}): ${p.summary} Built with ${p.tags.join(', ')}. (${p.period})`),
    '',
    '## Experience',
    '',
    ...experience.map((e) => `- ${e.role}, ${e.org} (${e.period}): ${e.description}`),
    '',
    '## Certifications',
    '',
    ...certifications.map((c) => `- ${c.name}, ${c.issuer} (${c.year})`),
    '',
    '## Skills',
    '',
    ...stack.map((g) => `- ${g.group}: ${g.items.join(', ')}`),
    '',
    '## Links',
    '',
    `- Website: ${base}`,
    `- Email: ${site.email}`,
    ...site.socials.map((s) => `- ${s.label}: ${s.href}`),
    '',
  ]
  return lines.join('\n')
}

export function sitemapXml(base: string) {
  const today = new Date().toISOString().slice(0, 10)
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${base}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${abs(base, seo.ogImage)}</image:loc>
    </image:image>
  </url>
</urlset>
`
}

/** Allows every crawler (search engines and AI answer engines alike) and points them at the sitemap. */
export function robotsTxt(base: string) {
  return `User-agent: *
Allow: /

Sitemap: ${abs(base, '/sitemap.xml')}
`
}

export function webManifest() {
  return JSON.stringify(
    {
      name: `${site.name} · Portfolio`,
      short_name: 'Tarunkumar',
      description: seo.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#171717',
      theme_color: '#171717',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  )
}
