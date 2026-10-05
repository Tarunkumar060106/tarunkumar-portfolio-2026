import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projectFilters, projects } from '../content'
import { ArrowUpRight, SectionHead } from './ui'
import GitHubActivity from './GitHubActivity'
import './Work.css'

gsap.registerPlugin(Flip, ScrollTrigger)

type Filter = (typeof projectFilters)[number]

/** "View on GitHub" / "View on GitLab" for repos, "Visit site" for live projects. */
function linkLabel(href: string) {
  const host = new URL(href).hostname
  if (host.endsWith('github.com')) return 'View on GitHub'
  if (host.endsWith('gitlab.com')) return 'View on GitLab'
  return 'Visit site'
}

const matches = (filter: Filter, p: (typeof projects)[number]) =>
  filter === 'All' || p.categories.includes(filter)

const count = (filter: Filter) => projects.filter((p) => matches(filter, p)).length

export default function Work() {
  const [filter, setFilter] = useState<Filter>('All')
  const listRef = useRef<HTMLOListElement>(null)
  const flipState = useRef<Flip.FlipState | null>(null)

  const choose = (next: Filter) => {
    if (next === filter) return
    // Record where every row is *before* React re-renders, so Flip can animate the difference.
    flipState.current = Flip.getState(listRef.current!.querySelectorAll('.project'))
    setFilter(next)
  }

  // Rows that drop out fade away, the rest glide into their new slots, newcomers rise in.
  useLayoutEffect(() => {
    const state = flipState.current
    if (!state) return
    flipState.current = null
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    Flip.from(state, {
      duration: reduce ? 0 : 0.7,
      ease: 'power3.inOut',
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.15 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.3 }),
      onComplete: () => ScrollTrigger.refresh(),
    })
  }, [filter])

  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <SectionHead index="02" label="Selected work" />
      <h2 className="section-title" id="work-title" data-reveal="block">
        Things I’ve built.
      </h2>

      <div className="work-filters" role="group" aria-label="Filter projects" data-reveal="up">
        {projectFilters.map((f) => (
          <button
            key={f}
            type="button"
            className="work-filter"
            aria-pressed={filter === f}
            onClick={() => choose(f)}
          >
            {f}
            <span className="work-filter-count">{count(f)}</span>
          </button>
        ))}
      </div>

      <ol className="projects" ref={listRef}>
        {projects.map((p, i) => (
          <li
            className="project"
            key={p.name}
            data-reveal="up"
            data-flip-id={p.name}
            hidden={!matches(filter, p)}
          >
            <a className="project-link" href={p.href} target="_blank" rel="noreferrer">
              <span className="project-index">{String(i + 1).padStart(2, '0')}</span>

              <div className="project-head">
                <h3>{p.name}</h3>
                <p className="project-kind">{p.kind}</p>
                <p className="project-period">{p.period}</p>
              </div>

              <div className="project-body">
                <p className="project-summary">{p.summary}</p>
                <ul className="project-highlights">
                  {p.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>

              <div className="project-meta">
                <ul className="project-tags" aria-label="Tags">
                  {p.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <span className="project-cta">
                  {linkLabel(p.href)} <ArrowUpRight />
                </span>
              </div>
            </a>
          </li>
        ))}
      </ol>

      <GitHubActivity />
    </section>
  )
}
