import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

/**
 * Wraps each line of `el` with an orange + white revealer block.
 * `line(i)` returns that line's reveal timeline: blocks sweep in, the text appears, blocks sweep out.
 *
 * Two modes:
 *  - Pre-built: if `el` already contains `.block-line-wrapper` children (written in JSX, see <BlockLine>),
 *    those are used as-is — nothing in the DOM moves, so React-owned nodes stay safe.
 *  - Auto: otherwise SplitText splits `el` into lines and the wrappers are injected.
 *    Call `revert()` afterwards to hand the text back to normal flow (so it re-wraps on resize).
 */
export function createBlockReveal(el: Element) {
  const prebuilt = [...el.querySelectorAll<HTMLElement>(':scope > .block-line-wrapper')]
  if (prebuilt.length) {
    return animate(
      prebuilt.map((w) => w.querySelector<HTMLElement>('.block-line')!),
      prebuilt.map((w) => ({
        orange: w.querySelector<HTMLElement>('.block-orange')!,
        white: w.querySelector<HTMLElement>('.block-white')!,
      })),
      () => {},
    )
  }

  const split = SplitText.create(el, { type: 'lines', linesClass: 'block-line' })
  const lines = split.lines as HTMLElement[]

  const reveals = lines.map((line) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'block-line-wrapper'
    line.parentNode!.insertBefore(wrapper, line)
    wrapper.appendChild(line)

    const white = document.createElement('div')
    white.className = 'block-revealer block-white'
    const orange = document.createElement('div')
    orange.className = 'block-revealer block-orange'
    wrapper.append(white, orange)

    return { orange, white }
  })

  return animate(lines, reveals, () => split.revert())
}

function animate(
  lines: HTMLElement[],
  reveals: { orange: HTMLElement; white: HTMLElement }[],
  revert: () => void,
) {
  gsap.set(lines, { opacity: 0 })
  gsap.set(
    reveals.flatMap((r) => [r.orange, r.white]),
    { scaleX: 0, transformOrigin: 'left center' },
  )

  const line = (index: number) => {
    const lineTl = gsap.timeline()
    const { orange, white } = reveals[index]

    ;[orange, white].forEach((block, blockIndex) => {
      const blockTl = gsap.timeline({ delay: blockIndex * 0.15 })
      blockTl.to(block, { scaleX: 1, duration: 0.5, ease: 'power4.inOut' })
      blockTl.set(block, { transformOrigin: 'right center' })
      blockTl.to(block, { scaleX: 0, duration: 0.5, ease: 'power4.inOut' })
      lineTl.add(blockTl, 0)
    })

    lineTl.set(lines[index], { opacity: 1 }, 0.5)
    return lineTl
  }

  /** Every line, overlapping the way the hero headline does. */
  const all = (vars?: gsap.TimelineVars) => {
    const tl = gsap.timeline(vars)
    lines.forEach((_, i) => tl.add(line(i), i === 0 ? 0 : '-=0.75'))
    return tl
  }

  return { lines, line, all, revert }
}
