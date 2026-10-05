import type Lenis from 'lenis'

// Shared handle so menus / the command palette can scroll through Lenis when it's running,
// and fall back to native scrolling when it isn't (reduced motion, not yet initialised).
let instance: Lenis | null = null

export function setLenis(lenis: Lenis | null) {
  instance = lenis
  if (import.meta.env.DEV) Object.assign(window, { __lenis: lenis })
}

/** Smoothly scrolls to a selector like "#work" (or the top for "#top"). Works even while Lenis is paused. */
export function scrollToTarget(target: string) {
  const el = target === '#top' ? document.body : document.querySelector<HTMLElement>(target)
  if (!el) return
  if (instance) {
    // Start Lenis *before* scrolling: if it's paused (menu / palette closing), the later start()
    // from the lock observer would otherwise reset and cancel this scroll mid-flight.
    if (instance.isStopped) instance.start()
    instance.scrollTo(target === '#top' ? 0 : el, { force: true, duration: 1.4 })
  } else {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }
  history.replaceState(null, '', target === '#top' ? location.pathname : target)
}
