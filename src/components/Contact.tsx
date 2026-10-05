import { useEffect, useRef, useState } from 'react'
import { contact, site } from '../content'
import { useLocalTime } from '../hooks/useLocalTime'
import { ArrowUpRight, SectionHead } from './ui'
import Terminal from './Terminal'
import './Contact.css'

const YEAR = new Date().getFullYear()

export default function Contact() {
  const time = useLocalTime()
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${site.email}` // clipboard blocked → fall back to the mail client
    }
  }

  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <SectionHead index="05" label="Contact" />

      <h2 className="contact-title" id="contact-title" data-reveal="block">
        {contact.title}
      </h2>

      <div className="contact-row">
        <p className="contact-body" data-reveal="up">
          {contact.body}
        </p>

        <div className="contact-actions" data-reveal="up">
          <a className="btn btn--dark" href={`mailto:${site.email}`}>
            Email me
          </a>
          <button type="button" className="btn btn--ghost" onClick={copyEmail}>
            {copied ? 'Copied!' : 'Copy email'}
          </button>
          <span className="visually-hidden" aria-live="polite">
            {copied ? 'Email address copied to clipboard' : ''}
          </span>
        </div>
      </div>

      <div data-reveal="up">
        <Terminal />
      </div>

      <ul className="contact-socials" data-reveal="up">
        {site.socials.map((s) => (
          <li key={s.href}>
            <a href={s.href} target="_blank" rel="noreferrer">
              {s.label}
              <ArrowUpRight />
            </a>
          </li>
        ))}
      </ul>

      <footer className="footer">
        <p>
          © {YEAR} {site.name}
        </p>
        <p>
          {site.location} · {time} IST
        </p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </section>
  )
}
