import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [auth, setAuth] = useState({ token: null, user: null })

  const login = useCallback(async ({ email, password }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data?.message ?? 'Login failed')
    }

    setAuth({ token: data.token, user: data.user })
    navigate('/dashboard', { replace: true })
  }, [navigate])

  const logout = useCallback(() => {
    setAuth({ token: null, user: null })
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo(() => {
    return {
      token: auth.token,
      user: auth.user,
      role: auth.user?.role,
      isAuthenticated: Boolean(auth.token),
      login,
      logout
    }
  }, [auth.token, auth.user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Helper for injecting Authorization header into future requests
export async function authFetch(token, input, init = {}) {
  const headers = new Headers(init.headers ?? {})
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(input, {
    ...init,
    headers
  })
}

