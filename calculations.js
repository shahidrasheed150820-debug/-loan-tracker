export function money(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value) || 0);
}

export function loanFigures(loan) {
  const principal = Number(loan.amount) || 0;
  const rate = Number(loan.rate) || 0;
  const interest = round(principal * rate / 100);
  const total = round(principal + interest);
  const collected = round((loan.payments || []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0));
  const balance = Math.max(0, round(total - collected));
  const status = balance === 0 ? 'paid' : collected > 0 ? 'partially paid' : 'unpaid';
  return { principal, interest, total, collected, balance, status };
}

export function isOverdue(loan, today = new Date()) {
  if (loanFigures(loan).balance === 0) return false;
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return loan.dueDate < localToday;
}

export function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
