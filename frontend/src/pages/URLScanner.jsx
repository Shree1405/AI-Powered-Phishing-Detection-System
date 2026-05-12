import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Search, Shield, AlertTriangle, CheckCircle, Loader2, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

function RiskMeter({ score }) {
  const color = score >= 60 ? '#ff3366' : score >= 30 ? '#f59e0b' : '#00ff88'
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Risk Score</span>
        <span style={{ color }} className="font-bold">{score}/100</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #00ff88, ${color})` }}
        />
      </div>
    </div>
  )
}

function FeatureRow({ label, value, good }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-mono ${good ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>{String(value)}</span>
    </div>
  )
}

export default function URLScanner() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/scan/url', { url: url.trim() })
      setResult(data)
      toast[data.prediction === 'Safe' ? 'success' : 'error'](
        `${data.prediction} — Risk: ${data.risk_score}%`
      )
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    if (result?.scan_id) window.open(`/api/v1/report/scan/${result.scan_id}/pdf`, '_blank')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Link2 className="text-[#00d4ff]" size={22} /> URL Scanner
        </h1>
        <p className="text-slate-400 text-sm mt-1">Analyze any URL for phishing indicators</p>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card-glow rounded-xl p-5"
      >
        <form onSubmit={handleScan} className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com or paste any suspicious URL..."
            className="scan-input flex-1 px-4 py-3 rounded-lg text-sm"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </form>

        {/* Quick examples */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">Try:</span>
          {['https://google.com', 'http://192.168.1.1/login/verify', 'http://paypal-secure-login.xyz'].map((ex) => (
            <button key={ex} onClick={() => setUrl(ex)}
              className="text-xs text-[#00d4ff] hover:underline opacity-70 hover:opacity-100 transition-opacity">
              {ex.length > 40 ? ex.slice(0, 40) + '…' : ex}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Loading animation */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glow rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#00d4ff] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#00d4ff] text-sm">Analyzing URL features...</p>
          <p className="text-slate-500 text-xs mt-1">Running ML model & threat checks</p>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Verdict */}
            <div className={`card-glow rounded-xl p-6 border ${
              result.prediction === 'Safe'
                ? 'border-[#00ff8844]'
                : 'border-[#ff336644]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {result.prediction === 'Safe'
                    ? <CheckCircle size={32} className="text-[#00ff88]" />
                    : <AlertTriangle size={32} className="text-[#ff3366]" />
                  }
                  <div>
                    <div className={`text-2xl font-bold ${result.prediction === 'Safe' ? 'neon-green' : 'neon-red'}`}>
                      {result.prediction}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Confidence: {(result.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <button onClick={downloadPDF}
                  className="btn-primary px-3 py-2 rounded-lg text-xs flex items-center gap-1.5">
                  <Download size={12} /> PDF
                </button>
              </div>
              <RiskMeter score={result.risk_score} />
              <div className="mt-3 text-xs text-slate-500 font-mono break-all">{result.url}</div>
            </div>

            {/* Features */}
            <div className="card-glow rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Shield size={14} className="text-[#00d4ff]" /> Feature Analysis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <FeatureRow label="HTTPS" value={result.features.has_https ? 'Yes ✓' : 'No ✗'} good={result.features.has_https} />
                <FeatureRow label="IP in URL" value={result.features.has_ip ? 'Yes ✗' : 'No ✓'} good={!result.features.has_ip} />
                <FeatureRow label="URL Length" value={result.features.url_length} good={result.features.url_length < 75} />
                <FeatureRow label="Subdomains" value={result.features.num_subdomains} good={result.features.num_subdomains <= 2} />
                <FeatureRow label="Suspicious Keywords" value={result.features.suspicious_keyword_count} good={result.features.suspicious_keyword_count === 0} />
                <FeatureRow label="@ Signs" value={result.features.num_at_signs} good={result.features.num_at_signs === 0} />
                <FeatureRow label="Dots" value={result.features.num_dots} good={result.features.num_dots <= 3} />
                <FeatureRow label="Hyphens in Domain" value={result.features.prefix_suffix_domain ? 'Yes' : 'No'} good={!result.features.prefix_suffix_domain} />
              </div>
            </div>

            {/* VirusTotal */}
            {result.virustotal && (
              <div className="card-glow rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">VirusTotal Results</h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {Object.entries(result.virustotal).filter(([k]) => k !== 'reputation').map(([k, v]) => (
                    <div key={k} className="bg-white/5 rounded-lg p-3">
                      <div className={`text-lg font-bold ${k === 'malicious' && v > 0 ? 'text-[#ff3366]' : 'text-[#00ff88]'}`}>{v}</div>
                      <div className="text-xs text-slate-500 capitalize">{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
