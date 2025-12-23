/* ================= calculations.js ================= */

import { VAT_RATE } from './utils.js';

/* -------- מסמך -------- */

export function calcDocumentSubtotal(doc) {
  if (Array.isArray(doc.lines) && doc.lines.length > 0) {
    return doc.lines.reduce(
      (sum, line) => sum + Number(line.price || 0) * Number(line.qty || 0),
      0
    );
  }
  return Number(doc.amount || doc.manualAmount || 0);
}

export function calcDocumentTotal(doc) {
  let total = calcDocumentSubtotal(doc);

  if (doc.vat) {
    total *= (1 + VAT_RATE);
  }

  if (doc.type === 'זיכוי') {
    total = -Math.abs(total);
  }

  return total;
}

/* -------- Dashboard -------- */

export function calcMonthlySummary(documents) {
  let expenses = 0;
  let credits = 0;
  let open = 0;

  documents.forEach(doc => {
    const val = calcDocumentTotal(doc);

    if (val < 0) credits += Math.abs(val);
    else expenses += val;

    if (doc.paid === false) {
      open += val;
    }
  });

  return {
    expenses,
    credits,
    open,
    net: expenses - credits
  };
}

/* -------- Reports -------- */

/**
 * סינון מסמכים לדוח
 */
export function filterReportDocuments(documents, options) {
  const { month, supplier, type } = options;

  const first = month ? month + '-01' : null;
  const last = month ? month + '-31' : null;

  return documents.filter(d => {
    if (month) {
      if (!d.date || d.date < first || d.date > last) return false;
    }
    if (supplier && d.supplier !== supplier) return false;
    if (type && d.type !== type) return false;
    return true;
  });
}

/**
 * סיכום דוח הוצאות
 */
export function calcReportSummary(documents) {
  let total = 0;
  let recurring = 0;
  let oneoff = 0;

  documents.forEach(d => {
    const val = calcDocumentTotal(d);
    total += val;

    if (d.type === 'recurring') recurring += val;
    if (d.type === 'oneoff') oneoff += val;
  });

  return {
    total,
    recurring,
    oneoff
  };
}

/**
 * סיכום לפי ספק לדוח
 */
export function calcReportBySupplier(documents) {
  const map = {};

  documents.forEach(d => {
    const val = calcDocumentTotal(d);
    map[d.supplier] = (map[d.supplier] || 0) + val;
  });

  return map;
}