import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom'
import Dashboard from './components/Dashboard.jsx'
import ExpenseList from './components/ExpenseList.jsx'
import ExpenseForm from './components/ExpenseForm.jsx'
import ReceiptUpload from './components/ReceiptUpload.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import {
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
} from './services/expenseService.js'

/* ------------------------------------------------------------------ */
/*  Toast helper                                                       */
/* ------------------------------------------------------------------ */
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-300 text-green-800 px-5 py-3 rounded-lg shadow-lg text-sm animate-fade-in">
      {message}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ExpensesPage — /expenses                                           */
/* ------------------------------------------------------------------ */
function ExpensesPage() {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [toast, setToast] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  function handleEdit(expense) {
    navigate(`/expenses/${expense.expenseId}/edit`)
  }

  function handleDeleteClick(expenseId) {
    setPendingDeleteId(expenseId)
    setConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return
    try {
      await deleteExpense(pendingDeleteId)
      setToast('Despesa excluída com sucesso!')
      setRefreshKey((k) => k + 1)
    } catch {
      setToast('Erro ao excluir despesa.')
    } finally {
      setConfirmOpen(false)
      setPendingDeleteId(null)
    }
  }

  function handleCancelDelete() {
    setConfirmOpen(false)
    setPendingDeleteId(null)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Despesas</h1>
        <button
          onClick={() => navigate('/expenses/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Nova Despesa
        </button>
      </div>

      <ExpenseList
        key={refreshKey}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Excluir Despesa"
        message="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  NewExpensePage — /expenses/new                                     */
/* ------------------------------------------------------------------ */
function NewExpensePage() {
  const navigate = useNavigate()
  const [ocrData, setOcrData] = useState(null)

  function handleOcrExtracted(data) {
    setOcrData(data)
  }

  function handleOcrError() {
    // User can fill manually — no blocking action needed
  }

  async function handleSubmit(expenseInput) {
    // Attach receiptKey from OCR if available
    const payload = ocrData?.receiptKey
      ? { ...expenseInput, receiptKey: ocrData.receiptKey }
      : expenseInput
    await createExpense(payload)
    navigate('/expenses')
  }

  function handleCancel() {
    navigate('/expenses')
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nova Despesa</h1>

      {/* Optional receipt upload */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          📷 Comprovante (opcional)
        </h2>
        <ReceiptUpload
          onDataExtracted={handleOcrExtracted}
          onError={handleOcrError}
        />
      </div>

      {/* Expense form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <ExpenseForm
          initialData={ocrData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  EditExpensePage — /expenses/:id/edit                               */
/* ------------------------------------------------------------------ */
function EditExpensePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expense, setExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchExpense = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getExpense(id)
      const data = result?.data
      if (!data) {
        setError('Despesa não encontrada.')
      } else {
        setExpense(data)
      }
    } catch {
      setError('Erro ao carregar despesa.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchExpense()
  }, [fetchExpense])

  async function handleSubmit(expenseInput) {
    await updateExpense(id, expenseInput)
    navigate('/expenses')
  }

  function handleCancel() {
    navigate('/expenses')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <span className="ml-3 text-sm text-gray-500">Carregando despesa...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
        <button
          onClick={() => navigate('/expenses')}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Voltar para Despesas
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Editar Despesa</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <ExpenseForm
          expense={expense}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Navigation items                                                   */
/* ------------------------------------------------------------------ */
const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/expenses', label: 'Despesas', icon: '💰' },
  { to: '/expenses/new', label: 'Nova Despesa', icon: '➕' },
]

/* ------------------------------------------------------------------ */
/*  App — root layout with sidebar + routes                            */
/* ------------------------------------------------------------------ */
export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">💲 FinTrack</h1>
          <p className="text-xs text-gray-400 mt-1">Gerenciador de Despesas</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/expenses'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
          FinTrack MVP &copy; {new Date().getFullYear()}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/new" element={<NewExpensePage />} />
          <Route path="/expenses/:id/edit" element={<EditExpensePage />} />
        </Routes>
      </main>
    </div>
  )
}
