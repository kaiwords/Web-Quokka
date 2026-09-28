import { cn } from '../../lib/utils'

/**
 * The real brand mascot asset — used subtly (empty/success states, feature
 * spots) rather than as a literal illustration. Brown on cream surfaces,
 * cream on forest or brown surfaces (`tone="inverted"`).
 */
export default function QuokkaMascot({ className, tone = 'default', size, ...props }) {
  const src = tone === 'inverted' ? '/brand/mascot-cream.png' : '/brand/mascot-brown.png'

  return (
    <img
      src={src}
      alt="WebQuokka mascot"
      className={cn('h-8 w-8 object-contain', className)}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    />
  )
}
