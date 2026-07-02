import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import StockPage from './pages/StockPage'
import TransactionsPage from './pages/TransactionsPage'
import PaymentsPage from './pages/PaymentsPage'
import ReplacementsPage from './pages/ReplacementsPage'
import ScrapPage from './pages/ScrapPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  const user  = useAuthStore((s) => s.user)
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardPage />} />
          <Route path="stock"         element={<StockPage />} />
          <Route path="transactions"  element={<TransactionsPage />} />
          <Route path="payments"      element={<PaymentsPage />} />
          <Route path="replacements"  element={<ReplacementsPage />} />
          <Route path="scrap"         element={<ScrapPage />} />
          <Route path="reports"       element={<ReportsPage />} />
          <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
