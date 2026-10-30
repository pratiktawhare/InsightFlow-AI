import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BotMessageSquare,
  Clapperboard,
  FileText,
  ListChecks,
  MessagesSquare,
  Sparkles,
  Timer,
  Wand2,
} from 'lucide-react'
import { Logo, LogoWord } from '../components/ui/Logo'
import { Button } from '../components/ui/kit'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.21, 1.02, 0.73, 1] as const },
}

const FEATURES = [
  {
    icon: Clapperboard,
    title: 'Instant transcription',
    text: 'Drop a YouTube link or audio file. Faster-Whisper or Sarvam AI transcribes it — Hinglish included.',
  },
  {
    icon: Wand2,
    title: 'AI meeting minutes',
    text: 'Bullet summaries, key decisions and open questions generated automatically from the full transcript.',
  },
  {
    icon: ListChecks,
    title: 'Action items, structured',
    text: 'Every task with its owner and deadline — checkable, filterable, exportable across all your meetings.',
  },
  {
    icon: MessagesSquare,
    title: 'Chat with the meeting',
    text: 'A RAG pipeline grounded in the transcript answers with citations from the exact moments.',
  },
  {
    icon: Timer,
    title: 'Timestamp deep-links',
    text: 'Jump from any quote, citation or transcript line straight to that second of the video.',
  },
  {
    icon: FileText,
    title: 'Beautiful exports',
    text: 'One-click meeting minutes as PDF or Markdown, ready to share with the team.',
  },
]

const STEPS = [
  { n: '01', label: 'Import', text: 'YouTube URL or drag & drop a file' },
  { n: '02', label: 'Transcribe', text: 'Segmented transcript with timestamps' },
  { n: '03', label: 'Analyze', text: 'Summary, tasks, decisions, questions' },
  { n: '04', label: 'Chat', text: 'RAG answers grounded in your meeting' },
]

export function Landing() {
  return (
    <div className="relative min-h-svh overflow-x-hidden">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
        <div className="absolute top-[38rem] -left-40 h-[380px] w-[380px] rounded-full bg-accent/15 blur-[110px]" />
        <div className="absolute top-[30rem] -right-40 h-[380px] w-[380px] rounded-full bg-brand/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in oklab, var(--line-strong) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--line-strong) 55%, transparent) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)',
          }}
        />
      </div>

      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={30} />
          <LogoWord />
        </Link>
        <nav className="flex items-center gap-2">
          <a href="#features" className="hidden rounded-lg px-3 py-2 text-sm text-ink-2 hover:text-ink sm:block">
            Features
          </a>
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm text-ink-2 hover:text-ink sm:block">
            How it works
          </a>
          <Link to="/app">
            <Button variant="primary" size="sm">
              Open App
              <ArrowRight size={14} />
            </Button>
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-28 text-center sm:pt-28">
        <motion.div {...fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3.5 py-1.5 text-[12.5px] font-medium text-brand">
            <Sparkles size={14} />
            RAG-powered meeting & video intelligence
          </span>
        </motion.div>
        <motion.h1
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
          className="font-display mt-6 text-5xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl"
        >
          Turn every meeting & video into
          <span className="gradient-text"> structured insight</span>
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.16 }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-2"
        >
          InsightFlow AI summarizes long recordings, extracts action items and lets you chat with the transcript —
          grounded, cited and seconds-accurate.
        </motion.p>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.24 }} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/app/new">
            <Button variant="primary" size="lg">
              Process your first meeting
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/app">
            <Button variant="outline" size="lg">
              View dashboard
            </Button>
          </Link>
        </motion.div>

        {/* pipeline card */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.32 }}
          className="glass-card mx-auto mt-16 grid max-w-3xl gap-px overflow-hidden rounded-2xl p-1 text-left sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative rounded-xl bg-card/70 p-5">
              <span className="font-mono text-[11px] font-semibold text-brand">{s.n}</span>
              <p className="mt-1.5 font-semibold text-ink">{s.label}</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-2">{s.text}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight
                  size={15}
                  className="absolute top-1/2 -right-[7px] hidden -translate-y-1/2 text-ink-3 lg:block"
                />
              )}
            </div>
          ))}
        </motion.div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-28">
        <motion.div {...fadeUp} className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Everything after <span className="gradient-text">"can you recap that?"</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-ink-2">
            One pipeline takes you from raw audio to an interactive, searchable knowledge base.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="card group p-6 transition-all hover:-translate-y-0.5 hover:border-brand/30"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-b from-brand/15 to-accent/10 text-brand ring-1 ring-brand/20">
                <f.icon size={18} />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="how" className="mx-auto max-w-3xl scroll-mt-20 px-6 pb-32 text-center">
        <motion.div {...fadeUp} className="gradient-border rounded-3xl p-10 sm:p-14">
          <BotMessageSquare className="mx-auto h-10 w-10 text-brand" />
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink">Your meetings, on demand</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-2">
            Runs locally with your own API keys — transcripts, embeddings and chat history never leave your machine.
          </p>
          <Link to="/app" className="mt-7 inline-block">
            <Button variant="primary" size="lg">
              Get started free
              <ArrowRight size={16} />
            </Button>
          </Link>
        </motion.div>
        <p className="mt-10 text-xs text-ink-3">
          InsightFlow AI — powered by Faster-Whisper, Sarvam AI, LangChain, ChromaDB & Groq.
        </p>
      </section>
    </div>
  )
}
