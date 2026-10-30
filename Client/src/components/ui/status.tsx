import { Badge } from './kit'
import { YoutubeIcon } from './BrandIcons'
import { cn } from '../../lib/utils'
import { Clapperboard, Loader2, Upload } from 'lucide-react'

const STATUS_TONE: Record<string, 'brand' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  ready: 'ok',
  processing: 'brand',
  pending: 'neutral',
  failed: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  ready: 'Ready',
  processing: 'Processing',
  pending: 'Queued',
  failed: 'Failed',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const processing = status === 'processing' || status === 'pending'
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} className={className}>
      {processing ? <Loader2 size={11} className="animate-spin" /> : null}
      {STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

export function SourceChip({ type, url, fileName, className }: { type: string; url?: string | null; fileName?: string | null; className?: string }) {
  const isYT = type === 'youtube' && url
  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-card-2 px-2.5 py-1 text-[11px] font-medium text-ink-2',
        isYT && 'text-danger',
        className,
      )}
    >
      {type === 'youtube' ? <YoutubeIcon size={13} /> : <Upload size={13} />}
      {isYT ? 'YouTube' : (fileName || 'Upload')}
    </span>
  )
  if (isYT)
    return (
      <a href={url || '#'} target="_blank" rel="noreferrer" className="hover:opacity-80 transition">
        {content}
      </a>
    )
  return content
}

export function TypeIcon({ type }: { type: string }) {
  return type === 'youtube' ? (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-danger/10 text-danger">
      <YoutubeIcon size={16} />
    </span>
  ) : (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
      <Clapperboard size={16} />
    </span>
  )
}
