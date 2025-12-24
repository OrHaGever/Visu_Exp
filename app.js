/* ================= Visual Expense - app.js (stable unified) ================= */

/* ---------- DOM helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };

function uid(){
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function money(n){
  const v = Number(n || 0);
  return "₪" + v.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function openModal(id){ const el = $("#"+id); if (el) el.style.display = "flex"; }
function closeModal(id){ const el = $("#"+id); if (el) el.style.display = "none"; }

let toastTimer = null;
function toast(msg, timeout=2600){
  const t = $("#toast");
  const m = $("#toastMsg");
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.remove("hide");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.add("hide"), timeout);
}
on("#toastBtn","click", ()=> $("#toast")?.classList.add("hide"));

/* ---------- Storage ---------- */
const KEY = "hatzeDef-supplier-dashboard-v3";

/* ---------- Defaults (single source of truth) ---------- */
const DEFAULT_PRIMARY_CATEGORIES = ["מזון","שתייה","שירותים חיצוניים","תחזוקה","חשמל וגז","ארנונה","אחר"];
const DEFAULT_SUBCATEGORIES = [
  { primary:"אחר", name:"לא משויך" },

  { primary:"מזון", name:"דגים" },
  { primary:"מזון", name:"בשר" },
  { primary:"מזון", name:"קינוחים" },
  { primary:"מזון", name:"קרח" },

  { primary:"שתייה", name:"שתייה קלה" },
  { primary:"שתייה", name:"אלכוהול" },
  { primary:"שתייה", name:"יין" },
  { primary:"שתייה", name:"קפה ותה" },

  { primary:"תחזוקה", name:"אריזות וחד-פעמי" },
  { primary:"תחזוקה", name:"נייר ומוצרי נייר" },
  { primary:"תחזוקה", name:"ניקיון והיגיינה" },
  { primary:"תחזוקה", name:"תחזוקה ותיקונים" },
  { primary:"תחזוקה", name:"ציוד מטבח" },
  { primary:"תחזוקה", name:"ציוד בר" },

  { primary:"שירותים חיצוניים", name:"שיווק ופרסום" },
  { primary:"שירותים חיצוניים", name:"משלוחים ופלטפורמות" },
  { primary:"שירותים חיצוניים", name:"תקשורת ואינטרנט" },
  { primary:"שירותים חיצוניים", name:"מערכות ותוכנה" },
  { primary:"שירותים חיצוניים", name:"כוח אדם" },
  { primary:"שירותים חיצוניים", name:"עמלות וסליקה" },
  { primary:"שירותים חיצוניים", name:"מיחזור ופינוי" },
  { primary:"שירותים חיצוניים", name:"פרחים ועיצוב" },

  { primary:"חשמל וגז", name:"חשמל / מים / גז" },
  { primary:"ארנונה", name:"מיסים וארנונה" }
];

const PROTECTED_PRIMARY = new Set(["אחר"]);
const PROTECTED_SUB = new Set(["לא משויך"]);

const DEFAULT_SUPPLIERS = [
  "מדחסקור אוניברסל","ג׳אקו שירות למטבחים","יוסי סימן טוב","י.שבי","צ.י.שיווק","קנקון",
  "לוילן סחר ומוצרים חקלאיים בע״מ","עואודה לשיווק בע״מ","מדג סי פרוט בע״מ","אהרון שיווק",
  "שיווק שלי א.א בע״מ","אקיפ החברה לציוד מלונאי בע״מ","דאלאס מוצרי נייר בע״מ","חברת חשמל",
  "א.א.ר שירותי ביוב","תמי 4","בזק","היכל היין","החברה המרכזית","סוקליק","ביסקוטי","אייס דרים",
  "ג.מ טעם הארץ בע״מ","יזמקו חברה בע״מ","אסטרטג טכנולוגיות בע״מ","אביב אש מערכות בע״מ","מניב ראשון",
  "אודי בכור שיווק דגים בע״מ","לירי כוח אדם בע״מ","מש-נט בע״מ","זאפ גרופ בע״מ","שיא \"10\" בע״מ",
  "קורקידי יעקב שיווק והפצה בסיטונאות","מקס עסקים","וינטר מכשירי גז בע״מ","מפעל הפרסום","וולט",
  "אלירן פרחים","פרסום תבור בעצ","אינפיניה מחזור","ייצוגית פלוס תעשיות בע״מ","משלוחה",
  "ביימי טכנולוגיות","ישראכרט","סוגת","אייפרקטיקום","אמישרגז","מאירוביץ שלי",
  "לה פסטה דלה קזה בע״מ","ארנונה ראשון לציון"
];

const DEFAULT_ITEMS = [
  { name: "דניס", category: "דגים", price: 29.90, unit: "ק״ג" },
  { name: "לברק", category: "דגים", price: 29.90, unit: "ק״ג" },
  { name: "מושט", category: "דגים", price: 24.90, unit: "ק״ג" },
  { name: "ברבוניה", category: "דגים", price: 39.90, unit: "ק״ג" },
  { name: "בר ים", category: "דגים", price: 34.90, unit: "ק״ג" },
  { name: "סלמון", category: "דגים", price: 49.90, unit: "ק״ג" },
  { name: "לוקוס", category: "דגים", price: 89.90, unit: "ק״ג" }
];

function inferSupplierCategory(name=""){
  const n = String(name).toLowerCase();
  if (n.includes("חשמל") || n.includes("גז") || n.includes("אמישרגז") || n.includes("וינטר")) return "חשמל / מים / גז";
  if (n.includes("ארנונה")) return "מיסים וארנונה";
  if (n.includes("בזק") || n.includes("אינטרנט") || n.includes("מש-נט") || n.includes("אייפרקטיקום")) return "תקשורת ואינטרנט";
  if (n.includes("ישראכרט") || n.includes("מקס")) return "עמלות וסליקה";
  if (n.includes("וולט") || n.includes("משלוחה")) return "משלוחים ופלטפורמות";
  if (n.includes("יין") || n.includes("היכל היין")) return "יין";
  if (n.includes("שתייה") || n.includes("החברה המרכזית") || n.includes("סוקליק")) return "שתייה קלה";
  if (n.includes("קינוחים") || n.includes("ביסקוטי") || n.includes("אייס דרים")) return "קינוחים";
  if (n.includes("פרחים")) return "פרחים ועיצוב";
  if (n.includes("דגים") || n.includes("מזון") || n.includes("שיווק") || n.includes("חקלאיים") || n.includes("טעם הארץ") || n.includes("לה פסטה") || n.includes("סוגת")) return "דגים";
  return "לא משויך";
}

/* ---------- State ---------- */
let state = {
  version: 7,
  theme: "dark",
  currentMonth: "",
  months: {},          // month -> { income:number, docs:[] }
  primaryCategories: [],
  subCategories: [],   // {primary,name}
  suppliers: [],       // {id,name,category(sub),primaryCategory,phone,email,notes,active}
  items: [],           // {id,name,category(sub),primaryCategory,price,unit,active}
};

function ensureMonth(month){
  if (!state.months) state.months = {};
  if (!state.months[month]) state.months[month] = { income: 0, docs: [] };
}
function currentMonthObj(){ return state.months[state.currentMonth]; }

function save(){
  localStorage.setItem(KEY, JSON.stringify(state));
}

