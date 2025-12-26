/* ================= app.js ================= */

import { $, $$, money, escapeHtml, openModal, closeModal, toast, bindToastClose } from './utils.js';
import { store, protectedPrimary, protectedSub } from './state.js';
import { calcDocTotal, calcKPIs } from './calculations.js';

const DOC_TYPES = ["חשבונית", "תעודת משלוח", "קבלה", "זיכוי"];

function calcDocItemsSum(items) {
  return (Array.isArray(items) ? items : []).reduce((s, it) => s + Number(it?.total || 0), 0);
}

function renderDocItems(items) {
  const body = document.getElementById('docItemsBody');
  const amountInput = document.getElementById('docAmount');
  if (!body || !amountInput) return;

  const safeItems = Array.isArray(items) ? items : [];

  body.innerHTML = safeItems.length
    ? safeItems.map((it, idx) => `
      <tr>
        <td>${escapeHtml(it.name || '')}</td>
        <td><input type="number" min="0" step="0.01" data-qty="${idx}" value="${Number(it.qty || 0)}"></td>
        <td><input type="number" min="0" step="0.01" data-price="${idx}" value="${Number(it.price || 0)}"></td>
        <td>${money(Number(it.total || 0))}</td>
        <td><button type="button" class="danger small" data-del-doc-item="${idx}">✕</button></td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" class="note">אין פריטים</td></tr>`;

  // qty/price changes
  body.querySelectorAll('[data-qty],[data-price]').forEach(inp => {
    inp.addEventListener('input', () => {
      const i = Number(inp.dataset.qty ?? inp.dataset.price);
      if (!Number.isFinite(i) || !safeItems[i]) return;

      const qtyEl = body.querySelector(`[data-qty="${i}"]`);
      const priceEl = body.querySelector(`[data-price="${i}"]`);

      const qty = Number(qtyEl?.value || 0);
      const price = Number(priceEl?.value || 0);

      safeItems[i].qty = qty;
      safeItems[i].price = price;
      safeItems[i].total = qty * price;

      amountInput.value = calcDocItemsSum(safeItems);
      renderDocItems(safeItems);
    });
  });

  // delete row
  body.querySelectorAll('[data-del-doc-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.delDocItem);
      if (!Number.isFinite(i)) return;
      safeItems.splice(i, 1);
      amountInput.value = calcDocItemsSum(safeItems);
      renderDocItems(safeItems);
    });
  });
}

function addItemToDoc() {
  const modal = document.getElementById('docModal');
  const amountInput = document.getElementById('docAmount');
  if (!modal || !amountInput) return;

  const items = modal._items;
  if (!Array.isArray(items)) return;

  const item = store.state.items.find(i => i.active !== false);
  if (!item) return toast('אין פריטים זמינים');

  items.push({
    itemId: item.id,
    name: item.name,
    qty: 1,
    price: Number(item.price || 0),
    total: Number(item.price || 0)
  });

  amountInput.value = calcDocItemsSum(items);
  renderDocItems(items);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme === 'light' ? 'light' : '';
}

function getMonthKey(dateStr) {
  if (!dateStr) return '';
  return String(dateStr).slice(0, 7);
}

/* ---------- Tabs ---------- */
function switchScreen(id) {
  $$('.screen').forEach(s => s.classList.add('hide'));
  const target = document.getElementById(id);
  if (target) target.classList.remove('hide');

  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.screen === id));
}

function bindTabs() {
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });
}

/* ---------- Select builders ---------- */
function fillSupplierSelect(selectEl, includeAll = false) {
  const suppliers = store.state.suppliers.filter(s => s.active !== false);
  let html = includeAll ? `<option value="">כל הספקים</option>` : ``;
  html += suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  selectEl.innerHTML = html || (includeAll ? `<option value="">כל הספקים</option>` : `<option value="">אין ספקים</option>`);
}

function fillMainSelect(selectEl, includeAll = false) {
  const mains = store.state.primaryCategories.slice();
  let html = includeAll ? `<option value="">כל הקטגוריות</option>` : ``;
  html += mains.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
  selectEl.innerHTML = html || (includeAll ? `<option value="">כל הקטגוריות</option>` : `<option value="אחר">אחר</option>`);
}

