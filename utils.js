/* ================= utils.js ================= */

/**
 * קבועים
 */
export const VAT_RATE = 0.18;

/**
 * DOM helpers
 */
export const $ = sel => document.querySelector(sel);
export const $$ = sel => Array.from(document.querySelectorAll(sel));

/**
 * יצירת ID יציב
 */
export function uid() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return 'id_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/**
 * פורמט כסף
 */
export function money(n) {
  return '₪' + Number(n || 0).toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Escape ל־HTML
 */
export function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * Toast (UI)
 */
let toastTimer = null;

export function toast(message, timeout = 2600) {
  const box = $('#toast');
  const msg = $('#toastMsg');
  if (!box || !msg) return;

  msg.textContent = message;
  box.classList.remove('hide');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.add('hide'), timeout);
}