/* ---------- Category model + migration ---------- */
function mapOldCategoryToPrimary(subName){
  const n = String(subName||"").trim();
  if (["דגים","בשר","קינוחים","קרח"].includes(n)) return "מזון";
  if (["שתייה קלה","אלכוהול","יין","קפה ותה"].includes(n)) return "שתייה";
  if (["חשמל / מים / גז"].includes(n)) return "חשמל וגז";
  if (["מיסים וארנונה"].includes(n)) return "ארנונה";
  if (["תקשורת ואינטרנט","מערכות ותוכנה","כוח אדם","עמלות וסליקה","מיחזור ופינוי","פרחים ועיצוב","שיווק ופרסום","משלוחים ופלטפורמות"].includes(n)) return "שירותים חיצוניים";
  if (["אריזות וחד-פעמי","נייר ומוצרי נייר","ניקיון והיגיינה","תחזוקה ותיקונים","ציוד מטבח","ציוד בר"].includes(n)) return "תחזוקה";
  return "אחר";
}
function ensureCategoryModel(){
  if (!Array.isArray(state.primaryCategories)) state.primaryCategories = [];
  if (!Array.isArray(state.subCategories)) state.subCategories = [];

  // seed primaries
  const pSet = new Set(state.primaryCategories);
  DEFAULT_PRIMARY_CATEGORIES.forEach(p=>{ if(!pSet.has(p)) state.primaryCategories.push(p); });

  // seed subs (unique by name)
  const nameSet = new Set(state.subCategories.map(x=>x.name));
  DEFAULT_SUBCATEGORIES.forEach(sc=>{
    if (!nameSet.has(sc.name)){
      state.subCategories.push({ primary: sc.primary, name: sc.name });
      nameSet.add(sc.name);
    }
  });

  // guarantee "לא משויך"
  if (!state.subCategories.some(x=>x.name==="לא משויך")){
    state.subCategories.push({ primary:"אחר", name:"לא משויך" });
  }
  if (!state.primaryCategories.includes("אחר")) state.primaryCategories.push("אחר");

  // fix invalid primaries
  state.subCategories.forEach(sc=>{
    if (!state.primaryCategories.includes(sc.primary)) sc.primary = "אחר";
  });

  // suppliers/items: make sure category exists as sub
  (state.suppliers||[]).forEach(s=>{
    const sub = (s.category || "לא משויך");
    if (!state.subCategories.some(x=>x.name===sub)){
      state.subCategories.push({ primary: s.primaryCategory || mapOldCategoryToPrimary(sub), name: sub });
    }
    s.primaryCategory = getPrimaryForSub(sub);
  });
  (state.items||[]).forEach(i=>{
    const sub = (i.category || "לא משויך");
    if (!state.subCategories.some(x=>x.name===sub)){
      state.subCategories.push({ primary: i.primaryCategory || mapOldCategoryToPrimary(sub), name: sub });
    }
    i.primaryCategory = getPrimaryForSub(sub);
  });

  // sort
  state.primaryCategories = Array.from(new Set(state.primaryCategories)).sort((a,b)=>a.localeCompare(b,"he"));
  state.subCategories = state.subCategories
    .filter(sc=>sc && sc.name)
    .sort((a,b)=>{
      const ap=a.primary.localeCompare(b.primary,"he");
      if (ap!==0) return ap;
      return a.name.localeCompare(b.name,"he");
    });
}
function getPrimaryForSub(subName){
  const sc = (state.subCategories||[]).find(x=>x.name===subName);
  return sc ? sc.primary : mapOldCategoryToPrimary(subName);
}
function ensureSubExists(primary, subName){
  if (!subName) return;
  if (!state.primaryCategories.includes(primary)) primary="אחר";
  if (!state.subCategories.some(x=>x.name===subName)){
    state.subCategories.push({ primary, name: subName });
    ensureCategoryModel();
  }
}
function catDisplay(subName){
  const p = getPrimaryForSub(subName);
  return `${p} › ${subName || "לא משויך"}`;
}

/* ---------- Docs ---------- */
function normalizeDoc(d){
  if (!d.id) d.id = uid();
  if (!d.date) d.date = new Date().toISOString().slice(0,10);
  if (!d.type) d.type = "חשבונית";
  if (!d.status) d.status = "שולם";
  if (d.vatApplied === undefined) d.vatApplied = true;
  if (d.notes === undefined) d.notes = "";
  if (!d.docNo) d.docNo = "";
  if (!Array.isArray(d.lines)) d.lines = [];
  if (d.manualAmount === undefined) d.manualAmount = 0;
  if (d.baseSubtotal === undefined) d.baseSubtotal = 0;
  if (d.amount === undefined) d.amount = 0;
  if (!d.supplierId) d.supplierId = "";
}
function recomputeDocAmounts(d){
  let base = 0;
  if (Array.isArray(d.lines) && d.lines.length){
    base = d.lines.reduce((sum,ln)=> sum + ((+ln.qty||0) * (+ln.unitPrice||0)), 0);
  } else {
    base = +d.manualAmount || 0;
  }
  d.baseSubtotal = base;

  let total = base;
  if (d.vatApplied) total *= 1.18;

  if (d.type === "זיכוי") total = -Math.abs(total);
  else total = Math.abs(total);

  d.amount = +total;
  return d;
}

/* ---------- Load + merge defaults ---------- */
function mergeDefaults(){
  // suppliers
  if (!Array.isArray(state.suppliers)) state.suppliers = [];
  const supByName = new Map(state.suppliers.map(s=>[String(s.name||"").trim(), s]));
  DEFAULT_SUPPLIERS.forEach(name=>{
    const n = String(name).trim();
    if (!supByName.has(n)){
      const sub = inferSupplierCategory(n);
      state.suppliers.push({
        id: uid(), name:n,
        category: sub,
        primaryCategory: mapOldCategoryToPrimary(sub),
        phone:"", email:"", notes:"",
        active:true
      });
    }
  });
  state.suppliers.forEach(s=>{
    if (!s.id) s.id = uid();
    if (!s.name) s.name = "—";
    if (!s.category) s.category = "לא משויך";
    if (s.active === undefined) s.active = true;
    if (s.phone === undefined) s.phone = "";
    if (s.email === undefined) s.email = "";
    if (s.notes === undefined) s.notes = "";
  });
  state.suppliers.sort((a,b)=>(a.name||"").localeCompare((b.name||""),"he"));

  // items
  if (!Array.isArray(state.items)) state.items = [];
  const itemByName = new Map(state.items.map(i=>[String(i.name||"").trim(), i]));
  DEFAULT_ITEMS.forEach(it=>{
    const n = String(it.name).trim();
    if (!itemByName.has(n)){
      const sub = it.category || "לא משויך";
      state.items.push({
        id: uid(),
        name: n,
        category: sub,
        primaryCategory: mapOldCategoryToPrimary(sub),
        price: +it.price || 0,
        unit: it.unit || "יחידה",
        active: true
      });
    }
  });
  state.items.forEach(i=>{
    if (!i.id) i.id = uid();
    if (!i.category) i.category = "לא משויך";
    if (i.price === undefined || i.price === null) i.price = 0;
    if (!i.unit) i.unit = "יחידה";
    if (i.active === undefined) i.active = true;
  });
  state.items.sort((a,b)=>(a.name||"").localeCompare((b.name||""),"he"));
}

function load(){
  const raw = localStorage.getItem(KEY);
  if (raw){
    try { state = JSON.parse(raw) || state; } catch(e){}
  }
  if (!state || typeof state !== "object") state = {};

  if (!state.theme) state.theme = "dark";
  if (!state.currentMonth) state.currentMonth = new Date().toISOString().slice(0,7);
  ensureMonth(state.currentMonth);

  // normalize docs
  Object.keys(state.months || {}).forEach(m=>{
    ensureMonth(m);
    const docs = state.months[m].docs || [];
    docs.forEach(d=>{
      normalizeDoc(d);
      (d.lines||[]).forEach(ln=>{
        if (!ln.id) ln.id = uid();
        if (!ln.itemId) ln.itemId = "";
        if (ln.qty === undefined) ln.qty = 0;
        if (ln.unitPrice === undefined) ln.unitPrice = 0;
        if (!ln.name) ln.name = "";
        if (!ln.unit) ln.unit = "";
      });
      recomputeDocAmounts(d);
    });
    state.months[m].docs = docs;
    if (state.months[m].income === undefined) state.months[m].income = 0;
  });

  if (!Array.isArray(state.primaryCategories)) state.primaryCategories = [];
  if (!Array.isArray(state.subCategories)) state.subCategories = [];

  mergeDefaults();
  ensureCategoryModel();

  save();
}

