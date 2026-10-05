// Turns an image into a grid of ASCII glyphs that lines up exactly with the same image
// rendered as `object-fit: cover`, and paints it to a canvas.

export const ASCII = {
  chars: ' .:-=+*xX#%@0369B&',
  baseColor: '#fff',
  tintColor: '#ff591f', // site accent, used for the lens rim
  hotColor: '#fff',
  backing: '23, 23, 23', // rgb of --base-400, painted behind lens glyphs to hide the photo
  blank: 0.06, // (stretched) brightness below this has no glyph during the intro wave
  wave: 1.3, // seconds for the reveal wave to cross the whole field
  tintLag: 0.5, // the colour wave trails the white reveal wave by this much
} as const

export type AsciiField = {
  cols: number
  rows: number
  cellW: number
  cellH: number
  glyphs: string[]
  /** Contrast-stretched brightness, 0–1 (so dark, colourful images still use the whole glyph ramp). */
  brightness: Float32Array
  /** Each cell's own colour from the image, brightened so glyphs stay readable on dark scenes. */
  colors: string[]
  start: Float32Array // reveal time per cell, seconds from wave start
  duration: number // until the last cell has been tinted
}

export type CoverOptions = {
  width: number
  height: number
  cellW: number
  cellH: number
  /** CSS object-position as 0–1 fractions, so the grid matches the <img>. */
  posX: number
  posY: number
  /** Where the wave starts, as 0–1 fractions of the field. */
  originX: number
  originY: number
}

export function sampleCover(image: HTMLImageElement, o: CoverOptions): AsciiField {
  const cols = Math.max(1, Math.round(o.width / o.cellW))
  const rows = Math.max(1, Math.round(o.height / o.cellH))
  const cellW = o.width / cols
  const cellH = o.height / rows

  // Same crop the browser makes for object-fit: cover + object-position.
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  const scale = Math.max(o.width / iw, o.height / ih)
  const sw = o.width / scale
  const sh = o.height / scale
  const sx = (iw - sw) * o.posX
  const sy = (ih - sh) * o.posY

  const sampler = document.createElement('canvas')
  sampler.width = cols
  sampler.height = rows
  const sctx = sampler.getContext('2d', { willReadFrequently: true })!
  sctx.drawImage(image, sx, sy, sw, sh, 0, 0, cols, rows)
  const pixels = sctx.getImageData(0, 0, cols, rows).data

  const count = cols * rows
  const glyphs = new Array<string>(count)
  const colors = new Array<string>(count)
  const brightness = new Float32Array(count)
  const dist = new Float32Array(count)
  const ox = o.originX * o.width
  const oy = o.originY * o.height
  let maxDist = 1

  // Luminance, then stretch the 4th–98th percentile range to 0–1 so a mostly-dark scene still
  // spreads across the whole glyph ramp instead of collapsing into dots.
  const lum = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const p = i * 4
    lum[i] = (pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114) / 255
  }
  const sorted = Float32Array.from(lum).sort()
  const lo = sorted[Math.floor(count * 0.04)]
  const hi = Math.max(lo + 0.05, sorted[Math.floor(count * 0.98)])

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col
      const p = i * 4
      const b = Math.min(1, Math.max(0, (lum[i] - lo) / (hi - lo)))
      brightness[i] = b
      glyphs[i] = b < ASCII.blank ? '' : ASCII.chars[1 + Math.floor(b * (ASCII.chars.length - 2))]

      // Boost the cell colour towards full brightness (keeps hue), then lift it slightly towards white.
      const r = pixels[p]
      const g = pixels[p + 1]
      const bl = pixels[p + 2]
      const k = Math.min(255 / Math.max(r, g, bl, 1), 4)
      const lift = (c: number) => Math.round(Math.min(255, c * k) * 0.82 + 255 * 0.18)
      colors[i] = `rgb(${lift(r)},${lift(g)},${lift(bl)})`

      dist[i] = Math.hypot((col + 0.5) * cellW - ox, (row + 0.5) * cellH - oy)
      if (dist[i] > maxDist) maxDist = dist[i]
    }
  }

  const start = new Float32Array(count)
  for (let i = 0; i < count; i++) start[i] = (dist[i] / maxDist) * ASCII.wave

  return { cols, rows, cellW, cellH, glyphs, brightness, colors, start, duration: ASCII.wave + ASCII.tintLag + 0.01 }
}

/** Cheap deterministic hash → [0, 1) for per-cell, per-step randomness without allocations. */
function hash01(i: number, step: number) {
  let h = Math.imul(i ^ Math.imul(step, 0x27d4eb2d), 0x9e3779b1)
  h ^= h >>> 15
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}

export type PaintState = {
  /** Seconds into the intro wave (< 0 → nothing revealed yet). */
  t: number
  /** 0–1 visibility of the full-field ASCII (1 during the intro, fades to 0 as the photo takes over). */
  fade: number
  /** 0–1 per cell: the cursor lens (decays into a trail). Null before interaction starts. */
  heat: Float32Array | null
  /** Animation step; rim glyphs re-roll whenever it changes. */
  step: number
}

export function paintField(
  ctx: CanvasRenderingContext2D,
  field: AsciiField,
  width: number,
  height: number,
  font: string,
  s: PaintState,
) {
  ctx.clearRect(0, 0, width, height)
  if (s.t < 0) return

  const { cols, rows, cellW, cellH, glyphs, brightness, colors, start } = field
  const ramp = ASCII.chars
  const heat = s.heat
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let row = 0; row < rows; row++) {
    const y = (row + 0.5) * cellH
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col
      const b = brightness[i]
      const lens = heat ? heat[i] : 0

      // Full-field layer (intro): glyph strength follows image brightness.
      const revealed = s.t >= start[i]
      const base = revealed && glyphs[i] ? (0.3 + 0.7 * b) * s.fade : 0
      if (base < 0.004 && lens < 0.01) continue

      const x = (col + 0.5) * cellW
      let glyph = glyphs[i]
      // Intro: glyphs land white, then the tint wave washes them into the image's own colours.
      let color: string = s.t >= start[i] + ASCII.tintLag ? colors[i] : ASCII.baseColor
      let alpha = base

      if (lens >= 0.01) {
        // Lens: blank out the photo under this cell, then show the scene as code.
        ctx.globalAlpha = Math.min(1, lens * 1.4) * 0.92
        ctx.fillStyle = `rgb(${ASCII.backing})`
        ctx.fillRect(col * cellW, row * cellH, cellW + 0.5, cellH + 0.5)

        if (!glyph) glyph = '.'
        color = colors[i]
        if (lens > 0.12 && lens < 0.8 && hash01(i, s.step) < 0.55) {
          // Rim: scrambling glyphs in the site's orange.
          glyph = ramp[1 + Math.floor(hash01(i + 7919, s.step) * (ramp.length - 1))]
          color = ASCII.tintColor
        } else if (b > 0.6 && lens > 0.6) {
          color = ASCII.hotColor
        }
        alpha = Math.max(alpha, lens * (0.55 + 0.45 * b))
      }

      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.fillText(glyph, x, y)
    }
  }
  ctx.globalAlpha = 1
}