function fillSubSelect(selectEl, mainValue = '', includeAll = false) {
  const subsAll = store.state.subCategories.slice();
  const subs = mainValue ? subsAll.filter(s => s.primary === mainValue) : subsAll;
  let html = includeAll ? `<option value="">כל התתי קטגוריות</option>` : ``;
  html += subs.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.primary + " › " + s.name)}</option>`).join('');
  selectEl.innerHTML = html || (includeAll ? `<option value="">כל התתי קטגוריות</option>` : `<option value="לא משויך">אחר › לא משויך</option>`);
}

function fillDocTypeSelect(selectEl, includeAll = false) {
  let html = includeAll ? `<option value="">כל הסוגים</option>` : ``;
  html += DOC_TYPES.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  selectEl.innerHTML = html;
}

/* ---------- Rendering ---------- */
function renderKPIs() {
  const docs = store.state.documents;
  const { total, docs: docsCount, unpaid } = calcKPIs(docs);

  $('#kpiTotal').textContent = money(total);
  $('#kpiDocs').textContent = String(docsCount);
  $('#kpiUnpaid').textContent = String(unpaid);

  // month badge = current month of latest doc, else current month
  const month = docs.length ? getMonthKey(docs[docs.length - 1].date) : new Date().toISOString().slice(0, 7);
  $('#kpiMonth').textContent = month || '—';
}

function renderDashboardSupplierCards() {
  const host = $('#supplierCards');
  const suppliers = store.state.suppliers.filter(s => s.active !== false);

  // compute totals per supplier
  const map = new Map();
  suppliers.forEach(s => map.set(s.id, { name: s.name, sum: 0, count: 0, unpaid: 0 }));

  store.state.documents.forEach(d => {
    const m = map.get(d.supplierId);
    if (!m) return;
    const val = calcDocTotal(d);
    m.sum += val;
    m.count += 1;
    if (d.paid === false) m.unpaid += val;
  });

  const cards = Array.from(map.values())
    .sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum))
    .slice(0, 8)
    .map(v => `
      <div class="kpi">
        <div class="k">${escapeHtml(v.name)}</div>
        <div class="v">${money(v.sum)}</div>
        <div class="note">מסמכים: <b>${v.count}</b> · פתוח: <b>${money(v.unpaid)}</b></div>
      </div>
    `).join('');

  host.innerHTML = cards || `<div class="empty">אין נתונים להצגה.</div>`;
}

function docCategoryLabel(d) {
  const main = d.main || 'אחר';
  const sub = d.sub || 'לא משויך';
  return `${main} › ${sub}`;
}

function getFilteredDocs() {
  const supplierId = $('#filterSupplier').value || '';
  const main = $('#filterMain').value || '';
  const sub = $('#filterSub').value || '';
  const type = $('#filterType').value || '';
  const from = $('#filterFrom').value || '';
  const to = $('#filterTo').value || '';

  return store.state.documents.filter(d => {
    if (supplierId && d.supplierId !== supplierId) return false;
    if (main && (d.main || '') !== main) return false;
    if (sub && (d.sub || '') !== sub) return false;
    if (type && (d.docType || '') !== type) return false;
    if (from && (!d.date || d.date < from)) return false;
    if (to && (!d.date || d.date > to)) return false;
    return true;
  });
}

function renderDocuments() {
  const body = $('#docsBody');
  const empty = $('#docsEmpty');

  const docsAll = store.state.documents;
  empty.classList.toggle('hide', docsAll.length !== 0);

  const docs = getFilteredDocs().slice().sort((a, b) => (b.date || '').localeCompare(a.date || '', 'he'));

  const suppliersById = new Map(store.state.suppliers.map(s => [s.id, s]));
  const rows = docs.map(d => {
    const s = suppliersById.get(d.supplierId);
    const supplierName = s ? s.name : '—';
    const amt = Number(d.amount || 0);
    const pill = d.paid === false ? `<span class="pill unpaid">לא שולם</span>` : `<span class="pill paid">שולם</span>`;
    const kind = escapeHtml(d.docType || '');

    return `
      <tr>
        <td>${escapeHtml(d.date || '')}</td>
        <td>${escapeHtml(supplierName)}</td>
        <td>${escapeHtml(docCategoryLabel(d))}</td>
        <td>${escapeHtml(d.desc || '')}</td>
        <td>${escapeHtml(d.number || '')}</td>
        <td><b>${money(amt)}</b></td>
        <td>${kind}</td>
        <td>${pill}</td>
        <td>
          <button class="outline small" data-edit-doc="${d.id}">ערוך</button>
          <button class="danger small" data-del-doc="${d.id}">מחק</button>
        </td>
      </tr>
    `;
  }).join('');

  body.innerHTML = rows || `<tr><td colspan="9" class="note">אין תוצאות לפי הסינון.</td></tr>`;

  $$('[data-edit-doc]').forEach(btn => btn.onclick = () => openDocForEdit(btn.dataset.editDoc));
  $$('[data-del-doc]').forEach(btn => btn.onclick = () => deleteDoc(btn.dataset.delDoc));
}

function renderSuppliers() {
  const body = $('#suppliersBody');
  const empty = $('#suppliersEmpty');

  const q = ($('#supplierSearch').value || '').trim();
  const subFilter = $('#supplierSubFilter').value || '';

  const list = store.state.suppliers
    .filter(s => s.active !== false)
    .filter(s => !q || (s.name || '').includes(q))
    .filter(s => !subFilter || s.sub === subFilter);

  empty.classList.toggle('hide', list.length !== 0);

  const rows = list.map(s => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.main || 'אחר')}</td>
      <td>${escapeHtml(s.sub || 'לא משויך')}</td>
      <td>${escapeHtml(s.phone || '')}</td>
      <td>${escapeHtml(s.email || '')}</td>
      <td>${escapeHtml(s.notes || '')}</td>
      <td>${s.active !== false ? 'כן' : 'לא'}</td>
      <td>
        <button class="outline small" data-edit-sup="${s.id}">ערוך</button>
        <button class="danger small" data-del-sup="${s.id}">מחק</button>
      </td>
    </tr>
  `).join('');

  body.innerHTML = rows || `<tr><td colspan="8" class="note">אין תוצאות.</td></tr>`;

  $$('[data-edit-sup]').forEach(btn => btn.onclick = () => openSupplierForEdit(btn.dataset.editSup));
  $$('[data-del-sup]').forEach(btn => btn.onclick = () => disableSupplier(btn.dataset.delSup));
}

