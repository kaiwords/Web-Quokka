import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'
import { HorizonProvider } from './components/horizon/HorizonContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <HorizonProvider>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </HorizonProvider>
    </BrowserRouter>
  </StrictMode>,
)
