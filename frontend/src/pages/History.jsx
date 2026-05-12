import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { History as HistoryIcon, Download, Link2, Mail, RefreshCw } from 'lucide-react'
import api from '../api/client'

export default function History() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/scan/history?limit=50')
      .then(({ data }) => setScans(data.scans))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="text-[#00d4ff]" size={22} /> Scan History
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your recent scans</p>
        </div>
        <button onClick={load} className="btn-primary px-3 py-2 rounded-lg text-xs flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="card-glow rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No scans yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Target</th>
                <th className="text-left p-4">Result</th>
                <th className="text-left p-4">Risk</th>
                <th className="text-left p-4">Date</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {scans.map((scan, i) => (
                <motion.tr
                  key={scan.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      {scan.scan_type === 'url' ? <Link2 size={12} /> : <Mail size={12} />}
                      {scan.scan_type?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <span className="text-slate-300 text-xs font-mono truncate block">{scan.target}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      scan.prediction === 'Safe'
                        ? 'text-[#00ff88] border-[#00ff8844] bg-[#00ff8811]'
                        : scan.prediction === 'Suspicious'
                        ? 'text-[#f59e0b] border-[#f59e0b44] bg-[#f59e0b11]'
                        : 'text-[#ff3366] border-[#ff336644] bg-[#ff336611]'
                    }`}>
                      {scan.prediction}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${scan.risk_score}%`,
                            background: scan.risk_score >= 60 ? '#ff3366' : scan.risk_score >= 30 ? '#f59e0b' : '#00ff88'
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{scan.risk_score}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => window.open(`/api/v1/report/scan/${scan.id}/pdf`, '_blank')}
                      className="text-slate-500 hover:text-[#00d4ff] transition-colors"
                      title="Download PDF"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
