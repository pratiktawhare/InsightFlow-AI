import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { FullPageLoader } from './components/ui/kit'

const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const NewMeeting = lazy(() => import('./pages/NewMeeting').then((m) => ({ default: m.NewMeeting })))
const MeetingDetail = lazy(() => import('./pages/MeetingDetail').then((m) => ({ default: m.MeetingDetail })))
const TasksPage = lazy(() => import('./pages/TasksPage').then((m) => ({ default: m.TasksPage })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="new" element={<NewMeeting />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="meetings/:id" element={<MeetingDetail />} />
          </Route>
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
