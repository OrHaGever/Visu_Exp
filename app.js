/* app.js - single file, original design restored */

(function () {
  'use strict';

  /* ================= constants.js (inlined) ================= */

  /**
   * קטגוריות ברירת מחדל
   */
  const DEFAULT_CATEGORIES = [
    "מזון",
    "שתייה קלה",
    "אלכוהול",
    "יין",
    "קינוחים",
    "קפה ותה",
    "קרח",
    "אריזות וחד-פעמי",
    "נייר ומוצרי נייר",
    "ניקיון והיגיינה",
    "תחזוקה ותיקונים",
    "ציוד מטבח",
    "ציוד בר",
    "שיווק ופרסום",
    "משלוחים ופלטפורמות",
    "תקשורת ואינטרנט",
    "חשמל / מים / גז",
    "כוח אדם",
    "מערכות ותוכנה",
    "עמלות וסליקה",
    "מיחזור ופינוי",
    "מיסים וארנונה",
    "שירותים חיצוניים",
    "פרחים ועיצוב",
    "אחר"
  ];

  /**
   * ספקים ברירת מחדל
   */
  const DEFAULT_SUPPLIERS = [
    "וולט",
    "תן ביס",
    "מקס",
    "ישראכרט",
    "סלקום",
    "פרטנר",
    "הוט",
    "אמישרגז",
    "תאגיד המים",
    "שיווק שלי א.א בע״מ",
    "אקיפ החברה לציוד מלונאי בע״מ",
    "דאלאס מוצרי נייר בע״מ",
    "חברת חשמל",
    "א.א.ר שירותי ביוב",
    "תמי 4",
    "בזק",
    "היכל היין",
    "החברה המרכזית",
    "סוקליק",
    "ביסקוטי",
    "אייס דרים",
    "ג.מ טעם הארץ בע״מ",
    "יזמקו חברה בע״מ"
  ];

  /**
   * פריטים ברירת מחדל
   */
  const DEFAULT_ITEMS = [
    { name: "קולה", category: "שתייה קלה", price: 0, unit: "יח׳" },
    { name: "מים מינרלים", category: "שתייה קלה", price: 0, unit: "יח׳" },
    { name: "קרח", category: "קרח", price: 0, unit: "שק" },
    { name: "בירה", category: "אלכוהול", price: 0, unit: "יח׳" },
    { name: "יין אדום", category: "יין", price: 0, unit: "בקבוק" },
    { name: "יין לבן", category: "יין", price: 0, unit: "בקבוק" },
    { name: "נייר טואלט", category: "נייר ומוצרי נייר", price: 0, unit: "חבילה" },
    { name: "מגבות נייר", category: "נייר ומוצרי נייר", price: 0, unit: "חבילה" },
    { name: "סבון כלים", category: "ניקיון והיגיינה", price: 0, unit: "בקבוק" },
    { name: "אקונומיקה", category: "ניקיון והיגיינה", price: 0, unit: "בקבוק" }
  ];

  /**
   * ניחוש קטגוריית ספק לפי שם
   */
  function inferSupplierCategory(name = "") {
    const n = name.toLowerCase();

    if (n.includes("חשמל") || n.includes("גז") || n.includes("אמישרגז"))
      return "חשמל / מים / גז";
    if (n.includes("ארנונה"))
      return "מיסים וארנונה";
    if (n.includes("בזק") || n.includes("אינטרנט"))
      return "תקשורת ואינטרנט";
    if (n.includes("ישראכרט") || n.includes("מקס"))
      return "עמלות וסליקה";
    if (n.includes("וולט") || n.includes("משלוחה"))
      return "משלוחים ופלטפורמות";
    if (n.includes("יין"))
      return "יין";
    if (n.includes("שתייה") || n.includes("החברה המרכזית"))
      return "שתייה קלה";
    if (n.includes("קינוחים") || n.includes("ביסקוטי"))
      return "קינוחים";
    if (n.includes("פרחים"))
      return "פרחים ועיצוב";
    if (n.includes("שיווק") || n.includes("דגים") || n.includes("מזון"))
      return "מזון";

    return "לא משויך";
  }

  /* ================= App ================= */

  const STORE_KEYS = ['visual-expense-app-v5', 'hatzeDef-supplier-dashboard-v3', 'visual-expense-app-v4'];
  const storeKey = 'visual-expense-app-v5';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const uid = () => Math.random().toString(36).slice(2, 10);

  const money = (n) => {
    const v = Number(n || 0);
    return '₪' + v.toLocaleString('he-IL', { maximumFractionDigits: 2 });
  };

  function toast(msg) {
    const box = $('#toastBox');
    const tmsg = $('#toastMsg');
    if (!box || !tmsg) return;
    tmsg.textContent = msg;
    box.style.display = 'flex';
  }

  function toastHide() {
    const box = $('#toastBox');
    if (box) box.style.display = 'none';
  }

  function normalizeCategories(names) {
    const set = new Set();
    (names || []).forEach((n) => {
      const v = String(n || '').trim();
      if (v) set.add(v);
    });
    if (!set.has('לא משויך')) set.add('לא משויך');
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'he'));
  }

  function loadRawState() {
    for (const k of STORE_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) return { key: k, data: JSON.parse(raw) };
      } catch {}
    }
    return null;
  }

  function migrateState(any) {
    const base = {
      version: 1,
      categories: [],
      suppliers: [],
      items: [],
      documents: [],
    };

    const s = any && typeof any === 'object' ? any : {};

    const legacySuppliers = Array.isArray(s.suppliers) ? s.suppliers : [];
    const legacyInvoices = Array.isArray(s.invoices)
      ? s.invoices
      : (Array.isArray(s.documents) ? s.documents : []);
    const legacyItems = Array.isArray(s.items) ? s.items : [];
    const legacyCategories = Array.isArray(s.categories) ? s.categories : [];

    const suppliers = legacySuppliers
      .map((x) => {
        if (typeof x === 'string') {
          const name = x.trim();
          return {
            id: uid(),
            name,
            category: inferSupplierCategory(name),
            phone: '',
            email: '',
            notes: '',
            active: true,
          };
        }
        const name = String(x.name || x.supplier || '').trim();
        return {
          id: x.id || uid(),
          name,
          category: String(x.category || inferSupplierCategory(name)).trim() || 'לא משויך',
          phone: String(x.phone || '').trim(),
          email: String(x.email || '').trim(),
          notes: String(x.notes || '').trim(),
          active: typeof x.active === 'boolean' ? x.active : true,
        };
      })
      .filter((su) => su.name);

    const items = legacyItems
      .map((x) => {
        if (typeof x === 'string') {
          return { id: uid(), name: x.trim(), category: 'לא משויך', price: 0, unit: '', active: true };
        }
        return {
          id: x.id || uid(),
          name: String(x.name || '').trim(),
          category: String(x.category || 'לא משויך').trim() || 'לא משויך',
          price: Number(x.price || 0),
          unit: String(x.unit || '').trim(),
          active: typeof x.active === 'boolean' ? x.active : true,
        };
      })
      .filter((it) => it.name);

    const documents = legacyInvoices
      .map((x) => {
        const date = String(x.date || x.createdAt || '').slice(0, 10);
        const supplier = String(x.supplier || x.vendor || '').trim();
        const amount = Number(x.amount ?? x.total ?? 0);
        const type = String(x.type || 'oneoff');
        const paid = !!(x.paid ?? x.isPaid);
        return {
          id: x.id || uid(),
          date,
          supplier,
          desc: String(x.desc || x.description || '').trim(),
          number: String(x.number || x.invoiceNumber || '').trim(),
          amount,
          type: (type === 'recurring' || type === 'קבוע') ? 'recurring' : 'oneoff',
          paid,
        };
      })
      .filter((d) => d.date && d.supplier);

    const catsFromLegacy = legacyCategories
      .map((c) => (typeof c === 'string' ? c : c?.name))
      .filter(Boolean);

    const categories = normalizeCategories([
      ...DEFAULT_CATEGORIES,
      ...catsFromLegacy,
      ...suppliers.map((su) => su.category),
      ...items.map((it) => it.category),
    ]);

    const seededSuppliers = suppliers.length
      ? suppliers
      : DEFAULT_SUPPLIERS.map((name) => {
          const n = String(name || '').trim();
          if (!n) return null;
          return {
            id: uid(),
            name: n,
            category: inferSupplierCategory(n),
            phone: '',
            email: '',
            notes: '',
            active: true,
          };
        }).filter(Boolean);

    const seededItems = items.length
      ? items
      : DEFAULT_ITEMS.map((it) => ({
          id: uid(),
          name: String(it.name || '').trim(),
          category: String(it.category || 'לא משויך').trim() || 'לא משויך',
          price: Number(it.price || 0),
          unit: String(it.unit || '').trim(),
          active: true,
        })).filter((it) => it.name);

    return {
      ...base,
      categories,
      suppliers: seededSuppliers,
      items: seededItems,
      documents,
    };
  }

  let state = migrateState(loadRawState()?.data || null);

  function save() {
    localStorage.setItem(storeKey, JSON.stringify(state));
  }

  function showScreen(id) {
    $$('.screen').forEach((s) => s.classList.add('hide'));
    const target = $('#' + id);
    if (target) target.classList.remove('hide');
    $$('nav .tab').forEach((b) => b.classList.toggle('active', b.dataset.screen === id));
  }

  function wireNav() {
    on(document, 'click', (e) => {
      const btn = e.target.closest('nav .tab');
      if (!btn) return;
      showScreen(btn.dataset.screen);
    });
  }

  function openModal(title, bodyEl) {
    const t = $('#modalTitle');
    if (t) t.textContent = title;
    const body = $('#modalBody');
    body.innerHTML = '';
    body.appendChild(bodyEl);
    const modal = $('#modal');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    const modal = $('#modal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    $('#modalBody').innerHTML = '';
  }

  function wireModal() {
    on($('#modalClose'), 'click', closeModal);
    on($('#modal'), 'click', (e) => {
      if (e.target && e.target.id === 'modal') closeModal();
    });
    on($('#toastClose'), 'click', toastHide);
  }

  function categoryOptions(selected) {
    return state.categories
      .map((c) => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`)
      .join('');
  }

  function supplierOptions(selected, include) {
    const activeNames = state.suppliers.filter((s) => s.active !== false).map((s) => s.name);
    const set = new Set(activeNames);
    if (include && include.trim()) set.add(include.trim());
    const names = Array.from(set).sort((a, b) => a.localeCompare(b, 'he'));
    return names.map((n) => `<option value="${n}" ${n === selected ? 'selected' : ''}>${n}</option>`).join('');
  }

  function supplierCategory(name) {
    const s = state.suppliers.find((x) => x.name === name);
    return s?.category || 'לא משויך';
  }

  function renderDashboard() {
    const month = new Date().toISOString().slice(0, 7);
    const monthDocs = state.documents.filter((d) => (d.date || '').slice(0, 7) === month);

    const total = monthDocs.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const unpaid = monthDocs.filter((d) => !d.paid).length;

    $('#kpiMonth').textContent = month;
    $('#kpiTotal').textContent = money(total);
    $('#kpiDocs').textContent = String(monthDocs.length);
    $('#kpiUnpaid').textContent = String(unpaid);

    const bySupplier = new Map();
    for (const d of monthDocs) {
      const key = d.supplier || '—';
      bySupplier.set(key, (bySupplier.get(key) || 0) + Number(d.amount || 0));
    }

    const cards = $('#supplierCards');
    if (cards) {
      const top = Array.from(bySupplier.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      cards.innerHTML =
        top
          .map(
            ([name, sum]) => `
        <div class="kpi">
          <div class="k">${name}</div>
          <div class="v">${money(sum)}</div>
        </div>
      `,
          )
          .join('') || '<div class="note">אין נתונים לחודש הנוכחי.</div>';
    }
  }

  const filters = { supplier: '', category: '', type: '', from: '', to: '' };

  function renderFilters() {
    const supplierSel = $('#filterSupplier');
    const catSel = $('#filterCategory');
    const typeSel = $('#filterType');

    if (supplierSel) {
      const names = ['הכל', ...state.suppliers.map((s) => s.name).sort((a, b) => a.localeCompare(b, 'he'))];
      supplierSel.innerHTML = names
        .map(
          (n) =>
            `<option value="${n === 'הכל' ? '' : n}" ${
              filters.supplier === (n === 'הכל' ? '' : n) ? 'selected' : ''
            }>${n}</option>`,
        )
        .join('');
    }

    if (catSel) {
      const names = ['הכל', ...state.categories];
      catSel.innerHTML = names
        .map(
          (n) =>
            `<option value="${n === 'הכל' ? '' : n}" ${
              filters.category === (n === 'הכל' ? '' : n) ? 'selected' : ''
            }>${n}</option>`,
        )
        .join('');
    }

    if (typeSel) {
      const types = [
        { value: '', label: 'הכל' },
        { value: 'oneoff', label: 'חד־פעמי' },
        { value: 'recurring', label: 'קבוע' },
      ];
      typeSel.innerHTML = types
        .map((t) => `<option value="${t.value}" ${filters.type === t.value ? 'selected' : ''}>${t.label}</option>`)
        .join('');
    }

    if ($('#filterFrom')) $('#filterFrom').value = filters.from;
    if ($('#filterTo')) $('#filterTo').value = filters.to;
  }

  function wireFilters() {
    on($('#filterSupplier'), 'change', (e) => { filters.supplier = e.target.value; renderDocuments(); });
    on($('#filterCategory'), 'change', (e) => { filters.category = e.target.value; renderDocuments(); });
    on($('#filterType'), 'change', (e) => { filters.type = e.target.value; renderDocuments(); });
    on($('#filterFrom'), 'change', (e) => { filters.from = e.target.value; renderDocuments(); });
    on($('#filterTo'), 'change', (e) => { filters.to = e.target.value; renderDocuments(); });
    on($('#clearFilters'), 'click', () => {
      filters.supplier = '';
      filters.category = '';
      filters.type = '';
      filters.from = '';
      filters.to = '';
      renderFilters();
      renderDocuments();
    });
  }

  function passesFilters(d) {
    if (filters.supplier && d.supplier !== filters.supplier) return false;
    if (filters.category && supplierCategory(d.supplier) !== filters.category) return false;
    if (filters.type && d.type !== filters.type) return false;
    if (filters.from && (d.date || '') < filters.from) return false;
    if (filters.to && (d.date || '') > filters.to) return false;
    return true;
  }

  function renderDocuments() {
    const body = $('#docsBody');
    const empty = $('#docsEmpty');
    if (!body) return;

    const rows = state.documents
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .filter(passesFilters);

    body.innerHTML = rows.map((d) => {
      const cat = supplierCategory(d.supplier);
      const statusClass = d.paid ? 'paid' : 'unpaid';
      const statusText = d.paid ? 'שולם' : 'לא שולם';

      return `
        <tr data-id="${d.id}">
          <td><input class="small" type="date" value="${d.date || ''}" disabled></td>
          <td>
            <select class="small" disabled>
              <option value="">—</option>
              ${supplierOptions(d.supplier, d.supplier)}
            </select>
          </td>
          <td><span class="badge"><b>${cat}</b></span></td>
          <td><input class="small" value="${String(d.desc || '').replaceAll('"', '&quot;')}" disabled></td>
          <td><input class="small" value="${String(d.number || '').replaceAll('"', '&quot;')}" disabled></td>
          <td><input class="small" type="number" step="0.01" value="${Number(d.amount || 0)}" disabled></td>
          <td>
            <select class="small" disabled>
              <option value="oneoff" ${d.type === 'oneoff' ? 'selected' : ''}>חד־פעמי</option>
              <option value="recurring" ${d.type === 'recurring' ? 'selected' : ''}>קבוע</option>
            </select>
          </td>
          <td>
            <label class="check"><input type="checkbox" ${d.paid ? 'checked' : ''} disabled><span class="pill ${statusClass}">${statusText}</span></label>
          </td>
          <td>
            <div class="btnRow">
              <button class="small ghost" data-act="edit">✏️</button>
              <button class="small green hide" data-act="save">💾</button>
              <button class="small danger" data-act="del">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (empty) empty.classList.toggle('hide', rows.length !== 0);
  }

  function wireDocumentsTable() {
    const body = $('#docsBody');
    if (!body) return;

    on(body, 'click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const tr = e.target.closest('tr');
      const id = tr?.dataset?.id;
      const doc = state.documents.find((x) => x.id === id);
      if (!doc) return;

      const act = btn.dataset.act;
      const editBtn = tr.querySelector('button[data-act="edit"]');
      const saveBtn = tr.querySelector('button[data-act="save"]');

      const dateEl = tr.querySelector('input[type="date"]');
      const supplierEl = tr.querySelector('td:nth-child(2) select');
      const descEl = tr.querySelector('td:nth-child(4) input');
      const numberEl = tr.querySelector('td:nth-child(5) input');
      const amountEl = tr.querySelector('td:nth-child(6) input');
      const typeEl = tr.querySelector('td:nth-child(7) select');
      const paidEl = tr.querySelector('td:nth-child(8) input[type="checkbox"]');

      const editables = [dateEl, supplierEl, descEl, numberEl, amountEl, typeEl, paidEl].filter(Boolean);

      if (act === 'edit') {
        editables.forEach((el) => (el.disabled = false));
        if (editBtn) editBtn.classList.add('hide');
        if (saveBtn) saveBtn.classList.remove('hide');
        return;
      }

      if (act === 'save') {
        const date = dateEl?.value || '';
        const supplier = supplierEl?.value || '';
        const amount = Number(amountEl?.value || 0);

        if (!date) return alert('חובה תאריך');
        if (!supplier) return alert('בחר ספק');
        if (!Number.isFinite(amount)) return alert('סכום לא תקין');

        doc.date = date;
        doc.supplier = supplier;
        doc.desc = (descEl?.value || '').trim();
        doc.number = (numberEl?.value || '').trim();
        doc.amount = amount;
        doc.type = typeEl?.value || 'oneoff';
        doc.paid = !!paidEl?.checked;

        save();
        renderDashboard();
        renderFilters();
        renderDocuments();
        toast('מסמך עודכן');
        return;
      }

      if (act === 'del') {
        if (!confirm('למחוק מסמך?')) return;
        state.documents = state.documents.filter((x) => x.id !== id);
        save();
        renderDashboard();
        renderDocuments();
        toast('מסמך נמחק');
      }
    });
  }

  function renderSuppliers() {
    const body = $('#suppliersBody');
    const empty = $('#suppliersEmpty');
    if (!body) return;

    const rows = state.suppliers.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    body.innerHTML = rows.map((s) => `
      <tr data-id="${s.id}">
        <td><input class="small" value="${String(s.name || '').replaceAll('"', '&quot;')}" disabled></td>
        <td>
          <select class="small" disabled>
            ${categoryOptions(s.category)}
          </select>
        </td>
        <td><input class="small" value="${String(s.phone || '').replaceAll('"', '&quot;')}" disabled></td>
        <td><input class="small" value="${String(s.email || '').replaceAll('"', '&quot;')}" disabled></td>
        <td><input class="small" value="${String(s.notes || '').replaceAll('"', '&quot;')}" disabled></td>
        <td style="text-align:center"><input type="checkbox" ${s.active !== false ? 'checked' : ''} disabled></td>
        <td>
          <div class="btnRow">
            <button class="small ghost" data-act="edit">✏️</button>
            <button class="small green hide" data-act="save">💾</button>
            <button class="small danger" data-act="del">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    if (empty) empty.classList.toggle('hide', rows.length !== 0);
  }

  function wireSuppliersTable() {
    const body = $('#suppliersBody');
    if (!body) return;

    on(body, 'click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const tr = e.target.closest('tr');
      const id = tr?.dataset?.id;
      const sup = state.suppliers.find((x) => x.id === id);
      if (!sup) return;

      const act = btn.dataset.act;
      const editBtn = tr.querySelector('button[data-act="edit"]');
      const saveBtn = tr.querySelector('button[data-act="save"]');

      const nameEl = tr.querySelector('td:nth-child(1) input');
      const catEl = tr.querySelector('td:nth-child(2) select');
      const phoneEl = tr.querySelector('td:nth-child(3) input');
      const emailEl = tr.querySelector('td:nth-child(4) input');
      const notesEl = tr.querySelector('td:nth-child(5) input');
      const activeEl = tr.querySelector('td:nth-child(6) input[type="checkbox"]');

      const editables = [nameEl, catEl, phoneEl, emailEl, notesEl, activeEl].filter(Boolean);

      if (act === 'edit') {
        editables.forEach((el) => (el.disabled = false));
        if (editBtn) editBtn.classList.add('hide');
        if (saveBtn) saveBtn.classList.remove('hide');
        return;
      }

      if (act === 'save') {
        const oldName = sup.name;
        const name = (nameEl?.value || '').trim();
        const category = catEl?.value || 'לא משויך';
        if (!name) return alert('שם ספק חובה');

        sup.name = name;
        sup.category = category;
        sup.phone = (phoneEl?.value || '').trim();
        sup.email = (emailEl?.value || '').trim();
        sup.notes = (notesEl?.value || '').trim();
        sup.active = !!activeEl?.checked;

        if (oldName && oldName !== name) {
          state.documents.forEach((d) => { if (d.supplier === oldName) d.supplier = name; });
        }

        if (!state.categories.includes(category)) {
          state.categories.push(category);
          state.categories = normalizeCategories(state.categories);
        }

        save();
        renderFilters();
        renderDocuments();
        renderSuppliers();
        renderCategories();
        renderDashboard();
        toast('ספק עודכן');
        return;
      }

      if (act === 'del') {
        const used = state.documents.some((d) => d.supplier === sup.name);
        if (used) return alert('לא ניתן למחוק ספק שיש לו מסמכים');
        if (!confirm('למחוק ספק?')) return;

        state.suppliers = state.suppliers.filter((x) => x.id !== id);
        save();
        renderFilters();
        renderSuppliers();
        renderDashboard();
        toast('ספק נמחק');
      }
    });
  }

  function renderItems() {
    const body = $('#itemsBody');
    const empty = $('#itemsEmpty');
    if (!body) return;

    const rows = state.items.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    body.innerHTML = rows.map((it) => `
      <tr data-id="${it.id}">
        <td><input class="small" value="${String(it.name || '').replaceAll('"', '&quot;')}" disabled></td>
        <td>
          <select class="small" disabled>
            ${categoryOptions(it.category)}
          </select>
        </td>
        <td><input class="small" type="number" step="0.01" value="${Number(it.price || 0)}" disabled></td>
        <td><input class="small" value="${String(it.unit || '').replaceAll('"', '&quot;')}" disabled></td>
        <td style="text-align:center"><input type="checkbox" ${it.active !== false ? 'checked' : ''} disabled></td>
        <td>
          <div class="btnRow">
            <button class="small ghost" data-act="edit">✏️</button>
            <button class="small green hide" data-act="save">💾</button>
            <button class="small danger" data-act="del">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    if (empty) empty.classList.toggle('hide', rows.length !== 0);
  }

  function wireItemsTable() {
    const body = $('#itemsBody');
    if (!body) return;

    on(body, 'click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const tr = e.target.closest('tr');
      const id = tr?.dataset?.id;
      const it = state.items.find((x) => x.id === id);
      if (!it) return;

      const act = btn.dataset.act;
      const editBtn = tr.querySelector('button[data-act="edit"]');
      const saveBtn = tr.querySelector('button[data-act="save"]');

      const nameEl = tr.querySelector('td:nth-child(1) input');
      const catEl = tr.querySelector('td:nth-child(2) select');
      const priceEl = tr.querySelector('td:nth-child(3) input');
      const unitEl = tr.querySelector('td:nth-child(4) input');
      const activeEl = tr.querySelector('td:nth-child(5) input[type="checkbox"]');

      const editables = [nameEl, catEl, priceEl, unitEl, activeEl].filter(Boolean);

      if (act === 'edit') {
        editables.forEach((el) => (el.disabled = false));
        if (editBtn) editBtn.classList.add('hide');
        if (saveBtn) saveBtn.classList.remove('hide');
        return;
      }

      if (act === 'save') {
        const name = (nameEl?.value || '').trim();
        const category = catEl?.value || 'לא משויך';
        const price = Number(priceEl?.value || 0);

        if (!name) return alert('שם פריט חובה');
        if (!Number.isFinite(price) || price < 0) return alert('מחיר לא תקין');

        it.name = name;
        it.category = category;
        it.price = price;
        it.unit = (unitEl?.value || '').trim();
        it.active = !!activeEl?.checked;

        if (!state.categories.includes(category)) {
          state.categories.push(category);
          state.categories = normalizeCategories(state.categories);
        }

        save();
        renderItems();
        renderCategories();
        renderDashboard();
        toast('פריט עודכן');
        return;
      }

      if (act === 'del') {
        if (!confirm('למחוק פריט?')) return;
        state.items = state.items.filter((x) => x.id !== id);
        save();
        renderItems();
        renderCategories();
        toast('פריט נמחק');
      }
    });
  }

  const PROTECTED_CATEGORIES = new Set(['לא משויך']);

  function categoryUsage(name) {
    return (
      state.suppliers.filter((s) => s.category === name).length +
      state.items.filter((i) => i.category === name).length
    );
  }

  function renderCategories() {
    const body = $('#categoriesBody');
    const empty = $('#categoriesEmpty');
    if (!body) return;

    const rows = state.categories.slice().sort((a, b) => a.localeCompare(b, 'he'));

    body.innerHTML = rows.map((name) => {
      const locked = PROTECTED_CATEGORIES.has(name);
      const used = categoryUsage(name);
      const safe = String(name).replaceAll('"', '&quot;');

      return `
        <tr data-name="${safe}">
          <td><input class="small" value="${safe}" ${locked ? 'disabled' : ''}></td>
          <td>${locked ? '<span class="pill">מוגנת</span>' : '<span class="pill">רגילה</span>'}</td>
          <td><span class="badge"><b>${used}</b></span></td>
          <td>
            ${
              locked
                ? '<span class="note">—</span>'
                : `
              <div class="btnRow">
                <button class="small green" data-act="save">💾</button>
                <button class="small danger" data-act="del">🗑️</button>
              </div>
            `
            }
          </td>
        </tr>
      `;
    }).join('');

    if (empty) empty.classList.toggle('hide', rows.length !== 0);
  }

  function wireCategoriesTable() {
    const body = $('#categoriesBody');
    if (!body) return;

    on(body, 'click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const tr = e.target.closest('tr');
      const oldName = tr?.dataset?.name;
      if (!oldName || PROTECTED_CATEGORIES.has(oldName)) return;

      const act = btn.dataset.act;

      if (act === 'save') {
        const input = tr.querySelector('input');
        const newName = (input?.value || '').trim();

        if (!newName) return alert('שם קטגוריה חובה');
        if (newName !== oldName && state.categories.includes(newName)) return alert('קטגוריה קיימת');

        state.categories = state.categories.map((c) => (c === oldName ? newName : c));
        state.suppliers.forEach((s) => { if (s.category === oldName) s.category = newName; });
        state.items.forEach((i) => { if (i.category === oldName) i.category = newName; });

        save();
        renderCategories();
        renderSuppliers();
        renderItems();
        renderFilters();
        renderDocuments();
        toast('קטגוריה עודכנה');
        return;
      }

      if (act === 'del') {
        if (categoryUsage(oldName) > 0) return alert('לא ניתן למחוק קטגוריה שבשימוש');
        if (!confirm('למחוק קטגוריה?')) return;

        state.categories = state.categories.filter((c) => c !== oldName);
        save();
        renderCategories();
        renderFilters();
        toast('קטגוריה נמחקה');
      }
    });
  }

  function docForm() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="row">
        <div>
          <label>תאריך</label>
          <input id="fDocDate" type="date" />
        </div>
        <div>
          <label>ספק</label>
          <select id="fDocSupplier">
            <option value="">בחר ספק…</option>
            ${supplierOptions('', '')}
          </select>
        </div>
        <div>
          <label>תיאור</label>
          <input id="fDocDesc" placeholder="למשל: אספקה שבועית" />
        </div>
        <div>
          <label>מס׳ מסמך</label>
          <input id="fDocNumber" placeholder="אופציונלי" />
        </div>
        <div>
          <label>סכום נטו</label>
          <input id="fDocAmount" type="number" step="0.01" />
        </div>
        <div>
          <label>סוג</label>
          <select id="fDocType">
            <option value="oneoff">חד־פעמי</option>
            <option value="recurring">קבוע</option>
          </select>
        </div>
      </div>

      <div class="spacer"></div>

      <div class="toggleRow">
        <label class="check"><input id="fDocPaid" type="checkbox" /><span>שולם</span></label>
      </div>

      <div class="actions">
        <button id="fDocSave" class="green">שמור</button>
        <button id="fDocCancel" class="ghost">ביטול</button>
      </div>
    `;

    on(wrap.querySelector('#fDocCancel'), 'click', closeModal);
    on(wrap.querySelector('#fDocSave'), 'click', () => {
      const date = wrap.querySelector('#fDocDate').value;
      const supplier = wrap.querySelector('#fDocSupplier').value;
      const amount = Number(wrap.querySelector('#fDocAmount').value || 0);
      if (!date) return alert('חובה תאריך');
      if (!supplier) return alert('בחר ספק');

      state.documents.push({
        id: uid(),
        date,
        supplier,
        desc: (wrap.querySelector('#fDocDesc').value || '').trim(),
        number: (wrap.querySelector('#fDocNumber').value || '').trim(),
        amount,
        type: wrap.querySelector('#fDocType').value,
        paid: !!wrap.querySelector('#fDocPaid').checked,
      });

      save();
      closeModal();
      renderDashboard();
      renderFilters();
      renderDocuments();
      toast('מסמך נשמר');
    });

    wrap.querySelector('#fDocDate').value = new Date().toISOString().slice(0, 10);
    return wrap;
  }

  function supplierForm() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="row">
        <div>
          <label>שם ספק</label>
          <input id="fSupName" placeholder="למשל: חברת חשמל" />
        </div>
        <div>
          <label>קטגוריה</label>
          <select id="fSupCategory">
            ${categoryOptions('לא משויך')}
          </select>
        </div>
        <div>
          <label>טלפון</label>
          <input id="fSupPhone" placeholder="אופציונלי" />
        </div>
        <div>
          <label>אימייל</label>
          <input id="fSupEmail" placeholder="אופציונלי" />
        </div>
        <div class="span2">
          <label>הערות</label>
          <input id="fSupNotes" placeholder="אופציונלי" />
        </div>
      </div>

      <div class="spacer"></div>

      <div class="toggleRow">
        <label class="check"><input id="fSupActive" type="checkbox" checked /><span>פעיל</span></label>
      </div>

      <div class="actions">
        <button id="fSupSave" class="green">שמור</button>
        <button id="fSupCancel" class="ghost">ביטול</button>
      </div>
    `;

    on(wrap.querySelector('#fSupCancel'), 'click', closeModal);
    on(wrap.querySelector('#fSupSave'), 'click', () => {
      const name = (wrap.querySelector('#fSupName').value || '').trim();
      const category = wrap.querySelector('#fSupCategory').value || 'לא משויך';
      if (!name) return alert('שם ספק חובה');

      state.suppliers.push({
        id: uid(),
        name,
        category,
        phone: (wrap.querySelector('#fSupPhone').value || '').trim(),
        email: (wrap.querySelector('#fSupEmail').value || '').trim(),
        notes: (wrap.querySelector('#fSupNotes').value || '').trim(),
        active: !!wrap.querySelector('#fSupActive').checked,
      });

      if (!state.categories.includes(category)) {
        state.categories.push(category);
        state.categories = normalizeCategories(state.categories);
      }

      save();
      closeModal();
      renderFilters();
      renderSuppliers();
      renderDocuments();
      renderCategories();
      renderDashboard();
      toast('ספק נוסף');
    });

    return wrap;
  }

  function categoryForm() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="row">
        <div class="span2">
          <label>שם קטגוריה</label>
          <input id="fCatName" placeholder="למשל: תחזוקה ותיקונים" />
        </div>
      </div>

      <div class="actions">
        <button id="fCatSave" class="green">שמור</button>
        <button id="fCatCancel" class="ghost">ביטול</button>
      </div>
    `;

    on(wrap.querySelector('#fCatCancel'), 'click', closeModal);
    on(wrap.querySelector('#fCatSave'), 'click', () => {
      const name = (wrap.querySelector('#fCatName').value || '').trim();
      if (!name) return alert('שם קטגוריה חובה');
      if (state.categories.includes(name)) return alert('קטגוריה קיימת');
      state.categories.push(name);
      state.categories = normalizeCategories(state.categories);
      save();
      closeModal();
      renderCategories();
      renderSuppliers();
      renderItems();
      renderFilters();
      renderDocuments();
      toast('קטגוריה נוספה');
    });

    return wrap;
  }

  function itemForm() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="row">
        <div>
          <label>שם פריט</label>
          <input id="fItemName" placeholder="למשל: קולה" />
        </div>
        <div>
          <label>קטגוריה</label>
          <select id="fItemCategory">
            ${categoryOptions('לא משויך')}
          </select>
        </div>
        <div>
          <label>מחיר</label>
          <input id="fItemPrice" type="number" step="0.01" />
        </div>
        <div>
          <label>יחידה</label>
          <input id="fItemUnit" placeholder="למשל: יח׳ / ק״ג" />
        </div>
      </div>

      <div class="spacer"></div>

      <div class="toggleRow">
        <label class="check"><input id="fItemActive" type="checkbox" checked /><span>פעיל</span></label>
      </div>

      <div class="actions">
        <button id="fItemSave" class="green">שמור</button>
        <button id="fItemCancel" class="ghost">ביטול</button>
      </div>
    `;

    on(wrap.querySelector('#fItemCancel'), 'click', closeModal);
    on(wrap.querySelector('#fItemSave'), 'click', () => {
      const name = (wrap.querySelector('#fItemName').value || '').trim();
      const category = wrap.querySelector('#fItemCategory').value || 'לא משויך';
      const price = Number(wrap.querySelector('#fItemPrice').value || 0);

      if (!name) return alert('שם פריט חובה');
      if (!Number.isFinite(price) || price < 0) return alert('מחיר לא תקין');

      state.items.push({
        id: uid(),
        name,
        category,
        price,
        unit: (wrap.querySelector('#fItemUnit').value || '').trim(),
        active: !!wrap.querySelector('#fItemActive').checked,
      });

      if (!state.categories.includes(category)) {
        state.categories.push(category);
        state.categories = normalizeCategories(state.categories);
      }

      save();
      closeModal();
      renderItems();
      renderCategories();
      renderDashboard();
      toast('פריט נוסף');
    });

    return wrap;
  }

  function wireExportImport() {
    on($('#exportJson'), 'click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'expenses-export.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 500);
    });

    const fileInput = $('#fileInput');

    on($('#importJson'), 'click', () => {
      fileInput.value = '';
      fileInput.click();
    });

    on(fileInput, 'change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || ''));
          state = migrateState(parsed);
          save();
          renderAll();
          toast('ייבוא הצליח');
        } catch {
          alert('קובץ JSON לא תקין');
        }
      };
      reader.readAsText(file);
    });

    on($('#clearAll'), 'click', () => {
      if (!confirm('לאפס הכל? פעולה זו מוחקת מסמכים/ספקים/פריטים מהדפדפן.')) return;
      state = migrateState(null);
      save();
      renderAll();
      toast('אופס');
    });
  }

  function wireAddButtons() {
    on($('#addDoc'), 'click', () => openModal('מסמך חדש', docForm()));
    on($('#addDoc2'), 'click', () => openModal('מסמך חדש', docForm()));
    on($('#addSupplier'), 'click', () => openModal('ספק חדש', supplierForm()));
    on($('#addSupplier2'), 'click', () => openModal('ספק חדש', supplierForm()));
    on($('#addCategory'), 'click', () => openModal('קטגוריה חדשה', categoryForm()));
    on($('#addCategory2'), 'click', () => openModal('קטגוריה חדשה', categoryForm()));
    on($('#addItem'), 'click', () => openModal('פריט חדש', itemForm()));
    on($('#addItem2'), 'click', () => openModal('פריט חדש', itemForm()));
  }

  function renderAll() {
    renderDashboard();
    renderFilters();
    renderDocuments();
    renderSuppliers();
    renderCategories();
    renderItems();
  }

  function init() {
    wireNav();
    wireModal();
    wireAddButtons();
    wireExportImport();
    wireFilters();

    wireDocumentsTable();
    wireSuppliersTable();
    wireCategoriesTable();
    wireItemsTable();

    renderAll();
    showScreen('dashboard');
  }

  document.addEventListener('DOMContentLoaded', init);
})();