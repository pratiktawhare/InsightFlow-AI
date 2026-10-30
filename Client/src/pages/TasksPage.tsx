import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CircleCheck, ListChecks } from 'lucide-react'
import { useTasks, useToggleTask } from '../api/hooks'
import { Api } from '../api/client'
import { Button, Card, EmptyState, SectionTitle, Segmented, Skeleton } from '../components/ui/kit'
import { cn } from '../lib/utils'

type Filter = 'open' | 'done' | 'all'

function useMeetingsLite() {
  return useQuery({
    queryKey: ['meetings', 'lite'],
    queryFn: () => Api.listMeetings(),
  })
}

export function TasksPage() {
  const [filter, setFilter] = useState<Filter>('open')
  const { data: tasks, isLoading } = useTasks()
  const { data: meetings } = useMeetingsLite()
  const toggle = useToggleTask()
  const qc = useQueryClient()

  const meetingTitles = new Map<string, string>()
  for (const m of meetings?.items ?? []) meetingTitles.set(m.id, m.title)

  const filtered = (tasks ?? []).filter((t) => (filter === 'all' ? true : filter === 'open' ? !t.done : t.done))

  const doneCount = (tasks ?? []).filter((t) => t.done).length

  return (
    <div className="mx-auto max-w-[860px] px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">Action items</h1>
          <p className="mt-1 text-sm text-ink-2">Every task across your meetings, with owner & deadline.</p>
        </div>
        <Segmented
          value={filter}
          onChange={(v: Filter) => setFilter(v)}
          options={[
            { value: 'open', label: `Open ${(tasks ?? []).filter((t) => !t.done).length || ''}` },
            { value: 'done', label: `Done ${doneCount || ''}` },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={22} />}
            title={filter === 'open' ? 'No open action items 🎉' : filter === 'done' ? 'Nothing completed yet' : 'No action items found'}
            description="Process a meeting and extracted tasks will show up here, ready to check off."
            action={
              <Link to="/app/new">
                <Button size="sm" variant="primary">New meeting</Button>
              </Link>
            }
          />
        ) : (
          <Card className="divide-y divide-line/70 p-0">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-4 sm:p-5">
                <button
                  onClick={() => toggle.mutate({ id: t.id, done: !t.done })}
                  className={cn(
                    'mt-0.5 grid h-5 w-5 shrink-0 cursor-pointer place-items-center rounded-full border transition-all',
                    t.done ? 'border-ok bg-ok text-white' : 'border-ink-3 hover:border-brand hover:bg-brand/10',
                  )}
                  aria-label={t.done ? 'Mark as open' : 'Mark as done'}
                >
                  {t.done ? <Check size={12} strokeWidth={3.5} /> : null}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={cn('text-[14px] leading-snug text-ink', t.done && 'text-ink-3 line-through')}>{t.description}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-3">
                    <span className="font-medium text-ink-2">{t.owner}</span>
                    <span className="rounded-md border border-line bg-card-2 px-1.5 py-0.5">⏱ {t.deadline}</span>
                    <Link to={`/app/meetings/${t.meeting_id}`} className="truncate hover:text-brand max-w-[280px]">
                      <CircleCheck size={10} className="mr-1 inline opacity-70" />
                      {meetingTitles.get(t.meeting_id) ?? 'Meeting'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div className="mt-6">
        <SectionTitle>Tip</SectionTitle>
        <p className="text-[13px] text-ink-3">
          Ticking a task marks it done everywhere instantly. Export meeting minutes as PDF/Markdown from the meeting page.
        </p>
      </div>
      <button onClick={() => void qc.invalidateQueries({ queryKey: ['tasks'] })} className="hidden" aria-hidden />
    </div>
  )
}
