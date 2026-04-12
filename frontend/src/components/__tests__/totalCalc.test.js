import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateTotal } from '../Dashboard.jsx';

/**
 * Property 12: Total de despesas é a soma dos valores
 * **Validates: Requirements 7.3**
 *
 * For any set of expenses, the calculated total must be exactly
 * equal to the sum of all `amount` fields.
 */
describe('Property 12: Total de despesas é a soma dos valores', () => {
  const expenseArb = fc.record({
    expenseId: fc.uuid(),
    description: fc.string({ minLength: 1 }),
    amount: fc.integer({ min: 1, max: 99_999_99 }),
    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .map((d) => d.toISOString().slice(0, 10)),
    category: fc.constantFrom(
      'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Outros'
    ),
  });

  it('calculateTotal equals the sum of all amount fields', () => {
    fc.assert(
      fc.property(
        fc.array(expenseArb, { minLength: 0, maxLength: 50 }),
        (expenses) => {
          const expected = expenses.reduce((sum, e) => sum + e.amount, 0);
          const result = calculateTotal(expenses);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 for an empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('returns the single amount for a one-element array', () => {
    fc.assert(
      fc.property(
        expenseArb,
        (expense) => {
          expect(calculateTotal([expense])).toBe(expense.amount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
