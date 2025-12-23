/* ================= calculations.js ================= */

import { VAT_RATE } from './utils.js';

/**
 * סכום לפני מע״מ
 */
export function calcDocumentSubtotal(doc) {
  if (Array.isArray(doc.lines) && doc.lines.length > 0) {
    return doc.lines.reduce((sum, line) => {
      return sum + Number(line.price || 0) * Number(line.qty || 0);
    }, 0);
  }
  return Number(doc.manualAmount || 0);
}

/**
 * סכום מסמך סופי (כולל מע״מ, זיכוי)
 */
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

/**
 * סיכום חודשי
 */
export function calcMonthlySummary(documents) {
  let expenses = 0;
  let credits = 0;
  let open = 0;

  documents.forEach(doc => {
    const value = calcDocumentTotal(doc);

    if (value < 0) credits += Math.abs(value);
    else expenses += value;

    if (doc.status === 'לא שולם') {
      open += value;
    }
  });

  return {
    expenses,
    credits,
    open,
    net: expenses - credits
  };
}

/**
 * סיכום לפי קטגוריה
 */
export function calcByCategory(documents, suppliersMap) {
  const result = {};

  documents.forEach(doc => {
    const supplier = suppliersMap[doc.supplierId];
    const cat = supplier?.category || 'לא משויך';

    const val = calcDocumentTotal(doc);

    result[cat] ||= { charges: 0, credits: 0, net: 0 };

    if (val < 0) result[cat].credits += Math.abs(val);
    else result[cat].charges += val;

    result[cat].net += val;
  });

  return result;
}