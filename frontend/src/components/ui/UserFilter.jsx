import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { userApi } from '../../lib/api'
import useAuthStore from '../../store/authStore'

/**
 * Admin-only "Filter by User" dropdown.
 * Renders nothing for non-admin users (they only ever see their own data,
 * enforced server-side regardless of this control).
 *
 * @param {string|number} value - currently selected userId, or '' for "All Users"
 * @param {function} onChange - called with the new userId (or '' for all)
 */
export default function UserFilter({ value, onChange }) {
  const user = useAuthStore(s => s.user)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    userApi.list()
      .then(r => setUsers(r.data.data || []))
      .finally(() => setLoading(false))
  }, [user])

  if (user?.role !== 'ADMIN') return null

  return (
    <div className="relative">
      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <select
        className="input pl-9 w-48"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">All Users (Company-wide)</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.name} {u.id === user.id ? '(You)' : ''} — {u.role}
          </option>
        ))}
      </select>
    </div>
  )
}
