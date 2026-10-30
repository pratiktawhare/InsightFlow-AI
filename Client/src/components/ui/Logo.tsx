import { cn } from '../../lib/utils'

export function Logo({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="iflg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#iflg)" />
      <path
        d="M32 14c1.2 0 2.2.8 2.5 1.9l2.6 8.9 8.9 2.6c1.1.3 1.9 1.3 1.9 2.5s-.8 2.2-1.9 2.5l-8.9 2.6-2.6 8.9c-.3 1.1-1.3 1.9-2.5 1.9s-2.2-.8-2.5-1.9l-2.6-8.9-8.9-2.6c-1.1-.3-1.9-1.3-1.9-2.5s.8-2.2 1.9-2.5l8.9-2.6 2.6-8.9c.3-1.1 1.3-1.9 2.5-1.9Z"
        fill="#fff"
        fillOpacity=".95"
      />
      <circle cx="47" cy="19" r="4" fill="#fff" fillOpacity=".55" />
      <circle cx="18" cy="46" r="3" fill="#fff" fillOpacity=".4" />
    </svg>
  )
}

export function LogoWord({ className }: { className?: string }) {
  return (
    <span className={cn('font-display text-lg font-semibold tracking-tight text-ink', className)}>
      Insight<span className="gradient-text">Flow</span>
      <span className="ml-1 rounded-md bg-brand/10 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-brand">
        AI
      </span>
    </span>
  )
}
