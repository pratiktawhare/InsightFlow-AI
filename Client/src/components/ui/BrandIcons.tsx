import { cn } from '../../lib/utils'

/** YouTube play icon (lucide v1 removed brand icons). */
export function YoutubeIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path d="M23.5 7.2a3.02 3.02 0 0 0-2.12-2.15C19.5 4.55 12 4.55 12 4.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 7.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 4.8 3.02 3.02 0 0 0 2.12 2.15c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.15A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-4.8ZM9.6 15.6V8.4l6.27 3.6-6.27 3.6Z" />
    </svg>
  )
}
