export interface Segment {
  start: number
  end: number
  text: string
  chunk: number
}

export interface TaskOut {
  id: string
  meeting_id: string
  description: string
  owner: string
  deadline: string
  done: boolean
  order_index: number
}

export interface ChatSource {
  index: number
  text: string
  start?: number | null
  end?: number | null
  chunk?: number | null
}

export interface ChatMessageOut {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[] | null
  created_at: string
}

export interface MeetingSummary {
  id: string
  title: string
  status: string
  stage: string
  progress: number
  source_type: string
  source_url: string | null
  file_name: string | null
  language: string
  duration_seconds: number
  word_count: number
  open_task_count: number
  created_at: string
}

export interface MeetingDetail extends MeetingSummary {
  transcript: string
  summary: string
  segments: Segment[]
  decisions: string[]
  open_questions: string[]
  chunk_count: number
  error: string | null
  tasks: TaskOut[]
  messages: ChatMessageOut[]
}

export interface MeetingList {
  items: MeetingSummary[]
  total: number
}

export interface StatusEvent {
  meeting_id: string
  status: string
  stage: string
  progress: number
  detail: string
}
