import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, LayoutDashboard, Link2, Mail, Radar,
  History, Settings, LogOut, ChevronRight
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/url-scanner', icon: Link2, label: 'URL Scanner' },
  { to: '/email-scanner', icon: Mail, label: 'Email Scanner' },
  { to: '/threat-intel', icon: Radar, label: 'Threat Intel' },
  { to: '/history', icon: History, label: 'Scan History' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden grid-bg">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 flex flex-col card-glow border-r border-[#00d4ff22] z-10"
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#00d4ff22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00d4ff22] border border-[#00d4ff44] flex items-center justify-center">
              <Shield size={20} className="text-[#00d4ff]" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">PhishGuard</div>
              <div className="text-[10px] text-[#00d4ff] tracking-widest uppercase">AI Security</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                  isActive
                    ? 'bg-[#00d4ff22] text-[#00d4ff] border border-[#00d4ff44]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
              <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mt-2 ${
                  isActive
                    ? 'bg-[#ff336622] text-[#ff3366] border border-[#ff336644]'
                    : 'text-slate-400 hover:text-[#ff3366] hover:bg-[#ff336611]'
                }`
              }
            >
              <Settings size={16} />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#00d4ff22]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#00ff88] flex items-center justify-center text-black font-bold text-xs">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.username}</div>
              <div className="text-xs text-slate-500 truncate">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-[#ff3366] hover:bg-[#ff336611] transition-all"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
