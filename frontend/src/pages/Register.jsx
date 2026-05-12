import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.access_token, data.user)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-[#00ff88] opacity-5 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card-glow rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#00ff8822] border border-[#00ff8844] flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-[#00ff88]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 text-sm mt-1">Join PhishGuard today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'username', label: 'Username', type: 'text', placeholder: 'johndoe' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="scan-input w-full px-4 py-3 rounded-lg text-sm"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00d4ff] hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
