import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  BotMessageSquare,
  Clapperboard,
  Clock3,
  Download,
  FileText,
  Gauge,
  ListChecks,
  ScrollText,
  Type,
} from 'lucide-react'
import { useMeeting } from '../api/hooks'
import { Api, downloadFile } from '../api/client'
import { Badge, Button, Skeleton } from '../components/ui/kit'
import { StatusBadge } from '../components/ui/status'
import { fmtDuration, fmtNumber, youtubeId, cn } from '../lib/utils'
import { ProcessingView } from '../components/meeting/ProcessingView'
import { OverviewTab } from '../components/meeting/OverviewTab'
import { ChatTab } from '../components/meeting/ChatTab'
import { TranscriptTab } from '../components/meeting/TranscriptTab'

type Tab = 'overview' | 'chat' | 'transcript'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Gauge size={15} /> },
  { key: 'chat', label: 'AI Chat', icon: <BotMessageSquare size={15} /> },
  { key: 'transcript', label: 'Transcript', icon: <ScrollText size={15} /> },
]

export interface Jump {
  t: number
  nonce: number
}

export function MeetingDetail() {
  const { id = '' } = useParams()
  const { data: m, isLoading } = useMeeting(id)
  const [tab, setTab] = useState<Tab>('overview')
  const [jump, setJump] = useState<Jump | null>(null)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1000px] space-y-4 px-4 py-8 sm:px-8">
        <Skeleton className="h-24" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }
  if (!m) return null

  const processing = m.status === 'processing' || m.status === 'pending'
  const ytVideoId = youtubeId(m.source_url)

  if (processing) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-8">
        <ProcessingView meeting={m} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-8 sm:py-8">
      {/* header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {m.source_type === 'youtube' && m.source_url ? (
              <a href={m.source_url} target="_blank" rel="noreferrer">
                <Badge tone="danger"><Clapperboard size={11} /> YouTube source</Badge>
              </a>
            ) : (
              <Badge><FileText size={11} /> Uploaded file</Badge>
            )}
            <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-ink">{m.title}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2">
              <StatusBadge status={m.status} />
              <span className="flex items-center gap-1"><Clock3 size={12} /> {fmtDuration(m.duration_seconds)}</span>
              <span className="capitalize flex items-center gap-1"><Type size={12} /> {m.language}</span>
              <span className="flex items-center gap-1"><ScrollText size={12} /> {fmtNumber(m.word_count)} words</span>
              <span className="flex items-center gap-1"><ListChecks size={12} /> {m.open_task_count} open tasks</span>
            </div>
          </div>

          {/* export actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadFile(Api.exportMeeting(m.id, 'pdf'))}>
              <Download size={14} /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadFile(Api.exportMeeting(m.id, 'md'))}>
              <Download size={14} /> Markdown
            </Button>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="card mt-5 overflow-hidden p-0">
        <div className="flex border-b border-line bg-card-2/50 px-2 sm:px-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-2 hover:text-ink',
              )}
            >
              {t.icon}
              {t.label}
              {t.key === 'chat' && m.messages.length > 0 && (
                <span className="rounded-full bg-card-2 px-1.5 text-[10px] text-ink-3">{m.messages.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {tab === 'overview' && (
            <OverviewTab
              meeting={m}
              onAsk={(q) => {
                setTab('chat')
                window.dispatchEvent(new CustomEvent('ifl-chat-ask', { detail: q }))
              }}
            />
          )}
          {tab === 'chat' && (
            <ChatTab
              meetingId={m.id}
              onJump={(t) => {
                setJump({ t, nonce: Date.now() })
                setTab('transcript')
              }}
            />
          )}
          {tab === 'transcript' && (
            <TranscriptTab
              meeting={m}
              jump={jump}
              ytVideoId={ytVideoId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
