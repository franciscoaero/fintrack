import { Routes, Route, NavLink } from 'react-router-dom'

// Placeholder pages — will be replaced by real components in later tasks
function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="mt-2 text-gray-500">Visão geral das suas despesas.</p>
    </div>
  )
}

function ExpensesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800">Despesas</h1>
      <p className="mt-2 text-gray-500">Lista de todas as despesas registradas.</p>
    </div>
  )
}

function NewExpensePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800">Nova Despesa</h1>
      <p className="mt-2 text-gray-500">Registre uma nova despesa.</p>
    </div>
  )
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/expenses', label: 'Despesas', icon: '💰' },
  { to: '/expenses/new', label: 'Nova Despesa', icon: '➕' },
]

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
              end={to === '/'}
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/new" element={<NewExpensePage />} />
        </Routes>
      </main>
    </div>
  )
}
