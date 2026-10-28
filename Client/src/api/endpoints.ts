import { apiClient } from './client';
import { Meeting, ProcessingJob, ChatMessage, ChatRequest } from '../types/api';

export const meetingsAPI = {
  list: (skip = 0, limit = 20) =>
    apiClient.get<Meeting[]>('/meetings', { params: { skip, limit } }),

  get: (id: string) =>
    apiClient.get<Meeting>(`/meetings/${id}`),

  delete: (id: string) =>
    apiClient.delete(`/meetings/${id}`),

  getProcessingJob: (meetingId: string) =>
    apiClient.get<ProcessingJob>(`/meetings/${meetingId}/job`),

  uploadFile: (file: File, language: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    return apiClient.post<Meeting>('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadYouTube: (url: string, language: string) => {
    const formData = new FormData();
    formData.append('url', url);
    formData.append('language', language);
    return apiClient.post<Meeting>('/upload/youtube', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  chat: (meetingId: string, request: ChatRequest) =>
    apiClient.post<ChatMessage>(`/meetings/${meetingId}/chat`, request),
};

export const healthAPI = {
  check: () => apiClient.get('/health'),
};
