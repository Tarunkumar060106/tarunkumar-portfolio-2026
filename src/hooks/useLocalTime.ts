import { useSyncExternalStore } from 'react'
import { site } from '../content'

const format = new Intl.DateTimeFormat('en-GB', {
  timeZone: site.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 15_000)
  return () => clearInterval(id)
}
const getSnapshot = () => format.format(new Date())
// The pre-rendered HTML has no clock; the browser fills it in after hydration (no mismatch).
const getServerSnapshot = () => '--:--'

/** Current HH:MM in the site's home time zone, refreshed every 15s. */
export function useLocalTime() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
