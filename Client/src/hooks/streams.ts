import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { StatusEvent } from '../api/types'

/**
 * Subscribes to /api/meetings/:id/progress SSE and returns the latest event.
 * Falls back to nothing if the meeting is terminal already.
 */
export function useProgressStream(meetingId: string | null | undefined) {
  const [event, setEvent] = useState<StatusEvent | null>(null)
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const qc = useQueryClient()

  useEffect(() => {
    if (!meetingId) {
      return
    }

    const es = new EventSource(`/api/meetings/${meetingId}/progress`)
    esRef.current = es

    es.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent<string>).data) as StatusEvent
        setEvent(data)
        if (data.status === 'ready' || data.status === 'failed') {
          es.close()
          setConnected(false)
          void qc.invalidateQueries({ queryKey: ['meeting', meetingId] })
          void qc.invalidateQueries({ queryKey: ['meetings'] })
          void qc.invalidateQueries({ queryKey: ['tasks'] })
        }
      } catch {
        /* malformed frame */
      }
    })
    es.onopen = () => setConnected(true)
    es.onerror = () => {
      // if the server ended the stream because it's terminal, close cleanly
      const st = esRef.current?.readyState
      if (st === 2) {
        setConnected(false)
        void qc.invalidateQueries({ queryKey: ['meeting', meetingId] })
      }
    }

    return () => {
      es.close()
      esRef.current = null
      setConnected(false)
    }
  }, [meetingId, qc])

  return { event: meetingId ? event : null, connected: meetingId ? connected : false }
}

export type ChatEvent =
  | { type: 'sources'; sources: { index: number; text: string; start?: number | null; end?: number | null }[] }
  | { type: 'delta'; text: string }
  | { type: 'done' }

/**
 * Streams a chat answer from POST /api/meetings/:id/chat and feeds tokens
 * through onToken. Resolves when the stream ends.
 */
export async function streamChat(
  meetingId: string,
  question: string,
  onEvent: (ev: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`/api/meetings/${meetingId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`Chat failed (${res.status})`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      let eventName = 'message'
      let data = ''
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (!data) continue
      try {
        const payload = JSON.parse(data)
        onEvent({ type: eventName, ...payload } as ChatEvent)
      } catch {
        /* ignore frame */
      }
    }
  }
}
