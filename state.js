/* ================= state.js ================= */

import { uid } from './utils.js';

const STORAGE_KEY = 'hatzeDef-supplier-dashboard-v3';

/**
 * טעינה
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return JSON.parse(raw);
  } catch {
    return createInitialState();
  }
}

/**
 * שמירה
 */
function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * state התחלתי
 */
function createInitialState() {
  return {
    version: 5,
    theme: 'dark',
    categories: [],
    suppliers: [],
    items: [],
    documents: [],
    incomeByMonth: {}
  };
}

/**
 * store מרכזי
 */
export const store = {
  state: load(),

  commit(mutator) {
    mutator(this.state);
    save(this.state);
  }
};

/**
 * selectors
 */
export function getDocumentsByMonth(month) {
  return store.state.documents.filter(d => d.month === month);
}

export function getSuppliersMap() {
  const map = {};
  store.state.suppliers.forEach(s => {
    map[s.id] = s;
  });
  return map;
}

/**
 * actions לדוגמה
 */
export function addDocument(doc) {
  store.commit(state => {
    state.documents.push({ id: uid(), ...doc });
  });
}