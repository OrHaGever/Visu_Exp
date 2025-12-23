import { $, $$, money } from './utils.js';
import { calcMonthlySummary } from './calculations.js';

(function () {

  const storeKey = 'visual-expense-app-v5';
  const state = { suppliers: [], invoices: [], revenue: {} };

  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* ================= STORAGE ================= */

  function load() {
    try {
      const raw = localStorage.getItem(storeKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      ['suppliers', 'invoices', 'revenue'].forEach(k => {
        if (data[k]) state[k] = data[k];
      });
    } catch { }
  }

  function save() {
    localStorage.setItem(storeKey, JSON.stringify(state));
  }

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
    const data = state.invoices.filter(inv => byFilters(inv, f));

    const summary = calcMonthlySummary(
      data.map(i => ({
        amount: i.amount,
        type: i.type === 'recurring' ? 'expense' : 'expense',
        status: i.paid ? 'שולם' : 'לא שולם'
      }))
    );

    $('#kpiTotal').textContent = money(summary.expenses);
    $('#kpiCount').textContent = data.length + ' רשומות';
    $('#kpiRecurring').textContent = money(
      data.filter(i => i.type === 'recurring').reduce((s, i) => s + i.amount, 0)
    );
    $('#kpiOneoff').textContent = money(
      data.filter(i => i.type === 'oneoff').reduce((s, i) => s + i.amount, 0)
    );
    $('#kpiAvg').textContent = money(data.length ? summary.expenses / data.length : 0);

    const ob = $('.onboarding');
    if (ob) ob.style.display = state.invoices.length ? 'none' : 'flex';
  }

  /* ================= INVOICES ================= */

  function renderInvoices() {
    const tbody = $('#invoicesTable tbody');
    if (!tbody) return;

    const data = state.invoices.slice().sort((a, b) => a.date.localeCompare(b.date));
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

  /* ================= WIRES ================= */

  function wireFilters() {
    ['filterFrom', 'filterTo', 'filterSupplier', 'filterType']
      .forEach(id => on($('#' + id), 'change', renderDashboard));
  }

  function wireInvoiceForm() {
    on($('#invoiceForm'), 'submit', e => {
      e.preventDefault();

      const inv = {
        id: uid(),
        date: $('#invDate').value,
        supplier: $('#invSupplier').value,
        number: $('#invNumber').value,
        amount: Number($('#invAmount').value || 0),
        type: $('#invType').value,
        paid: $('#invPaid').checked
      };

      if (!inv.supplier || !inv.date) {
        alert('יש להזין תאריך וספק');
        return;
      }

      state.invoices.push(inv);
      save();
      renderDashboard();
      renderInvoices();
      e.target.reset();
    });
  }

  /* ================= INIT ================= */

  function init() {
    load();
    wireFilters();
    wireInvoiceForm();
    renderDashboard();
    renderInvoices();
  }

  document.addEventListener('DOMContentLoaded', init);

})();