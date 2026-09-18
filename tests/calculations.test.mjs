import test from 'node:test';
import assert from 'node:assert/strict';
import { anniversary, calculateOverdueInterest, loanFigures, isOverdue, money } from '../calculations.js';

const base = { amount:1000, rate:20, loanDate:'2026-03-01', dueDate:'2026-04-30', payments:[] };

test('keeps the first six overdue days free', () => {
  assert.equal(loanFigures(base, '2026-05-06').total, 1200);
});

test('prorates from day one on days 7 through 13', () => {
  assert.equal(loanFigures(base, '2026-05-07').overdueInterest, 46.67);
  assert.equal(loanFigures(base, '2026-05-08').total, 1253.33);
  assert.equal(calculateOverdueInterest(1000, '2026-04-30', '2026-05-13'), 86.67);
});

test('replaces proration with the full 20% charge on day 14', () => {
  assert.equal(loanFigures(base, '2026-05-14').overdueInterest, 200);
  assert.equal(loanFigures(base, '2026-05-14').total, 1400);
});

test('retains full charges from previous anniversary cycles', () => {
  assert.equal(calculateOverdueInterest(1000, '2026-04-30', '2026-06-07'), 251.61);
  assert.equal(calculateOverdueInterest(1000, '2026-04-30', '2026-06-13'), 400);
});

test('clamps month-end anniversaries and uses the cycle start month length', () => {
  assert.equal(anniversary('2025-01-31', 1), '2025-02-28');
  assert.equal(anniversary('2025-01-31', 2), '2025-03-31');
  assert.equal(calculateOverdueInterest(1000, '2025-01-31', '2025-03-07'), 250);
});

test('handles February in leap years', () => {
  assert.equal(anniversary('2024-01-31', 1), '2024-02-29');
  assert.equal(calculateOverdueInterest(1000, '2024-02-29', '2024-03-07'), 48.28);
});

test('partial payments lower balance without lowering the interest principal', () => {
  const loan = { ...base, payments:[{ date:'2026-05-07', amount:500 }] };
  const figures = loanFigures(loan, '2026-05-14');
  assert.equal(figures.overdueInterest, 200);
  assert.equal(figures.collected, 500);
  assert.equal(figures.balance, 900);
  assert.equal(figures.status, 'partially paid');
});

test('dated settlement stops future charges and a paid loan stays paid', () => {
  const loan = { amount:1000, rate:20, dueDate:'2026-01-01', payments:[{ date:'2026-01-10', amount:1258.06 }] };
  const figures = loanFigures(loan, '2026-09-01');
  assert.equal(figures.settledOn, '2026-01-10');
  assert.equal(figures.overdueInterest, 58.06);
  assert.equal(figures.balance, 0);
  assert.equal(figures.status, 'paid');
  assert.equal(isOverdue(loan, new Date(2026, 8, 1)), false);
});

test('loads the previous record shape without mutation or migration', () => {
  const existing = { id:'old-1', borrower:'Existing Borrower', amount:10000, rate:5, loanDate:'2026-01-01', dueDate:'2026-02-01', payments:[{date:'2026-01-15',amount:500}] };
  const snapshot = JSON.stringify(existing);
  const figures = loanFigures(existing, '2026-02-01');
  assert.equal(figures.initialInterest, 500);
  assert.equal(figures.balance, 10000);
  assert.equal(JSON.stringify(existing), snapshot);
});

test('rounds currency to two decimal places and formats Philippine pesos', () => {
  assert.equal(calculateOverdueInterest(999.99, '2026-04-30', '2026-05-07'), 46.67);
  assert.match(money(1234.5), /₱1,234\.50/);
});
