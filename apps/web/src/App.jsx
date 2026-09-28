import { lazy, Suspense } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import BackgroundLayers from './components/horizon/BackgroundLayers'
import CustomCursor from './components/horizon/CustomCursor'
import FloatingActions from './components/horizon/FloatingActions'
import HorizonFooter from './components/horizon/HorizonFooter'
import HorizonHeader from './components/horizon/HorizonHeader'
import ScrollToTop from './components/layout/ScrollToTop'
import SmoothScroll from './components/layout/SmoothScroll'
import useHorizonInteractions from './hooks/useHorizonInteractions'
import useReveals from './hooks/useReveals'

const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Process = lazy(() => import('./pages/Process'))
const About = lazy(() => import('./pages/About'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))

/**
 * The inner routes are ordinary vertical pages. The home route brings its own
 * `<main class="rail">` and ends on a footer panel inside the journey, so it
 * sits outside this layout. The home rail eases its own travel, so Lenis only
 * runs here, on the vertical pages.
 */
function PageLayout() {
  return (
    <>
      <SmoothScroll />
      <main id="main" className="page-main" tabIndex={-1}>
        <Outlet />
      </main>
      <HorizonFooter />
    </>
  )
}

export default function App() {
  useHorizonInteractions()
  useReveals()

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <BackgroundLayers />
      <CustomCursor />
      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <HorizonHeader />
              <Suspense fallback={null}>
                <Home />
              </Suspense>
              <FloatingActions />
            </>
          }
        />
        <Route
          element={
            <>
              <HorizonHeader />
              <Suspense fallback={null}>
                <PageLayout />
              </Suspense>
              <FloatingActions />
            </>
          }
        >
          <Route path="/services" element={<Services />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/process" element={<Process />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
