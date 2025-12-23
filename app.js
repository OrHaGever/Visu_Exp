import { $, money, toast } from './utils.js';
import { calcMonthlySummary } from './calculations.js';
import { store } from './state.js';

(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const fmt = n => '₪' + (Number(n||0).toLocaleString('he-IL', {maximumFractionDigits: 2}));

  const storeKey = 'visual-expense-app-v5';
  const state = { suppliers: [], invoices: [], revenue: {} };

  const on = (el,ev,fn)=> el && el.addEventListener(ev,fn);
  const uid = ()=> Math.random().toString(36).slice(2,9);

  function load(){
    try{ const raw=localStorage.getItem(storeKey); if(!raw) return; const data=JSON.parse(raw); ['suppliers','invoices','revenue'].forEach(k=>{ if(data[k]) state[k]=data[k]; }); }catch{}
  }
  function save(){ localStorage.setItem(storeKey, JSON.stringify(state)); }

  function applyTheme(t){
    if(!t) return;
    if(t==='dark'){ document.documentElement.removeAttribute('data-theme'); }
    else { document.documentElement.setAttribute('data-theme', t); }
    localStorage.setItem('theme', t);
  }

  function getFilters(){
    return {
      from: $('#filterFrom')?.value || null,
      to: $('#filterTo')?.value || null,
      supplier: $('#filterSupplier')?.value || '',
      type: $('#filterType')?.value || ''
    };
  }
  function byFilters(inv, f){
    if(f.from && inv.date < f.from) return false;
    if(f.to && inv.date > f.to) return false;
    if(f.supplier && inv.supplier !== f.supplier) return false;
    if(f.type && inv.type !== f.type) return false;
    return true;
  }

  const initials = name => {
    if(!name) return 'ס';
    const parts = name.trim().split(/\s+/);
    return parts.slice(0,2).map(p=>p[0]).join('').toUpperCase();
  };

  function renderSupplierOptions(){
    const names = state.suppliers.map(s=>s.name).sort((a,b)=>a.localeCompare(b,'he'));
    const dlist = $('#supplierList');
    if(dlist) dlist.innerHTML = names.map(n=>`<option value="${n}"></option>`).join('');
    function fillSelect(el){
      if(!el) return;
      el.innerHTML = '<option value="">הכל</option>' + names.map(n=>`<option value="${n}">${n}</option>`).join('');
    }
    fillSelect($('#filterSupplier'));
    fillSelect($('#reportSupplier'));
  }

  function aggregates(data){
    const sum = data.reduce((s,i)=>s+Number(i.amount||0),0);
    const recSum = data.filter(i=>i.type==='recurring').reduce((s,i)=>s+Number(i.amount||0),0);
    const oneSum = data.filter(i=>i.type==='oneoff').reduce((s,i)=>s+Number(i.amount||0),0);
    const bySup = {};
    data.forEach(i=> bySup[i.supplier]=(bySup[i.supplier]||0)+Number(i.amount||0));
    return {sum, recSum, oneSum, bySup};
  }

  function renderCharts(data){
    const {sum, recSum, oneSum, bySup} = aggregates(data);
    const p1 = sum ? Math.round(recSum/sum*100) : 0;
    const p2 = sum ? Math.round(oneSum/sum*100) : 0;

    const donut = $('#donut');
    if(donut){
      donut.style.setProperty('--p1', p1);
      donut.style.setProperty('--p2', p2);
    }
    if($('#donutTotal')) $('#donutTotal').textContent = fmt(sum);
    if($('#legRecPct')) $('#legRecPct').textContent = p1 + '%';
    if($('#legOnePct')) $('#legOnePct').textContent = p2 + '%';

    const bars = $('#bars');
    if(bars){
      const entries = Object.entries(bySup).sort((a,b)=>b[1]-a[1]).slice(0,6);
      const max = entries[0]?.[1] || 1;
      bars.innerHTML = entries.map(([name, val])=>{
        const h = Math.max(4, Math.round(val/max*100));
        return `<div class="bar-wrap">
                  <div class="bar" style="--h:${h}%">
                    <div class="bar-label">${fmt(val)}</div>
                  </div>
                  <div class="bar-name" title="${name}">${name}</div>
                </div>`;
      }).join('') || '<div class="muted">אין נתונים להצגה.</div>';
    }
  }

  function renderDashboard(){
    const f = getFilters();
    const data = state.invoices.filter(inv => byFilters(inv,f));
    const {sum, recSum, oneSum} = aggregates(data);

    $('#kpiTotal').textContent = fmt(sum);
    $('#kpiCount').textContent = data.length + ' רשומות';
    $('#kpiRecurring').textContent = fmt(recSum);
    $('#kpiRecurringCount').textContent = data.filter(i=>i.type==='recurring').length + ' חשבוניות';
    $('#kpiOneoff').textContent = fmt(oneSum);
    $('#kpiOneoffCount').textContent = data.filter(i=>i.type==='oneoff').length + ' חשבוניות';
    $('#kpiAvg').textContent = fmt(data.length ? sum/data.length : 0);

    const sums = {};
    data.forEach(i=>{
      const s = sums[i.supplier] || (sums[i.supplier]={total:0, rec:0, one:0, count:0});
      s.total += Number(i.amount||0); s.count++;
      if(i.type==='recurring') s.rec += Number(i.amount||0); else s.one += Number(i.amount||0);
    });
    const container = $('#supplierCards');
    if(container){
      const entries = Object.entries(sums).sort((a,b)=>b[1].total - a[1].total);
      container.innerHTML = entries.map(([name, val])=>`
        <div class="card">
          <div class="row" style="justify-content:space-between;">
            <div class="row">
              <div class="logo" aria-hidden="true" style="width:38px;height:38px;border-radius:12px;">${initials(name)}</div>
              <strong>${name}</strong>
            </div>
            <strong>${fmt(val.total)}</strong>
          </div>
          <div class="muted">חשבוניות: ${val.count}</div>
          <div class="row">
            <span class="chip">קבוע: ${fmt(val.rec)}</span>
            <span class="chip">חד-פעמי: ${fmt(val.one)}</span>
          </div>
        </div>
      `).join('') || '<div class="empty"><div class="empty-text">אין נתונים לתצוגה.</div></div>';
    }

    renderCharts(data);

    const ob = $('.onboarding');
    if(ob) ob.style.display = state.invoices.length ? 'none' : 'flex';
  }

  function renderInvoices(){
    const tbody = $('#invoicesTable tbody');
    if(!tbody) return;
    const data = state.invoices.slice().sort((a,b)=> (a.date||'').localeCompare(b.date||''));
    tbody.innerHTML = data.map(i=>`
      <tr>
        <td>${i.date||''}</td>
        <td>${i.supplier||''}</td>
        <td>${i.number||''}</td>
        <td>${fmt(i.amount||0)}</td>
        <td><span class="badge ${i.type==='recurring'?'badge-rec':'badge-one'}">${i.type==='recurring'?'קבוע':'חד-פעמי'}</span></td>
        <td><span class="badge ${i.paid?'badge-paid':'badge-unpaid'}">${i.paid?'שולם':'לא שולם'}</span></td>
        <td>
          <div class="row-actions">
            <button class="ghost" data-act="edit" data-id="${i.id}">עריכה</button>
            <button class="danger" data-act="del" data-id="${i.id}">מחיקה</button>
          </div>
        </td>
      </tr>
    `).join('');

    const total = data.reduce((s,i)=>s+Number(i.amount||0),0);
    const tt = $('#tblTotal'); if(tt) tt.textContent = fmt(total);
    const empty = $('#invoicesEmpty'); if(empty) empty.style.display = data.length ? 'none' : 'block';
  }

  function renderSuppliers(){
    const list = $('#suppliersList'); if(!list) return;
    const items = state.suppliers.slice().sort((a,b)=>a.name.localeCompare(b.name,'he'));
    list.innerHTML = items.map(s=>`
      <div class="supplier-item">
        <div class="info">
          <div class="name">${s.name}</div>
          <div class="meta muted">${[s.category||'ללא קטגוריה', s.notes||''].filter(Boolean).join(' • ')}</div>
        </div>
        <div class="row-actions">
          <button class="ghost" data-act="edit-sup" data-id="${s.id}">עריכה</button>
          <button class="danger" data-act="del-sup" data-id="${s.id}">מחיקה</button>
        </div>
      </div>
    `).join('');
    const empty = $('#suppliersEmpty'); if(empty) empty.style.display = items.length ? 'none' : 'block';
  }

  function renderReports(){
    const m = $('#revMonth');
    if(m && !m.value){
      const now=new Date();const mm=String(now.getMonth()+1).padStart(2,'0');m.value=`${now.getFullYear()}-${mm}`;
    }
    const month = $('#revMonth')?.value;
    if($('#revAmount')) $('#revAmount').value = (state.revenue[month] || '');

    const first = month ? month + '-01' : null;
    const last = month ? month + '-31' : null;
    const type = $('#reportType')?.value || '';
    const supplier = $('#reportSupplier')?.value || '';

    const data = state.invoices.filter(i=>{
      if(month){ if(!i.date || i.date < first || i.date > last) return false; }
      if(type && i.type !== type) return false;
      if(supplier && i.supplier !== supplier) return false;
      return true;
    });

    const sum = data.reduce((s,i)=>s+Number(i.amount||0),0);
    const rec = data.filter(i=>i.type==='recurring').reduce((s,i)=>s+Number(i.amount||0),0);
    const one = data.filter(i=>i.type==='oneoff').reduce((s,i)=>s+Number(i.amount||0),0);
    if($('#repExpenses')) $('#repExpenses').textContent = fmt(sum);
    if($('#repBreakdown')) $('#repBreakdown').textContent = `קבוע: ${fmt(rec)} • חד-פעמי: ${fmt(one)}`;
    const rev = Number(state.revenue[month]||0);
    if($('#repNet')) $('#repNet').textContent = fmt(rev - sum);

    const sums = {};
    data.forEach(i=> sums[i.supplier]=(sums[i.supplier]||0)+Number(i.amount||0));
    const container = $('#reportSuppliers');
    if(container){
      const entries = Object.entries(sums).sort((a,b)=>b[1]-a[1]);
      container.innerHTML = entries.map(([name, val])=>`
        <div class="card">
          <div class="row" style="justify-content:space-between;">
            <strong>${name}</strong>
            <strong>${fmt(val)}</strong>
          </div>
        </div>
      `).join('') || '<div class="empty"><div class="empty-text">אין הוצאות בסינון הנוכחי.</div></div>';
    }
  }

  function refreshAll(){
    renderSupplierOptions();
    renderDashboard();
    renderInvoices();
    renderSuppliers();
    renderReports();
  }

  function wireNav(){
    $$('.tab').forEach(btn=> on(btn,'click',()=>{
      $$('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab=btn.dataset.tab;
      $$('.view').forEach(v=>v.classList.remove('visible'));
      const target=$('#'+tab); if(target) target.classList.add('visible');
      if(tab==='reports') renderReports();
    }));
    $$('.onboarding [data-goto]').forEach(b=> on(b,'click',()=>{
      const t=b.dataset.goto; const tabBtn=$$('.tab').find(x=>x.dataset.tab===t); if(tabBtn) tabBtn.click();
    }));
  }

  function wireFilters(){
    ['filterFrom','filterTo','filterSupplier','filterType'].forEach(id=> on($('#'+id),'change',renderDashboard));
    on($('#clearFilters'),'click',()=>{
      ['filterFrom','filterTo','filterSupplier','filterType'].forEach(id=>{const el=$('#'+id); if(el) el.value='';});
      renderDashboard();
    });
  }

  function wireInvoiceForm(){
    on($('#invoiceForm'),'submit',e=>{
      e.preventDefault();
      const inv={
        id:uid(),
        date:$('#invDate')?.value||'',
        supplier:($('#invSupplier')?.value||'').trim(),
        number:($('#invNumber')?.value||'').trim(),
        amount:Number($('#invAmount')?.value||0),
        type:$('#invType')?.value,
        paid:$('#invPaid')?.checked,
        desc:($('#invDesc')?.value||'').trim()
      };
      if(!inv.supplier||!inv.date){ alert('יש להזין תאריך וספק'); return; }
      state.invoices.push(inv);
      if(!state.suppliers.find(s=>s.name===inv.supplier)){
        state.suppliers.push({id:uid(), name:inv.supplier, category:'', notes:''});
      }
      save(); refreshAll(); e.target.reset();
    });
    on($('#invoicesTable'),'click',e=>{
      const btn=e.target.closest('button'); if(!btn) return;
      const id=btn.dataset.id; const act=btn.dataset.act;
      if(act==='del'){ state.invoices=state.invoices.filter(i=>i.id!==id); save(); refreshAll(); }
      if(act==='edit'){
        const i=state.invoices.find(x=>x.id===id); if(!i) return;
        $('#invDate').value=i.date||''; $('#invSupplier').value=i.supplier||''; $('#invNumber').value=i.number||'';
        $('#invAmount').value=i.amount||0; $('#invType').value=i.type||'recurring'; $('#invPaid').checked=!!i.paid; $('#invDesc').value=i.desc||'';
        state.invoices=state.invoices.filter(x=>x.id!==id); save(); refreshAll();
        const tabBtn=$$('.tab').find(t=>t.dataset.tab==='invoices'); if(tabBtn) tabBtn.click();
      }
    });
    on($('#fabAdd'),'click',()=>{ const tabBtn=$$('.tab').find(t=>t.dataset.tab==='invoices'); if(tabBtn) tabBtn.click(); $('#invDate')?.focus(); });
  }

  function wireSupplierForm(){
    on($('#supplierForm'),'submit',e=>{
      e.preventDefault();
      const s={ id:uid(), name:($('#supName')?.value||'').trim(), category:($('#supCategory')?.value||'').trim(), notes:($('#supNotes')?.value||'').trim() };
      if(!s.name){ alert('שם ספק חובה'); return; }
      const existing=state.suppliers.find(x=>x.name===s.name);
      if(existing){ existing.category=s.category; existing.notes=s.notes; }
      else { state.suppliers.push(s); }
      save(); refreshAll(); e.target.reset();
    });
    on($('#suppliersList'),'click',e=>{
      const btn=e.target.closest('button'); if(!btn) return;
      const id=btn.dataset.id; const act=btn.dataset.act;
      if(act==='del-sup'){
        const sup=state.suppliers.find(s=>s.id===id); if(!sup) return;
        const used=state.invoices.some(i=>i.supplier===sup.name);
        if(used){ alert('לא ניתן למחוק ספק שיש לו חשבוניות'); return; }
        state.suppliers=state.suppliers.filter(s=>s.id!==id); save(); refreshAll();
      }
      if(act==='edit-sup'){
        const s=state.suppliers.find(x=>x.id===id); if(!s) return;
        $('#supName').value=s.name; $('#supCategory').value=s.category||''; $('#supNotes').value=s.notes||'';
      }
    });
  }

  function wireReports(){
    on($('#revMonth'),'change',()=>{ const k=$('#revMonth').value; $('#revAmount').value=state.revenue[k]||''; renderReports(); });
    on($('#revAmount'),'change',()=>{ const k=$('#revMonth')?.value; state.revenue[k]=Number($('#revAmount')?.value||0); save(); renderReports(); });
    on($('#reportType'),'change',renderReports);
    on($('#reportSupplier'),'change',renderReports);
  }

  function wireSettings(){
    on($('#exportJson'),'click',()=>{
      const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='expenses_data.json'; a.click(); URL.revokeObjectURL(url);
    });
    on($('#importJson'),'change',async e=>{
      const file=e.target.files[0]; if(!file) return; const text=await file.text();
      try{
        const data=JSON.parse(text);
        if(data.suppliers&&data.invoices){ state.suppliers=data.suppliers; state.invoices=data.invoices; state.revenue=data.revenue||{}; save(); refreshAll(); alert('ייבוא הושלם'); }
        else alert('קובץ לא תקין');
      }catch{ alert('שגיאת ייבוא'); }
      e.target.value='';
    });
    on($('#sampleData'),'click',()=>{
      if(!confirm('לטעון נתוני דוגמה? זה יתווסף לנתונים הקיימים.')) return;
      const sup=['סוקוליק','החברה המרכזית','ביסקוטי','ניקיון חודשי','חלב וגלידות','ירקות ופירות'];
      sup.forEach(n=>{ if(!state.suppliers.find(s=>s.name===n)){ state.suppliers.push({id:uid(), name:n, category:'', notes:''}); } });
      const today=new Date(); const y=today.getFullYear(), m=String(today.getMonth()+1).padStart(2,'0');
      const demo=[
        {date:`${y}-${m}-02`, supplier:'סוקוליק', number:'87434', amount:2150, type:'recurring', paid:true, desc:'בירות + וודקה'},
        {date:`${y}-${m}-02`, supplier:'החברה המרכזית', number:'128345', amount:1240, type:'recurring', paid:true, desc:'קולה + סודה'},
        {date:`${y}-${m}-03`, supplier:'ביסקוטי', number:'55613', amount:690, type:'oneoff', paid:false, desc:'קינוחים'},
        {date:`${y}-${m}-04`, supplier:'ניקיון חודשי', number:'0001', amount:1200, type:'recurring', paid:true, desc:'שירות'},
        {date:`${y}-${m}-05`, supplier:'חלב וגלידות', number:'9981', amount:830, type:'recurring', paid:true, desc:'חלב, שמנת, גלידות'},
        {date:`${y}-${m}-06`, supplier:'ירקות ופירות', number:'7712', amount:950, type:'oneoff', paid:false, desc:'ירקות עלים ופירות'}
      ];
      demo.forEach(d=> state.invoices.push({id:uid(), ...d}));
      state.revenue[`${y}-${m}`]=180000; save(); refreshAll();
    });
    on($('#clearAll'),'click',()=>{
      if(!confirm('איפוס מוחלט ימחק הכל מהמכשיר. להמשיך?')) return;
      state.suppliers=[]; state.invoices=[]; state.revenue={}; save(); refreshAll();
    });
    $$('.themes .chip').forEach(btn=> on(btn,'click',()=>applyTheme(btn.dataset.theme)));
  }

  function init(){
    load();
    applyTheme(localStorage.getItem('theme')||'dark');
    wireNav(); wireFilters(); wireInvoiceForm(); wireSupplierForm(); wireReports(); wireSettings();
    refreshAll();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
