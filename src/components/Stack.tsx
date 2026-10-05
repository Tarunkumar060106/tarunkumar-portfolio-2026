import { useState } from 'react'
import { projects, stack } from '../content'
import { SectionHead } from './ui'
import './Stack.css'

const everything = stack.flatMap((g) => g.items)

/** Which featured projects use a tool: exact tag, a tag that extends it ("Django" → "Django REST"), or the project kind. */
function usedIn(item: string) {
  return projects
    .filter(
      (p) =>
        p.tags.some((t) => t === item || (t.startsWith(`${item} `) && !(item === 'React' && t === 'React Native'))) ||
        p.kind.includes(item),
    )
    .map((p) => p.name)
}

const usage = new Map(everything.map((item) => [item, usedIn(item)]))

export default function Stack() {
  const [active, setActive] = useState<string | null>(null)
  const projectsUsing = active ? (usage.get(active) ?? []) : []

  return (
    <section className="section stack" id="stack" aria-labelledby="stack-title">
      <SectionHead index="03" label="Stack" />
      <h2 className="section-title" id="stack-title" data-reveal="block">
        Tools I reach for.
      </h2>

      {/* Decorative ticker; the grouped lists below carry the same info for assistive tech. */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <span className="marquee-set" key={copy}>
              {everything.map((item) => (
                <span className="marquee-item" key={item}>
                  {item}
                  <span className="marquee-sep">/</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Explorer: hover / focus / tap a tool to see which projects it shipped in. */}
      <p className="stack-usage" aria-live="polite" data-reveal="up">
        {!active && <span className="stack-usage-hint">Hover a tool to see where I’ve shipped it.</span>}
        {active && (
          <>
            <span className="stack-usage-item">{active}</span>
            <span className="stack-usage-arrow" aria-hidden="true">
              →
            </span>
            {projectsUsing.length ? (
              projectsUsing.map((name) => (
                <span className="stack-usage-project" key={name}>
                  {name}
                </span>
              ))
            ) : (
              <span className="stack-usage-hint">in the toolkit, not in a featured project yet</span>
            )}
          </>
        )}
      </p>

      <div className="stack-groups" onMouseLeave={() => setActive(null)}>
        {stack.map((g) => (
          <div className="stack-group" key={g.group} data-reveal="up">
            <h3>{g.group}</h3>
            <ul>
              {g.items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className="stack-item"
                    data-used={(usage.get(item)?.length ?? 0) > 0}
                    aria-pressed={active === item}
                    onMouseEnter={() => setActive(item)}
                    onFocus={() => setActive(item)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
