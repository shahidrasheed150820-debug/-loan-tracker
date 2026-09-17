import test from 'node:test';
import assert from 'node:assert/strict';
import { loanFigures, isOverdue, money } from '../calculations.js';

test('calculates flat interest and total due',()=>{assert.deepEqual(loanFigures({amount:10000,rate:5,payments:[]}),{principal:10000,interest:500,total:10500,collected:0,balance:10500,status:'unpaid'})});
test('subtracts payments and marks partially paid',()=>{const f=loanFigures({amount:10000,rate:5,payments:[{amount:2500},{amount:500}]});assert.equal(f.collected,3000);assert.equal(f.balance,7500);assert.equal(f.status,'partially paid')});
test('never shows a negative balance and marks fully paid',()=>{const f=loanFigures({amount:1000,rate:10,payments:[{amount:1200}]});assert.equal(f.balance,0);assert.equal(f.status,'paid')});
test('flags only unpaid balances after due date',()=>{const date=new Date(2026,8,17);assert.equal(isOverdue({amount:1000,rate:0,dueDate:'2026-09-16',payments:[]},date),true);assert.equal(isOverdue({amount:1000,rate:0,dueDate:'2026-09-18',payments:[]},date),false);assert.equal(isOverdue({amount:1000,rate:0,dueDate:'2026-09-16',payments:[{amount:1000}]},date),false)});
test('formats Philippine pesos',()=>{assert.match(money(1234.5),/₱1,234\.50/) });
