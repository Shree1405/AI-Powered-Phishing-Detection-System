import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Scan, Link2, Mail, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../api/client'
import useAuthStore from '../store/authStore'

const COLORS = ['#00ff88', '#ff3366', '#00d4ff']

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-glow rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value ?? '—'}</div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  const pieData = stats ? [
    { name: 'Safe', value: stats.safe_count },
    { name: 'Threats', value: stats.threat_count },
    { name: 'URL Scans', value: stats.url_scans },
  ] : []

  const areaData = stats?.chart_data?.labels?.map((label, i) => ({
    date: label,
    safe: stats.chart_data.safe[i],
    threats: stats.chart_data.threats[i],
  })) || []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, <span className="neon-text">{user?.username}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's your security overview</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Scan} label="Total Scans" value={stats?.total_scans} color="#00d4ff" delay={0.1} />
        <StatCard icon={AlertTriangle} label="Threats" value={stats?.threat_count} color="#ff3366" delay={0.15} />
        <StatCard icon={CheckCircle} label="Safe" value={stats?.safe_count} color="#00ff88" delay={0.2} />
        <StatCard icon={TrendingUp} label="URL Scans" value={stats?.url_scans} color="#a78bfa" delay={0.25} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card-glow rounded-xl p-5 lg:col-span-2"
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-[#00d4ff]" /> 7-Day Scan Activity
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="safe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="threats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f0f2a', border: '1px solid #00d4ff33', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="safe" stroke="#00ff88" fill="url(#safe)" strokeWidth={2} />
              <Area type="monotone" dataKey="threats" stroke="#ff3366" fill="url(#threats)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card-glow rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Scan Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f0f2a', border: '1px solid #00d4ff33', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent scans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="card-glow rounded-xl p-5"
      >
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Shield size={14} className="text-[#00d4ff]" /> Recent Scans
        </h2>
        {loading ? (
          <div className="text-slate-500 text-sm text-center py-8">Loading...</div>
        ) : stats?.recent_scans?.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">No scans yet. Start scanning!</div>
        ) : (
          <div className="space-y-2">
            {stats?.recent_scans?.map((scan) => (
              <div key={scan.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${scan.prediction === 'Safe' ? 'bg-[#00ff88]' : 'bg-[#ff3366]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300 truncate">{scan.target}</div>
                  <div className="text-xs text-slate-500">{scan.scan_type?.toUpperCase()} · {new Date(scan.created_at).toLocaleString()}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  scan.prediction === 'Safe'
                    ? 'text-[#00ff88] border-[#00ff8844] bg-[#00ff8811]'
                    : 'text-[#ff3366] border-[#ff336644] bg-[#ff336611]'
                }`}>
                  {scan.prediction}
                </span>
                <span className="text-xs text-slate-500 w-12 text-right">{scan.risk_score}%</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
