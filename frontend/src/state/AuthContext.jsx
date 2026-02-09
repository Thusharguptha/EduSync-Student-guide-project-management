import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'

const AuthCtx = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const json = localStorage.getItem('user')
    return json ? JSON.parse(json) : null
  })

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, register, logout }), [user])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
