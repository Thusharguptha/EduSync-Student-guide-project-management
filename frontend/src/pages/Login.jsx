import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = await login(email, password)
      navigate(`/${user.role}`)
    } catch (e) {
      setError('Invalid credentials')
    }
  }

  return (
    <div 
      className="min-h-screen grid place-items-center p-4 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">EduSync</h1>
          <p className="text-white/80 text-sm">Educational Management System</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white/95 backdrop-blur-xl rounded-2xl px-8 py-8 shadow-2xl border border-white/20"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600 text-sm">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-6 py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
            }}
          >
            Sign In
          </button>
          
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">Don't have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Create Account
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
