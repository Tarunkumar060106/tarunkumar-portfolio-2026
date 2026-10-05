import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { certifications, experience } from '../content'
import { ArrowUpRight, SectionHead } from './ui'
import './Experience.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function Experience() {
  const listRef = useRef<HTMLOListElement>(null)

  // Timeline rail: fills with scroll, and each role's node lights up as the fill reaches it.
  useGSAP(
    () => {
      const list = listRef.current!
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        list.classList.add('is-static')
        return
      }
      gsap.fromTo(
        '.roles-rail-fill',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: list, start: 'top 65%', end: 'bottom 65%', scrub: 0.4 },
        },
      )
      gsap.utils.toArray<HTMLElement>('.role').forEach((role) => {
        ScrollTrigger.create({
          trigger: role,
          start: 'top 65%',
          toggleClass: { targets: role, className: 'is-active' },
        })
      })
    },
    { scope: listRef },
  )

  return (
    <section className="section experience" id="experience" aria-labelledby="experience-title">
      <SectionHead index="04" label="Experience" />
      <h2 className="section-title" id="experience-title" data-reveal="block">
        Where I’ve been.
      </h2>

      <ol className="roles" ref={listRef}>
        <li className="roles-rail" aria-hidden="true">
          <span className="roles-rail-fill" />
        </li>
        {experience.map((e) => (
          <li className="role" key={e.org} data-reveal="up">
            <span className="role-node" aria-hidden="true" />
            <p className="role-period">{e.period}</p>
            <div className="role-head">
              <h3>{e.role}</h3>
              <p className="role-org">
                {e.href ? (
                  <a className="role-link" href={e.href} target="_blank" rel="noreferrer">
                    {e.org}
                    <ArrowUpRight />
                  </a>
                ) : (
                  e.org
                )}
                {e.note && <span className="role-note">{e.note}</span>}
              </p>
            </div>
            <p className="role-desc">{e.description}</p>
          </li>
        ))}
      </ol>

      <div className="certs">
        <h3 className="certs-title" data-reveal="up">
          Certifications
        </h3>
        <ul className="certs-list">
          {certifications.map((c) => (
            <li className="cert" key={c.name} data-reveal="up">
              <span className="cert-name">{c.name}</span>
              <span className="cert-meta">
                {c.issuer} · {c.year}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
