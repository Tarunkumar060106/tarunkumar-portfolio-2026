import { useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import github from '../data/github.json'
import { ArrowUpRight } from './ui'
import './GitHubActivity.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Day = { date: string; level: number; count: number }

const CELL = 11 // px, includes the gap
const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' })
const updatedFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const parse = (d: string) => new Date(`${d}T00:00:00Z`)

/** Lays the days out GitHub-style: one column per week, Sunday at the top. */
function toWeeks(days: Day[]) {
  if (!days.length) return []
  const weeks: (Day | null)[][] = []
  let week: (Day | null)[] = Array(parse(days[0].date).getUTCDay()).fill(null)
  for (const d of days) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)])
  return weeks
}

const describe = (d: Day) =>
  `${d.count === 0 ? 'No' : d.count} contribution${d.count === 1 ? '' : 's'} on ${dayFmt.format(parse(d.date))}`

export default function GitHubActivity() {
  const root = useRef<HTMLDivElement>(null)
  const weeks = useMemo(() => toWeeks(github.contributions.days), [])
  const [hover, setHover] = useState<Day | null>(null)

  // Month labels above the first week that starts in a new month.
  const months = useMemo(() => {
    const out: { x: number; label: string }[] = []
    let last = -1
    weeks.forEach((w, i) => {
      const first = w.find(Boolean)
      if (!first) return
      const m = parse(first.date).getUTCMonth()
      if (m !== last && i < weeks.length - 1) {
        out.push({ x: i * CELL, label: monthFmt.format(parse(first.date)) })
        last = m
      }
    })
    return out
  }, [weeks])

  // Columns fill in left → right the first time the graph scrolls into view.
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      // Opacity only: the week groups are positioned with SVG transform attributes, which a y-tween would fight.
      gsap.from('.gh-week', {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.012,
        scrollTrigger: { trigger: '.gh-graph', start: 'top 85%', once: true },
      })
    },
    { scope: root },
  )

  if (!github.contributions.days.length) return null

  return (
    <div className="gh" ref={root} data-reveal="up">
      <div className="gh-head">
        <h3 className="gh-title">On GitHub</h3>
        <p className="gh-stats">
          <span>
            <strong>{github.contributions.total.toLocaleString('en-IN')}</strong> contributions in the last year
          </span>
          <span>
            <strong>{github.publicRepos}</strong> public repos
          </span>
          <a href={github.url} target="_blank" rel="noreferrer">
            @{github.user}
            <ArrowUpRight />
          </a>
        </p>
      </div>

      <div className="gh-graph" data-lenis-prevent onMouseLeave={() => setHover(null)}>
        <svg
          className="gh-svg"
          viewBox={`0 0 ${weeks.length * CELL} ${7 * CELL + 16}`}
          role="img"
          aria-label={`${github.contributions.total} contributions in the last year`}
        >
          {months.map((m) => (
            <text key={m.x} x={m.x} y={9} className="gh-month">
              {m.label}
            </text>
          ))}
          <g transform="translate(0 16)">
            {weeks.map((w, i) => (
              <g className="gh-week" key={i} transform={`translate(${i * CELL} 0)`}>
                {w.map((d, j) =>
                  d ? (
                    <rect
                      key={d.date}
                      y={j * CELL}
                      width={CELL - 2}
                      height={CELL - 2}
                      rx={2}
                      className={`gh-cell gh-l${d.level}`}
                      onMouseEnter={() => setHover(d)}
                    >
                      <title>{describe(d)}</title>
                    </rect>
                  ) : null,
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="gh-foot">
        <p className="gh-readout" aria-hidden="true">
          {hover ? describe(hover) : 'Hover a day to see the count.'}
        </p>
        <div className="gh-legend" aria-hidden="true">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`gh-swatch gh-l${l}`} />
          ))}
          More
        </div>
      </div>

      {github.recent.length > 0 && (
        <ul className="gh-repos">
          {github.recent.map((r) => (
            <li key={r.name}>
              <a className="gh-repo" href={r.url} target="_blank" rel="noreferrer">
                <span className="gh-repo-name">
                  {r.name}
                  <ArrowUpRight />
                </span>
                {r.description && <span className="gh-repo-desc">{r.description}</span>}
                <span className="gh-repo-meta">
                  {r.language && <span className="gh-lang">{r.language}</span>}
                  {r.stars > 0 && <span>★ {r.stars}</span>}
                  <span>Updated {updatedFmt.format(new Date(r.pushedAt))}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
