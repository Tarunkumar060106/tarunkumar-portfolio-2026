import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { SceneHandle } from '../components/HeroScene'
import { createBlockReveal } from '../lib/blockReveal'
import { whenFontsReady } from '../lib/fonts'
import { HEADLINE_IN } from '../lib/events'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ASSET_TIMEOUT = 4000

/**
 * One timeline for the whole intro: preloader blocks + "Loading" → conic wipe → nav,
 * block-revealed headline, CTA, footer words, and the hero scene "compiling" from ASCII into the photo.
 */
export function useIntroTimeline(
  root: RefObject<HTMLElement | null>,
  scene: RefObject<SceneHandle | null>,
) {
  useGSAP(
    (_, contextSafe) => {
      const q = gsap.utils.selector(root)
      const blocks = q('.preloader-block')
      const nestedBlocks = blocks.slice(1)

      // Always start the intro from the top, even after a reload mid-page.
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      window.scrollTo(0, 0)

      // Start states set before first paint so the folded blocks never flash open.
      gsap.set(nestedBlocks, { rotation: -180, transformOrigin: 'left center' })
      gsap.set(q('.preloader'), { scale: 0, transformOrigin: '25% center' })

      let cancelled = false

      const build = contextSafe!(() => {
        if (cancelled) return

        // Line splitting depends on final font metrics, so this runs after fonts load.
        const headline = createBlockReveal(q('.hero-copy h1')[0])

        const tl = gsap.timeline({
          delay: 1,
          // Hand the headline back to normal text flow so it re-wraps on resize.
          onComplete: headline.revert,
        })

        // — preloader —
        tl.to(q('.preloader-copy .char'), { opacity: 1, duration: 0.15, stagger: 0.1 })
        tl.to(q('.preloader'), { scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, '<')
        tl.to(
          nestedBlocks,
          { delay: 0.25, rotation: 0, duration: 0.65, ease: 'power3.inOut', stagger: 0.75 },
          '<',
        )
        tl.to([q('.preloader-copy'), blocks], { opacity: 0, duration: 0.5 })
        tl.to(q('.preloader-overlay'), { '--wipe': '90deg', duration: 1, ease: 'power3.inOut' })
        // Fully wiped: take the overlay out so it no longer swallows clicks, and unlock scroll.
        tl.set(q('.preloader-overlay'), { display: 'none' })
        tl.call(() => {
          document.documentElement.classList.remove('is-loading')
          ScrollTrigger.refresh()
        })

        // — hero —
        tl.addLabel('hero', '-=0.65')
        tl.to(q('.nav'), { y: 0, duration: 1, ease: 'power3.out' }, 'hero')
        headline.lines.forEach((_, i) => tl.add(headline.line(i), i === 0 ? '-=0.65' : '-=0.75'))
        // Headline is in → the rotating phrase can start decoding.
        tl.call(() => window.dispatchEvent(new Event(HEADLINE_IN)))

        tl.to(
          q('.hero-eyebrow, .hero-sub, .hero-copy .btn'),
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1 },
          '-=0.5',
        )
        tl.to(
          q('.hero-footer .word'),
          { y: '0%', duration: 0.75, stagger: 0.75, ease: 'power3.out' },
          '-=0.85',
        )

        // Scene: the ASCII wave "compiles" the background outward from the moon as the wipe clears,
        // then the photo cross-fades in underneath and the canvas hands over to the cursor code lens.
        const bg = scene.current
        const waveDuration = bg?.duration() ?? 0
        if (bg && waveDuration > 0) {
          const wave = { t: 0 }
          const photo = { p: 0 }
          tl.to(
            wave,
            { t: waveDuration, duration: waveDuration, ease: 'none', onUpdate: () => bg.seek(wave.t) },
            'hero',
          )
          tl.to(
            photo,
            {
              p: 1,
              duration: 1.4,
              ease: 'power2.inOut',
              onUpdate: () => bg.reveal(photo.p),
              onComplete: () => bg.startInteraction(),
            },
            `hero+=${waveDuration - 0.3}`,
          )
        } else {
          // Scene arrived after the asset timeout: skip the wave and show the photo straight away.
          bg?.ready.then(() => {
            bg.seek(bg.duration())
            bg.reveal(1)
            bg.startInteraction()
          })
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) tl.progress(1)

        // Dev only: window.__intro.pause().progress(0.5) to scrub the intro.
        if (import.meta.env.DEV) Object.assign(window, { __intro: tl, __gsap: gsap, __ScrollTrigger: ScrollTrigger })
      })

      // Wait for fonts + scene, but never longer than ASSET_TIMEOUT — the intro must not hang.
      Promise.race([
        Promise.all([whenFontsReady(), scene.current?.ready]),
        new Promise((resolve) => setTimeout(resolve, ASSET_TIMEOUT)),
      ])
        .catch(() => {}) // a font that fails to load shouldn't stall the intro either
        .then(build)

      return () => {
        cancelled = true
        document.documentElement.classList.add('is-loading')
      }
    },
    { scope: root },
  )
}
