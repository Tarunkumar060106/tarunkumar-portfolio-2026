import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setLenis } from '../lib/scroll'

gsap.registerPlugin(ScrollTrigger)

/** Classes on <html> that mean "the page shouldn't scroll right now". */
const LOCKS = ['is-loading', 'menu-open', 'palette-open']

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger (parallax, reveals, timeline rail)
 * stays perfectly in sync. Pauses while the intro, menu or command palette is open.
 * Inner scroll areas opt out with `data-lenis-prevent`. Off for reduced-motion users.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ anchors: { duration: 1.4 }, lerp: 0.1, autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    setLenis(lenis)

    // Only react when the lock state *changes*. Lenis toggles its own classes on <html> too, and
    // re-checking on those would stop a scroll that scrollToTarget() just started while a lock is closing.
    const html = document.documentElement
    let locked: boolean | null = null
    const sync = () => {
      const next = LOCKS.some((c) => html.classList.contains(c))
      if (next === locked) return
      locked = next
      if (next) lenis.stop()
      else lenis.start()
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })

    return () => {
      observer.disconnect()
      gsap.ticker.remove(tick)
      setLenis(null)
      lenis.destroy()
    }
  }, [])
}
