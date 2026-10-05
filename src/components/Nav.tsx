import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { nav, site } from '../content'
import Logo from './Logo'
import { ArrowUpRight } from './ui'
import { scrollToTarget } from '../lib/scroll'
import { OPEN_PALETTE } from '../lib/events'
import './Nav.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// ⌘ on Apple devices, Ctrl elsewhere. The pre-rendered HTML says "Ctrl"; the browser corrects it after hydration.
const noSubscribe = () => () => {}
const useIsMac = () =>
  useSyncExternalStore(
    noSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  )

export default function Nav() {
  const [open, setOpen] = useState(false)
  const isMac = useIsMac()
  const navRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const hasOpened = useRef(false)

  // Hide on scroll down, show on scroll up; switch to dark buttons over the orange contact section.
  useGSAP(() => {
    const bar = navRef.current!
    let hidden = false

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const next = self.direction === 1 && self.scroll() > window.innerHeight * 0.6
        if (next === hidden || document.documentElement.classList.contains('menu-open')) return
        hidden = next
        gsap.to(bar, { yPercent: hidden ? -100 : 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
      },
    })

    const contact = document.getElementById('contact')
    if (contact) {
      ScrollTrigger.create({
        trigger: contact,
        start: 'top 60px',
        end: 'bottom top',
        toggleClass: { targets: bar, className: 'nav--on-accent' },
      })
    }
  })

  // Menu open/close: the overlay reuses the preloader's conic wipe, links rise in.
  useGSAP(
    () => {
      const menu = menuRef.current!
      const links = menu.querySelectorAll('.menu-link-inner, .menu-foot')

      if (open) {
        hasOpened.current = true
        gsap.set(navRef.current, { yPercent: 0 })
        gsap.set(menu, { visibility: 'visible' })
        gsap.fromTo(menu, { '--wipe': '90deg' }, { '--wipe': '0deg', duration: 0.8, ease: 'power3.inOut' })
        gsap.fromTo(
          links,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.05, delay: 0.3 },
        )
      } else if (hasOpened.current) {
        gsap.to(menu, {
          '--wipe': '90deg',
          duration: 0.6,
          ease: 'power3.inOut',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' })
          },
        })
      }
    },
    { dependencies: [open] },
  )

  // Scroll lock, Escape to close, and sensible focus handling.
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    if (!open) return

    menuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  // In-page links: close the menu, then scroll via the shared helper (works while Lenis is paused).
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href')
    if (!href?.startsWith('#')) return
    e.preventDefault()
    close()
    scrollToTarget(href)
  }

  return (
    <>
      {/* className stays static: ScrollTrigger toggles .nav--on-accent imperatively, React owns data-menu-open. */}
      <nav className="nav" data-menu-open={open} ref={navRef} aria-label="Primary">
        <div className="nav-logo">
          <a href="#top" aria-label={`${site.name}, home`} onClick={go}>
            <Logo />
          </a>
        </div>

        <div className="nav-toggler">
          <button
            type="button"
            className="btn"
            ref={toggleRef}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>

        <div className="nav-cta">
          <button
            type="button"
            className="nav-k"
            onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE))}
            aria-label="Open command palette"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd>
          </button>
          <a href="#contact" className="btn" onClick={go}>
            Get in Touch
          </a>
        </div>
      </nav>

      <div className="menu" id="site-menu" ref={menuRef} inert={!open} data-lenis-prevent>
        <ol className="menu-links">
          {nav.map((item, i) => (
            <li key={item.href}>
              <a href={item.href} className="menu-link" onClick={go}>
                <span className="menu-link-inner">
                  <span className="menu-link-index">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ol>

        <div className="menu-foot">
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <ul>
            {site.socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                  <ArrowUpRight />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
