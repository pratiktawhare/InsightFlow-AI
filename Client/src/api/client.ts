import type { ChatMessageOut, MeetingDetail, MeetingList, MeetingSummary, Segment, StatusEvent, TaskOut, ChatSource } from './types'

export type {
  ChatMessageOut,
  MeetingDetail,
  MeetingList,
  MeetingSummary,
  Segment,
  StatusEvent,
  TaskOut,
  ChatSource,
}

export interface ChatTokens {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[] | null
  streaming?: boolean
  error?: string | null
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (typeof body?.detail === 'string') detail = body.detail
      else if (typeof body?.detail === 'object') detail = JSON.stringify(body.detail)
    } catch {
      /* not json */
    }
    throw new Error(detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function downloadFile(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// ---------- typed endpoints ----------
export const Api = {
  health: () => api<{ ok: boolean; llm_configured: boolean; sarvam_configured: boolean }>('/health'),

  listMeetings: (q?: string) =>
    api<MeetingList>(`/meetings${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  getMeeting: (id: string) => api<MeetingDetail>(`/meetings/${id}`),

  createMeeting: (form: FormData) =>
    api<MeetingSummary>('/meetings', { method: 'POST', body: form, headers: {} }),

  deleteMeeting: (id: string) => api<null>(`/meetings/${id}`, { method: 'DELETE' }),

  listTasks: (done?: boolean | null) =>
    api<TaskOut[]>(`/tasks${done === true ? '?done=true' : done === false ? '?done=false' : ''}`),

  toggleTask: (id: string, done: boolean) =>
    api<{ id: string; done: boolean }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),

  exportMeeting: (id: string, format: 'pdf' | 'md') => `/api/meetings/${id}/export?format=${format}`,
}
