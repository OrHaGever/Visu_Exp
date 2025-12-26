/* ================= calculations.js ================= */

import { VAT_RATE } from './utils.js';

export function calcDocNetAmount(doc) {
  return Number(doc.amount || 0);
}

export function calcDocTotal(doc) {
  let total = Number(doc.amount || 0);

  if (doc.vatApplied) total *= (1 + VAT_RATE);

  if (doc.docType === 'זיכוי') total = -Math.abs(total);
  else total = Math.abs(total);

  return total;
}

export function calcKPIs(documents) {
  const total = documents.reduce((s, d) => s + calcDocTotal(d), 0);
  const docs = documents.length;
  const unpaid = documents.filter(d => d.paid === false).length;

  return { total, docs, unpaid };
}