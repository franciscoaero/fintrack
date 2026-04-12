import { useState, useEffect } from 'react';
import { listExpenses } from '../services/expenseService.js';
import { formatCurrency } from '../utils/formatters.js';
import Charts from './Charts.jsx';
import InsightsPanel from './InsightsPanel.jsx';

/**
 * Calculate the total of all expense amounts (in centavos).
 * Exported so it can be tested independently.
 */
export function calculateTotal(expenses) {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getDefaultPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    startDate: `${y}-${m}-01`,
    endDate: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  };
}

export default function Dashboard() {
  const defaultPeriod = getDefaultPeriod();
  const [startDate, setStartDate] = useState(defaultPeriod.startDate);
  const [endDate, setEndDate] = useState(defaultPeriod.endDate);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const res = await listExpenses({ startDate, endDate });
      setExpenses(res.data || []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter(e) {
    e.preventDefault();
    fetchExpenses();
  }

  const total = calculateTotal(expenses);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Period selector */}
      <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          type="submit"
          className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Filtrar
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total no período</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(total)}</p>
          </div>

          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma despesa encontrada no período.</p>
          ) : (
            <>
              <Charts expenses={expenses} />
              <InsightsPanel startDate={startDate} endDate={endDate} expenseCount={expenses.length} />
            </>
          )}
        </>
      )}
    </div>
  );
}
