import { motion } from 'motion/react'

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}
