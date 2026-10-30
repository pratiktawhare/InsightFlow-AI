import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileAudio2, Pause, Play, Search } from 'lucide-react'
import type { MeetingDetail, Segment } from '../../api/types'
import type { Jump } from '../../pages/MeetingDetail'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { Card, Input } from '../ui/kit'
import { cn, fmtTimestamp } from '../../lib/utils'

export function TranscriptTab({
  meeting,
  jump,
  ytVideoId,
}: {
  meeting: MeetingDetail
  jump: Jump | null
  ytVideoId: string | null
}) {
  const [q, setQ] = useState('')
  const [activeSec, setActiveSec] = useState<number | null>(null)
  const { hostRef, seek, getTime, ready } = useYouTubePlayer(ytVideoId)
  const listRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const segments = meeting.segments

  /* follow playback highlight (light polling) */
  useEffect(() => {
    if (!ytVideoId || !ready) return
    let raf = 0
    const tick = () => {
      const t = getTime()
      if (t > 0) setActiveSec(t)
      raf = window.setTimeout(tick, 1000) as unknown as number
    }
    raf = window.setTimeout(tick, 800)
    return () => window.clearTimeout(raf)
  }, [ytVideoId, ready, getTime])

  /* jump from chat citations / transcript clicks */
  useEffect(() => {
    if (!jump) return
    if (ytVideoId) {
      requestAnimationFrame(() => seek(jump.t, true))
    }
    // highlight + scroll on the next frame so the DOM is settled
    let raf = 0
    raf = requestAnimationFrame(() => {
      setActiveSec(jump.t)
      const idx = segmentIndexAt(segments, jump.t)
      if (idx >= 0) {
        const row = rowRefs.current.get(idx)
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        listRef.current?.scrollTo({ top: 0 })
      }
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump?.nonce])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return segments
    return segments.filter((s) => s.text.toLowerCase().includes(query))
  }, [segments, q])

  const highlight = (text: string) => {
    const query = q.trim()
    if (!query) return <>{text}</>
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return (
      <>
        {parts.map((p, i) =>
          p.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="rounded px-0.5 bg-brand/25 text-ink">
              {p}
            </mark>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </>
    )
  }

  function onTimeClick(seg: Segment, idx: number) {
    setActiveSec(seg.start)
    if (ytVideoId) {
      seek(seg.start, true)
    }
    const row = rowRefs.current.get(idx)
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="space-y-4">
      {ytVideoId && (
        <Card className="p-3">
          <div className="relative aspect-video w-full overflow-hidden yt-frame">
            <div ref={hostRef} className="h-full w-full" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-3">
            <Play size={11} /> Click any timestamp to jump the video to that moment
          </div>
        </Card>
      )}
      {!ytVideoId && (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-card-2 px-3 py-2 text-[11.5px] text-ink-3">
          <FileAudio2 size={13} />
          Source file transcript — timestamps reference the audio position.
        </div>
      )}

      <div className="relative">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the transcript…"
          className="pl-9"
        />
      </div>

      <div ref={listRef} className="max-h-[56vh] space-y-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-3">{q ? `No lines match "${q}".` : 'No transcript segments.'}</p>
        ) : (
          filtered.map((seg, i) => {
            const active = activeSec != null && seg.start <= activeSec && activeSec < (filtered[i + 1]?.start ?? seg.end + 1)
            return (
              <div
                key={i}
                ref={(el) => {
                  if (el) rowRefs.current.set(i, el)
                  else rowRefs.current.delete(i)
                }}
                className={cn(
                  'group flex gap-3 rounded-xl px-3 py-2 transition-colors',
                  active ? 'bg-brand/10 border border-brand/25' : 'border border-transparent hover:bg-card-2',
                )}
              >
                <button
                  onClick={() => onTimeClick(seg, i)}
                  className="mt-0.5 h-fit shrink-0 cursor-pointer rounded-lg border border-line bg-card px-1.5 py-0.5 font-mono text-[11px] text-brand transition hover:border-brand/40"
                >
                  {fmtTimestamp(seg.start)}
                </button>
                <p className="text-[13.5px] leading-relaxed text-ink-2 group-hover:text-ink">{highlight(seg.text)}</p>
              </div>
            )
          })
        )}
      </div>

      {filtered.length > 0 ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[11px] text-ink-3">
          {filtered.length} of {segments.length} segments
          {ytVideoId ? ' • timestamps deep-link to the video' : ''}
          {!ytVideoId ? <span> <Pause size={9} className="inline" /></span> : null}
        </motion.p>
      ) : null}
    </div>
  )
}

function segmentIndexAt(segments: Segment[], t: number): number {
  let lo = 0
  let hi = segments.length - 1
  let best = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const s = segments[mid]
    if (s.start <= t) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}
