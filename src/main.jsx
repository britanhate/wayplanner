import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider, useAuth } from './lib/AuthContext'
import App from './pages/App'
import Login from './pages/Login'
import './styles/global.css'

function Root() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">⏳</div>
  return user ? <App /> : <Login />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>
)
