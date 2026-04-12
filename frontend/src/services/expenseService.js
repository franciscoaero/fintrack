/**
 * Expense service — single entry point for all expense operations.
 * Delegates to mockService when VITE_USE_MOCK=true, otherwise uses the real API.
 * Components should ONLY import from this file, never from mockService directly.
 */

import * as mockService from './mockService.js';
import api from './api.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function createExpense(data) {
  if (USE_MOCK) return mockService.createExpense(data);
  return api.post('/expenses', data);
}

export async function listExpenses(filters = {}) {
  if (USE_MOCK) return mockService.listExpenses(filters);
  const params = {};
  if (filters.category) params.category = filters.category;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return api.get('/expenses', { params });
}

export async function getExpense(id) {
  if (USE_MOCK) return mockService.getExpense(id);
  return api.get(`/expenses/${id}`);
}

export async function updateExpense(id, data) {
  if (USE_MOCK) return mockService.updateExpense(id, data);
  return api.put(`/expenses/${id}`, data);
}

export async function deleteExpense(id) {
  if (USE_MOCK) return mockService.deleteExpense(id);
  return api.delete(`/expenses/${id}`);
}

export async function classifyExpense(description) {
  if (USE_MOCK) return mockService.classifyExpense(description);
  return api.post('/classify', { description });
}

export async function getPresignedUrl(contentType, fileName) {
  if (USE_MOCK) return mockService.getPresignedUrl(contentType, fileName);
  return api.post('/receipts/presign', { contentType, fileName });
}

export async function uploadToS3(uploadUrl, file, contentType) {
  if (USE_MOCK) return mockService.uploadToS3(uploadUrl, file, contentType);
  // Direct upload to S3 via presigned URL (not through our API)
  return fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  });
}

export async function processReceipt(receiptKey) {
  if (USE_MOCK) return mockService.processReceipt(receiptKey);
  return api.post('/receipts/process', { receiptKey });
}

export async function getInsights(startDate, endDate) {
  if (USE_MOCK) return mockService.getInsights(startDate, endDate);
  return api.post('/insights', { startDate, endDate });
}
