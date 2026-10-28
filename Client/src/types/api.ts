export interface ApiResponse<T> {
  data: T;
  status: string;
}

export interface Meeting {
  id: string;
  title: string;
  source: "youtube" | "upload";
  source_url?: string;
  transcript?: string;
  summary?: string;
  status: "processing" | "completed" | "failed";
  language: string;
  created_at: string;
  updated_at: string;
  processing_seconds: number;
}

export interface ProcessingJob {
  id: string;
  meeting_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  current_stage: string;
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  question: string;
  answer: string;
}

export interface ChatRequest {
  question: string;
}
