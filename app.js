import { $, $$, money } from './utils.js';
import { store, addItem } from './state.js';

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

  /* ================= ITEMS (TABLE) ================= */

  function renderItems() {
    const tbody = $('#itemsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = store.state.items.map(it => `
      <tr data-id="${it.id}">
        <td><input value="${it.name}" disabled></td>
        <td><input value="${it.category || ''}" disabled></td>
        <td><input type="number" value="${it.price || 0}" disabled></td>
        <td><input value="${it.unit || ''}" disabled></td>
        <td class="actions">
          <button data-act="edit">✏️</button>
          <button data-act="save" class="hide">💾</button>
          <button data-act="del">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  function wireItemsTable() {
    on($('#itemsTable'), 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const row = btn.closest('tr');
      const id = row.dataset.id;
      const item = store.state.items.find(i => i.id === id);
      if (!item) return;

      const inputs = row.querySelectorAll('input');

      if (btn.dataset.act === 'edit') {
        inputs.forEach(i => i.disabled = false);
        row.querySelector('[data-act="edit"]').classList.add('hide');
        row.querySelector('[data-act="save"]').classList.remove('hide');
      }

      if (btn.dataset.act === 'save') {
        store.commit(() => {
          item.name = inputs[0].value.trim();
          item.category = inputs[1].value.trim();
          item.price = Number(inputs[2].value || 0);
          item.unit = inputs[3].value.trim();
        });
        renderItems();
      }

      if (btn.dataset.act === 'del') {
        if (!confirm('למחוק פריט?')) return;
        store.commit(state => {
          state.items = state.items.filter(i => i.id !== id);
        });
        renderItems();
      }
    });
  }

  function wireItemForm() {
    on($('#itemForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#itemName').value.trim();
      const category = $('#itemCategory').value.trim();
      const price = Number($('#itemPrice').value || 0);
      const unit = $('#itemUnit').value.trim();

      if (!name) return alert('שם פריט חובה');

      addItem({ name, category, price, unit });
      renderItems();
      e.target.reset();
    });
  }

  /* ================= INIT ================= */

  function init() {
    wireNavigation();
    wireItemForm();
    wireItemsTable();
    renderItems();
    showScreen('items');
  }

  document.addEventListener('DOMContentLoaded', init);

})();