function renderItems() {
  const body = $('#itemsBody');
  const empty = $('#itemsEmpty');

  const q = ($('#itemSearch').value || '').trim();
  const subFilter = $('#itemSubFilter').value || '';

  const list = store.state.items
    .filter(i => i.active !== false)
    .filter(i => !q || (i.name || '').includes(q))
    .filter(i => !subFilter || i.sub === subFilter);

  empty.classList.toggle('hide', list.length !== 0);

  const rows = list.map(i => `
    <tr>
      <td>${escapeHtml(i.name)}</td>
      <td>${escapeHtml(i.main || 'אחר')}</td>
      <td>${escapeHtml(i.sub || 'לא משויך')}</td>
      <td>${money(i.price || 0)}</td>
      <td>${escapeHtml(i.unit || '')}</td>
      <td>${i.active !== false ? 'כן' : 'לא'}</td>
      <td>
        <button class="outline small" data-edit-item="${i.id}">ערוך</button>
        <button class="danger small" data-del-item="${i.id}">מחק</button>
      </td>
    </tr>
  `).join('');

  body.innerHTML = rows || `<tr><td colspan="7" class="note">אין תוצאות.</td></tr>`;

  $$('[data-edit-item]').forEach(btn => btn.onclick = () => openItemForEdit(btn.dataset.editItem));
  $$('[data-del-item]').forEach(btn => btn.onclick = () => disableItem(btn.dataset.delItem));
}

/* ---------- Categories rendering + CRUD (primary/sub + merge/delete) ---------- */
function countUsageForPrimary(primary) {
  const subs = store.state.subCategories.filter(sc => sc.primary === primary).map(sc => sc.name);
  const sup = store.state.suppliers.filter(s => s.active !== false && s.main === primary).length;
  const items = store.state.items.filter(i => i.active !== false && i.main === primary).length;
  return { subsCount: subs.length, sup, items };
}

function countUsageForSub(subName) {
  const sup = store.state.suppliers.filter(s => s.active !== false && s.sub === subName).length;
  const items = store.state.items.filter(i => i.active !== false && i.sub === subName).length;
  return { sup, items };
}

let pendingPrimaryDelete = '';
let pendingSubDelete = '';

