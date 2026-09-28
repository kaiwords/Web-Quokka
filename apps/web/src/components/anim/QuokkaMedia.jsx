import { cn } from '../../lib/utils'

/**
 * The slot for REAL quokka photos and videos — sizing, rounding, border and
 * elevation prebuilt so dropping media in later is one prop. It renders
 * nothing until given a `src` (house rule: no stock or generated stand-ins).
 *
 * <QuokkaMedia src="/media/quokka-beach.jpg" alt="Quokka on the beach" />
 * <QuokkaMedia src="/media/quokka.mp4" type="video" aspect="16/9" />
 *
 * Add `data-figure-parallax` (and let useScrollAnimations run) for the slow
 * pan treatment from ANIMATIONS.md.
 */
export default function QuokkaMedia({
  src,
  type,
  alt = '',
  caption,
  aspect = '4 / 3',
  className,
  ...props
}) {
  if (!src) return null
  const isVideo = type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(src)

  return (
    <figure className={cn('quokka-media', className)} style={{ '--qm-aspect': aspect }}>
      {isVideo ? (
        <video src={src} controls playsInline preload="metadata" {...props} />
      ) : (
        <img src={src} alt={alt} loading="lazy" {...props} />
      )}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
