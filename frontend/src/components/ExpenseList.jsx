import { useState, useEffect, useCallback } from 'react';
import { listExpenses } from '../services/expenseService.js';
import { CATEGORIES } from '../utils/validators.js';
import ExpenseItem from './ExpenseItem.jsx';

/**
 * ExpenseList — fetches and displays expenses with filters.
 *
 * Props:
 *  - onEdit(expense): callback when user clicks edit on an item
 *  - onDelete(expenseId): callback when user clicks delete on an item
 */
export default function ExpenseList({ onEdit, onDelete }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (categoryFilter) filters.category = categoryFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await listExpenses(filters);
      setExpenses(result?.data || []);
    } catch {
      setError('Erro ao carregar despesas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div>
          <label htmlFor="filter-category" className="block text-xs font-medium text-gray-600 mb-1">
            Categoria
          </label>
          <select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-start" className="block text-xs font-medium text-gray-600 mb-1">
            Data inicial
          </label>
          <input
            id="filter-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="filter-end" className="block text-xs font-medium text-gray-600 mb-1">
            Data final
          </label>
          <input
            id="filter-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <span className="ml-3 text-sm text-gray-500">Carregando despesas...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && expenses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Nenhuma despesa encontrada.</p>
        </div>
      )}

      {/* Expense items */}
      {!loading && expenses.length > 0 && (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <ExpenseItem
              key={exp.expenseId}
              expense={exp}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
