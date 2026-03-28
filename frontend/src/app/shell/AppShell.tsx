import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'

export function AppShell() {
  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
