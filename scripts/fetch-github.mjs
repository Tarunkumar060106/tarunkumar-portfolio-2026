// Fetches public GitHub activity at build time and writes src/data/github.json.
// No token needed: repos come from the REST API, the contribution calendar from the public
// contributions page. If anything fails, the last good snapshot is kept so builds never break.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const USER = 'Tarunkumar060106'
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/github.json')
const RECENT_REPOS = 4
// Repos to keep out of the "latest activity" list (profile config, timed online tests).
const EXCLUDE = new Set([USER, 'RA2311003012062', 'bajaj-fs'])
const HEADERS = { 'User-Agent': `${USER}-portfolio-build`, Accept: 'application/vnd.github+json' }

async function getJSON(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json()
}

async function getContributions() {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, { headers: HEADERS })
  if (!res.ok) throw new Error(`contributions → ${res.status}`)
  const html = await res.text()

  // Exact counts live in the tooltips, keyed by the cell id they describe.
  const counts = new Map()
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>\s*([^<]*)/g)) {
    const n = m[2].match(/^(\d[\d,]*) contribution/)
    counts.set(m[1], n ? Number(n[1].replace(/,/g, '')) : 0)
  }

  const days = []
  for (const m of html.matchAll(/<td[^>]*\bdata-date="([\d-]+)"[^>]*>/g)) {
    const tag = m[0]
    const id = tag.match(/\bid="([^"]+)"/)?.[1]
    const level = Number(tag.match(/\bdata-level="(\d)"/)?.[1] ?? 0)
    days.push({ date: m[1], level, count: counts.get(id) ?? 0 })
  }
  days.sort((a, b) => a.date.localeCompare(b.date))
  if (!days.length) throw new Error('no contribution cells found (page layout changed?)')
  return { total: days.reduce((sum, d) => sum + d.count, 0), days }
}

async function main() {
  const [user, repos, contributions] = await Promise.all([
    getJSON(`https://api.github.com/users/${USER}`),
    getJSON(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`),
    getContributions(),
  ])

  const own = repos.filter((r) => !r.fork && !r.private)
  const languages = {}
  for (const r of own) if (r.language) languages[r.language] = (languages[r.language] ?? 0) + 1

  const data = {
    user: USER,
    url: user.html_url,
    fetchedAt: new Date().toISOString(),
    publicRepos: user.public_repos,
    followers: user.followers,
    languages: Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count })),
    recent: own
      .filter((r) => !EXCLUDE.has(r.name))
      .slice(0, RECENT_REPOS)
      .map((r) => ({
        name: r.name,
        description: r.description ?? null,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        pushedAt: r.pushed_at,
      })),
    contributions,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`)
  console.log(
    `[github] ${data.publicRepos} repos, ${contributions.total} contributions in the last year → src/data/github.json`,
  )
}

main().catch((err) => {
  if (existsSync(OUT)) {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'))
    console.warn(`[github] fetch failed (${err.message}); keeping snapshot from ${prev.fetchedAt}`)
  } else {
    console.warn(`[github] fetch failed (${err.message}); writing an empty snapshot`)
    mkdirSync(dirname(OUT), { recursive: true })
    writeFileSync(OUT, `${JSON.stringify({ user: USER, url: `https://github.com/${USER}`, fetchedAt: null, publicRepos: 0, followers: 0, languages: [], recent: [], contributions: { total: 0, days: [] } }, null, 2)}\n`)
  }
})
