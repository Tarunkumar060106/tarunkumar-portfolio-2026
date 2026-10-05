import type { ReactNode } from 'react'

export function SectionHead({ index, label }: { index: string; label: string }) {
  return (
    <p className="section-head">
      <span className="section-index">({index})</span>
      <span>{label}</span>
    </p>
  )
}

/**
 * One line of a block-revealed heading, written in JSX so createBlockReveal() animates it in place
 * (no SplitText DOM surgery — safe for content that updates after mount).
 */
export function BlockLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className="block-line-wrapper">
      <span className={className ? `block-line ${className}` : 'block-line'}>{children}</span>
      <span className="block-revealer block-white" />
      <span className="block-revealer block-orange" />
    </span>
  )
}

export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
    </svg>
  )
}
