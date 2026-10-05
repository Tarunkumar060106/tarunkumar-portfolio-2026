import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { createBlockReveal } from '../lib/blockReveal'
import { whenFontsReady } from '../lib/fonts'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Scroll-triggered reveals for everything below the hero:
 *  - [data-reveal="block"] → the hero's orange/white block reveal, line by line
 *  - [data-reveal="up"]    → fade + rise, batched so neighbours stagger together
 */
export function useScrollReveals(root: RefObject<HTMLElement | null>) {
  useGSAP(
    (_, contextSafe) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const q = gsap.utils.selector(root)
      const titles = q('[data-reveal="block"]')
      const risers = q('[data-reveal="up"]')

      gsap.set(titles, { autoAlpha: 0 })
      gsap.set(risers, { y: 40, opacity: 0 })

      ScrollTrigger.batch(risers, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.08 }),
      })

      let cancelled = false

      whenFontsReady()
        .catch(() => {})
        .then(
          contextSafe!(() => {
            if (cancelled) return
            titles.forEach((title) => {
              const reveal = createBlockReveal(title)
              gsap.set(title, { autoAlpha: 1 })
              const tl = reveal.all({ paused: true, onComplete: reveal.revert })
              ScrollTrigger.create({
                trigger: title,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                  tl.play()
                },
              })
            })
            ScrollTrigger.refresh()
          }),
        )

      return () => {
        cancelled = true
      }
    },
    { scope: root },
  )
}
