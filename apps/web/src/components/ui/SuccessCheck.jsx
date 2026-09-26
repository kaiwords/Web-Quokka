import { motion } from 'motion/react'

export default function SuccessCheck({ className }) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className={className}
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        strokeWidth="3"
        className="stroke-sky-500"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <motion.path
        d="M19 33l9 9 17-19"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-sky-500"
        variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
        transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}
