import { useRef } from 'react'
import Preloader from './components/Preloader'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Work from './components/Work'
import Stack from './components/Stack'
import Experience from './components/Experience'
import Contact from './components/Contact'
import type { SceneHandle } from './components/HeroScene'
import { useIntroTimeline } from './hooks/useIntroTimeline'
import { useScrollReveals } from './hooks/useScrollReveals'
import { useInteractions } from './hooks/useInteractions'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import CommandPalette from './components/CommandPalette'

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  const scene = useRef<SceneHandle>(null)

  useIntroTimeline(root, scene)
  useScrollReveals(root)
  useInteractions(root)
  useSmoothScroll()

  return (
    <div ref={root}>
      <Preloader />
      <Nav />
      <main>
        <Hero sceneRef={scene} />
        <About />
        <Work />
        <Stack />
        <Experience />
        <Contact />
      </main>
      <CommandPalette />
    </div>
  )
}
