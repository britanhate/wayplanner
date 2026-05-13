import { createContext, useContext, useState } from 'react'
import { USERS } from '../lib/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('wp_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading] = useState(false)

  const login = (email, password) => {
    const found = USERS.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Невірний логін або пароль')
    const u = { id: found.id, name: found.name, color: found.color, avatar: found.avatar }
    setUser(u)
    sessionStorage.setItem('wp_user', JSON.stringify(u))
    return u
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('wp_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
