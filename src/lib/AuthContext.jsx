import { createContext, useContext, useState } from 'react'
import { USERS } from '../lib/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('wp_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading] = useState(false)

  const login = (email) => {
    const found = USERS.find((u) => u.email === email);
    if (!found) throw new Error('Невірний логін або пароль')
    const u = { id: found.id, name: found.name, color: found.color, avatar: found.avatar }
    setUser(u)
    sessionStorage.setItem('wp_user', JSON.stringify(u))
    return u
  }

  const loginAsUser = (userId) => {
    const found = USERS.find((u) => u.id === userId);
    if (!found) throw new Error("Користувача не знайдено");
    return login(found.email);
  };

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('wp_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, loginAsUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
