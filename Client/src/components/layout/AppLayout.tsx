import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, LayoutDashboard, ListChecks, Menu, Moon, PlusCircle, Sun, X } from 'lucide-react'
import { Logo, LogoWord } from '../ui/Logo'
import { Button } from '../ui/kit'
import { useTheme } from '../../store/theme'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/tasks', icon: ListChecks, label: 'Tasks', end: false },
]

export function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const isMeeting = location.pathname.startsWith('/app/meetings/')
  const [mobileNav, setMobileNav] = useState(false)
  const closeMobileNav = () => setMobileNav(false)

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/" className="flex items-center gap-2.5 px-1" aria-label="InsightFlow AI home">
        <Logo size={30} />
        <LogoWord />
      </Link>

      <Button variant="primary" className="w-full justify-center" onClick={() => { navigate('/app/new'); closeMobileNav() }}>
        <PlusCircle size={16} />
        New meeting
      </Button>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label, end }) => {
          const active = end ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={closeMobileNav}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-brand/12 text-brand border border-brand/20' : 'text-ink-2 hover:bg-card-2 hover:text-ink border border-transparent',
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <div className="rounded-xl border border-line bg-card-2 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">Theme</p>
          <Button size="sm" variant="ghost" className="mt-1.5 w-full justify-center" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </Button>
        </div>
        <p className="text-center text-[11px] text-ink-3">InsightFlow AI • local-first</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-svh">
      <div className="mx-auto grid max-w-[1400px] md:grid-cols-[264px_1fr]">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-svh border-r border-line bg-card/40 md:block">{sidebar}</aside>

        {/* mobile top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-card/80 px-4 py-3 backdrop-blur md:hidden">
          <button className="cursor-pointer text-ink-2" onClick={() => setMobileNav(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <Logo size={24} />
            <LogoWord className="text-base" />
          </Link>
          <button className="cursor-pointer text-ink-2" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileNav && (
            <motion.div
              className="fixed inset-0 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNav(false)} />
              <motion.div
                className="absolute inset-y-0 left-0 w-[280px] border-r border-line bg-card"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                <button
                  className="absolute right-3 top-3 z-10 cursor-pointer rounded-lg p-1.5 text-ink-2 hover:bg-card-2"
                  onClick={() => setMobileNav(false)}
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
                {sidebar}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="min-w-0">
          {isMeeting && (
            <button
              onClick={() => navigate(-1)}
              className="ml-4 mt-4 hidden items-center gap-1.5 text-sm text-ink-2 hover:text-ink md:flex"
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
