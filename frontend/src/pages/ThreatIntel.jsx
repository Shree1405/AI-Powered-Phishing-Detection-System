import { useState } from 'react'
import { motion } from 'framer-motion'
import { Radar, Search, Globe, Shield, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

export default function ThreatIntel() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/scan/url', { url: url.trim() })
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Radar className="text-[#00d4ff]" size={22} /> Threat Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">Domain reputation & blacklist status</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card-glow rounded-xl p-5"
      >
        <form onSubmit={handleLookup} className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL or domain to investigate..."
            className="scan-input flex-1 px-4 py-3 rounded-lg text-sm"
          />
          <button type="submit" disabled={loading || !url.trim()}
            className="btn-primary px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Lookup
          </button>
        </form>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* ML verdict */}
          <div className={`card-glow rounded-xl p-5 border ${result.prediction === 'Safe' ? 'border-[#00ff8844]' : 'border-[#ff336644]'}`}>
            <div className="flex items-center gap-3">
              {result.prediction === 'Safe'
                ? <Shield size={28} className="text-[#00ff88]" />
                : <AlertTriangle size={28} className="text-[#ff3366]" />
              }
              <div>
                <div className={`text-xl font-bold ${result.prediction === 'Safe' ? 'neon-green' : 'neon-red'}`}>
                  {result.prediction}
                </div>
                <div className="text-xs text-slate-400">ML Risk Score: {result.risk_score}/100</div>
              </div>
            </div>
          </div>

          {/* VirusTotal */}
          {result.virustotal ? (
            <div className="card-glow rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Globe size={14} className="text-[#00d4ff]" /> VirusTotal Intelligence
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'malicious', label: 'Malicious', color: '#ff3366' },
                  { key: 'suspicious', label: 'Suspicious', color: '#f59e0b' },
                  { key: 'harmless', label: 'Harmless', color: '#00ff88' },
                  { key: 'undetected', label: 'Undetected', color: '#64748b' },
                ].map(({ key, label, color }) => (
                  <div key={key} className="rounded-lg p-4 text-center" style={{ background: `${color}11`, border: `1px solid ${color}33` }}>
                    <div className="text-2xl font-bold" style={{ color }}>{result.virustotal[key] ?? 0}</div>
                    <div className="text-xs text-slate-400 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Reputation score: <span className="text-[#00d4ff]">{result.virustotal.reputation ?? 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="card-glow rounded-xl p-5 text-center">
              <Globe size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">VirusTotal API key not configured.</p>
              <p className="text-slate-500 text-xs mt-1">Add VIRUSTOTAL_API_KEY to backend .env to enable live threat intel.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
