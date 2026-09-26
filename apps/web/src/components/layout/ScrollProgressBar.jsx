import { motion, useScroll, useSpring } from 'motion/react'

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 280, damping: 40, mass: 0.2 })

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-linear-to-r from-sky-500 via-sky-400 to-sand-500"
      style={{ scaleX }}
    />
  )
}
