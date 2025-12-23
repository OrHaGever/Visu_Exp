/* ================= state.js ================= */

import { uid } from './utils.js';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SUPPLIERS,
  DEFAULT_ITEMS,
  inferSupplierCategory
} from './constants.js';

const STORAGE_KEY = 'hatzeDef-supplier-dashboard-v3';

/* ================= helpers ================= */

/**
 * יצירת state התחלתי (רק אם אין נתונים)
 */
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
    version: 5,
    theme: 'dark',
    categories,
    suppliers,
    items,
    documents: [],
    incomeByMonth: {}
  };
}

/**
 * טעינה בטוחה מ־localStorage
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw);

    // אם יש נתונים קיימים – לא מוחקים!
    return {
      ...createInitialState(),
      ...parsed
    };
  } catch (err) {
    console.warn('⚠️ state load failed, using defaults', err);
    return createInitialState();
  }
}

/**
 * שמירה
 */
function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ================= STORE ================= */

export const store = {
  state: load(),

  commit(mutator) {
    mutator(this.state);
    save(this.state);
  }
};

/* ================= SELECTORS ================= */

/**
 * מסמכים לפי חודש
 */
export function getDocumentsByMonth(month) {
  return store.state.documents.filter(d => d.month === month);
}

/**
 * ספקים פעילים
 */
export function getActiveSuppliers() {
  return store.state.suppliers.filter(s => s.active);
}

/**
 * מפת ספקים לפי id
 */
export function getSuppliersMap() {
  const map = {};
  store.state.suppliers.forEach(s => {
    map[s.id] = s;
  });
  return map;
}

/**
 * קטגוריות
 */
export function getCategories() {
  return store.state.categories;
}

/* ================= ACTIONS ================= */

/**
 * הוספת מסמך
 */
export function addDocument(doc) {
  store.commit(state => {
    state.documents.push({
      id: uid(),
      ...doc
    });
  });
}

/**
 * הוספת ספק
 */
export function addSupplier(data) {
  store.commit(state => {
    state.suppliers.push({
      id: uid(),
      active: true,
      ...data
    });
  });
}

/**
 * הוספת פריט
 */
export function addItem(data) {
  store.commit(state => {
    state.items.push({
      id: uid(),
      active: true,
      ...data
    });
  });
}