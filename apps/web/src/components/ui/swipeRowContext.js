import { createContext, useContext } from 'react'

/**
 * `swipe` is true only while a SwipeRow is laid out as a horizontal scroller
 * (below the sm breakpoint). Children use it to drop stagger delays and lower
 * their in-view threshold so a card animates the moment it is swiped in.
 */
export const SwipeRowContext = createContext({ swipe: false })

export function useSwipeRow() {
  return useContext(SwipeRowContext)
}
