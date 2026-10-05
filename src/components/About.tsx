import { about, site } from '../content'
import { useLocalTime } from '../hooks/useLocalTime'
import { SectionHead } from './ui'
import './About.css'

export default function About() {
  const time = useLocalTime()

  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <SectionHead index="01" label="About" />

      <div className="about-grid">
        <h2 className="section-title" id="about-title" data-reveal="block">
          {about.title}
        </h2>

        <div className="about-copy">
          <p className="about-statement" data-reveal="up">
            {about.statement}
          </p>
          {about.body.map((para) => (
            <p className="about-body" data-reveal="up" key={para}>
              {para}
            </p>
          ))}
        </div>
      </div>

      <dl className="about-facts">
        <div data-reveal="up">
          <dt>Focus</dt>
          <dd>
            <ul>
              {about.focus.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div data-reveal="up">
          <dt>Education</dt>
          <dd>
            {about.education.degree}
            <span className="about-meta">{about.education.school}</span>
            <span className="about-meta">{about.education.detail}</span>
          </dd>
        </div>
        <div data-reveal="up">
          <dt>Off the clock</dt>
          <dd>
            <ul>
              {about.offClock.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div data-reveal="up">
          <dt>Based in</dt>
          <dd>
            {site.location}
            <span className="about-meta">{time} IST</span>
            <span className="about-meta">{about.availability}</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
