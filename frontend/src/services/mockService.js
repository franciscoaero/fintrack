/**
 * Mock service for FinTrack — operates entirely in-memory.
 * Used when VITE_USE_MOCK=true to allow frontend development without a backend.
 */

import { CATEGORIES } from '../utils/validators.js';

// Helper: generate a simple UUID-like id
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper: add artificial delay to simulate network latency
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: random delay between min and max ms
function randomDelay() {
  return delay(100 + Math.random() * 200);
}

// In-memory mock data — realistic Brazilian expenses
let mockExpenses = [
  {
    expenseId: generateId(),
    description: 'Supermercado Extra',
    amount: 28750,
    date: '2024-11-02',
    category: 'Alimentação',
    paymentMethod: 'Cartão de Débito',
    createdAt: '2024-11-02T10:30:00Z',
    updatedAt: '2024-11-02T10:30:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Uber para o trabalho',
    amount: 2340,
    date: '2024-11-03',
    category: 'Transporte',
    paymentMethod: 'PIX',
    createdAt: '2024-11-03T08:15:00Z',
    updatedAt: '2024-11-03T08:15:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Aluguel apartamento',
    amount: 180000,
    date: '2024-11-01',
    category: 'Moradia',
    paymentMethod: 'PIX',
    createdAt: '2024-11-01T09:00:00Z',
    updatedAt: '2024-11-01T09:00:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Farmácia Drogasil',
    amount: 8590,
    date: '2024-11-04',
    category: 'Saúde',
    paymentMethod: 'Cartão de Crédito',
    createdAt: '2024-11-04T14:20:00Z',
    updatedAt: '2024-11-04T14:20:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Cinema Cinemark',
    amount: 4500,
    date: '2024-11-05',
    category: 'Lazer',
    paymentMethod: 'Cartão de Crédito',
    createdAt: '2024-11-05T19:00:00Z',
    updatedAt: '2024-11-05T19:00:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Curso Udemy — React Avançado',
    amount: 2790,
    date: '2024-11-06',
    category: 'Educação',
    paymentMethod: 'Cartão de Crédito',
    createdAt: '2024-11-06T11:00:00Z',
    updatedAt: '2024-11-06T11:00:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Restaurante Outback',
    amount: 15680,
    date: '2024-11-07',
    category: 'Alimentação',
    paymentMethod: 'Cartão de Crédito',
    createdAt: '2024-11-07T20:30:00Z',
    updatedAt: '2024-11-07T20:30:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Gasolina posto Shell',
    amount: 22000,
    date: '2024-11-08',
    category: 'Transporte',
    paymentMethod: 'Cartão de Débito',
    createdAt: '2024-11-08T07:45:00Z',
    updatedAt: '2024-11-08T07:45:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Conta de luz ENEL',
    amount: 18500,
    date: '2024-11-10',
    category: 'Moradia',
    paymentMethod: 'PIX',
    createdAt: '2024-11-10T10:00:00Z',
    updatedAt: '2024-11-10T10:00:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Consulta médica particular',
    amount: 35000,
    date: '2024-11-11',
    category: 'Saúde',
    paymentMethod: 'PIX',
    createdAt: '2024-11-11T15:00:00Z',
    updatedAt: '2024-11-11T15:00:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Assinatura Netflix',
    amount: 3990,
    date: '2024-11-12',
    category: 'Lazer',
    paymentMethod: 'Cartão de Crédito',
    createdAt: '2024-11-12T00:00:00Z',
    updatedAt: '2024-11-12T00:00:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Padaria Pão de Açúcar',
    amount: 1850,
    date: '2024-11-13',
    category: 'Alimentação',
    paymentMethod: 'Dinheiro',
    createdAt: '2024-11-13T07:30:00Z',
    updatedAt: '2024-11-13T07:30:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Estacionamento shopping',
    amount: 1500,
    date: '2024-11-14',
    category: 'Transporte',
    paymentMethod: 'Dinheiro',
    createdAt: '2024-11-14T16:00:00Z',
    updatedAt: '2024-11-14T16:00:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Material escolar Kalunga',
    amount: 12000,
    date: '2024-10-28',
    category: 'Educação',
    paymentMethod: 'Cartão de Débito',
    createdAt: '2024-10-28T13:00:00Z',
    updatedAt: '2024-10-28T13:00:00Z',
  },
  {
    expenseId: generateId(),
    description: 'Presente aniversário',
    amount: 9900,
    date: '2024-10-30',
    category: 'Outros',
    paymentMethod: 'PIX',
    createdAt: '2024-10-30T18:00:00Z',
    updatedAt: '2024-10-30T18:00:00Z',
  },
];

// --- CRUD Operations ---

export async function createExpense(data) {
  await randomDelay();
  const now = new Date().toISOString();
  const expense = {
    expenseId: generateId(),
    description: data.description,
    amount: data.amount,
    date: data.date,
    category: data.category,
    paymentMethod: data.paymentMethod || null,
    receiptKey: data.receiptKey || null,
    createdAt: now,
    updatedAt: now,
  };
  mockExpenses.unshift(expense);
  return { data: expense };
}

