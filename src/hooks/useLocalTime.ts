import { useEffect, useState } from 'react'
import { site } from '../content'

const format = new Intl.DateTimeFormat('en-GB', {
  timeZone: site.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** Current HH:MM in the site's home time zone, refreshed every 15s. */
export function useLocalTime() {
  const [time, setTime] = useState(() => format.format(new Date()))
  useEffect(() => {
    const id = setInterval(() => setTime(format.format(new Date())), 15_000)
    return () => clearInterval(id)
  }, [])
  return time
}