/* ---------- Theme ---------- */
function applyTheme(){
  document.documentElement.dataset.theme = state.theme === "light" ? "light" : "";
}
on("#themeBtn","click", ()=>{
  state.theme = (state.theme==="light") ? "dark" : "light";
  applyTheme();
  save();
  toast("ערכת נושא עודכנה");
});

/* ---------- Data access ---------- */
function supplierById(id){ return (state.suppliers||[]).find(s=>s.id===id) || null; }
function itemById(id){ return (state.items||[]).find(i=>i.id===id) || null; }
function activeSuppliers(){ return (state.suppliers||[]).filter(s=>s.active!==false); }
function activeItems(){ return (state.items||[]).filter(i=>i.active!==false); }

/* ---------- Navigation ---------- */
function switchScreen(id){
  $$(".screen").forEach(s=> s.classList.add("hide"));
  $("#"+id)?.classList.remove("hide");
  $$(".tab").forEach(b=> b.classList.toggle("active", b.dataset.screen===id));
}
$$(".tab").forEach(b=> b.addEventListener("click", ()=> switchScreen(b.dataset.screen)));

// Fallback: buttons with same text in multiple screens
document.addEventListener("click",(e)=>{
  const btn = e.target.closest("button");
  if(!btn) return;
  const t = (btn.textContent || "").trim();
  if (t==="ספק חדש") openSupplierModalForAdd();
  if (t==="פריט חדש") openItemModalForAdd();
  if (t==="מסמך חדש") openDocModalForAdd();
});

/* ---------- Select fillers ---------- */
function fillCategorySelectOptions(selectEl, includeAll=false){
  if (!selectEl) return;
  ensureCategoryModel();

  const byP = new Map();
  (state.subCategories||[]).forEach(sc=>{
    if(!byP.has(sc.primary)) byP.set(sc.primary, []);
    byP.get(sc.primary).push(sc.name);
  });

  let html = "";
  if (includeAll) html += `<option value="">כל הקטגוריות</option>`;

  (state.primaryCategories||[]).forEach(p=>{
    const list = (byP.get(p)||[]).slice().sort((a,b)=>a.localeCompare(b,"he"));
    if(!list.length) return;
    html += `<optgroup label="${escapeHtml(p)}">`;
    list.forEach(name=>{
      html += `<option value="${escapeHtml(name)}">${escapeHtml(p + " › " + name)}</option>`;
    });
    html += `</optgroup>`;
  });

  selectEl.innerHTML = html;
}

