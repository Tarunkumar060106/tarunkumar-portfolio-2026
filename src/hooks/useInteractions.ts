import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { scrambleTo } from '../lib/scramble'

/**
 * Small site-wide interactions (hover devices only, off for reduced motion):
 *  - section titles decode through code glyphs on hover, like the hero's rotating phrase
 *  - buttons lean magnetically towards the cursor
 */
export function useInteractions(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return

    const cleanups: (() => void)[] = []

    // — title decode —
    el.querySelectorAll<HTMLElement>('.section-title, .contact-title').forEach((title) => {
      let busy = false
      const onEnter = () => {
        // Skip while the scroll reveal still has the title split into animated lines.
        if (busy || title.querySelector('.block-line')) return
        const text = title.textContent ?? ''
        title.setAttribute('aria-label', text) // screen readers keep the real text while it scrambles
        busy = true
        scrambleTo(title, text, 0.7, () => (busy = false))
      }
      title.addEventListener('pointerenter', onEnter)
      cleanups.push(() => title.removeEventListener('pointerenter', onEnter))
    })

    // — magnetic buttons — (uses the CSS `translate` property so it never fights GSAP's transforms)
    el.querySelectorAll<HTMLElement>('.btn').forEach((btn) => {
      const onMove = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect()
        const x = (e.clientX - (r.left + r.width / 2)) * 0.25
        const y = (e.clientY - (r.top + r.height / 2)) * 0.35
        gsap.to(btn, { '--mx': `${x}px`, '--my': `${y}px`, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
      }
      const onLeave = () =>
        gsap.to(btn, { '--mx': '0px', '--my': '0px', duration: 0.6, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' })
      btn.addEventListener('pointermove', onMove)
      btn.addEventListener('pointerleave', onLeave)
      cleanups.push(() => {
        btn.removeEventListener('pointermove', onMove)
        btn.removeEventListener('pointerleave', onLeave)
      })
    })

    return () => cleanups.forEach((fn) => fn())
  }, [root])
}
