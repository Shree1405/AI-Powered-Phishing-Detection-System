import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import URLScanner from './pages/URLScanner'
import EmailScanner from './pages/EmailScanner'
import ThreatIntel from './pages/ThreatIntel'
import History from './pages/History'
import AdminPanel from './pages/AdminPanel'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0f0f2a', color: '#e2e8f0', border: '1px solid #00d4ff33' },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="url-scanner" element={<URLScanner />} />
          <Route path="email-scanner" element={<EmailScanner />} />
          <Route path="threat-intel" element={<ThreatIntel />} />
          <Route path="history" element={<History />} />
          <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        </Route>
      </Routes>
    </>
  )
}
