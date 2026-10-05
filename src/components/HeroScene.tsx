import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { paintField, sampleCover, type AsciiField, type PaintState } from '../lib/asciiField'

export type SceneHandle = {
  /** Resolves once the image is loaded, the glyph font is ready and the field is sampled. */
  ready: Promise<void>
  /** Intro wave length in seconds (0 if the image failed to load). */
  duration: () => number
  /** Paint the intro wave at `t` seconds. */
  seek: (t: number) => void
  /** 0 → ASCII only, 1 → the photo has fully taken over. */
  reveal: (p: number) => void
  /** Turn on the cursor "code lens" (after the intro). */
  startInteraction: () => void
}

type Props = {
  src: string
  /** Responsive variants; the browser picks one and the ASCII sampler reads whichever it loaded. */
  srcSet?: string
  ref?: Ref<SceneHandle>
}

// Lens tuning
const IDLE_MS = 2500 // no pointer movement for this long → the autopilot lens takes over
const RADIUS = 0.17 // lens radius as a fraction of the hero's shorter side
const AUTO_RADIUS = 0.13
const TRAIL_DECAY = 0.9 // per 60fps frame; lower = shorter trail
const SCRAMBLE_MS = 70 // how often rim glyphs re-roll
const WAVE_ORIGIN = { x: 0.67, y: 0.52 } // the setting sun — the scene "compiles" outward from it

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}

const pad = (n: number) => String(n).padStart(3, '0')

/** Parses a computed `object-position` ("55% 50%") into 0–1 fractions. */
function objectPosition(img: HTMLImageElement) {
  const [x = '50%', y = '50%'] = getComputedStyle(img).objectPosition.split(' ')
  const frac = (v: string) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5)
  return { posX: frac(x), posY: frac(y) }
}

