import { useEffect, useState } from 'react'

export default function useTypewriter(text, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let index = 0
    let intervalId

    const delayId = setTimeout(() => {
      intervalId = setInterval(() => {
        index += 1
        setDisplayed(text.slice(0, index))
        if (index >= text.length) {
          clearInterval(intervalId)
          setDone(true)
        }
      }, speed)
    }, startDelay)

    return () => {
      clearTimeout(delayId)
      clearInterval(intervalId)
    }
  }, [text, speed, startDelay])

  return { displayed, done }
}
