import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/utils'

function calculateGap(width) {
  const minWidth = 1024
  const maxWidth = 1456
  const minGap = 60
  const maxGap = 86
  if (width <= minWidth) return minGap
  if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth))
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth))
}

export default function CircularTestimonials({ testimonials, autoplay = true }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoverPrev, setHoverPrev] = useState(false)
  const [hoverNext, setHoverNext] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1200)

  const imageContainerRef = useRef(null)
  const autoplayIntervalRef = useRef(null)
  const reducedMotion = useReducedMotion()

  const testimonialsLength = testimonials.length
  const activeTestimonial = testimonials[activeIndex]

  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) setContainerWidth(imageContainerRef.current.offsetWidth)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonialsLength)
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current)
  }, [testimonialsLength])

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonialsLength) % testimonialsLength)
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current)
  }, [testimonialsLength])

  useEffect(() => {
    if (autoplay && !reducedMotion) {
      autoplayIntervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonialsLength)
      }, 5000)
    }
    return () => {
      if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current)
    }
  }, [autoplay, testimonialsLength, reducedMotion])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNext, handlePrev])

  function getImageStyle(index) {
    const gap = calculateGap(containerWidth)
    const maxStickUp = gap * 0.8
    const isActive = index === activeIndex
    const isLeft = (activeIndex - 1 + testimonialsLength) % testimonialsLength === index
    const isRight = (activeIndex + 1) % testimonialsLength === index

    if (isActive) {
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: 'auto',
        transform: 'translateX(0px) translateY(0px) scale(1) rotateY(0deg)',
        transition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
      }
    }
    if (isLeft) {
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: 'auto',
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg)`,
        transition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
      }
    }
    if (isRight) {
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: 'auto',
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)`,
        transition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
      }
    }
    return {
      zIndex: 1,
      opacity: 0,
      pointerEvents: 'none',
      transition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
    }
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  return (
    <div className="grid w-full items-center gap-12 md:grid-cols-2 md:gap-20">
      <div ref={imageContainerRef} className="relative h-72 w-full sm:h-96" style={{ perspective: '1000px' }}>
        {testimonials.map((testimonial, index) => (
          <img
            key={testimonial.src}
            src={testimonial.src}
            alt={testimonial.name}
            className="absolute h-full w-full rounded-3xl object-cover shadow-xl shadow-sand-900/10 dark:shadow-black/40"
            style={getImageStyle(index)}
          />
        ))}
      </div>

      <div className="flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            variants={quoteVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <h3 className="font-heading text-2xl font-bold text-sand-900 dark:text-cream-50">
              {activeTestimonial.name}
            </h3>
            <p className="mt-1 mb-8 text-sm font-medium text-sand-600 dark:text-sand-400">
              {activeTestimonial.designation}
            </p>
            <p className="text-lg leading-relaxed text-sand-700 dark:text-cream-100">
              {reducedMotion
                ? activeTestimonial.quote
                : activeTestimonial.quote.split(' ').map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ filter: 'blur(10px)', opacity: 0, y: 5 }}
                      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut', delay: 0.025 * i }}
                      className="inline-block"
                    >
                      {word}&nbsp;
                    </motion.span>
                  ))}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-4 md:mt-0">
          <button
            type="button"
            onClick={handlePrev}
            onMouseEnter={() => setHoverPrev(true)}
            onMouseLeave={() => setHoverPrev(false)}
            aria-label="Previous testimonial"
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full bg-sand-800 text-cream-50 transition-colors duration-300 cursor-pointer dark:bg-ink-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-ink-900',
              hoverPrev && 'bg-sky-500 dark:bg-sky-500',
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            onMouseEnter={() => setHoverNext(true)}
            onMouseLeave={() => setHoverNext(false)}
            aria-label="Next testimonial"
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full bg-sand-800 text-cream-50 transition-colors duration-300 cursor-pointer dark:bg-ink-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-ink-900',
              hoverNext && 'bg-sky-500 dark:bg-sky-500',
            )}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