function fillSupplierFilters(){
  // docs filters
  const fs = $("#filterSupplier");
  if (fs){
    fs.innerHTML = [`<option value="">כל הספקים</option>`]
      .concat(activeSuppliers().map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`))
      .join("");
  }

  fillCategorySelectOptions($("#filterCategory"), true);
  fillCategorySelectOptions($("#supplierCatFilter"), true);
  fillCategorySelectOptions($("#itemCatFilter"), true);

  // modals selects
  fillCategorySelectOptions($("#supCat"), false);
  fillCategorySelectOptions($("#itemCategory"), false);
}

/* ---------- Dashboard ---------- */
function refreshMonthBadge(){
  const el = $("#monthBadge");
  if (el) el.textContent = state.currentMonth || "—";
}
function renderDashboard(){
  const m = currentMonthObj();
  const docs = m.docs || [];

  const exp = docs.reduce((s,d)=> s + (+d.amount||0), 0);
  const credit = docs.filter(d=>d.type==="זיכוי").reduce((s,d)=> s + Math.abs(+d.amount||0), 0);
  const open = docs.filter(d=>d.status==="לא שולם").reduce((s,d)=> s + (+d.amount||0), 0);

  $("#expSum") && ($("#expSum").textContent = money(exp));
  $("#creditSum") && ($("#creditSum").textContent = money(credit));
  $("#openSum") && ($("#openSum").textContent = money(open));

  renderCategorySummary();
  renderTopSuppliers();
}

function renderCategorySummary(){
  const m = currentMonthObj();
  const map = new Map();

  (m.docs||[]).forEach(d=>{
    const s = supplierById(d.supplierId);
    const cat = s ? (s.category||"לא משויך") : "לא משויך";
    if (!map.has(cat)) map.set(cat, {pos:0,neg:0,net:0});
    const v = map.get(cat);
    const amt = +d.amount||0;
    if (amt>=0) v.pos += amt; else v.neg += amt;
    v.net += amt;
  });

  const rows = Array.from(map.entries())
    .sort((a,b)=>a[0].localeCompare(b[0],"he"))
    .map(([cat,v])=>`
      <tr>
        <td>${escapeHtml(catDisplay(cat))}</td>
        <td class="amount-pos">${money(v.pos)}</td>
        <td class="amount-neg">${money(Math.abs(v.neg))}</td>
        <td><b>${money(v.net)}</b></td>
      </tr>
    `).join("");

  $("#catSummaryBody") && ($("#catSummaryBody").innerHTML = rows || `<tr><td colspan="4" class="note">אין נתונים לחודש זה.</td></tr>`);
}

function renderTopSuppliers(){
  const m = currentMonthObj();
  const map = new Map();

  (m.docs||[]).forEach(d=>{
    const s = supplierById(d.supplierId);
    const key = d.supplierId || "unknown";
    const name = s ? s.name : "—";
    const cat = s ? (s.category||"לא משויך") : "לא משויך";
    if (!map.has(key)) map.set(key,{name,cat,count:0,sum:0});
    const v = map.get(key);
    v.count++;
    v.sum += (+d.amount||0);
  });

  const rows = Array.from(map.values())
    .sort((a,b)=>Math.abs(b.sum)-Math.abs(a.sum))
    .slice(0,10)
    .map(v=>`
      <tr>
        <td>${escapeHtml(v.name)}</td>
        <td>${escapeHtml(catDisplay(v.cat))}</td>
        <td>${v.count}</td>
        <td><b>${money(v.sum)}</b></td>
      </tr>
    `).join("");

  $("#topSupBody") && ($("#topSupBody").innerHTML = rows || `<tr><td colspan="4" class="note">אין נתונים לחודש זה.</td></tr>`);
}

/* ---------- Documents ---------- */
function getDocsFiltered(){
  const m = currentMonthObj();
  const filterSup = $("#filterSupplier")?.value || "";
  const filterCat = $("#filterCategory")?.value || "";
  const filterType = $("#filterDocType")?.value || "";
  const filterStatus = $("#filterDocStatus")?.value || "";

  return (m.docs||[]).filter(d=>{
    const s = supplierById(d.supplierId);
    const cat = s ? (s.category||"לא משויך") : "לא משויך";

    if (filterSup && d.supplierId !== filterSup) return false;
    if (filterCat && cat !== filterCat) return false;
    if (filterType && (d.type||"") !== filterType) return false;
    if (filterStatus && (d.status||"") !== filterStatus) return false;
    return true;
  });
}

function renderDocuments(){
  const docsAll = currentMonthObj().docs || [];
  $("#docsEmpty")?.classList.toggle("hide", docsAll.length !== 0);

  const docs = getDocsFiltered().slice().sort((a,b)=>(b.date||"").localeCompare((a.date||""),"he"));

  const rows = docs.map(d=>{
    const s = supplierById(d.supplierId);
    const sname = s ? s.name : "—";
    const cat = s ? (s.category||"לא משויך") : "לא משויך";
    const amt = +d.amount||0;
    const amtClass = amt>=0 ? "amount-pos" : "amount-neg";

    return `
      <tr>
        <td>${escapeHtml(d.date||"")}</td>
        <td>${escapeHtml(d.docNo||"")}</td>
        <td>${escapeHtml(d.type||"")}${d.type==="זיכוי" ? ` <span class="pill credit">זיכוי</span>` : ""}</td>
        <td>${escapeHtml(sname)}</td>
        <td>${escapeHtml(catDisplay(cat))}</td>
        <td class="${amtClass}">${money(amt)}</td>
        <td>
          <select data-docstatus="${d.id}" style="min-width:110px">
            <option value="שולם" ${d.status==="שולם"?"selected":""}>שולם</option>
            <option value="לא שולם" ${d.status==="לא שולם"?"selected":""}>לא שולם</option>
          </select>
        </td>
        <td>
          <button class="outline small" data-editdoc="${d.id}">ערוך</button>
          <button class="danger small" data-deldoc="${d.id}">מחק</button>
        </td>
      </tr>
    `;
  }).join("");

  $("#docsBody") && ($("#docsBody").innerHTML = rows || `<tr><td colspan="8" class="note">אין תוצאות לפי הסינון.</td></tr>`);

  $$("[data-docstatus]").forEach(sel=>{
    sel.onchange = ()=>{
      const id = sel.getAttribute("data-docstatus");
      const doc = (currentMonthObj().docs||[]).find(x=>x.id===id);
      if(doc){
        doc.status = sel.value;
        save();
        toast("סטטוס עודכן");
        renderDashboard();
      }
    };
  });
  $$("[data-editdoc]").forEach(btn=> btn.onclick = ()=> openDocModalForEdit(btn.getAttribute("data-editdoc")));
  $$("[data-deldoc]").forEach(btn=> btn.onclick = ()=> deleteDoc(btn.getAttribute("data-deldoc")));
}

function deleteDoc(id){
  const m = currentMonthObj();
  const idx = (m.docs||[]).findIndex(d=>d.id===id);
  if (idx<0) return;
  const d = m.docs[idx];
  if (!confirm(`למחוק מסמך "${d.docNo||""}"?`)) return;
  m.docs.splice(idx,1);
  save();
  toast("המסמך נמחק");
  renderAll();
}

/* ---------- Suppliers ---------- */
function renderSuppliers(){
  const q = ($("#supplierSearch")?.value || "").trim();
  const filterCat = $("#supplierCatFilter")?.value || "";
  const list = (state.suppliers||[]).filter(s=>{
    if (s.active===false) return false;
    if (q && !String(s.name||"").includes(q)) return false;
    if (filterCat && (s.category||"לא משויך") !== filterCat) return false;
    return true;
  });

  $("#supEmpty")?.classList.toggle("hide", list.length!==0);

  const rows = list.map(s=>`
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(catDisplay(s.category||"לא משויך"))}</td>
      <td>${escapeHtml(s.phone||"")}</td>
      <td>${escapeHtml(s.email||"")}</td>
      <td>${escapeHtml(s.notes||"")}</td>
      <td>
        <button class="outline small" data-editsup="${s.id}">ערוך</button>
        <button class="danger small" data-delsup="${s.id}">מחק</button>
      </td>
    </tr>
  `).join("");

  $("#supBody") && ($("#supBody").innerHTML = rows || `<tr><td colspan="6" class="note">אין תוצאות.</td></tr>`);

  $$("[data-editsup]").forEach(btn=> btn.onclick = ()=> openSupplierModalForEdit(btn.getAttribute("data-editsup")));
  $$("[data-delsup]").forEach(btn=> btn.onclick = ()=> requestDeleteSupplier(btn.getAttribute("data-delsup")));
}

function countSupplierDocs(supplierId){
  let c=0;
  Object.values(state.months||{}).forEach(m=>{
    (m.docs||[]).forEach(d=>{ if(d.supplierId===supplierId) c++; });
  });
  return c;
}

let pendingSupplierDeleteId = null;
function requestDeleteSupplier(id){
  const s = supplierById(id);
  if (!s) return;

  const docsCount = countSupplierDocs(id);
  if (docsCount === 0){
    if (!confirm(`למחוק את הספק "${s.name}"?`)) return;
    state.suppliers = state.suppliers.filter(x=>x.id!==id);
    save(); toast("הספק נמחק"); renderAll();
    return;
  }

  pendingSupplierDeleteId = id;
  $("#supDelInfo").innerHTML = `לספק <b>${escapeHtml(s.name)}</b> יש <b>${docsCount}</b> מסמכים.`;
  $("#supDelMergeSelect").innerHTML =
    activeSuppliers().filter(x=>x.id!==id)
      .map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join("")
    || `<option value="">אין ספק אחר</option>`;
  openModal("supplierDeleteModal");
}
on("#supDelCancelBtn","click", ()=>{ pendingSupplierDeleteId=null; closeModal("supplierDeleteModal"); });
on("#supDelDisableBtn","click", ()=>{
  if (!pendingSupplierDeleteId) return;
  const s = supplierById(pendingSupplierDeleteId);
  if (!s) return;
  s.active = false;
  save();
  toast("הספק הושבת");
  pendingSupplierDeleteId=null;
  closeModal("supplierDeleteModal");
  renderAll();
});
on("#supDelMergeBtn","click", ()=>{
  if (!pendingSupplierDeleteId) return;
  const targetId = $("#supDelMergeSelect").value;
  if (!targetId){ toast("בחר ספק יעד למיזוג"); return; }
  const srcId = pendingSupplierDeleteId;

  Object.values(state.months||{}).forEach(m=>{
    (m.docs||[]).forEach(d=>{ if (d.supplierId===srcId) d.supplierId = targetId; });
  });
  state.suppliers = state.suppliers.filter(s=>s.id!==srcId);
  save();
  toast("בוצע מיזוג ומחיקה");
  pendingSupplierDeleteId=null;
  closeModal("supplierDeleteModal");
  renderAll();
});

/* ---------- Items ---------- */
function countItemUsage(itemId){
  let c=0;
  Object.values(state.months||{}).forEach(m=>{
    (m.docs||[]).forEach(d=>{
      (d.lines||[]).forEach(ln=>{ if (ln.itemId===itemId) c++; });
    });
  });
  return c;
}

function renderItems(){
  const q = ($("#itemSearch")?.value || "").trim();
  const filterCat = $("#itemCatFilter")?.value || "";
  const list = (state.items||[]).filter(i=>{
    if (i.active===false) return false;
    if (q && !String(i.name||"").includes(q)) return false;
    if (filterCat && (i.category||"לא משויך") !== filterCat) return false;
    return true;
  });

  $("#itemsEmpty")?.classList.toggle("hide", list.length!==0);

  const rows = list.map(i=>`
    <tr>
      <td>${escapeHtml(i.name)}</td>
      <td>${escapeHtml(catDisplay(i.category||"לא משויך"))}</td>
      <td>${money(i.price||0)}</td>
      <td>${escapeHtml(i.unit||"")}</td>
      <td>
        <button class="outline small" data-edititem="${i.id}">ערוך</button>
        <button class="danger small" data-delitem="${i.id}">מחק</button>
      </td>
    </tr>
  `).join("");

  $("#itemsBody") && ($("#itemsBody").innerHTML = rows || `<tr><td colspan="5" class="note">אין תוצאות.</td></tr>`);

  $$("[data-edititem]").forEach(btn=> btn.onclick = ()=> openItemModalForEdit(btn.getAttribute("data-edititem")));
  $$("[data-delitem]").forEach(btn=> btn.onclick = ()=> requestDeleteItem(btn.getAttribute("data-delitem")));
}

let pendingItemDeleteId=null;
function requestDeleteItem(id){
  const it = itemById(id);
  if (!it) return;

  const usage = countItemUsage(id);
  if (usage===0){
    if (!confirm(`למחוק את הפריט "${it.name}"?`)) return;
    state.items = state.items.filter(x=>x.id!==id);
    save(); toast("הפריט נמחק"); renderAll();
    return;
  }

  pendingItemDeleteId = id;
  $("#itemDelInfo").innerHTML = `לפריט <b>${escapeHtml(it.name)}</b> יש שימוש ב-<b>${usage}</b> שורות מסמכים.`;
  $("#itemDelMergeSelect").innerHTML =
    activeItems().filter(x=>x.id!==id)
      .map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join("")
    || `<option value="">אין פריט אחר</option>`;
  openModal("itemDeleteModal");
}
on("#itemDelCancelBtn","click", ()=>{ pendingItemDeleteId=null; closeModal("itemDeleteModal"); });
on("#itemDelDisableBtn","click", ()=>{
  if (!pendingItemDeleteId) return;
  const it = itemById(pendingItemDeleteId);
  if (!it) return;
  it.active = false;
  save();
  toast("הפריט הושבת");
  pendingItemDeleteId=null;
  closeModal("itemDeleteModal");
  renderAll();
});
on("#itemDelMergeBtn","click", ()=>{
  if (!pendingItemDeleteId) return;
  const targetId = $("#itemDelMergeSelect").value;
  if (!targetId){ toast("בחר פריט יעד למיזוג"); return; }
  const srcId = pendingItemDeleteId;

  Object.values(state.months||{}).forEach(m=>{
    (m.docs||[]).forEach(d=>{
      (d.lines||[]).forEach(ln=>{
        if (ln.itemId===srcId){
          const target = itemById(targetId);
          ln.itemId = targetId;
          ln.name = target ? target.name : ln.name;
          ln.unit = target ? target.unit : ln.unit;
          if (!ln.unitPrice) ln.unitPrice = target ? (+target.price||0) : 0;
        }
      });
      recomputeDocAmounts(d);
    });
  });

  state.items = state.items.filter(x=>x.id!==srcId);
  save();
  toast("בוצע מיזוג ומחיקה");
  pendingItemDeleteId=null;
  closeModal("itemDeleteModal");
  renderAll();
});

/* ---------- Categories UI ---------- */
function countUsageForSub(subName){
  let sup=0, items=0;
  (state.suppliers||[]).forEach(s=>{ if (s.active!==false && (s.category||"לא משויך")===subName) sup++; });
  (state.items||[]).forEach(i=>{ if (i.active!==false && (i.category||"לא משויך")===subName) items++; });
  return {sup, items};
}
function countUsageForPrimary(primary){
  const subs = (state.subCategories||[]).filter(sc=>sc.primary===primary).map(sc=>sc.name);
  let sup=0, items=0;
  (state.suppliers||[]).forEach(s=>{
    const p = s.primaryCategory || getPrimaryForSub(s.category);
    if (s.active!==false && p===primary) sup++;
  });
  (state.items||[]).forEach(i=>{
    const p = i.primaryCategory || getPrimaryForSub(i.category);
    if (i.active!==false && p===primary) items++;
  });
  return {subsCount: subs.length, sup, items};
}
function fillPrimarySelectForSubModal(selected=""){
  const opts = (state.primaryCategories||[]).slice()
    .sort((a,b)=>a.localeCompare(b,"he"))
    .map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  $("#subCatPrimary").innerHTML = opts || `<option value="אחר">אחר</option>`;
  if (selected) $("#subCatPrimary").value = selected;
}
function renderCategories(){
  ensureCategoryModel();
  const q = ($("#catSearch")?.value||"").trim();

  const primaries = (state.primaryCategories||[])
    .filter(p=> !q || p.includes(q))
    .sort((a,b)=>a.localeCompare(b,"he"));

  $("#primaryCatBody").innerHTML = primaries.map(p=>{
    const u = countUsageForPrimary(p);
    const disabled = PROTECTED_PRIMARY.has(p);
    return `
      <tr>
        <td>${escapeHtml(p)}</td>
        <td>${u.subsCount}</td>
        <td>${u.sup}</td>
        <td>${u.items}</td>
        <td>
          <button class="outline small" data-edit-primary="${encodeURIComponent(p)}">ערוך</button>
          <button class="danger small" data-del-primary="${encodeURIComponent(p)}" ${disabled?'disabled':''}>מחק</button>
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="5" class="note">אין תוצאות.</td></tr>`;

  const subs = (state.subCategories||[])
    .filter(sc=> !q || sc.name.includes(q) || sc.primary.includes(q));

  $("#subCatBody").innerHTML = subs.map(sc=>{
    const u = countUsageForSub(sc.name);
    const disabled = PROTECTED_SUB.has(sc.name);
    return `
      <tr>
        <td>${escapeHtml(sc.primary)}</td>
        <td>${escapeHtml(sc.name)}</td>
        <td>${u.sup}</td>
        <td>${u.items}</td>
        <td>
          <button class="outline small" data-edit-sub="${encodeURIComponent(sc.name)}">ערוך</button>
          <button class="danger small" data-del-sub="${encodeURIComponent(sc.name)}" ${disabled?'disabled':''}>מחק</button>
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="5" class="note">אין תוצאות.</td></tr>`;

  $$("[data-edit-primary]").forEach(btn=> btn.onclick = ()=> openPrimaryForEdit(decodeURIComponent(btn.getAttribute("data-edit-primary"))));
  $$("[data-del-primary]").forEach(btn=> btn.onclick = ()=> requestDeletePrimary(decodeURIComponent(btn.getAttribute("data-del-primary"))));
  $$("[data-edit-sub]").forEach(btn=> btn.onclick = ()=> openSubForEdit(decodeURIComponent(btn.getAttribute("data-edit-sub"))));
  $$("[data-del-sub]").forEach(btn=> btn.onclick = ()=> requestDeleteSub(decodeURIComponent(btn.getAttribute("data-del-sub"))));
}

/* primary add/edit */
function openPrimaryForAdd(){
  $("#primaryCatModalTitle").textContent = "קטגוריה ראשית חדשה";
  $("#primaryEditName").value = "";
  $("#primaryCatName").value = "";
  openModal("primaryCatModal");
}
function openPrimaryForEdit(name){
  $("#primaryCatModalTitle").textContent = "עריכת קטגוריה ראשית";
  $("#primaryEditName").value = name;
  $("#primaryCatName").value = name;
  openModal("primaryCatModal");
}
on("#addPrimaryCategory","click", openPrimaryForAdd);
on("#cancelPrimaryCatBtn","click", ()=> closeModal("primaryCatModal"));
on("#savePrimaryCatBtn","click", ()=>{
  ensureCategoryModel();
  const oldName = ($("#primaryEditName").value||"").trim();
  const name = ($("#primaryCatName").value||"").trim();

  if(!name){ toast("חובה שם לקטגוריה ראשית"); return; }
  if (PROTECTED_PRIMARY.has(oldName) && oldName !== name){ toast("אי אפשר לשנות שם של קטגוריה ראשית מוגנת"); return; }
  if ((state.primaryCategories||[]).includes(name) && oldName !== name){ toast("קטגוריה ראשית כזו כבר קיימת"); return; }

  if (oldName){
    (state.subCategories||[]).forEach(sc=>{ if(sc.primary===oldName) sc.primary=name; });
    (state.suppliers||[]).forEach(s=>{ if((s.primaryCategory||"")==oldName) s.primaryCategory=name; });
    (state.items||[]).forEach(i=>{ if((i.primaryCategory||"")==oldName) i.primaryCategory=name; });
    state.primaryCategories = (state.primaryCategories||[]).filter(p=>p!==oldName);
  }
  if (!(state.primaryCategories||[]).includes(name)) state.primaryCategories.push(name);

  ensureCategoryModel();
  save();
  closeModal("primaryCatModal");
  toast(oldName ? "קטגוריה ראשית עודכנה" : "קטגוריה ראשית נוספה");
  renderAll();
});

/* sub add/edit */
function openSubForAdd(){
  ensureCategoryModel();
  $("#subCatModalTitle").textContent = "תת קטגוריה חדשה";
  $("#subEditName").value = "";
  fillPrimarySelectForSubModal(state.primaryCategories.includes("מזון") ? "מזון" : (state.primaryCategories[0]||"אחר"));
  $("#subCatName").value = "";
  openModal("subCatModal");
}
function openSubForEdit(subName){
  ensureCategoryModel();
  const sc = (state.subCategories||[]).find(x=>x.name===subName);
  if(!sc) return;
  $("#subCatModalTitle").textContent = "עריכת תת קטגוריה";
  $("#subEditName").value = sc.name;
  fillPrimarySelectForSubModal(sc.primary);
  $("#subCatName").value = sc.name;
  openModal("subCatModal");
}
on("#addSubCategory","click", openSubForAdd);
on("#cancelSubCatBtn","click", ()=> closeModal("subCatModal"));

on("#saveSubCatBtn","click", ()=>{
  ensureCategoryModel();
  const oldName = ($("#subEditName").value||"").trim();
  const primary = $("#subCatPrimary").value || "אחר";
  const name = ($("#subCatName").value||"").trim();

  if(!name){ toast("חובה שם לתת קטגוריה"); return; }
  if (PROTECTED_SUB.has(oldName) && oldName !== name){ toast("אי אפשר לשנות שם של תת קטגוריה מוגנת"); return; }
  if ((state.subCategories||[]).some(x=>x.name===name) && oldName !== name){ toast("תת קטגוריה כזו כבר קיימת"); return; }

  if (oldName){
    (state.suppliers||[]).forEach(s=>{ if((s.category||"")==oldName) s.category=name; });
    (state.items||[]).forEach(i=>{ if((i.category||"")==oldName) i.category=name; });
    const sc = (state.subCategories||[]).find(x=>x.name===oldName);
    if(sc){ sc.name=name; sc.primary=primary; }
  } else {
    state.subCategories.push({ primary, name });
  }

  const p = getPrimaryForSub(name);
  (state.suppliers||[]).forEach(s=>{ if(s.category===name) s.primaryCategory=p; });
  (state.items||[]).forEach(i=>{ if(i.category===name) i.primaryCategory=p; });

  ensureCategoryModel();
  fillSupplierFilters();
  save();
  closeModal("subCatModal");
  toast(oldName ? "תת קטגוריה עודכנה" : "תת קטגוריה נוספה");
  renderAll();
});

/* delete primary */
let pendingPrimaryDelete = "";
function requestDeletePrimary(primary){
  if(PROTECTED_PRIMARY.has(primary)){ toast("אי אפשר למחוק קטגוריה ראשית מוגנת"); return; }
  ensureCategoryModel();
  pendingPrimaryDelete = primary;

  const u = countUsageForPrimary(primary);
  $("#primaryDelInfo").innerHTML = `קטגוריה ראשית: <b>${escapeHtml(primary)}</b> | תתי: <b>${u.subsCount}</b> | ספקים: <b>${u.sup}</b> | פריטים: <b>${u.items}</b>`;
  $("#primaryDelMergeSelect").innerHTML =
    (state.primaryCategories||[]).filter(p=>p!==primary)
      .map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("")
    || `<option value="אחר">אחר</option>`;
  openModal("primaryDeleteModal");
}
on("#primaryDelCancelBtn","click", ()=>{ pendingPrimaryDelete=""; closeModal("primaryDeleteModal"); });
on("#primaryDelMergeBtn","click", ()=>{
  const src = pendingPrimaryDelete;
  if(!src) return;
  const target = $("#primaryDelMergeSelect").value || "אחר";
  if(!target || target===src){ toast("בחר יעד מיזוג"); return; }

  (state.subCategories||[]).forEach(sc=>{ if(sc.primary===src) sc.primary=target; });
  (state.suppliers||[]).forEach(s=>{ if((s.primaryCategory||"")===src) s.primaryCategory=target; });
  (state.items||[]).forEach(i=>{ if((i.primaryCategory||"")===src) i.primaryCategory=target; });
  state.primaryCategories = (state.primaryCategories||[]).filter(p=>p!==src);

  ensureCategoryModel();
  save();
  closeModal("primaryDeleteModal");
  pendingPrimaryDelete="";
  toast("בוצע מיזוג ומחיקה");
  renderAll();
});

/* delete sub */
let pendingSubDelete = "";
function requestDeleteSub(subName){
  if(PROTECTED_SUB.has(subName)){ toast("אי אפשר למחוק תת קטגוריה מוגנת"); return; }
  ensureCategoryModel();
  pendingSubDelete = subName;

  const u = countUsageForSub(subName);
  $("#subDelInfo").innerHTML = `תת קטגוריה: <b>${escapeHtml(catDisplay(subName))}</b> | ספקים: <b>${u.sup}</b> | פריטים: <b>${u.items}</b>`;

  $("#subDelMergeSelect").innerHTML =
    (state.subCategories||[]).filter(x=>x.name!==subName)
      .map(x=>`<option value="${escapeHtml(x.name)}">${escapeHtml(x.primary + " › " + x.name)}</option>`).join("")
    || `<option value="לא משויך">אחר › לא משויך</option>`;

  openModal("subDeleteModal");
}
on("#subDelCancelBtn","click", ()=>{ pendingSubDelete=""; closeModal("subDeleteModal"); });

function mergeSubTo(targetSub){
  const src = pendingSubDelete;
  if(!src) return;

  (state.suppliers||[]).forEach(s=>{ if((s.category||"")==src) s.category=targetSub; });
  (state.items||[]).forEach(i=>{ if((i.category||"")==src) i.category=targetSub; });

  const tp = getPrimaryForSub(targetSub);
  (state.suppliers||[]).forEach(s=>{ if(s.category===targetSub) s.primaryCategory=tp; });
  (state.items||[]).forEach(i=>{ if(i.category===targetSub) i.primaryCategory=tp; });

  state.subCategories = (state.subCategories||[]).filter(x=>x.name!==src);

  ensureCategoryModel();
  fillSupplierFilters();
  save();
  pendingSubDelete="";
  closeModal("subDeleteModal");
  toast("בוצע מיזוג ומחיקה");
  renderAll();
}
on("#subDelMergeBtn","click", ()=>{
  const target = $("#subDelMergeSelect").value || "";
  if(!target || target===pendingSubDelete){ toast("בחר יעד מיזוג"); return; }
  mergeSubTo(target);
});
on("#subDelToUnassignedBtn","click", ()=>{
  ensureSubExists("אחר","לא משויך");
  mergeSubTo("לא משויך");
});

/* ---------- Supplier modal ---------- */
function openSupplierModalForAdd(prefillName=""){
  $("#supplierModalTitle").textContent = "הוספת ספק";
  $("#supEditId").value = "";
  $("#supName").value = prefillName || "";
  $("#supCat").value = "לא משויך";
  $("#supPhone").value = "";
  $("#supEmail").value = "";
  $("#supNotes").value = "";
  openModal("supplierModal");
}
function openSupplierModalForEdit(id){
  const s = supplierById(id);
  if (!s) return;
  $("#supplierModalTitle").textContent = "עריכת ספק";
  $("#supEditId").value = s.id;
  $("#supName").value = s.name || "";
  $("#supCat").value = s.category || "לא משויך";
  $("#supPhone").value = s.phone || "";
  $("#supEmail").value = s.email || "";
  $("#supNotes").value = s.notes || "";
  openModal("supplierModal");
}
on("#addSupplier","click", ()=> openSupplierModalForAdd());
on("#cancelSupplierBtn","click", ()=> closeModal("supplierModal"));

on("#saveSupplierBtn","click", ()=>{
  const editId = ($("#supEditId").value||"").trim();
  const name = ($("#supName").value||"").trim();
  const category = $("#supCat").value || "לא משויך";
  const phone = ($("#supPhone").value||"").trim();
  const email = ($("#supEmail").value||"").trim();
  const notes = ($("#supNotes").value||"").trim();

  if(!name){ toast("חובה שם ספק"); return; }

  ensureCategoryModel();
  const primary = getPrimaryForSub(category);
  ensureSubExists(primary, category);

  const dup = (state.suppliers||[]).find(s=> s.name===name && s.id!==editId);
  if (dup){ toast("קיים ספק עם אותו שם"); return; }

  if (editId){
    const s = supplierById(editId);
    if (!s) { toast("שגיאה: ספק לא נמצא"); return; }
    s.name = name;
    s.category = category;
    s.primaryCategory = primary;
    s.phone = phone; s.email = email; s.notes = notes; s.active = true;
    state.suppliers.sort((a,b)=> (a.name||"").localeCompare((b.name||""), "he"));
    save(); toast("הספק עודכן");
  } else {
    state.suppliers.push({id:uid(), name, category, primaryCategory: primary, phone, email, notes, active:true});
    state.suppliers.sort((a,b)=> (a.name||"").localeCompare((b.name||""), "he"));
    save(); toast("נוסף ספק");
  }

  closeModal("supplierModal");
  fillSupplierFilters();
  renderAll();
});

/* ---------- Item modal ---------- */
function openItemModalForAdd(){
  $("#itemModalTitle").textContent = "הוספת פריט";
  $("#itemEditId").value="";
  $("#itemName").value="";
  $("#itemCategory").value="לא משויך";
  $("#itemPrice").value="";
  $("#itemUnit").value="יחידה";
  openModal("itemModal");
}
function openItemModalForEdit(id){
  const it = itemById(id);
  if (!it) return;
  $("#itemModalTitle").textContent = "עריכת פריט";
  $("#itemEditId").value = it.id;
  $("#itemName").value = it.name || "";
  $("#itemCategory").value = it.category || "לא משויך";
  $("#itemPrice").value = +it.price || 0;
  $("#itemUnit").value = it.unit || "יחידה";
  openModal("itemModal");
}
on("#addItem","click", openItemModalForAdd);
on("#cancelItemBtn","click", ()=> closeModal("itemModal"));

on("#saveItemBtn","click", ()=>{
  const editId = ($("#itemEditId").value||"").trim();
  const name = ($("#itemName").value||"").trim();
  const category = $("#itemCategory").value || "לא משויך";
  const price = +($("#itemPrice").value||0);
  const unit = ($("#itemUnit").value||"יחידה").trim() || "יחידה";

  if(!name){ toast("חובה שם פריט"); return; }

  ensureCategoryModel();
  const primary = getPrimaryForSub(category);
  ensureSubExists(primary, category);

  const dup = (state.items||[]).find(i=> i.name===name && i.id!==editId);
  if (dup){ toast("קיים פריט עם אותו שם"); return; }

  if (editId){
    const it = itemById(editId);
    if (!it) { toast("שגיאה: פריט לא נמצא"); return; }
    it.name = name;
    it.category = category;
    it.primaryCategory = primary;
    it.price = price; it.unit = unit; it.active = true;
    state.items.sort((a,b)=> (a.name||"").localeCompare((b.name||""), "he"));
    save(); toast("הפריט עודכן");
  } else {
    state.items.push({id:uid(), name, category, primaryCategory: primary, price, unit, active:true});
    state.items.sort((a,b)=> (a.name||"").localeCompare((b.name||""), "he"));
    save(); toast("נוסף פריט");
  }

  closeModal("itemModal");
  fillSupplierFilters();
  renderAll();
});

/* ---------- Doc modal ---------- */
let docModalOpen = false;
let tempLines = [];

function refreshDocSupplierList(){
  const list = activeSuppliers().slice(0,1000);
  $("#docSupplierSelect").innerHTML =
    list.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")
    || `<option value="">אין ספקים</option>`;
}
function updateDocSupplierCategoryUI(){
  const sid = $("#docSupplierSelect").value;
  const s = supplierById(sid);
  const cat = s ? (s.category || "לא משויך") : "";
  $("#docSupplierCategory").value = cat ? catDisplay(cat) : "";
}
function resetDocModal(){
  $("#docModalTitle").textContent = "מסמך חדש";
  $("#docEditId").value = "";
  $("#docDate").value = new Date().toISOString().slice(0,10);
  $("#docType").value = "חשבונית";
  $("#docNo").value = "";
  $("#docStatus").value = "שולם";
  $("#docVat").checked = true;
  $("#docNotes").value = "";
  $("#docManualAmount").value = "";
  tempLines = [];
  renderLines();
  updateDocTotalsPreview();
}
function openDocModalForAdd(){
  resetDocModal();
  refreshDocSupplierList();
  const first = $("#docSupplierSelect")?.querySelector("option");
  if (first) $("#docSupplierSelect").value = first.value;
  updateDocSupplierCategoryUI();
  docModalOpen = true;
  openModal("docModal");
}
function openDocModalForEdit(docId){
  const m = currentMonthObj();
  const d = (m.docs||[]).find(x=>x.id===docId);
  if (!d) return;

  $("#docModalTitle").textContent = "עריכת מסמך";
  $("#docEditId").value = d.id;
  $("#docDate").value = d.date || new Date().toISOString().slice(0,10);
  $("#docType").value = d.type || "חשבונית";
  $("#docNo").value = d.docNo || "";
  $("#docStatus").value = d.status || "שולם";
  $("#docVat").checked = !!d.vatApplied;
  $("#docNotes").value = d.notes || "";
  $("#docManualAmount").value = +d.manualAmount || 0;

  refreshDocSupplierList();
  if (d.supplierId) $("#docSupplierSelect").value = d.supplierId;
  updateDocSupplierCategoryUI();

  tempLines = (d.lines||[]).map(ln=>({
    id: ln.id || uid(),
    itemId: ln.itemId || "",
    name: ln.name || "",
    qty: +ln.qty || 0,
    unitPrice: +ln.unitPrice || 0,
    unit: ln.unit || ""
  }));

  renderLines();
  updateDocTotalsPreview();
  docModalOpen = true;
  openModal("docModal");
}

on("#addDoc","click", openDocModalForAdd);
on("#cancelDocBtn","click", ()=>{ docModalOpen=false; closeModal("docModal"); });
on("#docSupplierSelect","change", ()=>{ updateDocSupplierCategoryUI(); renderLines(); updateDocTotalsPreview(); });
on("#docType","change", updateDocTotalsPreview);
on("#docVat","change", updateDocTotalsPreview);
on("#docManualAmount","input", updateDocTotalsPreview);
on("#docAddSupplierBtn","click", ()=> openSupplierModalForAdd(""));
on("#docAddItemBtn","click", ()=> openItemModalForAdd());

function getSelectedSupplierCategory(){
  const sid = $("#docSupplierSelect").value;
  const s = supplierById(sid);
  return s ? (s.category||"לא משויך") : "לא משויך";
}
function itemOptionsHtml(filterCategory){
  const list = activeItems()
    .filter(it => !filterCategory || it.category===filterCategory)
    .sort((a,b)=> (a.name||"").localeCompare((b.name||""), "he"));
  const use = list.length ? list : activeItems().slice().sort((a,b)=> (a.name||"").localeCompare((b.name||""), "he"));

  return `<option value="">בחר פריט…</option>` + use.map(it=>{
    const meta = `${catDisplay(it.category)} • ${money(it.price||0)} / ${it.unit||""}`;
    return `<option value="${it.id}">${escapeHtml(it.name)} (${escapeHtml(meta)})</option>`;
  }).join("");
}
function renderLines(){
  const cat = getSelectedSupplierCategory();
  const host = $("#linesHost");
  if (!host) return;

  host.innerHTML = tempLines.map(ln=>{
    const opts = itemOptionsHtml(cat);
    return `
      <div class="lineRow" data-line="${ln.id}">
        <div class="span2">
          <label>פריט</label>
          <select data-line-item="${ln.id}">
            ${opts}
          </select>
        </div>

        <div>
          <label>כמות</label>
          <input type="number" inputmode="decimal" data-line-qty="${ln.id}" value="${ln.qty}">
        </div>

        <div>
          <label>מחיר</label>
          <input type="number" inputmode="decimal" data-line-price="${ln.id}" value="${ln.unitPrice}">
        </div>

        <div>
          <label>יחידה</label>
          <input data-line-unit="${ln.id}" value="${escapeHtml(ln.unit||"")}" placeholder="ק״ג/יחידה">
        </div>

        <div class="lineActions">
          <button class="danger small" data-line-del="${ln.id}">X</button>
        </div>
      </div>
    `;
  }).join("") || `<div class="empty">אין פירוט פריטים. לחץ על <b>+ שורה</b> כדי להוסיף.</div>`;

  // set selects to current values
  tempLines.forEach(ln=>{
    const sel = document.querySelector(`[data-line-item="${ln.id}"]`);
    if (sel) sel.value = ln.itemId || "";
  });

  $$("[data-line-item]").forEach(sel=>{
    sel.onchange = ()=>{
      const lid = sel.getAttribute("data-line-item");
      const ln = tempLines.find(x=>x.id===lid);
      if (!ln) return;
      ln.itemId = sel.value || "";

      const it = itemById(ln.itemId);
      if (it){
        ln.name = it.name;
        if (!ln.unitPrice) ln.unitPrice = +it.price || 0;
        if (!ln.unit) ln.unit = it.unit || "";
      } else ln.name = "";

      const unitInp = document.querySelector(`[data-line-unit="${lid}"]`);
      if (unitInp) unitInp.value = ln.unit || "";
      const priceInp = document.querySelector(`[data-line-price="${lid}"]`);
      if (priceInp) priceInp.value = ln.unitPrice || 0;

      updateDocTotalsPreview();
    };
  });

  $$("[data-line-qty]").forEach(inp=>{
    inp.oninput = ()=>{
      const lid = inp.getAttribute("data-line-qty");
      const ln = tempLines.find(x=>x.id===lid);
      if (!ln) return;
      ln.qty = +inp.value || 0;
      updateDocTotalsPreview();
    };
  });

  $$("[data-line-price]").forEach(inp=>{
    inp.oninput = ()=>{
      const lid = inp.getAttribute("data-line-price");
      const ln = tempLines.find(x=>x.id===lid);
      if (!ln) return;
      ln.unitPrice = +inp.value || 0;
      updateDocTotalsPreview();
    };
  });

  $$("[data-line-unit]").forEach(inp=>{
    inp.oninput = ()=>{
      const lid = inp.getAttribute("data-line-unit");
      const ln = tempLines.find(x=>x.id===lid);
      if (!ln) return;
      ln.unit = inp.value || "";
      updateDocTotalsPreview();
    };
  });

  $$("[data-line-del]").forEach(btn=>{
    btn.onclick = ()=>{
      const lid = btn.getAttribute("data-line-del");
      tempLines = tempLines.filter(x=>x.id!==lid);
      renderLines();
      updateDocTotalsPreview();
    };
  });
}
on("#addLineBtn","click", ()=>{
  tempLines.push({id:uid(), itemId:"", name:"", qty:1, unitPrice:0, unit:""});
  renderLines();
  updateDocTotalsPreview();
});

function updateDocTotalsPreview(){
  let base = 0;
  if (tempLines.length){
    base = tempLines.reduce((s,ln)=> s + ((+ln.qty||0) * (+ln.unitPrice||0)), 0);
  } else {
    base = +($("#docManualAmount").value||0);
  }
  $("#docSubtotal").textContent = money(base);

  let total = base;
  if ($("#docVat").checked) total *= 1.18;

  const isCredit = ($("#docType").value === "זיכוי");
  total = isCredit ? -Math.abs(total) : Math.abs(total);

  $("#docTotal").textContent = money(total);
}
function isDuplicateDocNo(supplierId, docNo, ignoreId=""){
  docNo = (docNo||"").trim();
  if (!docNo) return false;
  return (currentMonthObj().docs||[]).some(d =>
    d.id !== ignoreId && d.supplierId===supplierId && (d.docNo||"").trim()===docNo
  );
}
on("#saveDocBtn","click", ()=>{
  const m = currentMonthObj();
  const editId = ($("#docEditId").value||"").trim();
  const supplierId = $("#docSupplierSelect").value;

  if (!supplierId){ toast("בחר ספק מהרשימה"); return; }

  const docNo = ($("#docNo").value||"").trim();
  if (isDuplicateDocNo(supplierId, docNo, editId)){
    toast("מס׳ מסמך כפול לאותו ספק בחודש הזה");
    return;
  }

  const s = supplierById(supplierId);
  const d = {
    id: editId || uid(),
    date: $("#docDate").value || new Date().toISOString().slice(0,10),
    type: $("#docType").value || "חשבונית",
    docNo,
    supplierId,
    status: $("#docStatus").value || "שולם",
    vatApplied: $("#docVat").checked,
    notes: ($("#docNotes").value||"").trim(),
    manualAmount: +($("#docManualAmount").value||0),
    lines: tempLines.map(ln=>{
      const it = itemById(ln.itemId);
      return {
        id: ln.id || uid(),
        itemId: ln.itemId || "",
        name: (it ? it.name : (ln.name||"")),
        qty: +ln.qty || 0,
        unitPrice: +ln.unitPrice || 0,
        unit: (ln.unit || (it ? it.unit : "")) || ""
      };
    })
  };

  normalizeDoc(d);
  recomputeDocAmounts(d);

  if (editId){
    const idx = (m.docs||[]).findIndex(x=>x.id===editId);
    if (idx<0){ toast("שגיאה: מסמך לא נמצא"); return; }
    m.docs[idx] = d;
    toast("המסמך עודכן");
  } else {
    m.docs.push(d);
    toast("נוסף מסמך");
  }

  save();
  docModalOpen = false;
  closeModal("docModal");
  renderAll();
  switchScreen("documents");
});

/* ---------- Month + income ---------- */
on("#monthInput","change", (e)=>{
  const v = e.target.value;
  if (!v) return;
  state.currentMonth = v;
  ensureMonth(v);
  save();
  refreshMonthBadge();
  $("#incomeInput").value = currentMonthObj().income || 0;
  renderAll();
});
on("#incomeInput","input", (e)=>{
  currentMonthObj().income = +e.target.value || 0;
  save();
  toast("הכנסות עודכנו");
});

/* ---------- Export/Import ---------- */
on("#exportBtn","click", ()=>{
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `hatzeDef_${state.currentMonth}.json`;
  a.click();
  toast("בוצע ייצוא JSON");
});
on("#importBtn","click", ()=> $("#fileInput")?.click());
on("#fileInput","change", (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const incoming = JSON.parse(r.result);
      state = incoming;

      if (!state.theme) state.theme = "dark";
      if (!state.currentMonth) state.currentMonth = new Date().toISOString().slice(0,7);
      ensureMonth(state.currentMonth);

      Object.keys(state.months || {}).forEach(m=>{
        ensureMonth(m);
        (state.months[m].docs||[]).forEach(d=>{
          normalizeDoc(d);
          (d.lines||[]).forEach(ln=>{
            if (!ln.id) ln.id = uid();
            if (ln.qty === undefined) ln.qty = 0;
            if (ln.unitPrice === undefined) ln.unitPrice = 0;
            if (!ln.name) ln.name = "";
            if (!ln.unit) ln.unit = "";
          });
          recomputeDocAmounts(d);
        });
      });

      mergeDefaults();
      ensureCategoryModel();
      save();
      applyTheme();
      $("#monthInput").value = state.currentMonth;
      $("#incomeInput").value = currentMonthObj().income || 0;
      renderAll();
      toast("ייבוא הצליח");
    }catch(err){
      alert("הקובץ לא תקין או לא בפורמט JSON.");
    }
  };
  r.readAsText(f);
});

/* ---------- Filters events ---------- */
on("#filterSupplier","change", renderDocuments);
on("#filterCategory","change", renderDocuments);
on("#filterDocType","change", renderDocuments);
on("#filterDocStatus","change", renderDocuments);

on("#supplierSearch","input", renderSuppliers);
on("#supplierCatFilter","change", renderSuppliers);

on("#itemSearch","input", renderItems);
on("#itemCatFilter","change", renderItems);

on("#catSearch","input", renderCategories);

/* ---------- Render all ---------- */
function renderAll(){
  refreshMonthBadge();
  fillSupplierFilters();
  renderDashboard();
  renderDocuments();
  renderSuppliers();
  renderCategories();
  renderItems();
}

/* ---------- Init ---------- */
function initApp(){
  load();
  applyTheme();

  $("#monthInput") && ($("#monthInput").value = state.currentMonth);
  $("#incomeInput") && ($("#incomeInput").value = currentMonthObj().income || 0);

  renderAll();
  switchScreen("dashboard");
}

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
