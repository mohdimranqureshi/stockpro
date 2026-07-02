import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, UserCheck, UserX, Shield, Trash2, KeyRound } from 'lucide-react'
import { userApi } from '../lib/api'
import { Modal, Badge, Spinner, EmptyState, ConfirmDialog } from '../components/ui'
import useAuthStore from '../store/authStore'

const ROLES = ['STAFF', 'MANAGER', 'ADMIN']
const EMPTY = { name: '', email: '', password: '', role: 'STAFF' }

export default function UsersPage() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const currentUser = useAuthStore(s => s.user)

  const load = useCallback(() => {
    setLoading(true)
    userApi.list()
      .then(r => setUsers(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setSaving(true)
    try {
      await userApi.create(form)
      toast.success('User created')
      setModal(false); setForm(EMPTY); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const toggleActive = async (id, active) => {
    try {
      await userApi.toggleActive(id)
      toast.success(active ? 'User disabled' : 'User enabled')
      load()
    } catch (e) { toast.error('Failed') }
  }

  const changeRole = async (id, role) => {
    try {
      await userApi.changeRole(id, role)
      toast.success('Role updated')
      load()
    } catch (e) { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    try {
      await userApi.delete(id)
      toast.success('User deleted')
      setConfirmDelete(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
  }

  const handleResetPassword = async () => {
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    try {
      await userApi.resetPassword(resetUser.id, newPassword)
      toast.success(`Password reset for ${resetUser.name}`)
      setResetUser(null); setNewPassword('')
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h =>
                  <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6}><Spinner /></td></tr>
              : users.length === 0 ? <tr><td colSpan={6}><EmptyState /></td></tr>
              : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{u.name}</td>
                  <td className="table-td text-gray-500">{u.email}</td>
                  <td className="table-td">
                    {u.id === currentUser?.id
                      ? <Badge label={u.role} />
                      : (
                        <select
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )
                    }
                  </td>
                  <td className="table-td">
                    <Badge label={u.active ? 'AVAILABLE' : 'SCRAPPED'} />
                    <span className="ml-1 text-xs text-gray-400">{u.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="table-td text-xs text-gray-400">{u.createdAt?.slice(0,10)}</td>
                  <td className="table-td">
                    {u.id !== currentUser?.id && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => toggleActive(u.id, u.active)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-medium transition-colors ${
                            u.active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.active ? <><UserX className="w-3 h-3" /> Disable</> : <><UserCheck className="w-3 h-3" /> Enable</>}
                        </button>
                        <button
                          onClick={() => { setResetUser(u); setNewPassword('') }}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <KeyRound className="w-3 h-3" /> Reset Password
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded font-medium bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Create New User" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Rahul Singh" />
            </div>
            <div>
              <label className="label">Email (Username) *</label>
              <input className="input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="user@stockpro.com" />
            </div>
            <div>
              <label className="label">Password *</label>
              <input className="input" type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => f('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              <Shield className="w-3.5 h-3.5 inline mr-1" />
              <strong>ADMIN</strong> — full access including delete & user management<br />
              <strong>MANAGER</strong> — can create/edit all records<br />
              <strong>STAFF</strong> — read + create, no delete
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
              Share the email and password with this user so they can sign in directly —
              no need for them to self-register.
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </Modal>
      )}

      {resetUser && (
        <Modal title={`Reset Password — ${resetUser.name}`} onClose={() => setResetUser(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500">
              Share this new password with <strong>{resetUser.email}</strong> so they can log back in.
            </p>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setResetUser(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleResetPassword} className="btn-primary">Reset Password</button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete user "${confirmDelete.name}" (${confirmDelete.email})? This cannot be undone.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
