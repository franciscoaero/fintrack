import { useState } from 'react';
import { getInsights } from '../services/expenseService.js';

/**
 * Render insight text with basic bold formatting (**text**).
 */
function renderInsightText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function InsightsPanel({ startDate, endDate, expenseCount }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    if (expenseCount < 3) return;

    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const res = await getInsights(startDate, endDate);
      setInsights(res.data?.insights || res.data?.text || '');
    } catch {
      setError('Insights temporariamente indisponíveis.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Insights com IA</h3>
        <button
          onClick={handleGenerate}
          disabled={loading || expenseCount < 3}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Gerando...' : 'Gerar Insights'}
        </button>
      </div>

      {expenseCount < 3 && (
        <p className="text-amber-600 text-sm">
          São necessários pelo menos 3 registros para gerar análises.
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {insights && !loading && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {renderInsightText(insights)}
        </div>
      )}
    </div>
  );
}
