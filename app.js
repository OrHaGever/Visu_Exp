import { $, $$, money, toast } from './utils.js';
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
    const f = getFilters();
    const data = store.state.documents.filter(inv => byFilters(inv, f));

    const summary = calcMonthlySummary(
      data.map(d => ({
        amount: d.amount,
        type: d.type,
        status: d.paid ? 'שולם' : 'לא שולם'
      }))
    );

    $('#kpiTotal').textContent = money(summary.expenses);
    $('#kpiCount').textContent = data.length + ' רשומות';
    $('#kpiRecurring').textContent = money(
      data.filter(i => i.type === 'recurring')
          .reduce((s, i) => s + i.amount, 0)
    );
    $('#kpiOneoff').textContent = money(
      data.filter(i => i.type === 'oneoff')
          .reduce((s, i) => s + i.amount, 0)
    );
    $('#kpiAvg').textContent = money(
      data.length ? summary.expenses / data.length : 0
    );

    const ob = $('.onboarding');
    if (ob) ob.style.display = store.state.documents.length ? 'none' : 'flex';
  }

  /* ================= INVOICES ================= */

  function renderInvoices() {
    const tbody = $('#invoicesTable tbody');
    if (!tbody) return;

    const data = store.state.documents
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));

    tbody.innerHTML = data.map(i => `
      <tr>
        <td>${i.date}</td>
        <td>${i.supplier}</td>
        <td>${i.number || ''}</td>
        <td>${money(i.amount)}</td>
        <td>${i.type === 'recurring' ? 'קבוע' : 'חד־פעמי'}</td>
        <td>${i.paid ? 'שולם' : 'לא שולם'}</td>
      </tr>
    `).join('');
  }

  /* ================= FORMS ================= */

  function wireInvoiceForm() {
    on($('#invoiceForm'), 'submit', e => {
      e.preventDefault();

      const doc = {
        date: $('#invDate').value,
        supplier: $('#invSupplier').value,
        number: $('#invNumber').value,
        amount: Number($('#invAmount').value || 0),
        type: $('#invType').value,
        paid: $('#invPaid').checked,
        desc: $('#invDesc')?.value || ''
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