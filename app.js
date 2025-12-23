import { $, $$, money } from './utils.js';
import { calcMonthlySummary } from './calculations.js';
import { store, addDocument, addSupplier, addItem } from './state.js';
import { PROTECTED_CATEGORIES } from './constants.js';

(function () {

  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ================= NAVIGATION ================= */

  function showScreen(name) {
    $$('.screen').forEach(s => {
      s.classList.toggle('hide', s.id !== name);
    });

    $$('nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === name);
    });
  }

  function wireNavigation() {
    $$('nav button').forEach(btn => {
      on(btn, 'click', () => {
        showScreen(btn.dataset.tab);
      });
    });
  }

  /* ================= DASHBOARD ================= */

  function renderDashboard() {
    const docs = store.state.documents;
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

    tbody.innerHTML = store.state.documents.map(d => `
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

    list.innerHTML = store.state.suppliers.map(s => `
      <div class="row">
        <strong>${s.name}</strong>
        <span class="muted">${s.category || ''}</span>
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

    list.innerHTML = store.state.items.map(i => `
      <div class="row">
        <strong>${i.name}</strong>
        <span class="muted">${money(i.price || 0)}</span>
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

    list.innerHTML = store.state.categories.map(c => `
      <div class="row">
        <strong>${c.name}</strong>
        ${PROTECTED_CATEGORIES.has(c.name) ? '<span class="muted">מוגנת</span>' : ''}
      </div>
    `).join('');
  }

  function wireCategoryForm() {
    on($('#categoryForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#catName').value.trim();
      if (!name) return alert('שם קטגוריה חובה');

      store.commit(state => {
        state.categories.push({ name });
      });

      renderCategories();
      e.target.reset();
    });
  }

  /* ================= INVOICE FORM ================= */

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

      if (!doc.date || !doc.supplier) {
        alert('חובה תאריך וספק');
        return;
      }

      addDocument(doc);
      renderDashboard();
      renderInvoices();
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

    showScreen('dashboard'); // מסך פתיחה
  }

  document.addEventListener('DOMContentLoaded', init);

})();