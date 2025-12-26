/* ================= state.js ================= */

import { uid } from './utils.js';
import {
  DEFAULT_PRIMARY_CATEGORIES,
  DEFAULT_SUBCATEGORIES,
  DEFAULT_SUPPLIERS,
  DEFAULT_ITEMS,
  PROTECTED_PRIMARY,
  PROTECTED_SUB,
  inferSupplierSub
} from './constants.js';

const STORAGE_KEY = 'visu_exp_v1';

function ensureModel(state) {
  if (!state || typeof state !== 'object') state = {};

  if (!Array.isArray(state.primaryCategories)) state.primaryCategories = [];
  if (!Array.isArray(state.subCategories)) state.subCategories = [];
  if (!Array.isArray(state.suppliers)) state.suppliers = [];
  if (!Array.isArray(state.items)) state.items = [];
  if (!Array.isArray(state.documents)) state.documents = [];

  // defaults primaries
  const pSet = new Set(state.primaryCategories);
  DEFAULT_PRIMARY_CATEGORIES.forEach(p => { if (!pSet.has(p)) state.primaryCategories.push(p); });
  // ensure "אחר"
  if (!state.primaryCategories.includes("אחר")) state.primaryCategories.push("אחר");

  // defaults subs
  const key = (p, n) => `${p}@@${n}`;
  const sSet = new Set(state.subCategories.map(sc => key(sc.primary, sc.name)));
  DEFAULT_SUBCATEGORIES.forEach(sc => {
    if (!sSet.has(key(sc.primary, sc.name))) state.subCategories.push({ primary: sc.primary, name: sc.name });
  });

  // unique sub by name (hard constraint)
  const seenSub = new Set();
  state.subCategories = state.subCategories.filter(sc => {
    const name = String(sc?.name || '').trim();
    if (!name) return false;
    if (seenSub.has(name)) return false;
    seenSub.add(name);
    sc.name = name;
    sc.primary = state.primaryCategories.includes(sc.primary) ? sc.primary : "אחר";
    return true;
  });

  // ensure "לא משויך"
  if (!state.subCategories.some(x => x.name === "לא משויך")) state.subCategories.push({ primary: "אחר", name: "לא משויך" });

  // normalize suppliers/items/docs
  state.suppliers.forEach(s => {
    if (!s.id) s.id = uid();
    s.name = String(s.name || '').trim();
    if (!s.sub) s.sub = inferSupplierSub(s.name) || "לא משויך";
    const sc = state.subCategories.find(x => x.name === s.sub);
    s.main = sc ? sc.primary : "אחר";
    if (s.active === undefined) s.active = true;
    if (s.phone === undefined) s.phone = '';
    if (s.email === undefined) s.email = '';
    if (s.notes === undefined) s.notes = '';
  });
  state.suppliers = state.suppliers.filter(s => s.name);

  state.items.forEach(i => {
    if (!i.id) i.id = uid();
    i.name = String(i.name || '').trim();
    if (!i.sub) i.sub = "לא משויך";
    const sc = state.subCategories.find(x => x.name === i.sub);
    i.main = sc ? sc.primary : "אחר";
    if (i.price === undefined || i.price === null) i.price = 0;
    if (!i.unit) i.unit = 'יחידה';
    if (i.active === undefined) i.active = true;
  });
  state.items = state.items.filter(i => i.name);

  state.documents.forEach(d => {
    if (!d.id) d.id = uid();
    if (!d.date) d.date = new Date().toISOString().slice(0, 10);
    if (!d.docType) d.docType = "חשבונית";
    if (!d.desc) d.desc = "";
    if (!d.number) d.number = "";
    if (d.amount === undefined || d.amount === null) d.amount = 0;
    if (d.vatApplied === undefined) d.vatApplied = true;
    if (d.paid === undefined) d.paid = true;

    // if supplier exists -> align categories
    const s = state.suppliers.find(x => x.id === d.supplierId);
    if (s) {
      d.main = s.main;
      d.sub = s.sub;
    } else {
      if (!d.sub) d.sub = "לא משויך";
      const sc = state.subCategories.find(x => x.name === d.sub);
      d.main = sc ? sc.primary : (d.main || "אחר");
    }
  });

  // seed defaults only if empty
  if (state.suppliers.length === 0) {
    state.suppliers = DEFAULT_SUPPLIERS.map(name => {
      const sub = inferSupplierSub(name) || "לא משויך";
      const sc = state.subCategories.find(x => x.name === sub);
      return {
        id: uid(),
        name,
        main: sc ? sc.primary : "אחר",
        sub,
        phone: '',
        email: '',
        notes: '',
        active: true
      };
    });
  }

  if (state.items.length === 0) {
    state.items = DEFAULT_ITEMS.map(it => {
      const sub = it.sub || "לא משויך";
      const sc = state.subCategories.find(x => x.name === sub);
      return {
        id: uid(),
        name: it.name,
        main: sc ? sc.primary : "אחר",
        sub,
        price: Number(it.price || 0),
        unit: it.unit || 'יחידה',
        active: true
      };
    });
  }

  // sort
  state.primaryCategories = Array.from(new Set(state.primaryCategories)).sort((a, b) => a.localeCompare(b, 'he'));
  state.subCategories.sort((a, b) => {
    const ap = a.primary.localeCompare(b.primary, 'he');
    if (ap !== 0) return ap;
    return a.name.localeCompare(b.name, 'he');
  });
  state.suppliers.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'he'));
  state.items.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'he'));

  // protected enforcement (names)
  // (we enforce at actions layer too)
  if (!state.primaryCategories.includes("אחר")) state.primaryCategories.push("אחר");
  if (!state.subCategories.some(x => x.name === "לא משויך")) state.subCategories.push({ primary: "אחר", name: "לא משויך" });

  return state;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return ensureModel(parsed);
  } catch {
    return ensureModel({});
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const store = {
  state: load(),
  commit(mutator) {
    mutator(this.state);
    this.state = ensureModel(this.state);
    save(this.state);
  }
};

export function protectedPrimary(name) {
  return PROTECTED_PRIMARY.has(name);
}
export function protectedSub(name) {
  return PROTECTED_SUB.has(name);
}