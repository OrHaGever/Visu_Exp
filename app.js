import { $, $$, money } from './utils.js';
import { calcMonthlySummary } from './calculations.js';
import { store, addDocument, addSupplier } from './state.js';

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
    const filters = getFilters();
    const docs = store.state.documents.filter(d => byFilters(d, filters));

    const summary = calcMonthlySummary(docs);

    $('#kpiTotal').textContent = money(summary.expenses);
    $('#kpiCount').textContent = docs.length + ' רשומות';

    $('#kpiRecurring').textContent = money(
      docs.filter(d => d.type === 'recurring')
          .reduce((s, d) => s + d.amount, 0)
    );
    $('#kpiRecurringCount').textContent =
      docs.filter(d => d.type === 'recurring').length + ' חשבוניות';

    $('#kpiOneoff').textContent = money(
      docs.filter(d => d.type === 'oneoff')
          .reduce((s, d) => s + d.amount, 0)
    );
    $('#kpiOneoffCount').textContent =
      docs.filter(d => d.type === 'oneoff').length + ' חשבוניות';

    $('#kpiAvg').textContent = money(
      docs.length ? summary.expenses / docs.length : 0
    );

    const onboarding = $('.onboarding');
    if (onboarding) {
      onboarding.style.display = store.state.documents.length ? 'none' : 'flex';
    }
  }

  /* ================= INVOICES ================= */

  function renderInvoices() {
    const tbody = $('#invoicesTable tbody');
    if (!tbody) return;

    const data = store.state.documents
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    tbody.innerHTML = data.map(i => `
      <tr>
        <td>${i.date || ''}</td>
        <td>${i.supplier || ''}</td>
        <td>${i.number || ''}</td>
        <td>${money(i.amount || 0)}</td>
        <td>
          <span class="badge ${i.type === 'recurring' ? 'badge-rec' : 'badge-one'}">
            ${i.type === 'recurring' ? 'קבוע' : 'חד־פעמי'}
          </span>
        </td>
        <td>
          <span class="badge ${i.paid ? 'badge-paid' : 'badge-unpaid'}">
            ${i.paid ? 'שולם' : 'לא שולם'}
          </span>
        </td>
      </tr>
    `).join('');

    const total = data.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalCell = $('#tblTotal');
    if (totalCell) totalCell.textContent = money(total);

    const empty = $('#invoicesEmpty');
    if (empty) empty.style.display = data.length ? 'none' : 'block';
  }

  /* ================= SUPPLIERS ================= */

  function renderSuppliers() {
    const list = $('#suppliersList');
    if (!list) return;

    const items = store.state.suppliers
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));

    list.innerHTML = items.map(s => `
      <div class="supplier-item">
        <div class="info">
          <div class="name">${s.name}</div>
          <div class="meta muted">
            ${(s.category || 'ללא קטגוריה')}
            ${s.notes ? ' • ' + s.notes : ''}
          </div>
        </div>
        <div class="row-actions">
          <button class="ghost" data-act="edit" data-id="${s.id}">עריכה</button>
          <button class="danger" data-act="del" data-id="${s.id}">מחיקה</button>
        </div>
      </div>
    `).join('');

    const empty = $('#suppliersEmpty');
    if (empty) empty.style.display = items.length ? 'none' : 'block';
  }

  function wireSupplierForm() {
    on($('#supplierForm'), 'submit', e => {
      e.preventDefault();

      const name = ($('#supName')?.value || '').trim();
      const category = ($('#supCategory')?.value || '').trim();
      const notes = ($('#supNotes')?.value || '').trim();

      if (!name) {
        alert('שם ספק חובה');
        return;
      }

      const existing = store.state.suppliers.find(s => s.name === name);

      if (existing) {
        store.commit(state => {
          existing.category = category;
          existing.notes = notes;
        });
      } else {
        addSupplier({ name, category, notes });
      }

      renderSuppliers();
      e.target.reset();
    });

    on($('#suppliersList'), 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      const act = btn.dataset.act;
      const supplier = store.state.suppliers.find(s => s.id === id);
      if (!supplier) return;

      if (act === 'edit') {
        $('#supName').value = supplier.name;
        $('#supCategory').value = supplier.category || '';
        $('#supNotes').value = supplier.notes || '';
      }

      if (act === 'del') {
        const used = store.state.documents.some(d => d.supplier === supplier.name);
        if (used) {
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

  /* ================= WIRES ================= */

  function wireFilters() {
    ['filterFrom', 'filterTo', 'filterSupplier', 'filterType']
      .forEach(id => on($('#' + id), 'change', renderDashboard));

    on($('#clearFilters'), 'click', () => {
      ['filterFrom', 'filterTo', 'filterSupplier', 'filterType']
        .forEach(id => { const el = $('#' + id); if (el) el.value = ''; });
      renderDashboard();
    });
  }

  function wireInvoiceForm() {
    on($('#invoiceForm'), 'submit', e => {
      e.preventDefault();

      const doc = {
        date: $('#invDate')?.value || '',
        supplier: ($('#invSupplier')?.value || '').trim(),
        number: ($('#invNumber')?.value || '').trim(),
        amount: Number($('#invAmount')?.value || 0),
        type: $('#invType')?.value || 'recurring',
        paid: $('#invPaid')?.checked || false,
        desc: ($('#invDesc')?.value || '').trim()
      };

      if (!doc.supplier || !doc.date) {
        alert('יש להזין תאריך וספק');
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
    wireFilters();
    wireInvoiceForm();
    wireSupplierForm();
    renderDashboard();
    renderInvoices();
    renderSuppliers();
  }

  document.addEventListener('DOMContentLoaded', init);

})();