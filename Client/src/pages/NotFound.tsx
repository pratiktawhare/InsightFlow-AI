import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button, Card } from '../components/ui/kit'
import { Logo, LogoWord } from '../components/ui/Logo'

export function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-6">
      <Card className="max-w-md text-center">
        <Logo size={44} className="mx-auto" />
        <LogoWord className="mt-4 block text-center" />
        <div className="mt-4 flex items-center justify-center gap-2 text-ink-2">
          <Compass size={16} />
          <p className="text-sm">This page drifted off the transcript.</p>
        </div>
        <Link to="/app" className="mt-6 inline-block">
          <Button variant="primary">Back to dashboard</Button>
        </Link>
      </Card>
    </div>
  )
}
