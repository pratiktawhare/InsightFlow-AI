import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AudioLines,
  CircleAlert,
  DatabaseZap,
  FileAudio2,
  Gauge,
  ListMusic,
  Loader2,
  RefreshCcw,
  Scissors,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { YoutubeIcon } from '../ui/BrandIcons'
import { Button, Progress } from '../ui/kit'
import { cn } from '../../lib/utils'
import { useProgressStream } from '../../hooks/streams'

interface ProcessingMeeting {
  id: string
  title: string
  status: string
  stage: string
  progress: number
  error?: string | null
}

interface StageDef {
  key: string
  label: string
  blurb: string
  icon: React.ReactNode
}

const STAGES: StageDef[] = [
  { key: 'download', label: 'Fetching audio', blurb: 'Downloading from the source', icon: <YoutubeIcon size={15} /> },
  { key: 'prepare', label: 'Prepare audio', blurb: 'Converting to 16 kHz WAV & chunking', icon: <Scissors size={15} /> },
  { key: 'transcribe', label: 'Transcribe', blurb: 'Whisper writes down every word', icon: <AudioLines size={15} /> },
  { key: 'summarize', label: 'LLM analysis', blurb: 'Summary, decisions, action items', icon: <Wand2 size={15} /> },
  { key: 'extract', label: 'Extract insights', blurb: 'Owners, deadlines, open questions', icon: <Sparkles size={15} /> },
  { key: 'index', label: 'Index for chat', blurb: 'Embedding into the vector store', icon: <DatabaseZap size={15} /> },
]

export function ProcessingView({ meeting }: { meeting: ProcessingMeeting }) {
  const { event } = useProgressStream(meeting.id)

  const status = event?.status ?? meeting.status
  const failed = status === 'failed'
  const detail = event?.detail || ''
  const progress = event?.progress ?? meeting.progress

  useEffect(() => {
    document.title = `${meeting.title || 'Processing…'} — InsightFlow AI`
  }, [meeting.title])

  if (failed) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card border-danger/30 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger ring-1 ring-danger/25">
            <CircleAlert size={24} />
          </div>
          <h2 className="font-display mt-4 text-xl font-semibold text-ink">Processing failed</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
            {'Something broke while analyzing this meeting. Common fixes: check FFmpeg is installed, verify API keys, or try a different file.'}
          </p>
          <div className="mt-2 rounded-xl bg-card-2 border border-line px-4 py-3">
            <p className="max-h-32 overflow-y-auto text-left break-words font-mono text-[11.5px] text-danger/90">
              {meeting.error ?? 'Unknown error'}
            </p>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/app/new">
              <Button variant="primary">
                <RefreshCcw size={15} /> Try again
              </Button>
            </Link>
            <Link to="/app">
              <Button variant="ghost">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  const activeIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.key === (event?.stage || meeting.stage)),
  )

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="relative grid h-14 w-14 place-items-center">
            <span className="absolute inset-0 rounded-2xl bg-brand/20 animate-ping opacity-40" />
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-brand/25 to-accent/15 text-brand ring-1 ring-brand/30">
              <Loader2 size={22} className="animate-spin" />
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="font-display truncate text-xl font-semibold text-ink">{meeting.title || 'Processing…'}</h2>
            <p className="text-sm text-ink-2">
              {event?.status ? prettyStage(event.stage, detail) : 'Warming up the pipeline…'}
            </p>
{/*             <p className="mt-0.5 text-xs text-ink-3">{detail}</p> */}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-3">
            <span>Overall progress</span>
            <span className="font-mono">{Math.round(progress * 100)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* stage stepper */}
        <ol className="mt-8 space-y-1">
          {STAGES.map((s, i) => {
            const done = i < activeIdx
            const active = i === activeIdx && s.key !== 'ready'
            return (
              <li key={s.key} className={cn('flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors', active && 'bg-brand/8 border border-brand/20', done && 'opacity-70')}>
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
                    done && 'border-ok/30 bg-ok/10 text-ok',
                    active && 'border-brand/30 bg-brand/10 text-brand',
                    !done && !active && 'border-line bg-card-2 text-ink-3',
                  )}
                >
                  {done ? <Gauge size={15} /> : active ? <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>{s.icon}</motion.span> : s.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-medium', done ? 'text-ink-2' : 'text-ink')}>{s.label}</p>
                  <p className="text-xs text-ink-3">{s.blurb}</p>
                </div>
                {active && detail ? (
                  <span className="hidden rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand sm:block">
                    {detail}
                  </span>
                ) : done ? (
                  <span className="hidden rounded-full border border-ok/25 bg-ok/10 px-2.5 py-1 text-[11px] font-medium text-ok sm:block">Done</span>
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ink-3">
        <FileAudio2 size={13} /> You can leave this page — everything keeps processing in the background.
        <ListMusic size={13} className="ml-1" />
      </p>
    </motion.div>
  )
}

function prettyStage(stage: string, detail: string): string {
  if (stage === 'transcribe' && detail) return detail
  const map: Record<string, string> = {
    download: 'Fetching audio…',
    prepare: 'Preparing audio…',
    transcribe: 'Transcribing…',
    summarize: 'Summarizing & analyzing…',
    extract: 'Extracting insights…',
    index: 'Building the knowledge index…',
    ready: 'Done',
  }
  return map[stage] ?? stage
}
