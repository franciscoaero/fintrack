/**
 * Property-based tests for Brazilian formatting utilities.
 * **Validates: Requirements 2.2**
 *
 * Property 4: Formatação brasileira de valores e datas
 * For any positive integer (centavos) and any valid ISO date (YYYY-MM-DD),
 * formatCurrency must produce a string matching the R$ pattern with comma for decimals,
 * and formatDate must produce a DD/MM/AAAA pattern.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatCurrency, formatDate, parseDateToISO } from '../formatters.js';

describe('Property 4: Formatação brasileira de valores e datas', () => {
  it('formatCurrency produces R$ pattern with comma for decimals for any positive integer (centavos)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999_999_999 }),
        (centavos) => {
          const result = formatCurrency(centavos);

          // Must start with R$ (the locale may insert a non-breaking space)
          expect(result).toMatch(/^R\$/);

          // Must contain a comma separating reais from centavos
          expect(result).toMatch(/,\d{2}$/);

          // Must not contain a dot as decimal separator (dots are thousand separators in pt-BR)
          // The last separator before the two decimal digits must be a comma
          const parts = result.replace(/^R\$\s*/, '');
          const commaIndex = parts.lastIndexOf(',');
          expect(commaIndex).toBeGreaterThan(-1);
          expect(parts.length - commaIndex - 1).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatDate converts valid ISO dates (YYYY-MM-DD) to DD/MM/AAAA pattern', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid day-of-month issues
        (year, month, day) => {
          const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const result = formatDate(iso);

          // Must match DD/MM/AAAA pattern
          expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

          // Verify the components are correctly rearranged
          const [dd, mm, aaaa] = result.split('/');
          expect(dd).toBe(String(day).padStart(2, '0'));
          expect(mm).toBe(String(month).padStart(2, '0'));
          expect(aaaa).toBe(String(year).padStart(4, '0'));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('round-trip: formatDate(parseDateToISO(formatDate(iso))) equals formatDate(iso)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        (year, month, day) => {
          const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const formatted = formatDate(iso);
          const backToISO = parseDateToISO(formatted);
          const reformatted = formatDate(backToISO);

          expect(reformatted).toBe(formatted);
        }
      ),
      { numRuns: 100 }
    );
  });
});
