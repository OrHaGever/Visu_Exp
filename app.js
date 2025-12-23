import { $, $$, money } from './utils.js';
import { calcMonthlySummary } from './calculations.js';
import { store, addDocument, addSupplier, addItem } from './state.js';
import { PROTECTED_CATEGORIES } from './constants.js';

(function () {

  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ================= NAVIGATION (FIXED) ================= */

  function showScreen(id) {
    $$('.screen').forEach(sec => {
      sec.style.display = sec.id === id ? 'block' : 'none';
    });

    $$('nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === id);
    });
  }

  function wireNavigation() {
    $$('nav button').forEach(btn => {
      on(btn, 'click', () => showScreen(btn.dataset.tab));
    });
  }

  /* ================= DASHBOARD ================= */

  function renderDashboard() {
    const docs = store.state.documents;
    const summary = calcMonthlySummary(docs);

    $('#kpiTotal').textContent = money(summary.expenses);
    $('#kpiCount').textContent = docs.length;
    $('#kpiAvg').textContent =
      money(docs.length ? summary.expenses / docs.length : 0);
  }

  /* ================= DOCUMENTS ================= */

  function renderInvoices() {
    const tbody = $('#invoicesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = store.state.documents.map(d => `
      <tr>
        <td>${d.date}</td>
        <td>${d.supplier}</td>
        <td>${d.number || ''}</td>
        <td>${money(d.amount)}</td>
        <td>${d.type === 'recurring' ? 'קבוע' : 'חד־פעמי'}</td>
        <td>${d.paid ? 'שולם' : 'לא שולם'}</td>
      </tr>
    `).join('');
  }

  function wireInvoiceForm() {
    on($('#invoiceForm'), 'submit', e => {
      e.preventDefault();

      const doc = {
        date: $('#invDate').value,
        supplier: $('#invSupplier').value,
        number: $('#invNumber').value,
        amount: Number($('#invAmount').value || 0),
        type: $('#invType').value,
        paid: $('#invPaid').checked
      };

      if (!doc.date || !doc.supplier) return alert('חסר תאריך או ספק');

      addDocument(doc);
      renderDashboard();
      renderInvoices();
      e.target.reset();
    });
  }

  /* ================= SUPPLIERS ================= */

  function renderSuppliers() {
    const box = $('#suppliersList');
    if (!box) return;

    box.innerHTML = store.state.suppliers.map(s => `
      <div class="row">
        <strong>${s.name}</strong>
        <span>${s.category || ''}</span>
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
    const box = $('#itemsList');
    if (!box) return;

    box.innerHTML = store.state.items.map(i => `
      <div class="row">
        <strong>${i.name}</strong>
        <span>${money(i.price || 0)}</span>
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
    const box = $('#categoriesList');
    if (!box) return;

    box.innerHTML = store.state.categories.map(c => `
      <div class="row">
        <strong>${c.name}</strong>
        ${PROTECTED_CATEGORIES.has(c.name) ? '<span>(מוגנת)</span>' : ''}
      </div>
    `).join('');
  }

  function wireCategoryForm() {
    on($('#categoryForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#catName').value.trim();
      if (!name) return alert('שם קטגוריה חובה');

      store.commit(s => s.categories.push({ name }));
      renderCategories();
      e.target.reset();
    });
  }

  /* ================= INIT ================= */

  function init() {
    wireNavigation();

    wireInvoiceForm();
    wireSupplierForm();
    wireItemForm();
    wireCategoryForm();

    renderDashboard();
    renderInvoices();
    renderSuppliers();
    renderItems();
    renderCategories();

    showScreen('dashboard'); // חשוב!
  }

  document.addEventListener('DOMContentLoaded', init);

})();