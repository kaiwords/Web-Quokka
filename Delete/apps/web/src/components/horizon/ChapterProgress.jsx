import { CHAPTERS } from '../../lib/chapters'
import { cn } from '../../lib/utils'
import { useHorizon } from './HorizonContext'

/**
 * Chapter rail along the bottom of the journey: a gradient fill driven straight
 * from the rail engine each frame, plus a numbered dot per chapter you can jump to.
 */
export default function ChapterProgress() {
  const { index, fillRef } = useHorizon()

  return (
    <nav className="progress" aria-label="Chapters">
      <div className="progress-track" aria-hidden="true">
        <span className="progress-fill" ref={fillRef} />
      </div>
      <ol className="progress-list">
        {CHAPTERS.map((chapter, i) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              data-cursor={chapter.label}
              aria-label={`Chapter ${i + 1}: ${chapter.label}`}
              aria-current={i === index ? 'step' : undefined}
              className={cn(i === index && 'is-current', i < index && 'is-passed')}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
