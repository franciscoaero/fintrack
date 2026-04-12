/**
 * Property-based tests for mock service independence.
 * **Validates: Requirements 10.3, 10.4**
 *
 * Property 14: Modo mock opera independentemente do backend
 * For any service operation (list, create, update, delete), when mock mode is active,
 * the operation must be resolved using local mock data without making any HTTP calls.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// We import mockService functions directly (they never use fetch/axios).
import {
  createExpense,
  listExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  classifyExpense,
} from '../mockService.js';

import { CATEGORIES } from '../../utils/validators.js';

// The mock service has artificial delays (100-300ms per call).
// With 100 property runs, we need a generous timeout.
const TEST_TIMEOUT = 60_000;

describe('Property 14: Modo mock opera independentemente do backend', () => {
  let fetchSpy;

  beforeEach(() => {
    // Spy on global fetch to detect any HTTP calls
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('HTTP call detected — mock service should not use fetch');
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // Generator for valid expense data
  const expenseDataArb = fc.record({
    description: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    amount: fc.integer({ min: 1, max: 999_999_99 }),
    date: fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    ).map(([y, m, d]) =>
      `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    ),
    category: fc.constantFrom(...CATEGORIES),
  });

  it('create operation works without HTTP calls and returns created expense', async () => {
    await fc.assert(
      fc.asyncProperty(expenseDataArb, async (data) => {
        const result = await createExpense(data);

        // Must return { data: expense }
        expect(result).toHaveProperty('data');
        expect(result.data).toHaveProperty('expenseId');
        expect(result.data.description).toBe(data.description);
        expect(result.data.amount).toBe(data.amount);
        expect(result.data.date).toBe(data.date);
        expect(result.data.category).toBe(data.category);

        // No HTTP calls should have been made
        expect(fetchSpy).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  }, TEST_TIMEOUT);

  it('list operation works without HTTP calls', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const result = await listExpenses();

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);

        // No HTTP calls
        expect(fetchSpy).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  }, TEST_TIMEOUT);

  it('created expenses can be retrieved', async () => {
    const data = {
      description: 'Test retrieval expense',
      amount: 5000,
      date: '2024-06-15',
      category: 'Alimentação',
    };

    const createResult = await createExpense(data);
    const id = createResult.data.expenseId;

    const getResult = await getExpense(id);
    expect(getResult.data.expenseId).toBe(id);
    expect(getResult.data.description).toBe(data.description);
    expect(getResult.data.amount).toBe(data.amount);

    // No HTTP calls
    expect(fetchSpy).not.toHaveBeenCalled();
  }, TEST_TIMEOUT);

  it('update operation works without HTTP calls', async () => {
    // Create an expense first, then update it
    const data = {
      description: 'Original description',
      amount: 1000,
      date: '2024-07-01',
      category: 'Transporte',
    };

    const createResult = await createExpense(data);
    const id = createResult.data.expenseId;

    const updateData = { description: 'Updated description', amount: 2000 };
    const updateResult = await updateExpense(id, updateData);

    expect(updateResult.data.description).toBe('Updated description');
    expect(updateResult.data.amount).toBe(2000);
    expect(updateResult.data.expenseId).toBe(id);

    // No HTTP calls
    expect(fetchSpy).not.toHaveBeenCalled();
  }, TEST_TIMEOUT);

  it('deleted expenses are removed and cannot be retrieved', async () => {
    const data = {
      description: 'To be deleted',
      amount: 3000,
      date: '2024-08-01',
      category: 'Lazer',
    };

    const createResult = await createExpense(data);
    const id = createResult.data.expenseId;

    // Delete
    const deleteResult = await deleteExpense(id);
    expect(deleteResult).toHaveProperty('data');

    // Attempt to retrieve should throw
    await expect(getExpense(id)).rejects.toBeDefined();

    // No HTTP calls
    expect(fetchSpy).not.toHaveBeenCalled();
  }, TEST_TIMEOUT);

  it('classifyExpense returns a valid category without HTTP calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (description) => {
          const result = await classifyExpense(description);

          expect(result).toHaveProperty('data');
          expect(result.data).toHaveProperty('category');
          expect(CATEGORIES).toContain(result.data.category);

          // No HTTP calls
          expect(fetchSpy).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  }, TEST_TIMEOUT);
});
