/**
 * Utilitários de formatação para o FinTrack.
 * Converte valores e datas entre formatos internos (centavos, ISO) e formato brasileiro.
 */

/**
 * Convert amount in centavos to Brazilian currency format.
 * Example: 4250 → "R$ 42,50"
 * Example: 1234567 → "R$ 12.345,67"
 * @param {number} amountInCents - Valor em centavos (inteiro)
 * @returns {string} Valor formatado em R$
 */
export function formatCurrency(amountInCents) {
  const reais = amountInCents / 100;
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Convert ISO date (YYYY-MM-DD) to Brazilian format (DD/MM/AAAA).
 * Example: "2024-03-15" → "15/03/2024"
 * @param {string} isoDate - Data no formato YYYY-MM-DD
 * @returns {string} Data no formato DD/MM/AAAA
 */
export function formatDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}

/**
 * Convert Brazilian date (DD/MM/AAAA) to ISO format (YYYY-MM-DD).
 * Example: "15/03/2024" → "2024-03-15"
 * @param {string} brDate - Data no formato DD/MM/AAAA
 * @returns {string} Data no formato YYYY-MM-DD
 */
export function parseDateToISO(brDate) {
  if (!brDate || typeof brDate !== 'string') return '';
  const [day, month, year] = brDate.split('/');
  if (!day || !month || !year) return '';
  return `${year}-${month}-${day}`;
}
