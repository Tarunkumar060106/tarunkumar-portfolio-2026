const FONTS = ['500 1em "Manrope Variable"', '500 1em "JetBrains Mono Variable"']

let ready: Promise<unknown> | null = null

/** Resolves once the display fonts are loaded (needed before any SplitText line split). */
export function whenFontsReady() {
  ready ??= Promise.all(FONTS.map((f) => document.fonts.load(f)))
  return ready
}
