import { $, $$, money, toast } from './utils.js';
import { calcMonthlySummary } from './calculations.js';
import { store, addDocument, addSupplier, addItem } from './state.js';
import { PROTECTED_CATEGORIES } from './constants.js';

(function () {
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ================= SAFE HTML ================= */
  function esc(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  /* ================= NAV (ALWAYS WORKS) ================= */
  function showScreen(id) {
    $$('.screen').forEach(s => (s.style.display = s.id === id ? 'block' : 'none'));
    $$('nav.tabs button[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  }

  function wireNavigation() {
    const nav = $('nav.tabs');
    on(nav, 'click', e => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      showScreen(btn.dataset.tab);
    });
  }

  /* ================= SELECTS ================= */
  function categoryNames() {
    return store.state.categories
      .slice()
      .map(c => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'he'));
  }

  function supplierNames() {
    return store.state.suppliers
      .slice()
      .filter(s => s.active !== false)
      .map(s => s.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'he'));
  }

  function fillSelect(select, placeholder, values, selected = '') {
    if (!select) return;
    const opts = [`<option value="">${esc(placeholder)}</option>`]
      .concat(values.map(v => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(v)}</option>`));
    select.innerHTML = opts.join('');
  }

  function refreshFormSelects() {
    fillSelect($('#supCategory'), '— בחר קטגוריה —', categoryNames(), $('#supCategory')?.value || '');
    fillSelect($('#itemCategory'), '— בחר קטגוריה —', categoryNames(), $('#itemCategory')?.value || '');
    fillSelect($('#invSupplier'), '— בחר ספק —', supplierNames(), $('#invSupplier')?.value || '');
  }

  /* ================= DASHBOARD ================= */
  function renderDashboard() {
    const docs = store.state.documents || [];
    const summary = calcMonthlySummary(docs);
    $('#kpiTotal').textContent = money(summary.expenses);
    $('#kpiCount').textContent = `${docs.length}`;
    $('#kpiAvg').textContent = money(docs.length ? summary.expenses / docs.length : 0);
  }

  /* ================= DOCUMENTS ================= */
  function renderInvoices() {
    const tbody = $('#invoicesTable tbody');
    const empty = $('#docsEmpty');
    if (!tbody) return;

    const rows = (store.state.documents || [])
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(d => `
        <tr>
          <td>${esc(d.date || '')}</td>
          <td>${esc(d.supplier || '')}</td>
          <td>${esc(d.number || '')}</td>
          <td>${esc(money(d.amount || 0))}</td>
          <td>${d.type === 'recurring' ? 'קבוע' : 'חד־פעמי'}</td>
          <td>${d.paid ? 'כן' : 'לא'}</td>
        </tr>
      `)
      .join('');

    tbody.innerHTML = rows;
    if (empty) empty.style.display = rows ? 'none' : 'block';
  }

  function wireInvoiceForm() {
    const form = $('#invoiceForm');
    if (!form) return;

    on(form, 'submit', e => {
      e.preventDefault();

      const supplier = $('#invSupplier')?.value || '';
      const date = $('#invDate')?.value || '';

      if (!date) return alert('חובה תאריך');
      if (!supplier) return alert('בחר ספק');

      addDocument({
        date,
        supplier,
        number: ($('#invNumber')?.value || '').trim(),
        amount: Number($('#invAmount')?.value || 0),
        type: $('#invType')?.value || 'oneoff',
        paid: !!$('#invPaid')?.checked
      });

      renderDashboard();
      renderInvoices();
      e.target.reset();
      refreshFormSelects();
      toast('מסמך נשמר');
    });
  }

  /* ================= SUPPLIERS ================= */
  function supplierUsedInDocuments(name) {
    return (store.state.documents || []).some(d => d.supplier === name);
  }

  function renderSuppliers() {
    const tbody = $('#suppliersTable tbody');
    const empty = $('#supEmpty');
    if (!tbody) return;

    const cats = categoryNames();
    const rows = (store.state.suppliers || [])
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
      .map(s => `
        <tr data-id="${esc(s.id)}" data-old-name="${esc(s.name || '')}">
          <td><input value="${esc(s.name || '')}" disabled></td>
          <td>
            <select disabled>
              <option value="">—</option>
              ${cats.map(c => `<option value="${esc(c)}" ${c === (s.category || '') ? 'selected' : ''}>${esc(c)}</option>`).join('')}
            </select>
          </td>
          <td><input value="${esc(s.phone || '')}" disabled></td>
          <td><input value="${esc(s.email || '')}" disabled></td>
          <td><input value="${esc(s.notes || '')}" disabled></td>
          <td style="text-align:center;"><input type="checkbox" ${s.active !== false ? 'checked' : ''} disabled></td>
          <td class="actions">
            <button class="iconbtn" data-act="edit" title="עריכה">✏️</button>
            <button class="iconbtn" data-act="save" title="שמירה" style="display:none;">💾</button>
            <button class="iconbtn danger" data-act="del" title="מחיקה">🗑️</button>
          </td>
        </tr>
      `)
      .join('');

    tbody.innerHTML = rows;
    if (empty) empty.style.display = rows ? 'none' : 'block';
  }

  function wireSuppliersTable() {
    const table = $('#suppliersTable');
    if (!table) return;

    on(table, 'click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const row = btn.closest('tr');
      const id = row?.dataset?.id;
      const supplier = (store.state.suppliers || []).find(s => s.id === id);
      if (!row || !supplier) return;

      const act = btn.dataset.act;
      const fields = row.querySelectorAll('input,select');
      const editBtn = row.querySelector('button[data-act="edit"]');
      const saveBtn = row.querySelector('button[data-act="save"]');

      if (act === 'edit') {
        fields.forEach(x => (x.disabled = false));
        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-block';
        return;
      }

      if (act === 'save') {
        const oldName = row.dataset.oldName || supplier.name || '';
        const name = (fields[0]?.value || '').trim();
        const category = fields[1]?.value || '';
        const phone = (fields[2]?.value || '').trim();
        const email = (fields[3]?.value || '').trim();
        const notes = (fields[4]?.value || '').trim();
        const active = !!fields[5]?.checked;

        if (!name) return alert('שם ספק חובה');
        if (!category) return alert('בחר קטגוריה');

        store.commit(state => {
          supplier.name = name;
          supplier.category = category;
          supplier.phone = phone;
          supplier.email = email;
          supplier.notes = notes;
          supplier.active = active;

          if (oldName && oldName !== name) {
            state.documents.forEach(d => {
              if (d.supplier === oldName) d.supplier = name;
            });
          }
        });

        renderSuppliers();
        renderInvoices();
        refreshFormSelects();
        toast('ספק נשמר');
        return;
      }

      if (act === 'del') {
        if (supplierUsedInDocuments(supplier.name)) return alert('לא ניתן למחוק ספק שיש לו מסמכים');
        if (!confirm('למחוק ספק?')) return;

        store.commit(state => {
          state.suppliers = state.suppliers.filter(s => s.id !== id);
        });

        renderSuppliers();
        refreshFormSelects();
        toast('ספק נמחק');
      }
    });
  }

  function wireSupplierForm() {
    const form = $('#supplierForm');
    if (!form) return;

    on(form, 'submit', e => {
      e.preventDefault();

      const name = ($('#supName')?.value || '').trim();
      const category = $('#supCategory')?.value || '';
      if (!name) return alert('שם ספק חובה');
      if (!category) return alert('בחר קטגוריה');

      addSupplier({
        name,
        category,
        phone: ($('#supPhone')?.value || '').trim(),
        email: ($('#supEmail')?.value || '').trim(),
        notes: ($('#supNotes')?.value || '').trim(),
        active: !!$('#supActive')?.checked
      });

      renderSuppliers();
      refreshFormSelects();
      e.target.reset();
      toast('ספק נוסף');
    });
  }

  /* ================= ITEMS ================= */
  function renderItems() {
    const tbody = $('#itemsTable tbody');
    const empty = $('#itemsEmpty');
    if (!tbody) return;

    const cats = categoryNames();
    const rows = (store.state.items || [])
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
      .map(it => `
        <tr data-id="${esc(it.id)}">
          <td><input value="${esc(it.name || '')}" disabled></td>
          <td>
            <select disabled>
              <option value="">—</option>
              ${cats.map(c => `<option value="${esc(c)}" ${c === (it.category || '') ? 'selected' : ''}>${esc(c)}</option>`).join('')}
            </select>
          </td>
          <td><input type="number" value="${Number(it.price || 0)}" disabled></td>
          <td><input value="${esc(it.unit || '')}" disabled></td>
          <td style="text-align:center;"><input type="checkbox" ${it.active !== false ? 'checked' : ''} disabled></td>
          <td class="actions">
            <button class="iconbtn" data-act="edit" title="עריכה">✏️</button>
            <button class="iconbtn" data-act="save" title="שמירה" style="display:none;">💾</button>
            <button class="iconbtn danger" data-act="del" title="מחיקה">🗑️</button>
          </td>
        </tr>
      `)
      .join('');

    tbody.innerHTML = rows;
    if (empty) empty.style.display = rows ? 'none' : 'block';
  }

  function wireItemsTable() {
    const table = $('#itemsTable');
    if (!table) return;

    on(table, 'click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const row = btn.closest('tr');
      const id = row?.dataset?.id;
      const item = (store.state.items || []).find(i => i.id === id);
      if (!row || !item) return;

      const act = btn.dataset.act;
      const fields = row.querySelectorAll('input,select');
      const editBtn = row.querySelector('button[data-act="edit"]');
      const saveBtn = row.querySelector('button[data-act="save"]');

      if (act === 'edit') {
        fields.forEach(x => (x.disabled = false));
        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-block';
        return;
      }

      if (act === 'save') {
        const name = (fields[0]?.value || '').trim();
        const category = fields[1]?.value || '';
        const price = Number(fields[2]?.value || 0);
        const unit = (fields[3]?.value || '').trim();
        const active = !!fields[4]?.checked;

        if (!name) return alert('שם פריט חובה');
        if (!category) return alert('בחר קטגוריה');

        store.commit(() => {
          item.name = name;
          item.category = category;
          item.price = price;
          item.unit = unit;
          item.active = active;
        });

        renderItems();
        toast('פריט נשמר');
        return;
      }

      if (act === 'del') {
        if (!confirm('למחוק פריט?')) return;

        store.commit(state => {
          state.items = state.items.filter(i => i.id !== id);
        });

        renderItems();
        toast('פריט נמחק');
      }
    });
  }

  function wireItemForm() {
    const form = $('#itemForm');
    if (!form) return;

    on(form, 'submit', e => {
      e.preventDefault();

      const name = ($('#itemName')?.value || '').trim();
      const category = $('#itemCategory')?.value || '';
      if (!name) return alert('שם פריט חובה');
      if (!category) return alert('בחר קטגוריה');

      addItem({
        name,
        category,
        price: Number($('#itemPrice')?.value || 0),
        unit: ($('#itemUnit')?.value || '').trim(),
        active: !!$('#itemActive')?.checked
      });

      renderItems();
      e.target.reset();
      toast('פריט נוסף');
    });
  }

  /* ================= CATEGORIES ================= */
  function isCategoryUsed(name) {
    return (store.state.suppliers || []).some(s => s.category === name) ||
           (store.state.items || []).some(i => i.category === name);
  }

  function renderCategories() {
    const tbody = $('#categoriesTable tbody');
    const empty = $('#catsEmpty');
    if (!tbody) return;

    const cats = (store.state.categories || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));

    const rows = cats.map(c => {
      const locked = PROTECTED_CATEGORIES.has(c.name);
      return `
        <tr data-old-name="${esc(c.name)}">
          <td><input value="${esc(c.name)}" ${locked ? 'disabled' : ''}></td>
          <td>${locked ? '<span class="badge lock">מוגנת</span>' : '<span class="badge ok">רגילה</span>'}</td>
          <td class="actions">
            ${locked
              ? '<span class="muted">—</span>'
              : `
                <button class="iconbtn" data-act="save" title="שמירה">💾</button>
                <button class="iconbtn danger" data-act="del" title="מחיקה">🗑️</button>
              `}
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rows;
    if (empty) empty.style.display = rows ? 'none' : 'block';
  }

  function wireCategoriesTable() {
    const table = $('#categoriesTable');
    if (!table) return;

    on(table, 'click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const row = btn.closest('tr');
      const oldName = row?.dataset?.oldName || '';
      if (!oldName || PROTECTED_CATEGORIES.has(oldName)) return;

      const act = btn.dataset.act;

      if (act === 'save') {
        const newName = (row.querySelector('input')?.value || '').trim();
        if (!newName) return alert('שם קטגוריה חובה');

        if (oldName !== newName && (store.state.categories || []).some(c => c.name === newName)) {
          return alert('קטגוריה בשם הזה כבר קיימת');
        }

        store.commit(state => {
          const cat = state.categories.find(c => c.name === oldName);
          if (cat) cat.name = newName;

          state.suppliers.forEach(s => { if (s.category === oldName) s.category = newName; });
          state.items.forEach(i => { if (i.category === oldName) i.category = newName; });
        });

        renderCategories();
        renderSuppliers();
        renderItems();
        refreshFormSelects();
        toast('קטגוריה עודכנה');
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
        toast('קטגוריה נמחקה');
      }
    });
  }

  function wireCategoryForm() {
    const form = $('#categoryForm');
    if (!form) return;

    on(form, 'submit', e => {
      e.preventDefault();

      const name = ($('#catName')?.value || '').trim();
      if (!name) return alert('שם קטגוריה חובה');
      if ((store.state.categories || []).some(c => c.name === name)) return alert('קטגוריה קיימת');

      store.commit(state => state.categories.push({ name }));

      renderCategories();
      renderSuppliers();
      renderItems();
      refreshFormSelects();
      e.target.reset();
      toast('קטגוריה נוספה');
    });
  }

  /* ================= TOAST CLOSE ================= */
  function wireToast() {
    on($('#toastBtn'), 'click', () => $('#toast')?.classList.add('hide'));
  }

  /* ================= INIT ================= */
  function init() {
    wireNavigation();
    wireToast();

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
