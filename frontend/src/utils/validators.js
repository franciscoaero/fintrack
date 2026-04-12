/**
 * Utilitários de validação para o FinTrack.
 */

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Outros',
];

export const PAYMENT_METHODS = [
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'PIX',
  'Outros',
];

/**
 * Validate expense form data.
 * Returns object of field errors (empty object if valid).
 *
 * Rules:
 * - description: required, non-empty string
 * - amount: required, positive number (in reais, will be converted to centavos)
 * - date: required, valid date string (YYYY-MM-DD)
 * - category: required, must be one of the valid categories
 *
 * @param {object} data - Form data to validate
 * @returns {object} Object mapping field names to error messages (empty if valid)
 */
export function validateExpenseForm(data) {
  const errors = {};

  // description: required, non-empty string
  if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
    errors.description = 'Descrição é obrigatória.';
  }

  // amount: required, positive number
  if (data.amount === undefined || data.amount === null || data.amount === '') {
    errors.amount = 'Valor é obrigatório.';
  } else {
    const numAmount = Number(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Valor deve ser um número positivo.';
    }
  }

  // date: required, valid date string
  if (!data.date || typeof data.date !== 'string' || data.date.trim() === '') {
    errors.date = 'Data é obrigatória.';
  } else {
    // Accept YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.date = 'Data deve estar no formato AAAA-MM-DD.';
    } else {
      const parsed = new Date(data.date + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        errors.date = 'Data inválida.';
      }
    }
  }

  // category: required, must be one of the valid categories
  if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
    errors.category = 'Categoria é obrigatória.';
  } else if (!CATEGORIES.includes(data.category)) {
    errors.category = `Categoria inválida. Opções: ${CATEGORIES.join(', ')}.`;
  }

  return errors;
}
