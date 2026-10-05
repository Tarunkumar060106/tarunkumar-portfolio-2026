import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { nav, projects, site } from '../content'
import { OPEN_PALETTE } from '../lib/events'
import { scrollToTarget } from '../lib/scroll'
import './CommandPalette.css'

type Command = {
  id: string
  group: 'Navigate' | 'Projects' | 'Actions' | 'Social'
  label: string
  hint?: string
  keywords?: string
  run: () => void | 'keep-open'
}

/** Subsequence match ("mlmd" → "Mailmind"); lower score = better. */
function score(query: string, text: string) {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 0
  const direct = t.indexOf(q)
  if (direct !== -1) return direct
  let ti = 0
  let gaps = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return Infinity
    gaps += found - ti
    ti = found + 1
  }
  return 100 + gaps
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const openRef = useRef(false)
  useEffect(() => {
    openRef.current = open
  }, [open])

  // Opening always starts fresh: empty query, first row highlighted, no toast.
  const show = useCallback(() => {
    setQuery('')
    setActive(0)
    setToast('')
    setOpen(true)
  }, [])

  const commands = useMemo<Command[]>(
    () => [
      { id: 'top', group: 'Navigate', label: 'Back to top', keywords: 'home hero', run: () => scrollToTarget('#top') },
      ...nav.map((n) => ({
        id: n.href,
        group: 'Navigate' as const,
        label: `Go to ${n.label}`,
        run: () => scrollToTarget(n.href),
      })),
      ...projects.map((p) => ({
        id: p.name,
        group: 'Projects' as const,
        label: p.name,
        hint: p.kind,
        keywords: `${p.tags.join(' ')} ${p.categories.join(' ')}`,
        run: () => void window.open(p.href, '_blank', 'noopener,noreferrer'),
      })),
      {
        id: 'copy-email',
        group: 'Actions',
        label: 'Copy email address',
        hint: site.email,
        keywords: 'contact mail',
        run: () => {
          void navigator.clipboard?.writeText(site.email).then(() => setToast('Email copied'))
          return 'keep-open'
        },
      },
      {
        id: 'email',
        group: 'Actions',
        label: 'Send me an email',
        keywords: 'contact mail hire',
        run: () => void (window.location.href = `mailto:${site.email}`),
      },
      {
        id: 'terminal',
        group: 'Actions',
        label: 'Open the terminal',
        keywords: 'cli shell console',
        run: () => {
          scrollToTarget('#contact')
          window.setTimeout(() => document.getElementById('term-input')?.focus({ preventScroll: true }), 1200)
        },
      },
      ...site.socials.map((s) => ({
        id: s.href,
        group: 'Social' as const,
        label: s.label,
        hint: s.href.replace(/^https?:\/\/(www\.)?/, ''),
        run: () => void window.open(s.href, '_blank', 'noopener,noreferrer'),
      })),
    ],
    [],
  )

  const results = useMemo(() => {
    const ranked = commands
      .map((c) => ({ c, s: Math.min(score(query, c.label), score(query, `${c.keywords ?? ''} ${c.hint ?? ''}`) + 50) }))
      .filter((r) => r.s !== Infinity)
    if (query) ranked.sort((a, b) => a.s - b.s)
    return ranked.map((r) => r.c)
  }, [commands, query])

  // ⌘K / Ctrl+K anywhere (and the nav button) toggles the palette.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (openRef.current) setOpen(false)
        else show()
      }
    }
    const onOpen = () => show()
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_PALETTE, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_PALETTE, onOpen)
    }
  }, [show])

  // Open: lock scroll, focus the input; close: restore focus to wherever it was.
  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('palette-open', open)
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      returnFocus.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  // Keep the highlighted row visible.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const execute = (cmd: Command | undefined) => {
    if (!cmd) return
    if (cmd.run() !== 'keep-open') setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      execute(results[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Tab') {
      e.preventDefault() // keep focus inside the dialog
    }
  }

  if (!open) return null

  let lastGroup = ''
  return (
    <div className="palette" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="palette-box" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-search">
          <span className="palette-prompt" aria-hidden="true">
            &gt;
          </span>
          <input
            ref={inputRef}
            className="palette-input"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `palette-${active}` : undefined}
            aria-autocomplete="list"
            placeholder="Jump to a section, open a project, copy my email…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="palette-esc">esc</kbd>
        </div>

        <ul className="palette-list" id="palette-list" role="listbox" ref={listRef} data-lenis-prevent>
          {results.length === 0 && <li className="palette-empty">No matches. Try “mail” or “work”.</li>}
          {results.map((c, i) => {
            const heading = c.group !== lastGroup ? c.group : null
            lastGroup = c.group
            return (
              <li key={c.id} role="presentation">
                {heading && (
                  <p className="palette-group" aria-hidden="true">
                    {heading}
                  </p>
                )}
                <div
                  id={`palette-${i}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  className="palette-item"
                  onMouseMove={() => setActive(i)}
                  onClick={() => execute(c)}
                >
                  <span className="palette-label">{c.label}</span>
                  {c.hint && <span className="palette-hint">{c.hint}</span>}
                  <span className="palette-enter" aria-hidden="true">
                    ↵
                  </span>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="palette-foot" aria-live="polite">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move · <kbd>↵</kbd> to select
          </span>
          <span className="palette-toast">{toast}</span>
        </div>
      </div>
    </div>
  )
}
