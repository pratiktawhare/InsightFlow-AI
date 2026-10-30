import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Bot, Quote, Timer, User } from 'lucide-react'
import { cn, fmtTimestamp } from '../../lib/utils'
import { streamChat } from '../../hooks/streams'
import { Logo } from '../ui/Logo'
import { Input } from '../ui/kit'

interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { index: number; text: string; start?: number | null; end?: number | null }[] | null
  streaming?: boolean
}

const SUGGESTIONS = [
  'Give me the top 3 takeaways',
  'What was decided in this meeting?',
  'List the action items with owners',
  'What questions are still unresolved?',
]

export function ChatTab({ meetingId, onJump }: { meetingId: string; onJump: (t: number) => void }) {
  const qp = useQueryClient()
  const [messages, setMessages] = useState<LocalMessage[]>(() => {
    const cached = qp.getQueryData<{ messages: { id: string; role: 'user' | 'assistant'; content: string; sources?: LocalMessage['sources'] }[] }>(['meeting', meetingId])
    return cached ? cached.messages.map((msg) => ({ ...msg })) : []
  })
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<string>).detail
      if (q) ask(q)
    }
    window.addEventListener('ifl-chat-ask', onAsk)
    return () => window.removeEventListener('ifl-chat-ask', onAsk)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function ask(question: string) {
    void runStreaming(question)
  }

  async function runStreaming(question: string) {
    setError(null)
    const userMsg: LocalMessage = { id: `u${Date.now()}`, role: 'user', content: question }
    const aId = `a${Date.now()}`
    setMessages((prev) => [...prev, userMsg, { id: aId, role: 'assistant', content: '', streaming: true }])

    try {
      await streamChat(meetingId, question, (ev) => {
        if (ev.type === 'sources') {
          setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, sources: ev.sources } : m)))
        } else if (ev.type === 'delta') {
          setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, content: m.content + (ev as { text: string }).text } : m)))
        } else if (ev.type === 'done') {
          setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, streaming: false } : m)))
        }
      })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message)
        toast.error(`Chat failed: ${(e as Error).message}`)
      }
    } finally {
      setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, streaming: false } : m)))
      // refresh canonical copy (sources, ids)
      void qp.invalidateQueries({ queryKey: ['meeting', meetingId] })
    }
  }

  async function send() {
    const q = (pending ?? '').trim()
    if (!q) return
    await runStreaming(q)
    setPending('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      {/* messages */}
      <div className="flex-1 space-y-5 overflow-y-auto pb-4 pr-1" style={{ maxHeight: '58vh' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-brand/20 to-accent/10 text-brand ring-1 ring-brand/25">
              <Bot size={26} />
            </div>
            <div>
              <p className="font-semibold text-ink">Ask anything about this meeting</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">
                Answers are grounded in the transcript via RAG and come with citations you can jump to.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="cursor-pointer rounded-full border border-line bg-card-2 px-3.5 py-1.5 text-[12.5px] text-ink-2 transition hover:border-brand/40 hover:text-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex gap-3', m.role === 'user' && 'justify-end')}
            >
              {m.role === 'assistant' && (
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-brand/15 to-accent/10 text-brand ring-1 ring-brand/25">
                  <Logo size={17} />
                </span>
              )}
              <div className={cn('max-w-[78%] min-w-0', m.role === 'user' && 'flex flex-col items-end')}>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-[14px] leading-relaxed',
                    m.role === 'user'
                      ? 'rounded-br-md bg-gradient-to-b from-brand to-brand-strong text-white shadow-[0_8px_24px_-12px_rgb(var(--glow)/0.6)]'
                      : 'rounded-bl-md border border-line bg-card-2 text-ink',
                  )}
                >
                  {m.role === 'assistant' ? (
                    m.content ? (
                      <div className="prose-flow">
                        <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                        {m.streaming && <span className="ml-1 inline-block h-4 w-[2px] animate-pulse rounded bg-brand align-middle" />}
                      </div>
                    ) : (
                      <span className="flex gap-1.5 py-1">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="h-2 w-2 rounded-full bg-ink-3 animate-pulse" style={{ animationDelay: `${i * 0.18}s` }} />
                        ))}
                      </span>
                    )
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>

                {/* sources */}
                {m.role === 'assistant' && m.sources && m.sources.length > 0 && !m.streaming && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.sources.slice(0, 6).map((s) => {
                      const ts = s.start != null && s.start > 0 ? s.start : null
                      return (
                        <button
                          key={s.index}
                          onClick={() => ts != null && onJump(ts)}
                          title={s.text.slice(0, 180)}
                          className="cursor-pointer flex max-w-[46%] items-center gap-1.5 truncate rounded-lg border border-line bg-card px-2 py-1 text-[11px] text-ink-3 transition hover:border-brand/40 hover:text-brand"
                        >
                          <Quote size={9} />
                          {ts != null ? <Timer size={10} /> : null}
                          {ts != null ? <span className="font-mono">{fmtTimestamp(ts)}</span> : null}
                          <span className="truncate">{s.text.replace(/\s+/g, ' ').slice(0, 36)}…</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-card-2 ring-1 ring-line text-ink-2">
                  <User size={15} />
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="mt-3 rounded-2xl border border-line bg-card-2 p-2 transition-all focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/20">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={pending ?? ''}
            onChange={(e) => setPending(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder="Ask about this meeting… (Enter to send)"
            className="border-0 bg-transparent focus:ring-0 focus:border-0"
          />
          <button
            onClick={() => void send()}
            disabled={!(pending ?? '').trim()}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-gradient-to-b from-brand to-brand-strong text-white transition hover:brightness-110 disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  )
}
