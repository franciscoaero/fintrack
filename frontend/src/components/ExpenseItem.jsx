import { formatCurrency, formatDate } from '../utils/formatters.js';

/**
 * Category badge color mapping.
 */
const CATEGORY_COLORS = {
  'Alimentação': 'bg-green-100 text-green-800',
  'Transporte': 'bg-blue-100 text-blue-800',
  'Moradia': 'bg-purple-100 text-purple-800',
  'Saúde': 'bg-red-100 text-red-800',
  'Lazer': 'bg-yellow-100 text-yellow-800',
  'Educação': 'bg-indigo-100 text-indigo-800',
  'Outros': 'bg-gray-100 text-gray-800',
};

/**
 * ExpenseItem — displays a single expense row.
 *
 * Props:
 *  - expense: the expense object
 *  - onEdit(expense): callback when edit is clicked
 *  - onDelete(expenseId): callback when delete is clicked
 */
export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const badgeClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS['Outros'];

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm font-semibold text-gray-700">
            {formatCurrency(expense.amount)}
          </span>
          <span className="text-xs text-gray-500">{formatDate(expense.date)}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
            {expense.category}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        <button
          onClick={() => onEdit(expense)}
          className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
          title="Editar despesa"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(expense.expenseId)}
          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
          title="Excluir despesa"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
