import { $, $$, money } from './utils.js';
import { store, addItem } from './state.js';
import { PROTECTED_CATEGORIES } from './constants.js';

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

  /* ================= HELPERS ================= */

  function renderCategoryOptions(select) {
    if (!select) return;
    select.innerHTML =
      `<option value="">— בחר קטגוריה —</option>` +
      store.state.categories.map(c =>
        `<option value="${c.name}">${c.name}</option>`
      ).join('');
  }

  /* ================= ITEMS (TABLE + DROPDOWN) ================= */

  function renderItems() {
    const tbody = $('#itemsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = store.state.items.map(it => `
      <tr data-id="${it.id}">
        <td><input value="${it.name}" disabled></td>
        <td>
          <select disabled>
            ${store.state.categories.map(c =>
              `<option value="${c.name}" ${c.name === it.category ? 'selected' : ''}>${c.name}</option>`
            ).join('')}
          </select>
        </td>
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

      const inputs = row.querySelectorAll('input,select');

      if (btn.dataset.act === 'edit') {
        inputs.forEach(i => i.disabled = false);
        row.querySelector('[data-act="edit"]').classList.add('hide');
        row.querySelector('[data-act="save"]').classList.remove('hide');
      }

      if (btn.dataset.act === 'save') {
        store.commit(() => {
          item.name = inputs[0].value.trim();
          item.category = inputs[1].value;
          item.price = Number(inputs[2].value || 0);
          item.unit = inputs[3].value.trim();
        });
        renderItems();
      }

      if (btn.dataset.act === 'del') {
        if (!confirm('למחוק פריט?')) return;
        store.commit(s => {
          s.items = s.items.filter(i => i.id !== id);
        });
        renderItems();
      }
    });
  }

  function wireItemForm() {
    const catSelect = $('#itemCategory');
    renderCategoryOptions(catSelect);

    on($('#itemForm'), 'submit', e => {
      e.preventDefault();

      const name = $('#itemName').value.trim();
      const category = catSelect.value;
      const price = Number($('#itemPrice').value || 0);
      const unit = $('#itemUnit').value.trim();

      if (!name) return alert('שם פריט חובה');
      if (!category) return alert('יש לבחור קטגוריה');

      addItem({ name, category, price, unit });
      renderItems();
      e.target.reset();
    });
  }

  /* ================= CATEGORIES (TABLE + EDIT) ================= */

  function renderCategories() {
    const tbody = $('#categoriesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = store.state.categories.map(c => `
      <tr data-name="${c.name}">
        <td><input value="${c.name}" ${PROTECTED_CATEGORIES.has(c.name) ? 'disabled' : ''}></td>
        <td class="actions">
          ${PROTECTED_CATEGORIES.has(c.name)
            ? '<span class="muted">מוגנת</span>'
            : `
              <button data-act="save">💾</button>
              <button data-act="del">🗑️</button>
            `
          }
        </td>
      </tr>
    `).join('');
  }

  function wireCategoriesTable() {
    on($('#categoriesTable'), 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const row = btn.closest('tr');
      const oldName = row.dataset.name;
      if (PROTECTED_CATEGORIES.has(oldName)) return;

      if (btn.dataset.act === 'save') {
        const newName = row.querySelector('input').value.trim();
        if (!newName) return alert('שם קטגוריה חובה');

        const used =
          store.state.items.some(i => i.category === oldName);

        store.commit(state => {
          state.categories.find(c => c.name === o
