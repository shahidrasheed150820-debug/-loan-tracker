export function money(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value) || 0);
}

export function loanFigures(loan, asOf = new Date()) {
  const principal = Number(loan.amount) || 0;
  const rate = Number(loan.rate) || 0;
  const initialInterest = round(principal * rate / 100);
  const asOfDate = toDateString(asOf);
  const payments = (loan.payments || []).filter(payment => payment.date <= asOfDate).sort((a, b) => a.date.localeCompare(b.date));
  let runningPayments = 0;
  let settledOn = null;
  for (const payment of payments) {
    runningPayments = round(runningPayments + (Number(payment.amount) || 0));
    const dueOnPaymentDate = round(principal + initialInterest + calculateOverdueInterest(principal, loan.dueDate, payment.date));
    if (runningPayments >= dueOnPaymentDate) { settledOn = payment.date; break; }
  }
  const interestEndDate = settledOn || asOfDate;
  const overdueInterest = calculateOverdueInterest(principal, loan.dueDate, interestEndDate);
  const total = round(principal + initialInterest + overdueInterest);
  const collected = round(payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0));
  const balance = Math.max(0, round(total - collected));
  const status = balance === 0 ? 'paid' : collected > 0 ? 'partially paid' : 'unpaid';
  return { principal, interest: initialInterest, initialInterest, overdueInterest, total, collected, balance, status, settledOn };
}

export function isOverdue(loan, today = new Date()) {
  if (loanFigures(loan, today).balance === 0) return false;
  const localToday = toDateString(today);
  return loan.dueDate < localToday;
}

export function calculateOverdueInterest(principal, dueDate, asOf = new Date()) {
  if (!dueDate) return 0;
  const end = parseDate(toDateString(asOf));
  const due = parseDate(dueDate);
  if (end <= due) return 0;
  const monthlyCharge = Number(principal) * 0.20;
  let cycle = 0;
  let retained = 0;
  let cycleStart = anniversary(dueDate, cycle);
  let nextStart = anniversary(dueDate, cycle + 1);
  while (end >= parseDate(nextStart)) {
    retained += monthlyCharge;
    cycle += 1;
    cycleStart = nextStart;
    nextStart = anniversary(dueDate, cycle + 1);
  }
  const elapsedDays = daysBetween(parseDate(cycleStart), end);
  let currentCharge = 0;
  if (elapsedDays >= 14) currentCharge = monthlyCharge;
  else if (elapsedDays >= 7) currentCharge = monthlyCharge / daysInMonth(parseDate(cycleStart)) * elapsedDays;
  return round(retained + currentCharge);
}

export function anniversary(dateString, monthsAfter) {
  const original = parseDate(dateString);
  const first = new Date(Date.UTC(original.getUTCFullYear(), original.getUTCMonth() + monthsAfter, 1));
  const day = Math.min(original.getUTCDate(), daysInMonth(first));
  return `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDate(value) { return new Date(`${value}T00:00:00Z`); }
function daysBetween(start, end) { return Math.floor((end - start) / 86400000); }
function daysInMonth(date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); }
function toDateString(value) {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
