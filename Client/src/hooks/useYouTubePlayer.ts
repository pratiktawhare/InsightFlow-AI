import { useCallback, useEffect, useRef, useState } from 'react'

interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  getCurrentTime: () => number
  destroy: () => void
}

let apiPromise: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const w = window as unknown as { YT?: { Player?: unknown }; onYouTubeIframeAPIReady?: () => void }
      if (w.YT?.Player) return resolve()
      const prev = w.onYouTubeIframeAPIReady
      w.onYouTubeIframeAPIReady = () => {
        prev?.()
        resolve()
      }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    })
  }
  return apiPromise
}

/** Lightweight YT IFrame API player with seek control. */
export function useYouTubePlayer(videoId: string | null) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!videoId || !hostRef.current) return
    let destroyed = false

    loadYouTubeApi().then(() => {
      if (destroyed || !hostRef.current) return
      const w = window as unknown as {
        YT: { Player: new (el: HTMLElement, opts: object) => YTPlayer }
      }
      const player = new w.YT.Player(hostRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            if (!destroyed) {
              setReady(true)
              playerRef.current = player
            }
          },
        },
      })
    })

    return () => {
      destroyed = true
      setReady(false)
      try {
        playerRef.current?.destroy()
      } catch {
        /* ignore */
      }
      playerRef.current = null
    }
  }, [videoId])

  const seek = useCallback((t: number, autoplay = true) => {
    const p = playerRef.current
    if (!p) return
    p.seekTo(t, true)
    if (autoplay) p.playVideo()
  }, [])

  const getTime = useCallback(() => {
    try {
      return playerRef.current?.getCurrentTime?.() ?? 0
    } catch {
      return 0
    }
  }, [])

  return { hostRef, seek, getTime, ready }
}
