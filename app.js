/* app.js - main categories + subcategories */

(function () {
  'use strict';

  /* ================= constants ================= */

  const MAIN_CATEGORIES = [
    "מזון",
    "שתייה",
    "שירותים חיצוניים",
    "תחזוקה",
    "חשמל וגז",
    "ארנונה",
    "אחר",
  ];

  const DEFAULT_SUBCATEGORIES = [
    { main: "מזון", name: "בשר" },
    { main: "מזון", name: "דגים" },
    { main: "מזון", name: "ירקות" },
    { main: "מזון", name: "קינוחים" },

    { main: "שתייה", name: "שתייה קלה" },
    { main: "שתייה", name: "אלכוהול" },
    { main: "שתייה", name: "יין" },
    { main: "שתייה", name: "קפה ותה" },
    { main: "שתייה", name: "קרח" },

    { main: "שירותים חיצוניים", name: "משלוחים ופלטפורמות" },
    { main: "שירותים חיצוניים", name: "שיווק ופרסום" },
    { main: "שירותים חיצוניים", name: "עמלות וסליקה" },
    { main: "שירותים חיצוניים", name: "מערכות ותוכנה" },
    { main: "שירותים חיצוניים", name: "תקשורת ואינטרנט" },

    { main: "תחזוקה", name: "ניקיון והיגיינה" },
    { main: "תחזוקה", name: "ציוד מטבח" },
    { main: "תחזוקה", name: "ציוד בר" },
    { main: "תחזוקה", name: "תחזוקה ותיקונים" },

    { main: "חשמל וגז", name: "חברת חשמל" },
    { main: "חשמל וגז", name: "מים" },
    { main: "חשמל וגז", name: "גז" },

    { main: "ארנונה", name: "ארנונה" },

    { main: "אחר", name: "אחר" },
  ];

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

  const DEFAULT_ITEMS = [
    { name: "קולה", mainCategory: "שתייה", subcategory: "שתייה קלה", price: 0, unit: "יח׳" },
    { name: "מים מינרלים", mainCategory: "שתייה", subcategory: "שתייה קלה", price: 0, unit: "יח׳" },
    { name: "קרח", mainCategory: "שתייה", subcategory: "קרח", price: 0, unit: "שק" },
    { name: "בירה", mainCategory: "שתייה", subcategory: "אלכוהול", price: 0, unit: "יח׳" },
    { name: "יין אדום", mainCategory: "שתייה", subcategory: "יין", price: 0, unit: "בקבוק" },
    { name: "יין לבן", mainCategory: "שתייה", subcategory: "יין", price: 0, unit: "בקבוק" },
    { name: "נייר טואלט", mainCategory: "תחזוקה", subcategory: "ניקיון והיגיינה", price: 0, unit: "חבילה" },
    { name: "מגבות נייר", mainCategory: "תחזוקה", subcategory: "ניקיון והיגיינה", price: 0, unit: "חבילה" },
    { name: "סבון כלים", mainCategory: "תחזוקה", subcategory: "ניקיון והיגיינה", price: 0, unit: "בקבוק" },
    { name: "אקונומיקה", mainCategory: "תחזוקה", subcategory: "ניקיון והיגיינה", price: 0, unit: "בקבוק" },
  ];

  function inferSupplierCategory(name = "") {
    const n = name.toLowerCase();

    if (n.includes("חשמל") || n.includes("גז") || n.includes("אמישרגז")) return { main: "חשמל וגז", sub: "גז" };
    if (n.includes("מים") || n.includes("תאגיד")) return { main: "חשמל וגז", sub: "מים" };
    if (n.includes("ארנונה")) return { main: "ארנונה", sub: "ארנונה" };
    if (n.includes("בזק") || n.includes("אינטרנט") || n.includes("סלקום") || n.includes("פרטנר") || n.includes("הוט")) {
      return { main: "שירותים חיצוניים", sub: "תקשורת ואינטרנט" };
    }
    if (n.includes("ישראכרט") || n.includes("מקס")) return { main: "שירותים חיצוניים", sub: "עמלות וסליקה" };
    if (n.includes("וולט") || n.includes("תן ביס")) return { main: "שירותים חיצוניים", sub: "משלוחים ופלטפורמות" };
    if (n.includes("יין") || n.includes("היכל")) return { main: "שתייה", sub: "יין" };
    if (n.includes("החברה המרכזית") || n.includes("שתייה")) return { main: "שתייה", sub: "שתייה קלה" };
    if (n.includes("ביסקוטי") || n.includes("אייס")) return { main: "מזון", sub: "קינוחים" };
    if (n.includes("שיווק") || n.includes("טעם") || n.includes("דגים") || n.includes("בשר")) return { main: "מזון", sub: "" };

    return { main: "אחר", sub: "" };
  }

  function mapLegacyFlatCategoryToMainSub(cat) {
    const c = String(cat || "").trim();
    if (!c) return { main: "אחר", sub: "" };
    if (MAIN_CATEGORIES.includes(c)) return { main: c, sub: "" };

    const lc = c.toLowerCase();

    if (lc.includes("יין")) return { main: "שתייה", sub: "יין" };
    if (lc.includes("אלכוהול") || lc.includes("בירה")) return { main: "שתייה", sub: "אלכוהול" };
    if (lc.includes("קפה") || lc.includes("תה")) return { main: "שתייה", sub: "קפה ותה" };
    if (lc.includes("קרח")) return { main: "שתייה", sub: "קרח" };
    if (lc.includes("שתייה")) return { main: "שתייה", sub: "שתייה קלה" };

    if (lc.includes("ניקיון") || lc.includes("היגיינה") || lc.includes("נייר")) return { main: "תחזוקה", sub: "ניקיון והיגיינה" };
    if (lc.includes("תחזוקה") || lc.includes("תיקונים") || lc.includes("ציוד")) return { main: "תחזוקה", sub: c };

    if (lc.includes("חשמל") || lc.includes("גז") || lc.includes("מים")) return { main: "חשמל וגז", sub: c };
    if (lc.includes("ארנונה")) return { main: "ארנונה", sub: "ארנונה" };

    if (lc.includes("שיווק") || lc.includes("פרסום") || lc.includes("סליקה") || lc.includes("עמלות") || lc.includes("תקשורת") || lc.includes("אינטרנט")) {
      return { main: "שירותים חיצוניים", sub: c };
    }

    if (lc.includes("מזון") || lc.includes("קינוחים") || lc.includes("דגים") || lc.includes("בשר") || lc.includes("ירקות")) {
      return { main: "מזון", sub: c };
    }

    return { main: "אחר", sub: c };
  }

  /* ================= infra ================= */

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

  function loadRawState() {
    for (const k of STORE_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) return { key: k, data: JSON.parse(raw) };
      } catch {}
    }
    return null;
  }

  function normalizeSubcategories(list) {
    const seen = new Set();
    const out = [];
    for (const x of list || []) {
      const main = String(x?.main || '').trim();
      const name = String(x?.name || '').trim();
      if (!main || !MAIN_CATEGORIES.includes(main)) continue;
      if (!name) continue;
      const key = `${main}::${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: x.id || uid(), main, name });
    }
    out.sort((a, b) => (a.main === b.main ? a.name.localeCompare(b.name, 'he') : a.main.localeCompare(b.main, 'he')));
    return out;
  }

  function ensureSubcategoryExists(state, main, sub) {
    const m = String(main || '').trim();
    const s = String(sub || '').trim();
    if (!m || !s) return;
    if (!MAIN_CATEGORIES.includes(m)) return;
    const exists = state.subcategories.some(x => x.main === m && x.name === s);
    if (!exists) state.subcategories.push({ id: uid(), main: m, name: s });
  }

  function migrateState(any) {
    const base = {
      version: 2,
      mainCategories: MAIN_CATEGORIES.slice(),
      subcategories: normalizeSubcategories(DEFAULT_SUBCATEGORIES.map(x => ({ id: uid(), ...x }))),
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
    const legacySubcats = Array.isArray(s.subcategories) ? s.subcategories : [];

    // Subcategories from old state (if already exists)
    base.subcategories = normalizeSubcategories([
      ...base.subcategories,
      ...legacySubcats.map(x => ({ id: x.id || uid(), main: x.main, name: x.name })),
    ]);

    const suppliers = legacySuppliers
      .map((x) => {
        if (typeof x === 'string') {
          const name = x.trim();
          const inf = inferSupplierCategory(name);
          return {
            id: uid(),
            name,
            mainCategory: inf.main,
            subcategory: inf.sub || '',
            phone: '',
            email: '',
            notes: '',
            active: true,
          };
        }

        const name = String(x.name || x.supplier || '').trim();
        const legacyMain = String(x.mainCategory || x.main || '').trim();
        const legacySub = String(x.subcategory || x.sub || '').trim();

        let mainCategory = legacyMain;
        let subcategory = legacySub;

        if (!mainCategory) {
          const flat = x.category || x.cat || '';
          const mapped = mapLegacyFlatCategoryToMainSub(flat);
          mainCategory = mapped.main;
          subcategory = mapped.sub;
        }

        if (!MAIN_CATEGORIES.includes(mainCategory)) {
          const mapped = mapLegacyFlatCategoryToMainSub(mainCategory);
          mainCategory = mapped.main;
          subcategory = subcategory || mapped.sub;
        }

        if (!name) return null;

        return {
          id: x.id || uid(),
          name,
          mainCategory,
          subcategory: subcategory || '',
          phone: String(x.phone || '').trim(),
          email: String(x.email || '').trim(),
          notes: String(x.notes || '').trim(),
          active: typeof x.active === 'boolean' ? x.active : true,
        };
      })
      .filter(Boolean);

    const items = legacyItems
      .map((x) => {
        const name = typeof x === 'string' ? x.trim() : String(x.name || '').trim();
        if (!name) return null;

        const legacyMain = typeof x === 'object' ? String(x.mainCategory || x.main || '').trim() : '';
        const legacySub = typeof x === 'object' ? String(x.subcategory || x.sub || '').trim() : '';

        let mainCategory = legacyMain;
        let subcategory = legacySub;

        if (!mainCategory) {
          const flat = (typeof x === 'object' ? x.category : '') || '';
          const mapped = mapLegacyFlatCategoryToMainSub(flat);
          mainCategory = mapped.main;
          subcategory = mapped.sub;
        }

        if (!MAIN_CATEGORIES.includes(mainCategory)) {
          const mapped = mapLegacyFlatCategoryToMainSub(mainCategory);
          mainCategory = mapped.main;
          subcategory = subcategory || mapped.sub;
        }

        return {
          id: (typeof x === 'object' && x.id) ? x.id : uid(),
          name,
          mainCategory,
          subcategory: subcategory || '',
          price: Number((typeof x === 'object' ? x.price : 0) || 0),
          unit: typeof x === 'object' ? String(x.unit || '').trim() : '',
          active: typeof x === 'object' && typeof x.active === 'boolean' ? x.active : true,
        };
      })
      .filter(Boolean);

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

    const seededSuppliers = suppliers.length
      ? suppliers
      : DEFAULT_SUPPLIERS.map((name) => {
          const n = String(name || '').trim();
          if (!n) return null;
          const inf = inferSupplierCategory(n);
          return {
            id: uid(),
            name: n,
            mainCategory: inf.main,
            subcategory: inf.sub || '',
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
          mainCategory: it.mainCategory || "אחר",
          subcategory: it.subcategory || "",
          price: Number(it.price || 0),
          unit: String(it.unit || '').trim(),
          active: true,
        })).filter((it) => it.name);

    const next = {
      ...base,
      suppliers: seededSuppliers,
      items: seededItems,
      documents,
    };

    // Ensure used subcategories exist
    for (const su of next.suppliers) ensureSubcategoryExists(next, su.mainCategory, su.subcategory);
    for (const it of next.items) ensureSubcategoryExists(next, it.mainCategory, it.subcategory);

    next.subcategories = normalizeSubcategories(next.subcategories);

    return next;
  }

  let state = migrateState(loadRawState()?.data || null);

  function save() {
    localStorage.setItem(storeKey, JSON.stringify(state));
  }

  /* ================= UI helpers ================= */

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
    on($('#toastClose'), 'click', () => toastHide());
  }

  function escAttr(s) {
    return String(s ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  function mainOptions(selected) {
    return MAIN_CATEGORIES
      .map((m) => `<option value="${escAttr(m)}" ${m === selected ? 'selected' : ''}>${m}</option>`)
      .join('');
  }

  function subcategoryNames(main) {
    const m = String(main || '').trim();
    return state.subcategories
      .filter((x) => x.main === m)
      .map((x) => x.name)
      .sort((a, b) => a.localeCompare(b, 'he'));
  }

  function subOptions(main, selected, includeSelected) {
    const m = String(main || '').trim();
    const set = new Set(subcategoryNames(m));
    const sel = String(selected || '').trim();
    if (includeSelected && sel) set.add(sel);
    const list = Array.from(set).sort((a, b) => a.localeCompare(b, 'he'));

    const opts = [`<option value="">—</option>`].concat(
      list.map((n) => `<option value="${escAttr(n)}" ${n === sel ? 'selected' : ''}>${n}</option>`)
    );
    return opts.join('');
  }

  function supplierCategoryLabelByName(name) {
    const s = state.suppliers.find(x => x.name === name);
    if (!s) return { main: "אחר", sub: "" };
    return { main: s.mainCategory || "אחר", sub: s.subcategory || "" };
  }

  function supplierOptions(selected, include) {
    const activeNames = state.suppliers.filter((s) => s.active !== false).map((s) => s.name);
    const set = new Set(activeNames);
    const inc = String(include || '').trim();
    if (inc) set.add(inc);
    const names = Array.from(set).sort((a, b) => a.localeCompare(b, 'he'));
    return names.map((n) => `<option value="${escAttr(n)}" ${n === selected ? 'selected' : ''}>${n}</option>`).join('');
  }

  /* ================= dashboard ================= */

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
          .map(([name, sum]) => `
            <div class="kpi">
              <div class="k">${escAttr(name)}</div>
              <div class="v">${money(sum)}</div>
            </div>
          `)
          .join('') || '<div class="note">אין נתונים לחודש הנוכחי.</div>';
    }
  }

  /* ================= filters ================= */

  const filters = { supplier: '', main: '', sub: '', type: '', from: '', to: '' };

  function renderFilters() {
    const supplierSel = $('#filterSupplier');
    const mainSel = $('#filterMain');
    const subSel = $('#filterSub');
    const typeSel = $('#filterType');

    if (supplierSel) {
      const names = ['הכל', ...state.suppliers.map((s) => s.name).sort((a, b) => a.localeCompare(b, 'he'))];
      supplierSel.innerHTML = names
        .map((n) => `<option value="${n === 'הכל' ? '' : escAttr(n)}" ${filters.supplier === (n === 'הכל' ? '' : n) ? 'selected' : ''}>${escAttr(n)}</option>`)
        .join('');
    }

    if (mainSel) {
      const names = ['הכל', ...MAIN_CATEGORIES];
      mainSel.innerHTML = names
        .map((n) => `<option value="${n === 'הכל' ? '' : escAttr(n)}" ${filters.main === (n === 'הכל' ? '' : n) ? 'selected' : ''}>${escAttr(n)}</option>`)
        .join('');
    }

    if (subSel) {
      const subs = filters.main ? subcategoryNames(filters.main) : Array.from(new Set(state.subcategories.map(x => x.name))).sort((a, b) => a.localeCompare(b, 'he'));
      const names = ['הכל', ...subs];
      subSel.innerHTML = names
        .map((n) => `<option value="${n === 'הכל' ? '' : escAttr(n)}" ${filters.sub === (n === 'הכל' ? '' : n) ? 'selected' : ''}>${escAttr(n)}</option>`)
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
    on($('#filterMain'), 'change', (e) => { filters.main = e.target.value; filters.sub = ''; renderFilters(); renderDocuments(); });
    on($('#filterSub'), 'change', (e) => { filters.sub = e.target.value; renderDocuments(); });
    on($('#filterType'), 'change', (e) => { filters.type = e.target.value; renderDocuments(); });
    on($('#filterFrom'), 'change', (e) => { filters.from = e.target.value; renderDocuments(); });
    on($('#filterTo'), 'change', (e) => { filters.to = e.target.value; renderDocuments(); });

    on($('#clearFilters'), 'click', () => {
      filters.supplier = '';
      filters.main = '';
      filters.sub = '';
      filters.type = '';
      filters.from = '';
      filters.to = '';
      renderFilters();
      renderDocuments();
    });
  }

  function passesFilters(d) {
    if (filters.supplier && d.supplier !== filters.supplier) return false;

    const cat = supplierCategoryLabelByName(d.supplier);
    if (filters.main && cat.main !== filters.main) return false;
    if (filters.sub && (cat.sub || '') !== filters.sub) return false;

    if (filters.type && d.type !== filters.type) return false;
    if (filters.from && (d.date || '') < filters.from) return false;
    if (filters.to && (d.date || '') > filters.to) return false;
    return true;
  }

  /* ================= documents ================= */

  function renderDocuments() {
    const body = $('#docsBody');
    const empty = $('#docsEmpty');
    if (!body) return;

    const rows = state.documents
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .filter(passesFilters);

    body.innerHTML = rows.map((d) => {
      const cat = supplierCategoryLabelByName(d.supplier);
      const catLabel = cat.sub ? `${cat.main} / ${cat.sub}` : cat.main;

      const statusClass = d.paid ? 'paid' : 'unpaid';
      const statusText = d.paid ? 'שולם' : 'לא שולם';

      return `
        <tr data-id="${escAttr(d.id)}">
          <td><input class="small" type="date" value="${escAttr(d.date || '')}" disabled></td>
          <td>
            <select class="small" disabled>
              <option value="">—</option>
              ${supplierOptions(d.supplier, d.supplier)}
            </select>
          </td>
          <td><span class="badge"><b>${escAttr(catLabel)}</b></span></td>
          <td><input class="small" value="${escAttr(d.desc || '')}" disabled></td>
          <td><input class="small" value="${escAttr(d.number || '')}" disabled></td>
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

  /* ================= suppliers ================= */

  function renderSuppliers() {
    const body = $('#suppliersBody');
    const empty = $('#suppliersEmpty');
    if (!body) return;

    const rows = state.suppliers.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    body.innerHTML = rows.map((s) => `
      <tr data-id="${escAttr(s.id)}">
        <td><input class="small" value="${escAttr(s.name || '')}" disabled></td>

        <td>
          <select class="small" data-role="main" disabled>
            ${mainOptions(s.mainCategory || "אחר")}
          </select>
        </td>

        <td>
          <select class="small" data-role="sub" disabled>
            ${subOptions(s.mainCategory || "אחר", s.subcategory || "", true)}
          </select>
        </td>

        <td><input class="small" value="${escAttr(s.phone || '')}" disabled></td>
        <td><input class="small" value="${escAttr(s.email || '')}" disabled></td>
        <td><input class="small" value="${escAttr(s.notes || '')}" disabled></td>
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

  function supplierUsed(name) {
    return state.documents.some((d) => d.supplier === name);
  }

  function wireSuppliersTable() {
    const body = $('#suppliersBody');
    if (!body) return;

    on(body, 'change', (e) => {
      const sel = e.target.closest('select[data-role="main"]');
      if (!sel) return;
      const tr = e.target.closest('tr');
      const sub = tr.querySelector('select[data-role="sub"]');
      if (!sub) return;
      sub.innerHTML = subOptions(sel.value, '', false);
    });

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
      const mainEl = tr.querySelector('select[data-role="main"]');
      const subEl = tr.querySelector('select[data-role="sub"]');
      const phoneEl = tr.querySelector('td:nth-child(4) input');
      const emailEl = tr.querySelector('td:nth-child(5) input');
      const notesEl = tr.querySelector('td:nth-child(6) input');
      const activeEl = tr.querySelector('td:nth-child(7) input[type="checkbox"]');

      const editables = [nameEl, mainEl, subEl, phoneEl, emailEl, notesEl, activeEl].filter(Boolean);

      if (act === 'edit') {
        editables.forEach((el) => (el.disabled = false));
        if (editBtn) editBtn.classList.add('hide');
        if (saveBtn) saveBtn.classList.remove('hide');
        return;
      }

      if (act === 'save') {
        const oldName = sup.name;
        const name = (nameEl?.value || '').trim();
        const mainCategory = mainEl?.value || "אחר";
        const subcategory = (subEl?.value || '').trim();

        if (!name) return alert('שם ספק חובה');
        if (!MAIN_CATEGORIES.includes(mainCategory)) return alert('קטגוריה ראשית לא תקינה');

        sup.name = name;
        sup.mainCategory = mainCategory;
        sup.subcategory = subcategory;
        sup.phone = (phoneEl?.value || '').trim();
        sup.email = (emailEl?.value || '').trim();
        sup.notes = (notesEl?.value || '').trim();
        sup.active = !!activeEl?.checked;

        ensureSubcategoryExists(state, mainCategory, subcategory);
        state.subcategories = normalizeSubcategories(state.subcategories);

        if (oldName && oldName !== name) {
          state.documents.forEach((d) => { if (d.supplier === oldName) d.supplier = name; });
        }

        save();
        renderFilters();
        renderDocuments();
        renderSuppliers();
        renderSubcategories();
        renderDashboard();
        toast('ספק עודכן');
        return;
      }

      if (act === 'del') {
        if (supplierUsed(sup.name)) return alert('לא ניתן למחוק ספק שיש לו מסמכים');
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

  /* ================= items ================= */

  function renderItems() {
    const body = $('#itemsBody');
    const empty = $('#itemsEmpty');
    if (!body) return;

    const rows = state.items.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    body.innerHTML = rows.map((it) => `
      <tr data-id="${escAttr(it.id)}">
        <td><input class="small" value="${escAttr(it.name || '')}" disabled></td>

        <td>
          <select class="small" data-role="main" disabled>
            ${mainOptions(it.mainCategory || "אחר")}
          </select>
        </td>

        <td>
          <select class="small" data-role="sub" disabled>
            ${subOptions(it.mainCategory || "אחר", it.subcategory || "", true)}
          </select>
        </td>

        <td><input class="small" type="number" step="0.01" value="${Number(it.price || 0)}" disabled></td>
        <td><input class="small" value="${escAttr(it.unit || '')}" disabled></td>
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

    on(body, 'change', (e) => {
      const sel = e.target.closest('select[data-role="main"]');
      if (!sel) return;
      const tr = e.target.closest('tr');
      const sub = tr.querySelector('select[data-role="sub"]');
      if (!sub) return;
      sub.innerHTML = subOptions(sel.value, '', false);
    });

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
      const mainEl = tr.querySelector('select[data-role="main"]');
      const subEl = tr.querySelector('select[data-role="sub"]');
      const priceEl = tr.querySelector('td:nth-child(4) input');
      const unitEl = tr.querySelector('td:nth-child(5) input');
      const activeEl = tr.querySelector('td:nth-child(6) input[type="checkbox"]');

      const editables = [nameEl, mainEl, subEl, priceEl, unitEl, activeEl].filter(Boolean);

      if (act === 'edit') {
        editables.forEach((el) => (el.disabled = false));
        if (editBtn) editBtn.classList.add('hide');
        if (saveBtn) saveBtn.classList.remove('hide');
        return;
      }

      if (act === 'save') {
        const name = (nameEl?.value || '').trim();
        const mainCategory = mainEl?.value || "אחר";
        const subcategory = (subEl?.value || '').trim();
        const price = Number(priceEl?.value || 0);

        if (!name) return alert('שם פריט חובה');
        if (!MAIN_CATEGORIES.includes(mainCategory)) return alert('קטגוריה ראשית לא תקינה');
        if (!Number.isFinite(price) || price < 0) return alert('מחיר לא תקין');

        it.name = name;
        it.mainCategory = mainCategory;
        it.subcategory = subcategory;
        it.price = price;
        it.unit = (unitEl?.value || '').trim();
        it.active = !!activeEl?.checked;

        ensureSubcategoryExists(state, mainCategory, subcategory);
        state.subcategories = normalizeSubcategories(state.subcategories);

        save();
        renderItems();
        renderSubcategories();
        renderDashboard();
        toast('פריט עודכן');
        return;
      }

      if (act === 'del') {
        if (!confirm('למחוק פריט?')) return;
        state.items = state.items.filter((x) => x.id !== id);
        save();
        renderItems();
        renderSubcategories();
        toast('פריט נמחק');
      }
    });
  }

  /* ================= subcategories management ================= */

  function subcategoryUsage(main, sub) {
    const m = String(main || '').trim();
    const s = String(sub || '').trim();
    const fromSuppliers = state.suppliers.filter(x => (x.mainCategory || '') === m && (x.subcategory || '') === s).length;
    const fromItems = state.items.filter(x => (x.mainCategory || '') === m && (x.subcategory || '') === s).length;
    return fromSuppliers + fromItems;
  }

  function renderSubcategories() {
    const body = $('#subcategoriesBody');
    const empty = $('#subcategoriesEmpty');
    if (!body) return;

    const rows = state.subcategories
      .slice()
      .sort((a, b) => (a.main === b.main ? a.name.localeCompare(b.name, 'he') : a.main.localeCompare(b.main, 'he')));

    body.innerHTML = rows.map((sc) => {
      const used = subcategoryUsage(sc.main, sc.name);
      return `
        <tr data-id="${escAttr(sc.id)}">
          <td>
            <select class="small" data-role="main" disabled>
              ${mainOptions(sc.main)}
            </select>
          </td>
          <td><input class="small" value="${escAttr(sc.name)}" disabled></td>
          <td><span class="badge"><b>${used}</b></span></td>
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

  function wireSubcategoriesTable() {
    const body = $('#subcategoriesBody');
    if (!body) return;

    on(body, 'click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const tr = e.target.closest('tr');
      const id = tr?.dataset?.id;
      const sc = state.subcategories.find(x => x.id === id);
      if (!sc) return;

      const act = btn.dataset.act;
      const editBtn = tr.querySelector('button[data-act="edit"]');
      const saveBtn = tr.querySelector('button[data-act="save"]');

      const mainEl = tr.querySelector('select[data-role="main"]');
      const nameEl = tr.querySelector('td:nth-child(2) input');

      if (act === 'edit') {
        mainEl.disabled = false;
        nameEl.disabled = false;
        editBtn.classList.add('hide');
        saveBtn.classList.remove('hide');
        return;
      }

      if (act === 'save') {
        const oldMain = sc.main;
        const oldName = sc.name;
        const newMain = mainEl.value;
        const newName = (nameEl.value || '').trim();

        if (!MAIN_CATEGORIES.includes(newMain)) return alert('קטגוריה ראשית לא תקינה');
        if (!newName) return alert('שם תת־קטגוריה חובה');

        // prevent dup
        const dup = state.subcategories.some(x => x.id !== sc.id && x.main === newMain && x.name === newName);
        if (dup) return alert('תת־קטגוריה כבר קיימת תחת הקטגוריה הראשית הזו');

        sc.main = newMain;
        sc.name = newName;

        // update suppliers/items referencing old
        state.suppliers.forEach(su => {
          if ((su.mainCategory || '') === oldMain && (su.subcategory || '') === oldName) {
            su.mainCategory = newMain;
            su.subcategory = newName;
          }
        });
        state.items.forEach(it => {
          if ((it.mainCategory || '') === oldMain && (it.subcategory || '') === oldName) {
            it.mainCategory = newMain;
            it.subcategory = newName;
          }
        });

        state.subcategories = normalizeSubcategories(state.subcategories);

        save();
        renderSubcategories();
        renderSuppliers();
        renderItems();
        renderFilters();
        renderDocuments();
        toast('תת־קטגוריה עודכנה');
        return;
      }

      if (act === 'del') {
        const used = subcategoryUsage(sc.main, sc.name);
        if (used > 0) return alert('לא ניתן למחוק תת־קטגוריה שבשימוש');
        if (!confirm('למחוק תת־קטגוריה?')) return;

        state.subcategories = state.subcategories.filter(x => x.id !== sc.id);
        save();
        renderSubcategories();
        renderFilters();
        renderDocuments();
        toast('תת־קטגוריה נמחקה');
      }
    });
  }

  /* ================= modal forms ================= */

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
          <label>קטגוריה ראשית</label>
          <select id="fSupMain">
            ${mainOptions("אחר")}
          </select>
        </div>
        <div>
          <label>תת־קטגוריה</label>
          <select id="fSupSub">
            ${subOptions("אחר", "", false)}
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

    const mainEl = wrap.querySelector('#fSupMain');
    const subEl = wrap.querySelector('#fSupSub');

    on(mainEl, 'change', () => {
      subEl.innerHTML = subOptions(mainEl.value, '', false);
    });

    on(wrap.querySelector('#fSupCancel'), 'click', closeModal);
    on(wrap.querySelector('#fSupSave'), 'click', () => {
      const name = (wrap.querySelector('#fSupName').value || '').trim();
      const mainCategory = mainEl.value;
      const subcategory = (subEl.value || '').trim();

      if (!name) return alert('שם ספק חובה');
      if (!MAIN_CATEGORIES.includes(mainCategory)) return alert('קטגוריה ראשית לא תקינה');

      state.suppliers.push({
        id: uid(),
        name,
        mainCategory,
        subcategory,
        phone: (wrap.querySelector('#fSupPhone').value || '').trim(),
        email: (wrap.querySelector('#fSupEmail').value || '').trim(),
        notes: (wrap.querySelector('#fSupNotes').value || '').trim(),
        active: !!wrap.querySelector('#fSupActive').checked,
      });

      ensureSubcategoryExists(state, mainCategory, subcategory);
      state.subcategories = normalizeSubcategories(state.subcategories);

      save();
      closeModal();
      renderFilters();
      renderSuppliers();
      renderDocuments();
      renderSubcategories();
      renderDashboard();
      toast('ספק נוסף');
    });

    return wrap;
  }

  function subcategoryForm() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="row">
        <div>
          <label>קטגוריה ראשית</label>
          <select id="fSubMain">
            ${mainOptions("מזון")}
          </select>
        </div>
        <div>
          <label>שם תת־קטגוריה</label>
          <input id="fSubName" placeholder="למשל: דגים / בשר / קינוחים" />
        </div>
      </div>

      <div class="actions">
        <button id="fSubSave" class="green">שמור</button>
        <button id="fSubCancel" class="ghost">ביטול</button>
      </div>
    `;

    on(wrap.querySelector('#fSubCancel'), 'click', closeModal);
    on(wrap.querySelector('#fSubSave'), 'click', () => {
      const main = wrap.querySelector('#fSubMain').value;
      const name = (wrap.querySelector('#fSubName').value || '').trim();
      if (!MAIN_CATEGORIES.includes(main)) return alert('קטגוריה ראשית לא תקינה');
      if (!name) return alert('שם תת־קטגוריה חובה');

      const dup = state.subcategories.some(x => x.main === main && x.name === name);
      if (dup) return alert('תת־קטגוריה כבר קיימת');

      state.subcategories.push({ id: uid(), main, name });
      state.subcategories = normalizeSubcategories(state.subcategories);

      save();
      closeModal();
      renderSubcategories();
      renderSuppliers();
      renderItems();
      renderFilters();
      renderDocuments();
      toast('תת־קטגוריה נוספה');
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
          <label>קטגוריה ראשית</label>
          <select id="fItemMain">
            ${mainOptions("אחר")}
          </select>
        </div>
        <div>
          <label>תת־קטגוריה</label>
          <select id="fItemSub">
            ${subOptions("אחר", "", false)}
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

    const mainEl = wrap.querySelector('#fItemMain');
    const subEl = wrap.querySelector('#fItemSub');

    on(mainEl, 'change', () => {
      subEl.innerHTML = subOptions(mainEl.value, '', false);
    });

    on(wrap.querySelector('#fItemCancel'), 'click', closeModal);
    on(wrap.querySelector('#fItemSave'), 'click', () => {
      const name = (wrap.querySelector('#fItemName').value || '').trim();
      const mainCategory = mainEl.value;
      const subcategory = (subEl.value || '').trim();
      const price = Number(wrap.querySelector('#fItemPrice').value || 0);

      if (!name) return alert('שם פריט חובה');
      if (!MAIN_CATEGORIES.includes(mainCategory)) return alert('קטגוריה ראשית לא תקינה');
      if (!Number.isFinite(price) || price < 0) return alert('מחיר לא תקין');

      state.items.push({
        id: uid(),
        name,
        mainCategory,
        subcategory,
        price,
        unit: (wrap.querySelector('#fItemUnit').value || '').trim(),
        active: !!wrap.querySelector('#fItemActive').checked,
      });

      ensureSubcategoryExists(state, mainCategory, subcategory);
      state.subcategories = normalizeSubcategories(state.subcategories);

      save();
      closeModal();
      renderItems();
      renderSubcategories();
      renderDashboard();
      toast('פריט נוסף');
    });

    return wrap;
  }

  /* ================= export/import ================= */

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
    on($('#addSubcategory'), 'click', () => openModal('תת־קטגוריה חדשה', subcategoryForm()));
    on($('#addSubcategory2'), 'click', () => openModal('תת־קטגוריה חדשה', subcategoryForm()));
    on($('#addItem'), 'click', () => openModal('פריט חדש', itemForm()));
    on($('#addItem2'), 'click', () => openModal('פריט חדש', itemForm()));
  }

  function renderAll() {
    renderDashboard();
    renderFilters();
    renderDocuments();
    renderSuppliers();
    renderSubcategories();
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
    wireSubcategoriesTable();
    wireItemsTable();

    renderAll();
    showScreen('dashboard');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
