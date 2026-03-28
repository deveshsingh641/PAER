import { createContext } from 'react'
import type { UserSafe } from '../api'

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'guest'; user: null }
  | { status: 'authed'; user: UserSafe }

export type AuthContextValue = {
  state: AuthState
  loginWithToken: (token: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
