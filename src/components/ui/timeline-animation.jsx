import React from 'react'
import { motion } from 'motion/react'

export function TimelineContent({
  as = 'div',
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}) {
  const Component = motion[as] || motion.div

  const defaultVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        delay: i * 0.15,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: 'blur(10px)',
      y: -20,
      opacity: 0,
    },
  }

  const variants = customVariants || defaultVariants

  return (
    <Component
      custom={animationNum}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </Component>
  )
}
