import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { about, projects, site, stack } from '../content'
import './Terminal.css'

type Line = { kind: 'in' | 'out'; text: ReactNode }

const PROMPT = 'tarun@portfolio:~$'
const SUGGESTIONS = ['help', 'whoami', 'projects', 'sudo hire-me']

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: site.timeZone,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const COMMANDS: Record<string, string> = {
  help: 'list commands',
  whoami: 'who is this guy',
  projects: 'featured work',
  'open <n>': 'open project n in a new tab',
  stack: 'tools I use',
  contact: 'how to reach me',
  time: 'my local time',
  clear: 'clear the screen',
}

function run(raw: string): ReactNode | 'clear' {
  const [cmd = '', ...args] = raw.trim().toLowerCase().split(/\s+/)
  switch (cmd) {
    case '':
      return null
    case 'help':
      return (
        <>
          {Object.entries(COMMANDS).map(([c, d]) => (
            <span className="term-row" key={c}>
              <span className="term-accent">{c.padEnd(10)}</span> {d}
            </span>
          ))}
          <span className="term-row term-dim">psst: try sudo hire-me</span>
        </>
      )
    case 'whoami':
      return about.statement
    case 'projects':
      return (
        <>
          {projects.map((p, i) => (
            <span className="term-row" key={p.name}>
              <span className="term-accent">[{i + 1}]</span> {p.name} <span className="term-dim">· {p.kind}</span>
            </span>
          ))}
          <span className="term-row term-dim">type "open 1" to visit one</span>
        </>
      )
    case 'open': {
      const p = projects[Number(args[0]) - 1]
      if (!p) return `open: no project "${args[0] ?? ''}". Try a number from 1 to ${projects.length}.`
      window.open(p.href, '_blank', 'noopener,noreferrer')
      return `Opening ${p.name}…`
    }
    case 'stack':
      return (
        <>
          {stack.map((g) => (
            <span className="term-row" key={g.group}>
              <span className="term-accent">{g.group}:</span> {g.items.join(', ')}
            </span>
          ))}
        </>
      )
    case 'contact':
    case 'email':
      return (
        <>
          <span className="term-row">
            email: <a href={`mailto:${site.email}`}>{site.email}</a>
          </span>
          {site.socials.map((s) => (
            <span className="term-row" key={s.href}>
              {s.label.toLowerCase()}:{' '}
              <a href={s.href} target="_blank" rel="noreferrer">
                {s.href.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </span>
          ))}
        </>
      )
    case 'time':
    case 'date':
      return `It’s ${timeFmt.format(new Date())} in Chennai.`
    case 'sudo':
      if (args.join(' ') === 'hire-me')
        return (
          <>
            <span className="term-row term-accent">[sudo] permission granted.</span>
            <span className="term-row">
              Great choice. Drop me a line at <a href={`mailto:${site.email}`}>{site.email}</a> and let’s talk.
            </span>
          </>
        )
      return 'Nice try. Only one sudo command works here.'
    case 'clear':
      return 'clear'
    case 'ls':
      return 'about  work  stack  experience  contact'
    case 'rm':
      return 'Whoa. Let’s not.'
    case 'exit':
      return 'There’s no escape. Try "contact" instead.'
    default:
      return `command not found: ${cmd}. Type "help" for the list.`
  }
}

const GREETING: Line[] = [{ kind: 'out', text: 'Welcome! Type "help" to look around, or tap a suggestion below.' }]

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(GREETING)
  const [value, setValue] = useState('')
  const history = useRef<string[]>([])
  const cursor = useRef(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)

  // Keep the newest output in view.
  useEffect(() => {
    const el = screenRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const submit = (raw: string) => {
    const out = run(raw)
    if (raw.trim()) history.current.unshift(raw)
    cursor.current = -1
    setValue('')
    if (out === 'clear') return setLines([])
    setLines((prev) => [...prev, { kind: 'in', text: raw }, ...(out ? [{ kind: 'out' as const, text: out }] : [])])
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit(value)
  }

  // ↑/↓ walk the history, Tab completes a command.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const h = history.current
      cursor.current = Math.max(-1, Math.min(h.length - 1, cursor.current + (e.key === 'ArrowUp' ? 1 : -1)))
      setValue(cursor.current === -1 ? '' : h[cursor.current])
    } else if (e.key === 'Tab' && value) {
      const match = Object.keys(COMMANDS)
        .map((c) => c.split(' ')[0])
        .find((c) => c.startsWith(value.toLowerCase()))
      if (match) {
        e.preventDefault()
        setValue(match)
      }
    }
  }

  return (
    <div className="term" onClick={() => inputRef.current?.focus()}>
      <div className="term-bar" aria-hidden="true">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-title">~/portfolio</span>
      </div>

      <div className="term-screen" ref={screenRef} data-lenis-prevent role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map((l, i) =>
          l.kind === 'in' ? (
            <p className="term-line" key={i}>
              <span className="term-prompt">{PROMPT}</span> {l.text}
            </p>
          ) : (
            <p className="term-line term-out" key={i}>
              {l.text}
            </p>
          ),
        )}

        <form className="term-line term-input-row" onSubmit={onSubmit}>
          <label className="term-prompt" htmlFor="term-input">
            {PROMPT}
          </label>
          <input
            id="term-input"
            ref={inputRef}
            className="term-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="term-help"
          />
        </form>
      </div>

      <div className="term-suggestions">
        <span id="term-help" className="visually-hidden">
          Type a command and press Enter. Try help.
        </span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="term-chip"
            onClick={(e) => {
              e.stopPropagation()
              submit(s)
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
