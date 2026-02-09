import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  const chatPath = user?.role === 'teacher' ? '/teacher/chat' : user?.role === 'student' ? '/student/chat' : null

  return (
    <div 
      className="flex w-full items-center justify-between px-6 py-4 backdrop-blur-xl border-b border-white/10"
      style={{ 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
        color: 'white'
      }}
    >
      <div className="text-xl font-bold tracking-wide text-white">
        EduSync
      </div>
      <div className="flex items-center gap-4 text-sm">
        {chatPath && (
          <Link 
            to={chatPath} 
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
          >
            💬 Chat
          </Link>
        )}
        <div className="flex items-center gap-3 rounded-xl px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="font-medium text-white">{user?.name}</span>
          <span className="text-xs text-white/70 capitalize">({user?.role})</span>
        </div>
        <button
          onClick={logout}
          className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 bg-white text-gray-800 hover:bg-white/90 shadow-lg"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
