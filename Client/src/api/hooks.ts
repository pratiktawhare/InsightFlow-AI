import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Api } from './client'

export function useMeetings(q?: string) {
  return useQuery({
    queryKey: ['meetings', q || ''],
    queryFn: () => Api.listMeetings(q),
    // fast-changing statuses while processing
    refetchInterval: (query) => {
      const items = query.state.data?.items
      return items?.some((m) => m.status === 'processing' || m.status === 'pending') ? 2500 : false
    },
  })
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: () => Api.getMeeting(id),
    refetchInterval: (query) => {
      const d = query.state.data
      if (!d) return 2500
      const processing = d.status === 'processing' || d.status === 'pending'
      if (processing && !window.EventSource) return 1500
      if (!processing) return false
      return 10_000 // SSE hook normally drives updates; slow reminder-refresh as fallback
    },
  })
}

export function useTasks(done?: boolean | null) {
  return useQuery({ queryKey: ['tasks', String(done)], queryFn: () => Api.listTasks(done) })
}

export function useToggleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => Api.toggleTask(id, done),
    onMutate: async ({ id, done }) => {
      // optimistic toggle across both caches
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = qc.getQueriesData({ queryKey: ['tasks'] })
      qc.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) => {
        if (!old || !Array.isArray(old)) return old
        return (old as { id: string; done: boolean; description: string; owner: string; deadline: string; order_index: number }[]).map(
          (t) => (t.id === id ? { ...t, done } : t),
        )
      })
      await qc.cancelQueries({ queryKey: ['meeting', id] })
      return { snapshot }
    },
    onError: (e, _v, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.error(`Could not update task: ${(e as Error).message}`)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] })
      void qc.invalidateQueries({ queryKey: ['meetings'] })
      void qc.invalidateQueries({ queryKey: ['meeting'] })
    },
  })
}

export function useDeleteMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => Api.deleteMeeting(id),
    onSuccess: () => {
      toast.success('Meeting deleted')
      void qc.invalidateQueries({ queryKey: ['meetings'] })
    },
    onError: (e) => toast.error(`Delete failed: ${(e as Error).message}`),
  })
}
