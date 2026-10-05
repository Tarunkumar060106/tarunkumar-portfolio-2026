import { Fragment, useEffect, useRef, type Ref } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import heroBg800 from '../assets/hero-bg-800.webp'
import heroBg1200 from '../assets/hero-bg-1200.webp'
import heroBg1672 from '../assets/hero-bg-1672.webp'
import { hero } from '../content'
import HeroScene, { type SceneHandle } from './HeroScene'
import { BlockLine } from './ui'
import { scrambleTo } from '../lib/scramble'
import { HEADLINE_IN } from '../lib/events'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Parallax tuning
const SCENE_DRIFT = 30 // % of the hero's height the background lags behind on scroll
const SCENE_ZOOM = [1.06, 1.16] // slight overscale hides the edges while the mouse shifts the scene
const MOUSE_SHIFT = { x: 22, y: 14 } // px the background leans away from the cursor

// Rotating headline phrase
const HOLD_MS = 2600 // how long each phrase stays before decoding into the next
const SCRAMBLE_S = 0.9


// Screen readers get the whole sentence once instead of a changing word.
const spokenHeadline = `${hero.lead} ${hero.rotating.slice(0, -1).join(', ')} and ${hero.rotating.at(-1)} ${hero.tail}`

export default function Hero({ sceneRef }: { sceneRef: Ref<SceneHandle> }) {
  const root = useRef<HTMLElement>(null)
  const wordRef = useRef<HTMLSpanElement>(null)

  // Rotating phrase: starts once the intro has revealed the headline, decodes to the next phrase every
  // HOLD_MS, pauses while the hero is off screen. Static for reduced-motion users.
  useEffect(() => {
    const el = wordRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let index = 0
    let timer = 0
    let cancel = () => {}
    let started = false
    let visible = true

    const schedule = () => {
      window.clearTimeout(timer)
      if (started && visible) timer = window.setTimeout(advance, HOLD_MS)
    }
    const advance = () => {
      index = (index + 1) % hero.rotating.length
      cancel = scrambleTo(el, hero.rotating[index], SCRAMBLE_S, schedule)
    }
    const start = () => {
      started = true
      schedule()
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      schedule()
    })
    io.observe(el)
    window.addEventListener(HEADLINE_IN, start, { once: true })

    return () => {
      window.clearTimeout(timer)
      cancel()
      io.disconnect()
      window.removeEventListener(HEADLINE_IN, start)
    }
  }, [])

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const section = root.current!
      const scene = section.querySelector<HTMLElement>('.hero-scene')!
      const copy = section.querySelector<HTMLElement>('.hero-copy')!

      // Scroll: the background drifts down + zooms in (slower than the page), the copy lifts away faster.
      const scrub = { trigger: section, start: 'top top', end: 'bottom top', scrub: true }
      gsap.fromTo(
        scene,
        { yPercent: 0, scale: SCENE_ZOOM[0] },
        { yPercent: SCENE_DRIFT, scale: SCENE_ZOOM[1], ease: 'none', scrollTrigger: scrub },
      )
      gsap.to(copy, { yPercent: -35, opacity: 0, ease: 'none', scrollTrigger: { ...scrub, end: '80% top' } })

      // Mouse: the scene leans gently away from the cursor for depth (hover devices only).
      if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return
      const toX = gsap.quickTo(scene, 'x', { duration: 1.2, ease: 'power3.out' })
      const toY = gsap.quickTo(scene, 'y', { duration: 1.2, ease: 'power3.out' })
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        toX(-nx * 2 * MOUSE_SHIFT.x)
        toY(-ny * 2 * MOUSE_SHIFT.y)
      }
      const onLeave = () => {
        toX(0)
        toY(0)
      }
      section.addEventListener('pointermove', onMove, { passive: true })
      section.addEventListener('pointerleave', onLeave)
      return () => {
        section.removeEventListener('pointermove', onMove)
        section.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: root },
  )

  return (
    <section className="hero" id="top" ref={root}>
      <HeroScene
        src={heroBg1672}
        srcSet={`${heroBg800} 800w, ${heroBg1200} 1200w, ${heroBg1672} 1672w`}
        ref={sceneRef}
      />

      <div className="hero-copy">
        <p className="hero-eyebrow">{hero.eyebrow}</p>
        <h1 className="hero-title" aria-label={spokenHeadline}>
          <BlockLine>{hero.lead}</BlockLine>
          <BlockLine className="hero-rotator">
            {/* Text is swapped imperatively by scrambleTo(); React never re-renders this span. */}
            <span className="hero-rotator-word" ref={wordRef}>
              {hero.rotating[0]}
            </span>
            <span className="hero-caret" />
          </BlockLine>
          <BlockLine>{hero.tail}</BlockLine>
        </h1>
        <p className="hero-sub">{hero.sub}</p>
        <a href={hero.cta.href} className="btn">
          {hero.cta.label}
        </a>
      </div>

      <div className="hero-footer">
        {/* Pre-split into masked words so no SplitText pass is needed for this line. */}
        <p>
          {hero.footer.split(' ').map((word, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <span className="word-mask">
                <span className="word">{word}</span>
              </span>
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  )
}
