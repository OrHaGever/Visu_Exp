import { $, $$, money } from './utils.js';
import { calcMonthlySummary } from './calculations.js';
import { store, addDocument, addSupplier, addItem } from './state.js';
import { PROTECTED_CATEGORIES } from './constants.js';

(function () {
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ================= NAV ================= */

  function showScreen(id) {
    $$('.screen').forEach(s => (s.style.display = s.id === id ? 'block' : 'none'));
    $$('nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  }

  function wireNavigation() {
    $$('nav button').forEach(btn => on(btn, 'click', () => showScreen(btn.dataset.tab)));
  }

  /* ================= SELECT HELPERS ================= */

  function renderCategoryOptions(select, selected = '') {
    if (!select) return;
    const opts =
      `<option value="">— בחר קטגוריה —</option>` +
      store.state.categories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'he'))
        .map(c => `<option value="${c.name}" ${c.name === selected ? 'selected' : ''}>${c.name}</option>`)
        .join('');
    select.innerHTML = opts;
  }

  function refreshFormSelects() {
    renderCategoryOptions($('#supCategory'), $('#supCategory')?.value || '');
    renderCategoryOptions($('#itemCategory'), $('#itemCategory')?.value || '');
  }

  /* ================= DASHBOARD ================= */

  function renderDashboard() {
    const docs = store.state.documents;
    const summary = calcMonthlySummary(docs);

    $('#kpiTotal').textContent = money(summary.expenses);
    $('#kpiCount').textContent = docs.length + ' רשומות';
    $('#kpiAvg').textContent = money(docs.length ? summary.expenses / docs.length : 0);
  }

  /* ================= DOCUMENTS ================= */

  function renderInvoices() {
    const tbody = $('#invoicesTable tbody');
    if (!tbody) return;

    const rows = store.state.documents
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(d => `
        <tr>
          <td>${d.date || ''}</td>
          <td>${d.supplier || ''}</td>
          <td>${d.number || ''}</td>
          <td>${money(d.amount || 0)}</td>
          <td>${d.type === 'recurring' ? 'קבוע' : 'חד־פעמי'}</td>
          <td>${d.paid ? 'שולם' : 'לא שולם'}</td>
        </tr>
      `)
      .join('');

    tbody.innerHTML = rows;
  }

  function wireInvoiceForm() {
    on($('#invoiceForm'), 'submit', e => {
      e.preventDefault();

      const doc = {
        date: $('#invDate').value,
        supplier: $('#invSupplier').value.trim(),
        number: $('#invNumber').value.trim(),
        amount: Number($('#invAmount').value || 0),
        type: $('#invType').value,
        paid: $('#invPaid').checked
      };

      if (!doc.date || !doc.supplier) return alert('חובה תאריך וספק');

      addDocument(doc);
      renderDashboard();
      renderInvoices();
      e.target.reset();
    });
  }

  /* ================= SUPPLIERS (TABLE + DROPDOWN) ================= */

  function supplierUsedInDocuments(name) {
    return store.state.documents.some(d => d.supplier === name);
  }

  function renderSuppliers() {
    const tbody = $('#suppliersTable tbody');
    if (!tbody) return;

    const suppliers = store.state.suppliers
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    tbody.innerHTML = suppliers
      .map(s => `
        <tr data-id="${s.id}" data-old-name="${s.name}">
          <td><input value="${s.name || ''}" disabled></td>
          <td>
            <select disabled>
              <option value="">—</option>
              ${store.state.categories
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, 'he'))
                .map(c => `<option value="${c.name}" ${c.name === (s.category || '') ? 'selected' : ''}>${c.name}</option>`)
                .join('')}
            </select>
          </td>
          <td><input value="${s.phone || ''}" disabled></td>
          <td><input value="${s.notes || ''}" disabled></td>
          <td class="actions">
            <button data-act="edit">✏️</button>
            <button data-act="save" class="hide">💾</button>
            <button data-act="del">🗑️</button>
          </td>
        </tr>
      `)
      .join('');
  }

  function wireSuppliersTable() {
    on($('#suppliersTable'), 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const row = btn.closest('tr');
      if (!row) return;

      const id = row.dataset.id;
      const supplier = store.state.suppliers.find(s => s.id === id);
      if (!supplier) return;

      const act = btn.dataset.act;
      const fields = row.querySelectorAll('input,select');

      if (act === 'edit') {
        fields.forEach(x => (x.disabled = false));
        row.querySelector('[data-act="edit"]').classList.add('hide');
        row.querySelector('[data-act="save"]').classList.remove('hide');
        return;
      }

      if (act === 'save') {
        const oldName = row.dataset.oldName || supplier.name;
        const newName = fields[0].value.trim();
        const newCategory = fields[1].value;
        const newPhone = fields[2].value.trim();
        const newNotes = fields[3].value.trim();

        if (!newName) return alert('שם ספק חובה');

        // אם משנים שם ספק ויש מסמכים, נעדכן גם מסמכים
        store.commit(state => {
          supplier.name = newName;
          supplier.category = newCategory;
          supplier.phone = newPhone;
          supplier.notes = newNotes;

          if (oldName !== newName) {
            state.documents.forEach(d => {
              if (d.supplier === oldName) d.supplier = newName;
            });
          }
        });

        renderSuppliers();
        renderInvoices();
        return;
      }

      if (act === 'del') {
        if (supplierUsedInDocuments(supplier.name)) {
          alert('לא ניתן למחוק ספק שיש לו מסמכים');
          return;
        }
        if (!confirm('למחוק ספק?')) return;

        store.commit(state => {
          state.suppliers = state.suppliers.filter(s => s.id !== id);
        });

        renderSuppliers();
      }
    });
  }

  function wireSupplierForm() {
    refreshFormSelects();

    on($('#supplierForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#supName').value.trim();
      const category = $('#supCategory').value;
      const phone = $('#supPhone').value.trim();
      const notes = $('#supNotes').value.trim();

      if (!name) return alert('שם ספק חובה');
      if (!category) return alert('בחר קטגוריה');

      addSupplier({ name, category, phone, notes });
      renderSuppliers();
      e.target.reset();
    });
  }

  /* ================= ITEMS (TABLE + DROPDOWN) ================= */

  function renderItems() {
    const tbody = $('#itemsTable tbody');
    if (!tbody) return;

    const items = store.state.items
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    tbody.innerHTML = items
      .map(it => `
        <tr data-id="${it.id}">
          <td><input value="${it.name || ''}" disabled></td>
          <td>
            <select disabled>
              <option value="">—</option>
              ${store.state.categories
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, 'he'))
                .map(c => `<option value="${c.name}" ${c.name === (it.category || '') ? 'selected' : ''}>${c.name}</option>`)
                .join('')}
            </select>
          </td>
          <td><input type="number" value="${Number(it.price || 0)}" disabled></td>
          <td><input value="${it.unit || ''}" disabled></td>
          <td class="actions">
            <button data-act="edit">✏️</button>
            <button data-act="save" class="hide">💾</button>
            <button data-act="del">🗑️</button>
          </td>
        </tr>
      `)
      .join('');
  }

  function wireItemsTable() {
    on($('#itemsTable'), 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const row = btn.closest('tr');
      const id = row?.dataset.id;
      const item = store.state.items.find(i => i.id === id);
      if (!item) return;

      const act = btn.dataset.act;
      const fields = row.querySelectorAll('input,select');

      if (act === 'edit') {
        fields.forEach(x => (x.disabled = false));
        row.querySelector('[data-act="edit"]').classList.add('hide');
        row.querySelector('[data-act="save"]').classList.remove('hide');
        return;
      }

      if (act === 'save') {
        const newName = fields[0].value.trim();
        const newCategory = fields[1].value;
        const newPrice = Number(fields[2].value || 0);
        const newUnit = fields[3].value.trim();

        if (!newName) return alert('שם פריט חובה');
        if (!newCategory) return alert('בחר קטגוריה');

        store.commit(() => {
          item.name = newName;
          item.category = newCategory;
          item.price = newPrice;
          item.unit = newUnit;
        });

        renderItems();
        return;
      }

      if (act === 'del') {
        if (!confirm('למחוק פריט?')) return;

        store.commit(state => {
          state.items = state.items.filter(i => i.id !== id);
        });

        renderItems();
      }
    });
  }

  function wireItemForm() {
    refreshFormSelects();

    on($('#itemForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#itemName').value.trim();
      const category = $('#itemCategory').value;
      const price = Number($('#itemPrice').value || 0);
      const unit = $('#itemUnit').value.trim();

      if (!name) return alert('שם פריט חובה');
      if (!category) return alert('בחר קטגוריה');

      addItem({ name, category, price, unit });
      renderItems();
      e.target.reset();
    });
  }

  /* ================= CATEGORIES (TABLE + RENAME + GUARDS) ================= */

  function isCategoryUsed(name) {
    return (
      store.state.suppliers.some(s => s.category === name) ||
      store.state.items.some(i => i.category === name)
    );
  }

  function renderCategories() {
    const tbody = $('#categoriesTable tbody');
    if (!tbody) return;

    const cats = store.state.categories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));

    tbody.innerHTML = cats
      .map(c => `
        <tr data-old-name="${c.name}">
          <td>
            <input value="${c.name}" ${PROTECTED_CATEGORIES.has(c.name) ? 'disabled' : ''}>
          </td>
          <td class="actions">
            ${
              PROTECTED_CATEGORIES.has(c.name)
                ? '<span class="muted">מוגנת</span>'
                : `<button data-act="save">💾</button><button data-act="del">🗑️</button>`
            }
          </td>
        </tr>
      `)
      .join('');
  }

  function wireCategoriesTable() {
    on($('#categoriesTable'), 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const row = btn.closest('tr');
      const oldName = row.dataset.oldName;
      if (PROTECTED_CATEGORIES.has(oldName)) return;

      const act = btn.dataset.act;

      if (act === 'save') {
        const newName = row.querySelector('input').value.trim();
        if (!newName) return alert('שם קטגוריה חובה');

        if (oldName !== newName && store.state.categories.some(c => c.name === newName)) {
          return alert('קטגוריה בשם הזה כבר קיימת');
        }

        store.commit(state => {
          const cat = state.categories.find(c => c.name === oldName);
          if (cat) cat.name = newName;

          state.suppliers.forEach(s => {
            if (s.category === oldName) s.category = newName;
          });
          state.items.forEach(i => {
            if (i.category === oldName) i.category = newName;
          });
        });

        renderCategories();
        renderSuppliers();
        renderItems();
        refreshFormSelects();
        return;
      }

      if (act === 'del') {
        if (isCategoryUsed(oldName)) return alert('לא ניתן למחוק קטגוריה שבשימוש');
        if (!confirm('למחוק קטגוריה?')) return;

        store.commit(state => {
          state.categories = state.categories.filter(c => c.name !== oldName);
        });

        renderCategories();
        renderSuppliers();
        renderItems();
        refreshFormSelects();
      }
    });
  }

  function wireCategoryForm() {
    on($('#categoryForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#catName').value.trim();
      if (!name) return alert('שם קטגוריה חובה');
      if (store.state.categories.some(c => c.name === name)) return alert('קטגוריה קיימת');

      store.commit(state => state.categories.push({ name }));

      renderCategories();
      renderSuppliers();
      renderItems();
      refreshFormSelects();
      e.target.reset();
    });
  }

  /* ================= INIT ================= */

  function init() {
    wireNavigation();

    wireInvoiceForm();

    wireSupplierForm();
    wireSuppliersTable();

    wireItemForm();
    wireItemsTable();

    wireCategoryForm();
    wireCategoriesTable();

    refreshFormSelects();

    renderDashboard();
    renderInvoices();
    renderSuppliers();
    renderItems();
    renderCategories();

    showScreen('dashboard');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
