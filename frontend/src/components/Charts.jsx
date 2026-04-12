import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CATEGORY_COLORS = {
  'Alimentação': '#22c55e',
  'Transporte': '#3b82f6',
  'Moradia': '#a855f7',
  'Saúde': '#ef4444',
  'Lazer': '#eab308',
  'Educação': '#6366f1',
  'Outros': '#6b7280',
};

/**
 * Build pie chart data: group expenses by category and sum amounts.
 */
function buildCategoryData(expenses) {
  const map = {};
  for (const e of expenses) {
    const cat = e.category || 'Outros';
    map[cat] = (map[cat] || 0) + e.amount;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

/**
 * Build bar chart data: group expenses by month (YYYY-MM) and sum amounts.
 */
function buildMonthlyData(expenses) {
  const map = {};
  for (const e of expenses) {
    const month = e.date ? e.date.slice(0, 7) : 'Sem data';
    map[month] = (map[month] || 0) + e.amount;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => {
      const [y, m] = month.split('-');
      const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const label = m ? `${MONTHS[parseInt(m, 10) - 1]}/${y}` : month;
      return { month: label, total };
    });
}

function PieTooltipContent({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  const total = payload[0].payload._total;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  const formatted = (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold">{name}</p>
      <p className="text-gray-600">{formatted} ({pct}%)</p>
    </div>
  );
}

function BarTooltipContent({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const formatted = (payload[0].value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold">{label}</p>
      <p className="text-gray-600">{formatted}</p>
    </div>
  );
}

export default function Charts({ expenses }) {
  if (!expenses || expenses.length === 0) return null;

  const categoryData = buildCategoryData(expenses);
  const totalAmount = categoryData.reduce((s, d) => s + d.value, 0);
  const categoryDataWithTotal = categoryData.map((d) => ({ ...d, _total: totalAmount }));

  const monthlyData = buildMonthlyData(expenses);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie / Donut chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryDataWithTotal}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={2}
            >
              {categoryDataWithTotal.map((entry) => (
                <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltipContent />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução Mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v) => `R$ ${(v / 100).toLocaleString('pt-BR')}`} />
            <Tooltip content={<BarTooltipContent />} />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
