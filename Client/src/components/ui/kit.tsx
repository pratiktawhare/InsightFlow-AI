import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

// ---------- Button ----------
type Variant = 'primary' | 'ghost' | 'outline' | 'subtle' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-brand to-brand-strong text-white shadow-[0_6px_20px_-8px_rgb(var(--glow)/0.7)] hover:brightness-110 active:brightness-95',
  ghost: 'text-ink-2 hover:text-ink hover:bg-card-2',
  outline: 'border border-line text-ink hover:bg-card-2 hover:border-line-strong',
  subtle: 'bg-card-2 text-ink border border-line hover:bg-bg-subtle',
  danger: 'text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl',
  icon: 'h-9 w-9 rounded-lg justify-center',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'subtle', size = 'md', loading, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center font-medium transition-all duration-150 select-none cursor-pointer',
        'focus-visible:outline-2 outline-offset-2 outline-brand/60',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-55 pointer-events-none',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

// ---------- Card ----------
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card p-5', className)} {...rest}>
      {children}
    </div>
  )
}

// ---------- Badge ----------
type BadgeTone = 'brand' | 'ok' | 'warn' | 'danger' | 'neutral'
const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand/10 text-brand border-brand/25',
  ok: 'bg-ok/10 text-ok border-ok/25',
  warn: 'bg-warn/10 text-warn border-warn/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
  neutral: 'bg-card-2 text-ink-2 border-line',
}

export function Badge({ tone = 'neutral', className, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

// ---------- Input ----------
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...rest }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-xl border border-line bg-card-2 px-3 text-sm text-ink placeholder:text-ink-3',
      'transition focus:outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20',
      className,
    )}
    {...rest}
  />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-line bg-card-2 px-3 py-2 text-sm text-ink placeholder:text-ink-3 resize-none',
      'transition focus:outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20',
      className,
    )}
    {...rest}
  />
))
Textarea.displayName = 'Textarea'

// ---------- Progress ----------
export function Progress({ value, className, indeterminate }: { value: number; className?: string; indeterminate?: boolean }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-card-2 border border-line/60', className)}>
      {indeterminate ? (
        <div className="shimmer-bar h-full w-full" />
      ) : (
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-[width] duration-500 ease-out"
          style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }}
        />
      )}
    </div>
  )
}

// ---------- Skeleton ----------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-card-2 border border-line/50', className)} />
}

// ---------- SectionTitle ----------
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">{children}</h3>
      {action}
    </div>
  )
}

// ---------- EmptyState ----------
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-16 text-center">
      {icon ? <div className="grid h-12 w-12 place-items-center rounded-2xl bg-card-2 text-ink-3">{icon}</div> : null}
      <div>
        <p className="font-medium text-ink">{title}</p>
        {description ? <p className="mt-1 max-w-sm text-sm text-ink-2">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

// ---------- FullPageLoader (for route lazy chunks) ----------
export function FullPageLoader() {
  return (
    <div className="grid min-h-svh place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative grid h-12 w-12 place-items-center">
          <span className="absolute inset-0 rounded-2xl bg-brand/20 animate-ping opacity-30" />
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-b from-brand/25 to-accent/15 text-brand ring-1 ring-brand/30">
            <span className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </span>
        </div>
        <p className="text-sm text-ink-3">Loading InsightFlow…</p>
      </div>
    </div>
  )
}

// ---------- Segmented control ----------
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode; icon?: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-xl border border-line bg-card-2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all cursor-pointer',
            value === o.value ? 'bg-card text-ink shadow-sm border border-line' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}
