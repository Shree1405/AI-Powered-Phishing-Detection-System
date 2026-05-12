import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Search, AlertTriangle, CheckCircle, Loader2, Download, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const SAMPLE_PHISHING = `Dear Customer,

URGENT: Your account has been suspended due to unusual activity!

Please verify your account IMMEDIATELY by clicking the link below:
http://192.168.1.1/paypal-login/verify?token=abc123

Enter your password, credit card number, and social security number to confirm your identity.

This is your FINAL NOTICE. Failure to act within 24 hours will result in permanent account closure.

Click here: http://bit.ly/secure-verify-now`

export default function EmailScanner() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/scan/email', { content: content.trim() })
      setResult(data)
      toast[data.prediction === 'Safe' ? 'success' : 'error'](
        `${data.prediction} — Risk: ${data.risk_percentage}%`
      )
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = result
    ? result.risk_percentage >= 60 ? '#ff3366'
    : result.risk_percentage >= 30 ? '#f59e0b'
    : '#00ff88'
    : '#00d4ff'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mail className="text-[#00d4ff]" size={22} /> Email Scanner
        </h1>
        <p className="text-slate-400 text-sm mt-1">Detect phishing patterns in email content</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card-glow rounded-xl p-5"
      >
        <form onSubmit={handleScan} className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Email Content</label>
            <button type="button" onClick={() => setContent(SAMPLE_PHISHING)}
              className="text-xs text-[#00d4ff] hover:underline opacity-70 hover:opacity-100">
              Load sample phishing email
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste email content here..."
            rows={10}
            className="scan-input w-full px-4 py-3 rounded-lg text-sm resize-none font-mono"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{content.length} characters</span>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Analyzing...' : 'Analyze Email'}
            </button>
          </div>
        </form>
      </motion.div>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glow rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#00d4ff] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#00d4ff] text-sm">Scanning for phishing patterns...</p>
        </motion.div>
      )}

      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Verdict */}
            <div className="card-glow rounded-xl p-6" style={{ borderColor: `${riskColor}44` }}>
              <div className="flex items-center gap-4 mb-5">
                {result.prediction === 'Safe'
                  ? <CheckCircle size={36} className="text-[#00ff88]" />
                  : <AlertTriangle size={36} style={{ color: riskColor }} />
                }
                <div>
                  <div className="text-2xl font-bold" style={{ color: riskColor }}>{result.prediction}</div>
                  <div className="text-xs text-slate-400">Risk: {result.risk_percentage}%</div>
                </div>
              </div>

              {/* Risk bar */}
              <div className="space-y-1.5 mb-4">
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.risk_percentage}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, #00ff88, ${riskColor})` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Safe</span><span>Suspicious</span><span>Phishing</span>
                </div>
              </div>

              {/* Explanation */}
              <div className="flex gap-2 p-3 rounded-lg bg-white/5 text-sm text-slate-300">
                <Info size={14} className="text-[#00d4ff] flex-shrink-0 mt-0.5" />
                <span>{result.explanation}</span>
              </div>
            </div>

            {/* Detected patterns */}
            {result.detected_patterns?.length > 0 && (
              <div className="card-glow rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#f59e0b]" />
                  Detected Indicators ({result.detected_patterns.length})
                </h3>
                <div className="space-y-2">
                  {result.detected_patterns.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-[#ff336611] border border-[#ff336622]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3366] mt-1.5 flex-shrink-0" />
                      <span className="text-xs text-slate-300">{p}</span>
                    </motion.div>
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
