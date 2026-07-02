import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Store, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../lib/api'
import useAuthStore from '../store/authStore'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      return toast.error("Passwords don't match")
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'STAFF', // self-registered users start as STAFF; admin can promote later
      })
      const { accessToken, user } = res.data.data
      setAuth(accessToken, user)
      toast.success(`Welcome, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">StockPro</h1>
          <p className="text-blue-300 mt-1">Business Inventory & Sales Manager</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Create your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                required
                className="input"
                value={form.name}
                onChange={e => f('name', e.target.value)}
                placeholder="e.g. Rahul Singh"
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email" required
                className="input"
                value={form.email}
                onChange={e => f('email', e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required
                  className="input pr-10"
                  value={form.password}
                  onChange={e => f('password', e.target.value)}
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type={showPwd ? 'text' : 'password'} required
                className="input"
                value={form.confirm}
                onChange={e => f('confirm', e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