function renderCategories() {
  const q = ($('#catSearch').value || '').trim();
  const primBody = $('#primaryCatBody');
  const subBody = $('#subCatBody');

  const primaries = store.state.primaryCategories
    .filter(p => !q || p.includes(q))
    .slice()
    .sort((a, b) => a.localeCompare(b, 'he'));

  primBody.innerHTML = primaries.map(p => {
    const u = countUsageForPrimary(p);
    const disabled = protectedPrimary(p);
    return `
      <tr>
        <td>${escapeHtml(p)}</td>
        <td>${u.subsCount}</td>
        <td>${u.sup}</td>
        <td>${u.items}</td>
        <td>
          <button class="outline small" data-edit-primary="${escapeHtml(p)}">ערוך</button>
          <button class="danger small" data-del-primary="${escapeHtml(p)}" ${disabled ? 'disabled' : ''}>מחק</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5" class="note">אין תוצאות.</td></tr>`;

  const subs = store.state.subCategories
    .filter(sc => !q || sc.name.includes(q) || sc.primary.includes(q))
    .slice()
    .sort((a, b) => {
      const ap = a.primary.localeCompare(b.primary, 'he');
      if (ap !== 0) return ap;
      return a.name.localeCompare(b.name, 'he');
    });

  subBody.innerHTML = subs.map(sc => {
    const u = countUsageForSub(sc.name);
    const disabled = protectedSub(sc.name);
    return `
      <tr>
        <td>${escapeHtml(sc.primary)}</td>
        <td>${escapeHtml(sc.name)}</td>
        <td>${u.sup}</td>
        <td>${u.items}</td>
        <td>
          <button class="outline small" data-edit-sub="${escapeHtml(sc.name)}">ערוך</button>
          <button class="danger small" data-del-sub="${escapeHtml(sc.name)}" ${disabled ? 'disabled' : ''}>מחק</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5" class="note">אין תוצאות.</td></tr>`;

  $$('[data-edit-primary]').forEach(btn => btn.onclick = () => openPrimaryForEdit(btn.dataset.editPrimary));
  $$('[data-del-primary]').forEach(btn => btn.onclick = () => requestDeletePrimary(btn.dataset.delPrimary));

  $$('[data-edit-sub]').forEach(btn => btn.onclick = () => openSubForEdit(btn.dataset.editSub));
  $$('[data-del-sub]').forEach(btn => btn.onclick = () => requestDeleteSub(btn.dataset.delSub));
}

function openPrimaryForAdd() {
  $('#primaryCatModalTitle').textContent = 'קטגוריה ראשית חדשה';
  $('#primaryEditName').value = '';
  $('#primaryCatName').value = '';
  openModal('primaryCatModal');
}
function openPrimaryForEdit(name) {
  $('#primaryCatModalTitle').textContent = 'עריכת קטגוריה ראשית';
  $('#primaryEditName').value = name;
  $('#primaryCatName').value = name;
  openModal('primaryCatModal');
}
function savePrimaryCategory() {
  const oldName = ($('#primaryEditName').value || '').trim();
  const name = ($('#primaryCatName').value || '').trim();
  if (!name) return toast('חובה שם לקטגוריה ראשית');

  if (oldName && protectedPrimary(oldName) && oldName !== name) return toast('אי אפשר לשנות שם של קטגוריה ראשית מוגנת');

  store.commit(state => {
    if (oldName) {
      // rename
      state.primaryCategories = state.primaryCategories.filter(p => p !== oldName);
      state.primaryCategories.push(name);
      state.subCategories.forEach(sc => { if (sc.primary === oldName) sc.primary = name; });
      state.suppliers.forEach(s => { if (s.main === oldName) s.main = name; });
      state.items.forEach(i => { if (i.main === oldName) i.main = name; });
      state.documents.forEach(d => { if (d.main === oldName) d.main = name; });
    } else {
      if (state.primaryCategories.includes(name)) throw new Error('exists');
      state.primaryCategories.push(name);
    }
  });

  closeModal('primaryCatModal');
  toast(oldName ? 'קטגוריה ראשית עודכנה' : 'קטגוריה ראשית נוספה');
  renderAll();
}

function openSubForAdd() {
  $('#subCatModalTitle').textContent = 'תת קטגוריה חדשה';
  $('#subEditName').value = '';
  fillMainSelect($('#subCatPrimary'), false);
  $('#subCatPrimary').value = store.state.primaryCategories.includes('מזון') ? 'מזון' : (store.state.primaryCategories[0] || 'אחר');
  $('#subCatName').value = '';
  openModal('subCatModal');
}
function openSubForEdit(subName) {
  const sc = store.state.subCategories.find(x => x.name === subName);
  if (!sc) return;
  $('#subCatModalTitle').textContent = 'עריכת תת קטגוריה';
  $('#subEditName').value = sc.name;
  fillMainSelect($('#subCatPrimary'), false);
  $('#subCatPrimary').value = sc.primary;
  $('#subCatName').value = sc.name;
  openModal('subCatModal');
}
function saveSubCategory() {
  const oldName = ($('#subEditName').value || '').trim();
  const primary = $('#subCatPrimary').value || 'אחר';
  const name = ($('#subCatName').value || '').trim();
  if (!name) return toast('חובה שם לתת קטגוריה');

  if (oldName && protectedSub(oldName) && oldName !== name) return toast('אי אפשר לשנות שם של תת קטגוריה מוגנת');

  store.commit(state => {
    if (oldName) {
      // rename
      state.subCategories.forEach(sc => {
        if (sc.name === oldName) {
          sc.name = name;
          sc.primary = primary;
        }
      });

      state.suppliers.forEach(s => { if (s.sub === oldName) { s.sub = name; s.main = primary; } });
      state.items.forEach(i => { if (i.sub === oldName) { i.sub = name; i.main = primary; } });
      state.documents.forEach(d => { if (d.sub === oldName) { d.sub = name; d.main = primary; } });
    } else {
      if (state.subCategories.some(x => x.name === name)) throw new Error('exists');
      state.subCategories.push({ primary, name });
    }
  });

  closeModal('subCatModal');
  toast(oldName ? 'תת קטגוריה עודכנה' : 'תת קטגוריה נוספה');
  renderAll();
}

function requestDeletePrimary(primary) {
  if (protectedPrimary(primary)) return toast('אי אפשר למחוק קטגוריה ראשית מוגנת');
  pendingPrimaryDelete = primary;

  const u = countUsageForPrimary(primary);
  $('#primaryDelInfo').innerHTML = `קטגוריה ראשית: <b>${escapeHtml(primary)}</b> | תתי: <b>${u.subsCount}</b> | ספקים: <b>${u.sup}</b> | פריטים: <b>${u.items}</b>`;

  const targetOpts = store.state.primaryCategories
    .filter(p => p !== primary)
    .map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`)
    .join('') || `<option value="אחר">אחר</option>`;

  $('#primaryDelMergeSelect').innerHTML = targetOpts;
  openModal('primaryDeleteModal');
}

function mergeDeletePrimary() {
  const src = pendingPrimaryDelete;
  const target = $('#primaryDelMergeSelect').value || 'אחר';
  if (!src) return;
  if (!target || target === src) return toast('בחר יעד מיזוג');

  store.commit(state => {
    state.subCategories.forEach(sc => { if (sc.primary === src) sc.primary = target; });
    state.suppliers.forEach(s => { if (s.main === src) s.main = target; });
    state.items.forEach(i => { if (i.main === src) i.main = target; });
    state.documents.forEach(d => { if (d.main === src) d.main = target; });
    state.primaryCategories = state.primaryCategories.filter(p => p !== src);
  });

  pendingPrimaryDelete = '';
  closeModal('primaryDeleteModal');
  toast('בוצע מיזוג ומחיקה');
  renderAll();
}

function requestDeleteSub(subName) {
  if (protectedSub(subName)) return toast('אי אפשר למחוק תת קטגוריה מוגנת');
  pendingSubDelete = subName;

  const u = countUsageForSub(subName);
  const sc = store.state.subCategories.find(x => x.name === subName);
  const label = sc ? `${sc.primary} › ${sc.name}` : subName;
  $('#subDelInfo').innerHTML = `תת קטגוריה: <b>${escapeHtml(label)}</b> | ספקים: <b>${u.sup}</b> | פריטים: <b>${u.items}</b>`;

  const opts = store.state.subCategories
    .filter(x => x.name !== subName)
    .map(x => `<option value="${escapeHtml(x.name)}">${escapeHtml(x.primary + " › " + x.name)}</option>`)
    .join('') || `<option value="לא משויך">אחר › לא משויך</option>`;

  $('#subDelMergeSelect').innerHTML = opts;
  openModal('subDeleteModal');
}

function mergeDeleteSub(targetSub) {
  const src = pendingSubDelete;
  if (!src) return;
  if (!targetSub || targetSub === src) return toast('בחר יעד מיזוג');

  const targetSC = store.state.subCategories.find(x => x.name === targetSub);
  const targetMain = targetSC ? targetSC.primary : 'אחר';

  store.commit(state => {
    state.suppliers.forEach(s => { if (s.sub === src) { s.sub = targetSub; s.main = targetMain; } });
    state.items.forEach(i => { if (i.sub === src) { i.sub = targetSub; i.main = targetMain; } });
    state.documents.forEach(d => { if (d.sub === src) { d.sub = targetSub; d.main = targetMain; } });
    state.subCategories = state.subCategories.filter(x => x.name !== src);
  });

  pendingSubDelete = '';
  closeModal('subDeleteModal');
  toast('בוצע מיזוג ומחיקה');
  renderAll();
}

/* ---------- Documents CRUD ---------- */
function openDocForAdd() {
  $('#docModalTitle').textContent = 'מסמך חדש';
  $('#docEditId').value = '';
  $('#docDate').value = new Date().toISOString().slice(0, 10);

  fillSupplierSelect($('#docSupplier'), false);
  fillMainSelect($('#docMain'), false);

  const firstSupplierId = $('#docSupplier').value || (store.state.suppliers[0]?.id || '');
  $('#docSupplier').value = firstSupplierId;

  // align categories from supplier
  const s = store.state.suppliers.find(x => x.id === firstSupplierId);
  const main = s?.main || 'אחר';
  const sub = s?.sub || 'לא משויך';

  $('#docMain').value = main;
  fillSubSelect($('#docSub'), main, false);
  $('#docSub').value = sub;

  $('#docType').value = 'חשבונית';
  $('#docNumber').value = '';
  $('#docDesc').value = '';
  $('#docAmount').value = '';
  $('#docVat').checked = true;
  $('#docPaid').checked = true;
  $('#docNotes').value = '';

  openModal('docModal');
  const modal = document.getElementById('docModal');
modal._items = [];
renderDocItems(modal._items);

// אם אתה רוצה שסכום ייגזר רק מפריטים:
document.getElementById('docAmount').value = 0;
}

function openDocForEdit(id) {
  const d = store.state.documents.find(x => x.id === id);
  if (!d) return;

const modal = document.getElementById('docModal');
modal._items = structuredClone(d.items || []);
renderDocItems(modal._items);

// עדכון סכום לפי פריטים (מומלץ כדי לא להסתנכרן לא נכון)
document.getElementById('docAmount').value = calcDocItemsSum(modal._items);

  $('#docModalTitle').textContent = 'עריכת מסמך';
  $('#docEditId').value = d.id;
  $('#docDate').value = d.date || new Date().toISOString().slice(0, 10);

  fillSupplierSelect($('#docSupplier'), false);
  $('#docSupplier').value = d.supplierId || '';

  fillMainSelect($('#docMain'), false);
  $('#docMain').value = d.main || 'אחר';

  fillSubSelect($('#docSub'), $('#docMain').value, false);
  $('#docSub').value = d.sub || 'לא משויך';

  $('#docType').value = d.docType || 'חשבונית';
  $('#docNumber').value = d.number || '';
  $('#docDesc').value = d.desc || '';
  $('#docAmount').value = Number(d.amount || 0);
  $('#docVat').checked = !!d.vatApplied;
  $('#docPaid').checked = d.paid !== false;
  $('#docNotes').value = d.notes || '';

  openModal('docModal');
}

function saveDoc() {
  const editId = ($('#docEditId').value || '').trim();
  const date = $('#docDate').value || new Date().toISOString().slice(0, 10);
  const supplierId = $('#docSupplier').value;
  const main = $('#docMain').value || 'אחר';
  const sub = $('#docSub').value || 'לא משויך';
  const docType = $('#docType').value || 'חשבונית';
  const number = ($('#docNumber').value || '').trim();
  const desc = ($('#docDesc').value || '').trim();
  const amount = Number($('#docAmount').value || 0);
  const vatApplied = $('#docVat').checked;
  const paid = $('#docPaid').checked;
  const notes = ($('#docNotes').value || '').trim();
const modal = document.getElementById('docModal');
const items = Array.isArray(modal._items) ? modal._items : [];

const doc = {
  // ...
  items,
  amount: calcDocItemsSum(items),
  // ...
};
  if (!supplierId) return toast('חובה לבחור ספק');
  if (!sub) return toast('חובה לבחור תת־קטגוריה');

  store.commit(state => {
    const s = state.suppliers.find(x => x.id === supplierId);
    const fixedMain = s ? s.main : main;
    const fixedSub = s ? s.sub : sub;

    const doc = {
      id: editId || crypto.randomUUID(),
      date,
      supplierId,
      main: fixedMain,
      sub: fixedSub,
      docType,
      number,
      desc,
      amount: amount,
      vatApplied,
      paid: !!paid,
      notes
    };

    if (editId) {
      const idx = state.documents.findIndex(x => x.id === editId);
      if (idx >= 0) state.documents[idx] = doc;
      else state.documents.push(doc);
    } else {
      state.documents.push(doc);
    }
  });

  closeModal('docModal');
  toast(editId ? 'המסמך עודכן' : 'נוסף מסמך');
  renderAll();
  switchScreen('documents');
}

function deleteDoc(id) {
  const d = store.state.documents.find(x => x.id === id);
  if (!d) return;
  if (!confirm(`למחוק מסמך "${d.number || ''}"?`)) return;

  store.commit(state => {
    state.documents = state.documents.filter(x => x.id !== id);
  });

  toast('המסמך נמחק');
  renderAll();
}

/* ---------- Supplier CRUD ---------- */
function openSupplierForAdd() {
  $('#supplierModalTitle').textContent = 'ספק חדש';
  $('#supEditId').value = '';
  $('#supName').value = '';
  fillMainSelect($('#supMain'), false);
  $('#supMain').value = store.state.primaryCategories.includes('מזון') ? 'מזון' : (store.state.primaryCategories[0] || 'אחר');
  fillSubSelect($('#supSub'), $('#supMain').value, false);
  $('#supSub').value = 'לא משויך';
  $('#supPhone').value = '';
  $('#supEmail').value = '';
  $('#supNotes').value = '';
  $('#supActive').checked = true;
  openModal('supplierModal');
}

function openSupplierForEdit(id) {
  const s = store.state.suppliers.find(x => x.id === id);
  if (!s) return;

  $('#supplierModalTitle').textContent = 'עריכת ספק';
  $('#supEditId').value = s.id;
  $('#supName').value = s.name || '';

  fillMainSelect($('#supMain'), false);
  $('#supMain').value = s.main || 'אחר';
  fillSubSelect($('#supSub'), $('#supMain').value, false);
  $('#supSub').value = s.sub || 'לא משויך';

  $('#supPhone').value = s.phone || '';
  $('#supEmail').value = s.email || '';
  $('#supNotes').value = s.notes || '';
  $('#supActive').checked = s.active !== false;

  openModal('supplierModal');
}

function saveSupplier() {
  const editId = ($('#supEditId').value || '').trim();
  const name = ($('#supName').value || '').trim();
  const main = $('#supMain').value || 'אחר';
  const sub = $('#supSub').value || 'לא משויך';
  const phone = ($('#supPhone').value || '').trim();
  const email = ($('#supEmail').value || '').trim();
  const notes = ($('#supNotes').value || '').trim();
  const active = $('#supActive').checked;

  if (!name) return toast('חובה שם ספק');

  store.commit(state => {
    // ensure sub exists (if user created elsewhere)
    const sc = state.subCategories.find(x => x.name === sub);
    if (!sc) state.subCategories.push({ primary: main, name: sub });

    // uniqueness by name
    const dup = state.suppliers.find(s => s.name === name && s.id !== editId);
    if (dup) throw new Error('dup');

    if (editId) {
      const s = state.suppliers.find(x => x.id === editId);
      if (!s) throw new Error('missing');
      s.name = name;
      s.main = main;
      s.sub = sub;
      s.phone = phone;
      s.email = email;
      s.notes = notes;
      s.active = active;

      // update docs referencing supplier => keep supplier categories
      state.documents.forEach(d => {
        if (d.supplierId === editId) {
          d.main = main;
          d.sub = sub;
        }
      });
    } else {
      state.suppliers.push({
        id: crypto.randomUUID(),
        name,
        main,
        sub,
        phone,
        email,
        notes,
        active
      });
    }
  });

  closeModal('supplierModal');
  toast(editId ? 'הספק עודכן' : 'נוסף ספק');
  renderAll();
}

function disableSupplier(id) {
  const s = store.state.suppliers.find(x => x.id === id);
  if (!s) return;
  if (!confirm(`להשבית את הספק "${s.name}"?`)) return;

  store.commit(state => {
    const sup = state.suppliers.find(x => x.id === id);
    if (sup) sup.active = false;
  });

  toast('הספק הושבת');
  renderAll();
}

/* ---------- Item CRUD ---------- */
function openItemForAdd() {
  $('#itemModalTitle').textContent = 'פריט חדש';
  $('#itemEditId').value = '';
  $('#itemName').value = '';
  fillMainSelect($('#itemMain'), false);
  $('#itemMain').value = store.state.primaryCategories.includes('שתייה') ? 'שתייה' : (store.state.primaryCategories[0] || 'אחר');
  fillSubSelect($('#itemSub'), $('#itemMain').value, false);
  $('#itemSub').value = 'לא משויך';
  $('#itemPrice').value = '';
  $('#itemUnit').value = 'יחידה';
  $('#itemActive').checked = true;
  openModal('itemModal');
}

function openItemForEdit(id) {
  const it = store.state.items.find(x => x.id === id);
  if (!it) return;

  $('#itemModalTitle').textContent = 'עריכת פריט';
  $('#itemEditId').value = it.id;
  $('#itemName').value = it.name || '';

  fillMainSelect($('#itemMain'), false);
  $('#itemMain').value = it.main || 'אחר';
  fillSubSelect($('#itemSub'), $('#itemMain').value, false);
  $('#itemSub').value = it.sub || 'לא משויך';

  $('#itemPrice').value = Number(it.price || 0);
  $('#itemUnit').value = it.unit || 'יחידה';
  $('#itemActive').checked = it.active !== false;

  openModal('itemModal');
}

function saveItem() {
  const editId = ($('#itemEditId').value || '').trim();
  const name = ($('#itemName').value || '').trim();
  const main = $('#itemMain').value || 'אחר';
  const sub = $('#itemSub').value || 'לא משויך';
  const price = Number($('#itemPrice').value || 0);
  const unit = ($('#itemUnit').value || 'יחידה').trim() || 'יחידה';
  const active = $('#itemActive').checked;

  if (!name) return toast('חובה שם פריט');

  store.commit(state => {
    const sc = state.subCategories.find(x => x.name === sub);
    if (!sc) state.subCategories.push({ primary: main, name: sub });

    const dup = state.items.find(i => i.name === name && i.id !== editId);
    if (dup) throw new Error('dup');

    if (editId) {
      const it = state.items.find(x => x.id === editId);
      if (!it) throw new Error('missing');
      it.name = name;
      it.main = main;
      it.sub = sub;
      it.price = price;
      it.unit = unit;
      it.active = active;
    } else {
      state.items.push({
        id: crypto.randomUUID(),
        name,
        main,
        sub,
        price,
        unit,
        active
      });
    }
  });

  closeModal('itemModal');
  toast(editId ? 'הפריט עודכן' : 'נוסף פריט');
  renderAll();
}

function disableItem(id) {
  const it = store.state.items.find(x => x.id === id);
  if (!it) return;
  if (!confirm(`להשבית את הפריט "${it.name}"?`)) return;

  store.commit(state => {
    const item = state.items.find(x => x.id === id);
    if (item) item.active = false;
  });

  toast('הפריט הושבת');
  renderAll();
}

/* ---------- Export/Import/Clear ---------- */
function exportJson() {
  const blob = new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `visu_exp_export_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  toast('בוצע ייצוא JSON');
}

function importJson() {
  $('#fileInput').click();
}

function bindImportFile() {
  $('#fileInput').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    const r = new FileReader();
    r.onload = () => {
      try {
        const incoming = JSON.parse(r.result);
        store.commit(state => {
          Object.keys(state).forEach(k => delete state[k]);
          Object.assign(state, incoming);
        });
        toast('ייבוא הצליח');
        renderAll();
      } catch {
        alert('הקובץ לא תקין או לא בפורמט JSON.');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  });
}

function clearAll() {
  if (!confirm('לאפס הכל? פעולה בלתי הפיכה.')) return;
  localStorage.clear();
  location.reload();
}

/* ---------- Wiring / dependencies between selects ---------- */
function bindSelectDependencies() {
  // doc modal: supplier => auto categories
  $('#docSupplier').addEventListener('change', () => {
    const sid = $('#docSupplier').value;
    const s = store.state.suppliers.find(x => x.id === sid);
    const main = s?.main || 'אחר';
    const sub = s?.sub || 'לא משויך';
    $('#docMain').value = main;
    fillSubSelect($('#docSub'), main, false);
    $('#docSub').value = sub;
  });

  // doc modal: main => sub list
  $('#docMain').addEventListener('change', () => {
    fillSubSelect($('#docSub'), $('#docMain').value, false);
  });

  // supplier modal: main => sub list
  $('#supMain').addEventListener('change', () => {
    fillSubSelect($('#supSub'), $('#supMain').value, false);
  });

  // item modal: main => sub list
  $('#itemMain').addEventListener('change', () => {
    fillSubSelect($('#itemSub'), $('#itemMain').value, false);
  });

  // documents filters: main => sub list
  $('#filterMain').addEventListener('change', () => {
    fillSubSelect($('#filterSub'), $('#filterMain').value, true);
    renderDocuments();
  });
}

/* ---------- Filters binding ---------- */
function bindFilters() {
  ['filterSupplier', 'filterSub', 'filterType', 'filterFrom', 'filterTo'].forEach(id => {
    $( `#${id}` ).addEventListener('change', renderDocuments);
    $( `#${id}` ).addEventListener('input', renderDocuments);
  });

  $('#clearFilters').addEventListener('click', () => {
    $('#filterSupplier').value = '';
    $('#filterMain').value = '';
    fillSubSelect($('#filterSub'), '', true);
    $('#filterSub').value = '';
    $('#filterType').value = '';
    $('#filterFrom').value = '';
    $('#filterTo').value = '';
    renderDocuments();
  });
}

/* ---------- Global render ---------- */
function refreshAllSelects() {
  // filters
  fillSupplierSelect($('#filterSupplier'), true);
  fillMainSelect($('#filterMain'), true);
  fillSubSelect($('#filterSub'), '', true);
  fillDocTypeSelect($('#filterType'), true);

  // supplier/item filters
  fillSubSelect($('#supplierSubFilter'), '', true);
  fillSubSelect($('#itemSubFilter'), '', true);
}

function renderAll() {
  renderKPIs();
  renderDashboardSupplierCards();
  refreshAllSelects();
  renderDocuments();
  renderSuppliers();
  renderCategories();
  renderItems();
}

/* ---------- Bind buttons ---------- */
function bindActions() {
  
  // top actions
document.getElementById('addDocItem').addEventListener('click', addItemToDoc);
  $('#addDoc').addEventListener('click', openDocForAdd);
  $('#addDoc2').addEventListener('click', openDocForAdd);

  $('#addSupplier').addEventListener('click', openSupplierForAdd);
  $('#addSupplier2').addEventListener('click', openSupplierForAdd);

  $('#addItem').addEventListener('click', openItemForAdd);
  $('#addItem2').addEventListener('click', openItemForAdd);

  $('#addPrimaryCategory').addEventListener('click', openPrimaryForAdd);
  $('#addSubCategory').addEventListener('click', openSubForAdd);
  $('#addSubCategoryQuick').addEventListener('click', () => { switchScreen('categories'); openSubForAdd(); });

  // modal close
  $('#cancelDocBtn').addEventListener('click', () => closeModal('docModal'));
  $('#cancelSupplierBtn').addEventListener('click', () => closeModal('supplierModal'));
  $('#cancelItemBtn').addEventListener('click', () => closeModal('itemModal'));

  $('#cancelPrimaryCatBtn').addEventListener('click', () => closeModal('primaryCatModal'));
  $('#cancelSubCatBtn').addEventListener('click', () => closeModal('subCatModal'));

  $('#primaryDelCancelBtn').addEventListener('click', () => { pendingPrimaryDelete = ''; closeModal('primaryDeleteModal'); });
  $('#subDelCancelBtn').addEventListener('click', () => { pendingSubDelete = ''; closeModal('subDeleteModal'); });

  // modal save
  $('#saveDocBtn').addEventListener('click', saveDoc);
  $('#saveSupplierBtn').addEventListener('click', saveSupplier);
  $('#saveItemBtn').addEventListener('click', saveItem);

  $('#savePrimaryCatBtn').addEventListener('click', () => {
    try { savePrimaryCategory(); }
    catch (e) { toast(e?.message === 'exists' ? 'קטגוריה ראשית קיימת' : 'שגיאה בשמירה'); }
  });

  $('#saveSubCatBtn').addEventListener('click', () => {
    try { saveSubCategory(); }
    catch (e) { toast(e?.message === 'exists' ? 'תת קטגוריה קיימת' : 'שגיאה בשמירה'); }
  });

  // merges
  $('#primaryDelMergeBtn').addEventListener('click', mergeDeletePrimary);
  $('#subDelMergeBtn').addEventListener('click', () => mergeDeleteSub($('#subDelMergeSelect').value || ''));
  $('#subDelToUnassignedBtn').addEventListener('click', () => mergeDeleteSub('לא משויך'));

  // export/import/clear
  $('#exportJson').addEventListener('click', exportJson);
  $('#importJson').addEventListener('click', importJson);
  $('#clearAll').addEventListener('click', clearAll);

  // searches
  $('#supplierSearch').addEventListener('input', renderSuppliers);
  $('#supplierSubFilter').addEventListener('change', renderSuppliers);

  $('#itemSearch').addEventListener('input', renderItems);
  $('#itemSubFilter').addEventListener('change', renderItems);

  $('#catSearch').addEventListener('input', renderCategories);
}

/* ---------- Init ---------- */
function init() {
  bindToastClose();
  bindTabs();

  // theme (kept simple: default dark)
  setTheme(store.state.theme || 'dark');

  // initial select fills for modals
  fillSupplierSelect($('#docSupplier'), false);
  fillMainSelect($('#docMain'), false);
  fillSubSelect($('#docSub'), $('#docMain').value, false);

  fillMainSelect($('#supMain'), false);
  fillSubSelect($('#supSub'), $('#supMain').value, false);

  fillMainSelect($('#itemMain'), false);
  fillSubSelect($('#itemSub'), $('#itemMain').value, false);

  bindSelectDependencies();
  bindFilters();
  bindImportFile();
  bindActions();

  renderAll();
  switchScreen('dashboard');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}