import { useState, useEffect } from 'react';
import { CATEGORIES, PAYMENT_METHODS, validateExpenseForm } from '../utils/validators.js';
import { classifyExpense } from '../services/expenseService.js';

/**
 * ExpenseForm — formulário para criar ou editar despesas.
 *
 * Props:
 *  - expense?: objeto de despesa existente (modo edição)
 *  - initialData?: dados pré-preenchidos (ex.: OCR)
 *  - onSubmit(expenseInput): callback ao salvar
 *  - onCancel(): callback ao cancelar
 */
export default function ExpenseForm({ expense, initialData, onSubmit, onCancel }) {
  const isEdit = Boolean(expense);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from expense (edit mode) or initialData (OCR)
  useEffect(() => {
    if (expense) {
      setDescription(expense.description || '');
      setAmount(expense.amount != null ? (expense.amount / 100).toFixed(2).replace('.', ',') : '');
      setDate(expense.date || '');
      setCategory(expense.category || '');
      setPaymentMethod(expense.paymentMethod || '');
    } else if (initialData) {
      setDescription(initialData.description || '');
      setAmount(
        initialData.amount != null
          ? (initialData.amount / 100).toFixed(2).replace('.', ',')
          : ''
      );
      setDate(initialData.date || '');
      setCategory(initialData.category || '');
      setPaymentMethod(initialData.paymentMethod || '');
    }
  }, [expense, initialData]);

  /**
   * Parse user-typed reais value ("42,50" or "42.50") to centavos integer.
   */
  function parseAmountToCents(raw) {
    const normalized = raw.replace(',', '.');
    const num = parseFloat(normalized);
    if (isNaN(num)) return NaN;
    return Math.round(num * 100);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const amountCents = parseAmountToCents(amount);

      // Build form data for validation (amount in reais for the validator)
      const formData = {
        description: description.trim(),
        amount: isNaN(amountCents) ? '' : amountCents / 100,
        date,
        category,
      };

      const validationErrors = validateExpenseForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setSubmitting(false);
        return;
      }

      // If creating and category is empty, ask AI for suggestion
      let finalCategory = category;
      if (!isEdit && !category) {
        try {
          const result = await classifyExpense(description.trim());
          finalCategory = result?.data?.category || 'Outros';
          setCategory(finalCategory);
        } catch {
          finalCategory = 'Outros';
        }
      }

      const expenseInput = {
        description: description.trim(),
        amount: amountCents,
        date,
        category: finalCategory || category,
      };
      if (paymentMethod) {
        expenseInput.paymentMethod = paymentMethod;
      }

      await onSubmit(expenseInput);
      setSuccessMsg('Despesa salva com sucesso!');

      // Clear form if creating
      if (!isEdit) {
        setDescription('');
        setAmount('');
        setDate('');
        setCategory('');
        setPaymentMethod('');
      }
    } catch {
      setErrors({ _form: 'Erro ao salvar despesa. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Success toast */}
      {successMsg && (
        <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      {/* General form error */}
      {errors._form && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
          {errors._form}
        </div>
      )}

      {/* Descrição */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Supermercado, Uber, Aluguel..."
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.description ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Valor */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Valor (R$)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.amount ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
        )}
      </div>

      {/* Data */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Data
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.date ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-xs text-red-600">{errors.date}</p>
        )}
      </div>

      {/* Categoria */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Categoria
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.category ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
          }`}
        >
          <option value="">Selecione uma categoria</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-xs text-red-600">{errors.category}</p>
        )}
      </div>

      {/* Método de Pagamento (opcional) */}
      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
          Método de Pagamento <span className="text-gray-400">(opcional)</span>
        </label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Nenhum</option>
          {PAYMENT_METHODS.map((pm) => (
            <option key={pm} value={pm}>{pm}</option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Salvando...' : isEdit ? 'Atualizar' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
