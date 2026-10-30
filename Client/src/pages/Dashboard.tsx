import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import {
  Clapperboard,
  Clock3,
  Download,
  FileAudio2,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { YoutubeIcon } from '../components/ui/BrandIcons'
import { toast } from 'sonner'
import { useDeleteMeeting, useMeetings, useMeeting, useTasks } from '../api/hooks'
import { Api, downloadFile } from '../api/client'
import { Button, Card, EmptyState, Input, Progress, SectionTitle, Skeleton } from '../components/ui/kit'
import { StatusBadge } from '../components/ui/status'
import { fmtDuration, fmtNumber, fmtRelative } from '../lib/utils'

export function Dashboard() {
  const [q, setQ] = useState('')
  const { data, isLoading } = useMeetings(q || undefined)
  const { data: tasks } = useTasks()
  const del = useDeleteMeeting()

  const stats = useMemo(() => {
    const items = data?.items ?? []
    const ready = items.filter((m) => m.status === 'ready')
    const seconds = ready.reduce((a, m) => a + (m.duration_seconds || 0), 0)
    const open = (tasks ?? []).filter((t) => !t.done).length
    const processing = items.filter((m) => m.status === 'processing' || m.status === 'pending').length
    return { total: data?.total ?? 0, seconds, open, processing }
  }, [data, tasks])

  const activity = useMemo(() => {
    const byDay = new Map<string, number>()
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      byDay.set(d.toISOString().slice(0, 10), 0)
    }
    for (const m of data?.items ?? []) {
      const day = m.created_at.slice(0, 10)
      if (byDay.has(day)) byDay.set(day, (byDay.get(day) ?? 0) + 1)
    }
    return [...byDay.entries()].map(([day, n], i, arr) => ({
      day,
      label: new Date(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      n,
      cum: arr.slice(0, i + 1).reduce((a, b) => a + b[1], 0),
    }))
  }, [data])

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-8 sm:py-10">
      {/* header */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-56">
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-2">Your processed meetings & videos at a glance.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
            <Input placeholder="Search meetings…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Link to="/app/new" className="shrink-0">
            <Button variant="primary">
              <Plus size={15} />
              <span className="hidden sm:inline">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* stats */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total meetings" value={fmtNumber(stats.total)} icon={<Clapperboard size={17} />} />
        <StatCard
          label="Hours processed"
          value={stats.seconds >= 3600 ? `${(stats.seconds / 3600).toFixed(1)}h` : fmtDuration(stats.seconds)}
          icon={<Clock3 size={17} />}
        />
        <StatCard label="Open action items" value={fmtNumber(stats.open)} icon={<ListChecks size={17} />} />
        <StatCard label="Processing now" value={fmtNumber(stats.processing)} icon={stats.processing > 0 ? <Loader2 size={17} className="animate-spin" /> : <ListChecks size={17} />} />
      </div>

      {/* activity + recent */}
      <div className="mt-8 flex flex-col gap-8">
        <section>
          <SectionTitle>Meetings</SectionTitle>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((m) => (
                <MeetingCard key={m.id} id={m.id} onDelete={() => del.mutateAsync(m.id)} showActions />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileAudio2 size={22} />}
              title={q ? `No meetings match "${q}"` : 'No meetings yet'}
              description="Process a YouTube link or upload an audio file to build your knowledge base."
              action={
                <Link to="/app/new">
                  <Button variant="primary" size="sm">
                    <Plus size={14} /> New meeting
                  </Button>
                </Link>
              }
            />
          )}
        </section>

        <section>
          <SectionTitle>Activity — last 14 days</SectionTitle>
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={activity} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--ink-3)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    fontSize: 12,
                    color: 'var(--ink)',
                  }}
                  labelStyle={{ color: 'var(--ink-2)', fontSize: 11 }}
                  cursor={{ stroke: 'var(--line-strong)' }}
                />
                <Area
                  type="monotone"
                  dataKey="cum"
                  name="Cumulative"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  fill="url(#fillArea)"
                  dot={{ r: 2, fill: 'var(--brand)' }}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-brand/15 to-accent/10 text-brand ring-1 ring-brand/20">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">{label}</p>
        <p className="font-display truncate text-xl font-semibold text-ink">{value}</p>
      </div>
    </Card>
  )
}

export function MeetingCard({
  id,
  showActions,
  onDelete,
}: {
  id: string
  showActions?: boolean
  onDelete?: () => void
}) {
  const { data: m } = useMeeting(id)

  if (!m) return <Skeleton className="h-[148px]" />

  const processing = m.status === 'processing' || m.status === 'pending'

  return (
    <Card className="group relative flex h-full flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-brand/15 to-accent/10 text-brand ring-1 ring-brand/20">
            {m.source_type === 'youtube' ? <YoutubeIcon size={15} /> : <FileAudio2 size={15} />}
          </span>
          <Link to={`/app/meetings/${m.id}`} className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink group-hover:text-brand">{m.title || 'Untitled meeting'}</p>
            <p className="text-[11px] text-ink-3">{fmtRelative(m.created_at)}</p>
          </Link>
        </div>
        <StatusBadge status={m.status} />
      </div>

      <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-2">
        {m.summary.replace(/[*_#]/g, '').slice(0, 160) || (processing ? 'Working on it…' : 'Tap to open the analysis.')}
      </p>

      {processing && (
        <div className="flex items-center gap-2">
          <Progress value={m.progress} className="flex-1" />
          <span className="font-mono text-[10px] text-ink-3">{Math.round(m.progress * 100)}%</span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-line/70 pt-3 text-[11px] text-ink-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock3 size={11} /> {fmtDuration(m.duration_seconds)}
          </span>
          <span className="capitalize">{m.language === 'english' ? 'English' : 'Hinglish'}</span>
          {m.open_task_count > 0 && (
            <Link to={`/app/meetings/${m.id}`} className="flex items-center gap-1 font-medium text-warn">
              <ListChecks size={11} /> {m.open_task_count}
            </Link>
          )}
        </div>
        {showActions && (
          <div className="pointer-events-none relative z-10 flex opacity-0 transition-opacity hover:pointer-events-auto group-hover:pointer-events-auto group-hover:opacity-100">
            <Button size="icon" variant="ghost" title="Export PDF" onClick={() => { downloadFile(Api.exportMeeting(m.id, 'pdf')); toast.success('Exporting PDF…') }}>
              <Download size={14} />
            </Button>
            {m.source_type === 'youtube' && m.source_url ? (
              <a href={m.source_url} target="_blank" rel="noreferrer" title="Open source">
                <Button size="icon" variant="ghost" tabIndex={-1}>
                  <Link2 size={14} />
                </Button>
              </a>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              title="Delete meeting"
              onClick={() => {
                if (confirm('Delete this meeting permanently?')) onDelete?.()
              }}
            >
              <Trash2 size={14} className="text-danger/80" />
            </Button>
          </div>
        )}
      </div>
      <Link to={`/app/meetings/${m.id}`} className="absolute inset-0 z-0" aria-label={`Open ${m.title}`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  )
}