export async function listExpenses(filters = {}) {
  await randomDelay();
  let results = [...mockExpenses];

  if (filters.category) {
    results = results.filter((e) => e.category === filters.category);
  }
  if (filters.startDate) {
    results = results.filter((e) => e.date >= filters.startDate);
  }
  if (filters.endDate) {
    results = results.filter((e) => e.date <= filters.endDate);
  }

  // Sort by date descending (most recent first)
  results.sort((a, b) => b.date.localeCompare(a.date));

  return { data: results };
}

export async function getExpense(id) {
  await randomDelay();
  const expense = mockExpenses.find((e) => e.expenseId === id);
  if (!expense) {
    throw { message: 'Despesa não encontrada' };
  }
  return { data: expense };
}

export async function updateExpense(id, data) {
  await randomDelay();
  const index = mockExpenses.findIndex((e) => e.expenseId === id);
  if (index === -1) {
    throw { message: 'Despesa não encontrada' };
  }
  const updated = {
    ...mockExpenses[index],
    ...data,
    expenseId: mockExpenses[index].expenseId,
    createdAt: mockExpenses[index].createdAt,
    updatedAt: new Date().toISOString(),
  };
  mockExpenses[index] = updated;
  return { data: updated };
}

export async function deleteExpense(id) {
  await randomDelay();
  const index = mockExpenses.findIndex((e) => e.expenseId === id);
  if (index === -1) {
    throw { message: 'Despesa não encontrada' };
  }
  mockExpenses.splice(index, 1);
  return { data: { message: 'Despesa excluída com sucesso' } };
}

// --- AI Features ---

const KEYWORD_CATEGORY_MAP = {
  uber: 'Transporte',
  '99': 'Transporte',
  gasolina: 'Transporte',
  combustível: 'Transporte',
  estacionamento: 'Transporte',
  ônibus: 'Transporte',
  metrô: 'Transporte',
  restaurante: 'Alimentação',
  supermercado: 'Alimentação',
  padaria: 'Alimentação',
  lanchonete: 'Alimentação',
  ifood: 'Alimentação',
  mercado: 'Alimentação',
  almoço: 'Alimentação',
  jantar: 'Alimentação',
  café: 'Alimentação',
  aluguel: 'Moradia',
  condomínio: 'Moradia',
  luz: 'Moradia',
  água: 'Moradia',
  internet: 'Moradia',
  gás: 'Moradia',
  farmácia: 'Saúde',
  médico: 'Saúde',
  consulta: 'Saúde',
  hospital: 'Saúde',
  dentista: 'Saúde',
  cinema: 'Lazer',
  netflix: 'Lazer',
  spotify: 'Lazer',
  teatro: 'Lazer',
  show: 'Lazer',
  viagem: 'Lazer',
  curso: 'Educação',
  livro: 'Educação',
  escola: 'Educação',
  faculdade: 'Educação',
  udemy: 'Educação',
  material: 'Educação',
};

export async function classifyExpense(description) {
  await randomDelay();
  const lower = description.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    if (lower.includes(keyword)) {
      return { data: { category } };
    }
  }
  return { data: { category: 'Outros' } };
}

export async function getPresignedUrl(contentType, fileName) {
  await randomDelay();
  const receiptKey = `receipts/default-user/${generateId()}.${fileName.split('.').pop()}`;
  return {
    data: {
      upload_url: `https://fake-s3-bucket.s3.amazonaws.com/${receiptKey}?X-Amz-Signature=fake`,
      receipt_key: receiptKey,
    },
  };
}

export async function uploadToS3(_uploadUrl, _file, _contentType) {
  await randomDelay();
  // No-op in mock mode — simulates successful upload
  return;
}

export async function processReceipt(_receiptKey) {
  await delay(300); // Slightly longer delay to simulate OCR processing
  return {
    data: {
      description: 'Supermercado Pão de Açúcar',
      amount: 15430,
      date: '2024-11-15',
      receipt_key: _receiptKey,
    },
  };
}

export async function getInsights(_startDate, _endDate) {
  await delay(300);
  return {
    data: {
      insights:
        '📊 **Análise dos seus gastos:**\n\n' +
        '• Sua maior categoria de gastos é **Moradia**, representando cerca de 40% do total.\n' +
        '• Gastos com **Alimentação** somam aproximadamente R$ 460,00 no período, distribuídos entre supermercado, restaurantes e padaria.\n' +
        '• Você gastou R$ 258,40 com **Transporte** — considere alternativas como transporte público para economizar.\n' +
        '• **Dica de economia:** Seus gastos com Lazer (Netflix + Cinema) somam R$ 84,90. Avalie se todas as assinaturas estão sendo utilizadas.\n' +
        '• Comparado ao mês anterior, seus gastos totais aumentaram cerca de 12%.',
    },
  };
}
