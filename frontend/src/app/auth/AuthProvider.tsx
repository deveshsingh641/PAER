import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, setToken, type UserSafe } from '../api'
import { AuthContext, type AuthContextValue, type AuthState } from './AuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })

  const refreshMe = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: UserSafe }>('/me')
      setState({ status: 'authed', user: res.user })
    } catch {
      setToken(null)
      setState({ status: 'guest', user: null })
    }
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const loginWithToken = useCallback(
    async (token: string) => {
      setToken(token)
      await refreshMe()
    },
    [refreshMe],
  )

  const logout = useCallback(() => {
    setToken(null)
    setState({ status: 'guest', user: null })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      loginWithToken,
      logout,
      refreshMe,
    }),
    [loginWithToken, logout, refreshMe, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
