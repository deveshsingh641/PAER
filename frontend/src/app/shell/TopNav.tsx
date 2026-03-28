import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

function NavLink({
  to,
  label,
}: {
  to: string
  label: string
}) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link
      to={to}
      className={
        active
          ? 'rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white'
          : 'rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200'
      }
    >
      {label}
    </Link>
  )
}

export function TopNav() {
  const { state, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-base font-semibold text-slate-900">
            Passport Services
          </Link>
          <span className="hidden text-sm text-slate-500 sm:inline">Demo redesign</span>
        </div>

        <nav className="flex items-center gap-2">
          {state.status === 'authed' ? (
            <>
              <NavLink to="/dashboard" label="Dashboard" />
              <NavLink to="/start" label="Start application" />
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
