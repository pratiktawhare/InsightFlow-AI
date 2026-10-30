import { Button, Card, SectionTitle } from '../ui/kit'
import type { MeetingDetail } from '../../api/types'
import { cn } from '../../lib/utils'
import { Check, CircleAlert, KeyRound, MessageCirclePlus } from 'lucide-react'
import { toast } from 'sonner'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function OverviewTab({
  meeting,
  onAsk,
}: {
  meeting: MeetingDetail
  onAsk: (q: string) => void
}) {
  const hasSummary = !!meeting.summary.trim()

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* summary */}
      <Card className="lg:col-span-3">
        <SectionTitle action={
          <Button size="sm" variant="ghost" onClick={() => copyText(meeting.summary, 'Summary copied')}>
            Copy
          </Button>
        }>Summary</SectionTitle>
        {hasSummary ? (
          <div className="prose-flow text-[14.5px] text-ink-2">
            <Markdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(meeting.summary)}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-ink-3">No summary available for this meeting.</p>
        )}
      </Card>

      <div className="flex flex-col gap-4 lg:col-span-2">
        {/* action items */}
        <Card>
          <SectionTitle>
            Action items <span className="ml-1 rounded-full bg-card-2 px-1.5 text-[10px] font-bold">{meeting.tasks.filter((t) => !t.done).length}</span>
          </SectionTitle>
          {meeting.tasks.length === 0 ? (
            <p className="text-sm text-ink-3">No action items were found in this meeting.</p>
          ) : (
            <ul className="space-y-1.5">
              {meeting.tasks.map((t) => (
                <li
                  key={t.id}
                  className={cn(
                    'flex items-start gap-2.5 rounded-xl border border-line/70 bg-card-2 px-3 py-2.5 transition-opacity',
                    t.done && 'opacity-55',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition-colors',
                      t.done ? 'border-ok bg-ok text-white' : 'border-ink-3',
                    )}
                  >
                    {t.done ? <Check size={11} strokeWidth={3} /> : null}
                  </span>
                  <div className="min-w-0">
                    <p className={cn('text-[13.5px] leading-snug text-ink', t.done && 'line-through')}>{t.description}</p>
                    <p className="mt-0.5 text-[11px] text-ink-3">
                      <span className="font-medium text-ink-2">{t.owner}</span> · ⏱ {t.deadline}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* decisions */}
        <Card>
          <SectionTitle>Key decisions</SectionTitle>
          {meeting.decisions.length === 0 ? (
            <p className="text-sm text-ink-3">No key decisions were recorded.</p>
          ) : (
            <ul className="space-y-2">
              {meeting.decisions.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-2">
                  <KeyRound size={13} className="mt-1 shrink-0 text-brand" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* open questions */}
        <Card>
          <SectionTitle>Open questions</SectionTitle>
          {meeting.open_questions.length === 0 ? (
            <p className="text-sm text-ink-3">Nothing left unresolved.</p>
          ) : (
            <ul className="space-y-2">
              {meeting.open_questions.map((q, i) => (
                <li key={i} className="group flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-2">
                  <CircleAlert size={13} className="mt-1 shrink-0 text-warn" />
                  <span className="flex-1">{q}</span>
                  <button
                    onClick={() => onAsk(q)}
                    title="Ask this in AI chat"
                    className="cursor-pointer rounded-lg border border-line bg-card px-2 py-1 text-[11px] font-medium text-ink-2 opacity-0 transition-opacity group-hover:opacity-100 hover:text-brand"
                  >
                    <MessageCirclePlus size={12} className="mr-1 inline" /> Ask
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function normalizeMarkdown(md: string): string {
  // ensure single-* bullets become proper markdown
  const lines = md.split('\n')
  return lines
    .map((l) => {
      const t = l.trim()
      if (!t) return ''
      const bullet = /^[-•*]\s+/.test(t)
      const text = t.replace(/^[-•*]\s+/, '')
      return bullet ? `- ${text}` : l
    })
    .join('\n')
}

function copyText(text: string, msg: string) {
  void navigator.clipboard?.writeText(text).then(
    () => toast.success(msg),
    () => toast.error('Could not copy'),
  )
}
