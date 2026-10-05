import './Preloader.css'

const LABEL = 'Loading'

// Markup only — the animation lives in useIntroTimeline so the preloader and hero share one timeline.
export default function Preloader() {
  return (
    <div className="preloader-overlay" role="status" aria-label="Loading">
      <div className="preloader" aria-hidden="true">
        <div className="preloader-block">
          <div className="preloader-block">
            <div className="preloader-block">
              <div className="preloader-block" />
            </div>
          </div>
        </div>
      </div>

      <div className="preloader-copy" aria-hidden="true">
        <p>
          {[...LABEL].map((char, i) => (
            <span className="char" key={i}>
              {char}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
