import { $, $$, money } from './utils.js';
import { store, addSupplier } from './state.js';

(function () {

  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ================= NAV ================= */

  function showScreen(id) {
    $$('.screen').forEach(s => s.style.display = s.id === id ? 'block' : 'none');
    $$('nav button').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === id)
    );
  }

  function wireNavigation() {
    $$('nav button').forEach(btn =>
      on(btn, 'click', () => showScreen(btn.dataset.tab))
    );
  }

  /* ================= SUPPLIERS (TABLE) ================= */

  function renderSuppliers() {
    const tbody = $('#suppliersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = store.state.suppliers.map(s => `
      <tr data-id="${s.id}">
        <td><input value="${s.name}" disabled></td>
        <td><input value="${s.category || ''}" disabled></td>
        <td><input value="${s.phone || ''}" disabled></td>
        <td><input value="${s.notes || ''}" disabled></td>
        <td class="actions">
          <button data-act="edit">✏️</button>
          <button data-act="save" class="hide">💾</button>
          <button data-act="del">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  function wireSuppliersTable() {
    on($('#suppliersTable'), 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const row = btn.closest('tr');
      const id = row.dataset.id;
      const supplier = store.state.suppliers.find(s => s.id === id);
      if (!supplier) return;

      const inputs = row.querySelectorAll('input');

      if (btn.dataset.act === 'edit') {
        inputs.forEach(i => i.disabled = false);
        row.querySelector('[data-act="edit"]').classList.add('hide');
        row.querySelector('[data-act="save"]').classList.remove('hide');
      }

      if (btn.dataset.act === 'save') {
        store.commit(() => {
          supplier.name = inputs[0].value.trim();
          supplier.category = inputs[1].value.trim();
          supplier.phone = inputs[2].value.trim();
          supplier.notes = inputs[3].value.trim();
        });
        renderSuppliers();
      }

      if (btn.dataset.act === 'del') {
        if (!confirm('למחוק ספק?')) return;
        store.commit(state => {
          state.suppliers = state.suppliers.filter(s => s.id !== id);
        });
        renderSuppliers();
      }
    });
  }

  function wireSupplierForm() {
    on($('#supplierForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#supName').value.trim();
      const category = $('#supCategory').value.trim();
      const phone = $('#supPhone').value.trim();
      const notes = $('#supNotes').value.trim();

      if (!name) return alert('שם ספק חובה');

      addSupplier({ name, category, phone, notes });
      renderSuppliers();
      e.target.reset();
    });
  }

  /* ================= INIT ================= */

  function init() {
    wireNavigation();
    wireSupplierForm();
    wireSuppliersTable();
    renderSuppliers();
    showScreen('suppliers');
  }

  document.addEventListener('DOMContentLoaded', init);

})();
