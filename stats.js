/* ================= state.js ================= */

import { uid } from './utils.js';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SUPPLIERS,
  DEFAULT_ITEMS,
  inferSupplierCategory
} from './constants.js';

const STORAGE_KEY = 'hatzeDef-supplier-dashboard-v3';
const LEGACY_KEY = 'visual-expense-app-v5';

function createInitialState() {
  const categories = DEFAULT_CATEGORIES.map(name => ({ name }));

  const suppliers = DEFAULT_SUPPLIERS.map(name => ({
    id: uid(),
    name,
    category: inferSupplierCategory(name),
    phone: '',
    email: '',
    notes: '',
    active: true
  }));

  const items = DEFAULT_ITEMS.map(item => ({
    id: uid(),
    name: item.name,
    category: item.category,
    price: item.price,
    unit: item.unit,
    active: true
  }));

  return {
    version: 6,
    theme: 'dark',
    categories,
    suppliers,
    items,
    documents: [],
    incomeByMonth: {}
  };
}

function loadLegacyIfNeeded() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    const base = createInitialState();

    const legacySuppliers = Array.isArray(parsed.suppliers) ? parsed.suppliers : [];
    const legacyInvoices = Array.isArray(parsed.invoices) ? parsed.invoices : [];
    const legacyRevenue = parsed.revenue && typeof parsed.revenue === 'object' ? parsed.revenue : {};

    const suppliers = legacySuppliers.map(s => ({
      id: s.id || uid(),
      name: s.name || s.supplier || '',
      category: s.category || inferSupplierCategory(s.name || s.supplier || ''),
      phone: s.phone || '',
      email: s.email || '',
      notes: s.notes || '',
      active: typeof s.active === 'boolean' ? s.active : true
    })).filter(s => s.name);

    const documents = legacyInvoices.map(inv => ({
      id: inv.id || uid(),
      date: inv.date || '',
      supplier: inv.supplier || '',
      number: inv.number || '',
      amount: Number(inv.amount || 0),
      type: inv.type || 'oneoff',
      paid: !!inv.paid
    })).filter(d => d.date && d.supplier);

    const usedCats = new Set(base.categories.map(c => c.name));
    suppliers.forEach(s => s.category && usedCats.add(s.category));
    base.items.forEach(i => i.category && usedCats.add(i.category));

    return {
      ...base,
      suppliers: suppliers.length ? suppliers : base.suppliers,
      documents,
      incomeByMonth: legacyRevenue,
      categories: Array.from(usedCats).map(name => ({ name }))
    };
  } catch {
    return null;
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = loadLegacyIfNeeded();
      return legacy || createInitialState();
    }

    const parsed = JSON.parse(raw);
    return {
      ...createInitialState(),
      ...parsed
    };
  } catch {
    const legacy = loadLegacyIfNeeded();
    return legacy || createInitialState();
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const store = {
  state: load(),
  commit(mutator) {
    mutator(this.state);
    save(this.state);
  }
};

export function addDocument(doc) {
  store.commit(state => {
    state.documents.push({ id: uid(), ...doc });
  });
}

export function addSupplier(data) {
  store.commit(state => {
    state.suppliers.push({ id: uid(), active: true, ...data });
  });
}

export function addItem(data) {
  store.commit(state => {
    state.items.push({ id: uid(), active: true, ...data });
  });
}
