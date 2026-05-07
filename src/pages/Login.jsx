import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { USERS } from '../lib/constants'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      login(email, password)
    } catch (err) {
      setError(err.message)
    }
  }

  const quickLogin = (user) => {
    try { login(user.email, user.password) } catch (err) { setError(err.message) }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">
          <span className="login-logo-dot" />
          WayPlanner
        </div>
        <div className="login-subtitle">Спільне планування подорожей</div>

        <div className="quick-users">
          {USERS.map(u => (
            <button key={u.id} className="quick-user-btn" onClick={() => quickLogin(u)}
              style={{ borderColor: u.color }}>
              <span>{u.avatar}</span>
              <span>{u.name}</span>
            </button>
          ))}
        </div>

        <div className="login-divider"><span>або вручну</span></div>

        <form onSubmit={handleSubmit} className="login-form">
          <input className="login-inp" type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="login-inp" type="password" placeholder="Пароль"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" type="submit">Увійти</button>
        </form>

        <div className="login-hint">
          {USERS.map(u => (
            <div key={u.id}>
              <b>{u.name}:</b> {u.email} / {u.password}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
