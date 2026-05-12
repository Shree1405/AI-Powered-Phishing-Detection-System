import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Users, Scan, AlertTriangle, CheckCircle, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card-glow rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <div className="text-xl font-bold text-white">{value ?? '—'}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [scans, setScans] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('scans')

  const loadStats = () => api.get('/admin/stats').then(({ data }) => setStats(data))
  const loadScans = () => api.get('/admin/scans?limit=30').then(({ data }) => setScans(data.scans))
  const loadUsers = () => api.get('/admin/users').then(({ data }) => setUsers(data.users))

  useEffect(() => {
    loadStats()
    loadScans()
    loadUsers()
  }, [])

  const deleteScan = async (id) => {
    try {
      await api.delete(`/admin/scans/${id}`)
      toast.success('Scan deleted')
      setScans((s) => s.filter((x) => x.id !== id))
      loadStats()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-[#ff3366]" size={22} /> Admin Panel
        </h1>
        <p className="text-slate-400 text-sm mt-1">System-wide monitoring & management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Scan} label="Total Scans" value={stats?.total_scans} color="#00d4ff" />
        <StatCard icon={Users} label="Users" value={stats?.total_users} color="#a78bfa" />
        <StatCard icon={AlertTriangle} label="Phishing" value={stats?.phishing_count} color="#ff3366" />
        <StatCard icon={CheckCircle} label="Safe" value={stats?.safe_count} color="#00ff88" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['scans', 'users'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
              tab === t ? 'bg-[#00d4ff22] text-[#00d4ff] border border-[#00d4ff44]' : 'text-slate-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
        <button onClick={() => { loadScans(); loadUsers(); loadStats() }}
          className="ml-auto btn-primary px-3 py-2 rounded-lg text-xs flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Scans table */}
      {tab === 'scans' && (
        <div className="card-glow rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Target</th>
                <th className="text-left p-4">Result</th>
                <th className="text-left p-4">Risk</th>
                <th className="text-left p-4">Date</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-4 text-xs text-slate-400">{scan.username}</td>
                  <td className="p-4 text-xs text-slate-400 uppercase">{scan.scan_type}</td>
                  <td className="p-4 max-w-xs">
                    <span className="text-xs font-mono text-slate-300 truncate block">{scan.target}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      scan.prediction === 'Safe' ? 'text-[#00ff88] border-[#00ff8844] bg-[#00ff8811]'
                      : 'text-[#ff3366] border-[#ff336644] bg-[#ff336611]'
                    }`}>{scan.prediction}</span>
                  </td>
                  <td className="p-4 text-xs text-slate-400">{scan.risk_score}%</td>
                  <td className="p-4 text-xs text-slate-500">
                    {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4">
                    <button onClick={() => deleteScan(scan.id)}
                      className="text-slate-600 hover:text-[#ff3366] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users table */}
      {tab === 'users' && (
        <div className="card-glow rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left p-4">Username</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Scans</th>
                <th className="text-left p-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-4 text-sm text-white">{user.username}</td>
                  <td className="p-4 text-xs text-slate-400">{user.email}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      user.role === 'admin'
                        ? 'text-[#ff3366] border-[#ff336644] bg-[#ff336611]'
                        : 'text-[#00d4ff] border-[#00d4ff44] bg-[#00d4ff11]'
                    }`}>{user.role}</span>
                  </td>
                  <td className="p-4 text-xs text-slate-400">{user.scan_count}</td>
                  <td className="p-4 text-xs text-slate-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
