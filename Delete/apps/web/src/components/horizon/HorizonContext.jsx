import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const HorizonContext = createContext(null)

const INITIAL = { index: 0, solid: false, away: false, horizontal: false }

/**
 * Shared chrome state for the Horizon Drift layer. The rail (on the home route)
 * pushes header/chapter/FAB state in through `setChrome`; the header, chapter
 * progress bar and floating actions read it back out. `fillRef` is handed to the
 * rail so it can drive the progress fill every frame without re-rendering React.
 */
export function HorizonProvider({ children }) {
  const [chrome, setChromeState] = useState(INITIAL)
  const fillRef = useRef(null)

  const setChrome = useCallback((next) => {
    setChromeState((prev) =>
      prev.index === next.index &&
      prev.solid === next.solid &&
      prev.away === next.away &&
      prev.horizontal === next.horizontal
        ? prev
        : { ...prev, ...next },
    )
  }, [])

  const value = useMemo(() => ({ ...chrome, setChrome, fillRef }), [chrome, setChrome])

  return <HorizonContext.Provider value={value}>{children}</HorizonContext.Provider>
}

export function useHorizon() {
  const ctx = useContext(HorizonContext)
  if (!ctx) throw new Error('useHorizon must be used within a HorizonProvider')
  return ctx
}