export default function HeroScene({ src, srcSet, ref }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readoutRef = useRef<HTMLParagraphElement>(null)
  const field = useRef<AsciiField | null>(null)
  const metrics = useRef({ w: 0, h: 0, dpr: 1, font: '' })
  const state = useRef<PaintState>({ t: -1, fade: 1, heat: null, step: 0 })
  const ready = useRef(deferred())
  const startRef = useRef<() => void>(() => {})

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !field.current) return
    const { w, h, dpr, font } = metrics.current
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintField(ctx, field.current, w, h, font, state.current)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      ready: ready.current.promise,
      duration: () => field.current?.duration ?? 0,
      seek: (t) => {
        state.current.t = t
        paint()
      },
      reveal: (p) => {
        if (imgRef.current) imgRef.current.style.opacity = String(p)
        state.current.fade = 1 - p
        paint()
      },
      startInteraction: () => startRef.current(),
    }),
    [paint],
  )

  // Sizing + sampling. The grid is rebuilt on resize so it always lines up with the cover-fit photo.
  useEffect(() => {
    const canvas = canvasRef.current!
    const img = imgRef.current!
    let cancelled = false
    let loaded = false

    const fit = () => {
      // Layout size (not getBoundingClientRect) so the parallax scale/translate doesn't skew the grid.
      const rect = { width: canvas.clientWidth, height: canvas.clientHeight }
      if (!rect.width || !rect.height) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cs = getComputedStyle(canvas)
      const fontSize = parseFloat(cs.fontSize)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      metrics.current = { w: rect.width, h: rect.height, dpr, font: `${cs.fontSize} ${cs.fontFamily}` }

      if (loaded) {
        field.current = sampleCover(img, {
          width: rect.width,
          height: rect.height,
          cellW: fontSize * 0.8,
          cellH: fontSize * 1.3,
          ...objectPosition(img),
          originX: WAVE_ORIGIN.x,
          originY: WAVE_ORIGIN.y,
        })
        if (state.current.heat) state.current.heat = new Float32Array(field.current.cols * field.current.rows)
      }
      paint()
    }
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)

    // Load-event based on purpose: img.decode() can stay pending in background/throttled tabs.
    const imageLoaded = new Promise<void>((resolve, reject) => {
      if (img.complete && img.naturalWidth) return resolve()
      img.addEventListener('load', () => resolve(), { once: true })
      img.addEventListener('error', reject, { once: true })
    })
    const fontSpec = `${getComputedStyle(canvas).fontSize} ${getComputedStyle(canvas).fontFamily}`

    Promise.all([imageLoaded, document.fonts.load(fontSpec)])
      .then(() => {
        if (cancelled) return
        loaded = true
        fit()
      })
      .catch(() => {}) // a missing image just leaves the scene dark; never block the intro
      .finally(() => {
        if (!cancelled) ready.current.resolve()
      })

    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [src, paint])

  // Code lens: follows the cursor (eased, leaving a trail), shows the scene as code with a scrambling rim,
  // and drifts on autopilot when idle or on touch screens. Only runs while the hero is on screen.
  useEffect(() => {
    const canvas = canvasRef.current!
    const host = canvas.closest('section') ?? document.body
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const paintState = state.current

    const s = {
      enabled: false,
      visible: true,
      raf: 0,
      last: 0,
      lastMove: -Infinity,
      tx: 0,
      ty: 0,
      px: NaN,
      py: NaN,
      r: 0,
      readout: '',
    }

    const loop = (now: number) => {
      s.raf = 0
      const f = field.current
      const heat = state.current.heat
      if (!f || !heat || !s.visible) return

      const dt = s.last ? Math.min(now - s.last, 64) / 16.667 : 1
      s.last = now
      const { w, h } = metrics.current
      const short = Math.min(w, h)
      const wide = w >= 1000

      const auto = coarse || now - s.lastMove > IDLE_MS
      if (auto) {
        // Autopilot stays clear of the headline: right side on desktop, upper area on phones.
        const k = now / 1000
        const nx = 0.5 + 0.5 * Math.sin(k * 0.45)
        const ny = 0.5 + 0.5 * Math.sin(k * 0.73 + 1.2)
        s.tx = w * (wide ? 0.56 + 0.34 * nx : 0.2 + 0.6 * nx)
        s.ty = h * (wide ? 0.28 + 0.45 * ny : 0.18 + 0.3 * ny)
      }
      if (Number.isNaN(s.px)) {
        s.px = s.tx
        s.py = s.ty
      }
      const follow = 1 - Math.pow(1 - (auto ? 0.04 : 0.2), dt)
      s.px += (s.tx - s.px) * follow
      s.py += (s.ty - s.py) * follow
      s.r += (short * (auto ? AUTO_RADIUS : RADIUS) - s.r) * (1 - Math.pow(0.92, dt))

      // Heat: decay everything into a trail, then stamp the lens (smoothstep falloff).
      const decay = Math.pow(TRAIL_DECAY, dt)
      const r2 = s.r * s.r
      for (let row = 0; row < f.rows; row++) {
        const dy = (row + 0.5) * f.cellH - s.py
        for (let col = 0; col < f.cols; col++) {
          const i = row * f.cols + col
          let v = heat[i] * decay
          const dx = (col + 0.5) * f.cellW - s.px
          const d2 = dx * dx + dy * dy
          if (d2 < r2) {
            const x = 1 - Math.sqrt(d2) / s.r
            const inf = x * x * (3 - 2 * x)
            if (inf > v) v = inf
          }
          heat[i] = v < 0.004 ? 0 : v
        }
      }
      state.current.step = Math.floor(now / SCRAMBLE_MS)
      paint()

      // Readout: the cell under the lens and the glyph it decodes to.
      const readout = readoutRef.current
      if (readout) {
        const col = Math.min(f.cols - 1, Math.max(0, Math.floor(s.px / f.cellW)))
        const row = Math.min(f.rows - 1, Math.max(0, Math.floor(s.py / f.cellH)))
        const glyph = f.glyphs[row * f.cols + col] || '·'
        const text = `${auto ? 'AUTO' : 'SCAN'} ${pad(col)}:${pad(row)} [${glyph}]`
        if (text !== s.readout) readout.textContent = s.readout = text
      }

      s.raf = requestAnimationFrame(loop)
    }

    const kick = () => {
      if (s.enabled && s.visible && !s.raf) {
        s.last = 0
        s.raf = requestAnimationFrame(loop)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      // Map through the parallax transform back into the canvas's own coordinate space.
      const rect = canvas.getBoundingClientRect()
      s.tx = (e.clientX - rect.left) * (canvas.clientWidth / rect.width)
      s.ty = (e.clientY - rect.top) * (canvas.clientHeight / rect.height)
      s.lastMove = performance.now()
    }
    const onLeave = () => {
      s.lastMove = -Infinity // hand straight back to the autopilot
    }

    const io = new IntersectionObserver(([entry]) => {
      s.visible = entry.isIntersecting
      if (s.visible) kick()
      else if (s.raf) {
        cancelAnimationFrame(s.raf)
        s.raf = 0
      }
    })

    startRef.current = () => {
      const f = field.current
      if (s.enabled || reduce || !f) return
      s.enabled = true
      state.current.heat = new Float32Array(f.cols * f.rows)
      readoutRef.current?.classList.add('is-live')
      if (!coarse) {
        host.addEventListener('pointermove', onMove, { passive: true })
        host.addEventListener('pointerleave', onLeave)
      }
      io.observe(canvas)
      kick()
    }

    return () => {
      startRef.current = () => {}
      cancelAnimationFrame(s.raf)
      io.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      paintState.heat = null
    }
  }, [paint])

  return (
    <>
      {/* Parallax layer: photo + ASCII canvas move together so they always line up. */}
      <div className="hero-scene" aria-hidden="true">
        <img
          ref={imgRef}
          className="hero-scene-img"
          src={src}
          srcSet={srcSet}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
        <canvas ref={canvasRef} className="hero-scene-canvas" />
      </div>
      {/* Static layers: the shade stays anchored so the bottom edge always melts into the next section. */}
      <div className="hero-shade" aria-hidden="true" />
      <p ref={readoutRef} className="ascii-readout" aria-hidden="true" />
    </>
  )
}
