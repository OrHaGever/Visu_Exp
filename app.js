import { $, $$, money } from './utils.js';
import { calcMonthlySummary } from './calculations.js';
import { store, addDocument } from './state.js';

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

  /* ================= FORMS ================= */

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

  /* ================= INIT ================= */

  function init() {
    wireFilters();
    wireInvoiceForm();
    renderDashboard();
    renderInvoices();
  }

  document.addEventListener('DOMContentLoaded', init);

})();