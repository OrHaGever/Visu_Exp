import { $, $$, money } from './utils.js';
import { calcMonthlySummary } from './calculations.js';
import { store, addDocument, addSupplier, addItem } from './state.js';
import { PROTECTED_CATEGORIES } from './constants.js';

(function () {

  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ================= FILTERS ================= */

  function getFilters() {
    return {
      from: $('#filterFrom')?.value || null,
      to: $('#filterTo')?.value || null,
      supplier: $('#filterSupplier')?.value || '',
      type: $('#filterType')?.value || ''
    };
  }

  function byFilters(inv, f) {
    if (f.from && inv.date < f.from) return false;
    if (f.to && inv.date > f.to) return false;
    if (f.supplier && inv.supplier !== f.supplier) return false;
    if (f.type && inv.type !== f.type) return false;
    return true;
  }

  /* ================= DASHBOARD ================= */

  function renderDashboard() {
    const docs = store.state.documents.filter(d => byFilters(d, getFilters()));
    const summary = calcMonthlySummary(docs);

    $('#kpiTotal').textContent = money(summary.expenses);
    $('#kpiCount').textContent = docs.length + ' רשומות';
    $('#kpiAvg').textContent =
      money(docs.length ? summary.expenses / docs.length : 0);
  }

  /* ================= INVOICES ================= */

  function renderInvoices() {
    const tbody = $('#invoicesTable tbody');
    if (!tbody) return;

    const data = store.state.documents
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    tbody.innerHTML = data.map(d => `
      <tr>
        <td>${d.date || ''}</td>
        <td>${d.supplier || ''}</td>
        <td>${d.number || ''}</td>
        <td>${money(d.amount || 0)}</td>
        <td>${d.type === 'recurring' ? 'קבוע' : 'חד־פעמי'}</td>
        <td>${d.paid ? 'שולם' : 'לא שולם'}</td>
      </tr>
    `).join('');
  }

  /* ================= SUPPLIERS ================= */

  function renderSuppliers() {
    const list = $('#suppliersList');
    if (!list) return;

    list.innerHTML = store.state.suppliers
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
      .map(s => `
        <div class="supplier-item">
          <strong>${s.name}</strong>
          <span class="muted">${s.category || 'ללא קטגוריה'}</span>
          <div>
            <button data-act="edit" data-id="${s.id}">עריכה</button>
            <button data-act="del" data-id="${s.id}">מחיקה</button>
          </div>
        </div>
      `).join('');
  }

  function wireSupplierForm() {
    on($('#supplierForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#supName').value.trim();
      const category = $('#supCategory').value.trim();

      if (!name) return alert('שם ספק חובה');

      addSupplier({ name, category });
      renderSuppliers();
      e.target.reset();
    });
  }

  /* ================= ITEMS ================= */

  function renderItems() {
    const list = $('#itemsList');
    if (!list) return;

    list.innerHTML = store.state.items
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
      .map(i => `
        <div class="item-row">
          <strong>${i.name}</strong>
          <span class="muted">
            ${i.category || 'ללא קטגוריה'} • ${money(i.price || 0)}
          </span>
          <div>
            <button data-act="edit" data-id="${i.id}">עריכה</button>
            <button data-act="del" data-id="${i.id}">מחיקה</button>
          </div>
        </div>
      `).join('');
  }

  function wireItemForm() {
    on($('#itemForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#itemName').value.trim();
      const category = $('#itemCategory').value.trim();
      const price = Number($('#itemPrice').value || 0);

      if (!name) return alert('שם פריט חובה');

      addItem({ name, category, price });
      renderItems();
      e.target.reset();
    });
  }

  /* ================= CATEGORIES ================= */

  function renderCategories() {
    const list = $('#categoriesList');
    if (!list) return;

    list.innerHTML = store.state.categories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
      .map(c => `
        <div class="category-row">
          <strong>${c.name}</strong>
          ${PROTECTED_CATEGORIES.has(c.name)
            ? '<span class="badge">מוגנת</span>'
            : `<button data-act="del" data-name="${c.name}">מחיקה</button>`
          }
        </div>
      `).join('');
  }

  function wireCategoryForm() {
    on($('#categoryForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#catName').value.trim();
      if (!name) return alert('שם קטגוריה חובה');

      if (store.state.categories.some(c => c.name === name)) {
        return alert('קטגוריה כבר קיימת');
      }

      store.commit(state => {
        state.categories.push({ name });
      });

      renderCategories();
      e.target.reset();
    });

    on($('#categoriesList'), 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const name = btn.dataset.name;
      if (PROTECTED_CATEGORIES.has(name)) return;

      const used =
        store.state.suppliers.some(s => s.category === name) ||
        store.state.items.some(i => i.category === name);

      if (used) {
        alert('לא ניתן למחוק קטגוריה שבשימוש');
        return;
      }

      if (!confirm('למחוק קטגוריה?')) return;

      store.commit(state => {
        state.categories = state.categories.filter(c => c.name !== name);
      });

      renderCategories();
    });
  }

  /* ================= INIT ================= */

  function init() {
    renderDashboard();
    renderInvoices();
    renderSuppliers();
    renderItems();
    renderCategories();

    wireSupplierForm();
    wireItemForm();
    wireCategoryForm();
  }

  document.addEventListener('DOMContentLoaded', init);

})();