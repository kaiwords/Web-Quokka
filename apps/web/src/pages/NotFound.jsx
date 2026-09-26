import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import SEO from '../components/layout/SEO'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import QuokkaMascot from '../components/ui/QuokkaMascot'

export default function NotFound() {
  return (
    <>
      <SEO title="Page Not Found" description="This page doesn't exist." path="/404" />
      <section className="flex min-h-[70vh] items-center py-20">
        <Container className="flex flex-col items-center text-center">
          <motion.div
            animate={{ rotate: [0, -6, 6, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <QuokkaMascot className="animate-float" size="clamp(3.75rem, 3rem + 4vw, 5.5rem)" />
          </motion.div>
          <h1 className="mt-6 page-title font-heading font-extrabold text-cream-50">
            404
          </h1>
          <p className="mt-2 text-lg text-sand-700 dark:text-sand-300">
            Looks like this page hopped off somewhere else.
          </p>
          <Button to="/" size="lg" className="mt-8">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Back to Home
          </Button>
        </Container>
      </section>
    </>
  )
}
