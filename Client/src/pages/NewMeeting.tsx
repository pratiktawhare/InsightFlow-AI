import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Clapperboard, FileAudio2, Link2, Play, Sparkles, UploadCloud, X } from 'lucide-react'
import { Api } from '../api/client'
import { Button, Card, Input, Segmented } from '../components/ui/kit'
import { fmtBytes, cn } from '../lib/utils'

type Mode = 'youtube' | 'upload'
type Lang = 'english' | 'hinglish'

const ALLOWED = /\.(mp3|wav|m4a|ogg|flac|mp4|webm|aac|opus|mkv)$/i

export function NewMeeting() {
  const [mode, setMode] = useState<Mode>('youtube')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [lang, setLang] = useState<Lang>('english')
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const urlValid = /^https?:\/\/\S+$/.test(url.trim())
  const valid = mode === 'youtube' ? urlValid : !!file

  function acceptFile(f: File) {
    if (!ALLOWED.test(f.name) && !f.type.startsWith('audio') && !f.type.startsWith('video')) {
      toast.error('Unsupported file type. Use an audio or video file.')
      return
    }
    setFile(f)
  }

  async function submit() {
    if (!valid || submitting) return
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('language', lang)
      if (mode === 'youtube') {
        form.append('youtube_url', url.trim())
      } else {
        form.append('file', file as File)
      }
      const m = await Api.createMeeting(form)
      toast.success('Processing started ✨')
      navigate(`/app/meetings/${m.id}`)
    } catch (e) {
      toast.error((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-8 sm:py-12">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          <Sparkles size={12} /> New meeting
        </span>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink">What should we analyze?</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
          Paste a YouTube link or drop an audio recording. Transcription, summary, action items and a chat — wired up
          automatically.
        </p>
      </div>

      <Card className="mt-8 p-6">
        <Segmented
          className="mx-auto"
          value={mode}
          onChange={(v: Mode) => {
            setMode(v)
            setFile(null)
          }}
          options={[
            { value: 'youtube', label: 'YouTube link', icon: <Link2 size={15} /> },
            { value: 'upload', label: 'Upload file', icon: <UploadCloud size={15} /> },
          ]}
        />

        <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-6">
          {mode === 'youtube' ? (
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-ink-2">YouTube URL</label>
              <div className="relative">
                <Link2 size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="h-12 pl-9"
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
              {url.length > 4 && !urlValid && <p className="mt-2 text-xs text-warn">Enter a full URL starting with http:// or https://</p>}
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-ink-2">Audio or video file</label>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) acceptFile(f)
                }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-card-2 px-6 py-10 text-center transition-all hover:border-brand/50 hover:bg-brand/5',
                  dragging && 'scale-[1.01] border-brand/70 bg-brand/10',
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) acceptFile(f)
                  }}
                />
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-b from-brand/15 to-accent/10 text-brand ring-1 ring-brand/20">
                  <UploadCloud size={20} />
                </div>
                <p className="text-sm font-medium text-ink">Drag & drop or click to browse</p>
                <p className="text-xs text-ink-3">MP3, WAV, M4A, OGG, MP4, WEBM…</p>
                {file ? (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-xs text-ink">
                    <FileAudio2 size={14} className="text-brand" />
                    <span className="max-w-[260px] truncate font-medium">{file.name}</span>
                    <span className="text-ink-3">{fmtBytes(file.size)}</span>
                    <button
                      className="cursor-pointer rounded p-0.5 text-ink-3 hover:text-danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-7">
          <label className="mb-2 block text-[13px] font-semibold text-ink-2">Language</label>
          <Segmented
            value={lang}
            onChange={(v: Lang) => setLang(v)}
            options={[
              { value: 'english', label: 'English — local Whisper' },
              { value: 'hinglish', label: 'Hinglish — Sarvam AI' },
            ]}
          />
          <p className="mt-2 text-xs text-ink-3">
            {lang === 'english'
              ? 'Runs the faster-whisper model locally on your CPU.'
              : 'Streams audio to Sarvam AI and translates it to English while transcribing.'}
          </p>
        </div>

        <Button variant="primary" size="lg" className="mt-8 w-full justify-center" loading={submitting} disabled={!valid} onClick={submit}>
          <Play size={16} />
          Process meeting
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink-3">
          <Clapperboard size={12} /> Longer recordings take a while — you can watch the live progress.
        </p>
      </Card>
    </div>
  )
}
