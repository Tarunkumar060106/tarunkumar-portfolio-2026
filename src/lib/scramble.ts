// Decodes an element's text into new text through random code glyphs, settling left → right.
// Same visual language as the hero's ASCII lens.

const GLYPHS = '!<>-_\\/[]{}=+*^?#%@&01'

const escape = (c: string) =>
  c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === ' ' ? '&nbsp;' : c

/** Starts the scramble; returns a cancel function. Writes innerHTML, so `el` must not have React children. */
export function scrambleTo(el: HTMLElement, next: string, duration = 0.9, onDone?: () => void) {
  const from = el.textContent ?? ''
  const len = Math.max(from.length, next.length)
  const ms = duration * 1000

  // Each character starts scrambling at a random point in the first half, settles in order after that.
  const plan = Array.from({ length: len }, (_, i) => {
    const start = Math.random() * ms * 0.4
    const end = start + ms * 0.35 + (i / Math.max(1, len - 1)) * ms * 0.35
    return { from: from[i] ?? '', to: next[i] ?? '', start, end }
  })

  let raf = 0
  const t0 = performance.now()
  const tick = (now: number) => {
    const t = now - t0
    let html = ''
    let done = 0
    for (const c of plan) {
      if (t >= c.end) {
        html += escape(c.to)
        done++
      } else if (t >= c.start) {
        const g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        html += `<span class="scramble-char">${escape(g)}</span>`
      } else {
        html += escape(c.from)
      }
    }
    el.innerHTML = html
    if (done === plan.length) {
      el.textContent = next
      onDone?.()
      return
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return () => cancelAnimationFrame(raf)
}
