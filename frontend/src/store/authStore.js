import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('accessToken') || null,

  setAuth: (token, user) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  isAdmin:   () => useAuthStore.getState().user?.role === 'ADMIN',
  isManager: () => ['ADMIN','MANAGER'].includes(useAuthStore.getState().user?.role),
}))

export default useAuthStore
