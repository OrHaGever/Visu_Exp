/* ================= utils.js ================= */

export const VAT_RATE = 0.18;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function uid() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return 'id_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function money(n) {
  return '₪' + Number(n || 0).toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ---------- Modal helpers ---------- */
export function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
}
export function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
}

/* ---------- Toast (fixed to match index.html) ---------- */
let toastTimer = null;

export function toast(message, timeout = 2600) {
  const box = document.getElementById('toastBox');
  const msg = document.getElementById('toastMsg');
  if (!box || !msg) return;

  msg.textContent = message;
  box.style.display = 'flex';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    box.style.display = 'none';
  }, timeout);
}

export function bindToastClose() {
  const closeBtn = document.getElementById('toastClose');
  const box = document.getElementById('toastBox');
  if (!closeBtn || !box) return;
  closeBtn.addEventListener('click', () => (box.style.display = 'none'));
}