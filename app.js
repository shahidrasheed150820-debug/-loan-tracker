import { money, loanFigures, isOverdue } from './calculations.js';

const STORAGE_KEY = 'utang-talaan-loans-v1';
const sampleLoans = [
  { id:'sample-1', borrower:'Maria Santos', amount:12000, rate:5, loanDate:'2026-08-01', dueDate:'2026-10-01', payments:[{date:'2026-08-20',amount:4000}] },
  { id:'sample-2', borrower:'Paolo Cruz', amount:7500, rate:8, loanDate:'2026-06-10', dueDate:'2026-07-10', payments:[] },
  { id:'sample-3', borrower:'Liza Mendoza', amount:5000, rate:4, loanDate:'2026-05-01', dueDate:'2026-06-01', payments:[{date:'2026-05-15',amount:5200}] }
];
let loans = loadLoans();
const $ = (selector) => document.querySelector(selector);
const dialog = $('#loanDialog');

function loadLoans() {
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : sampleLoans; }
  catch { return sampleLoans; }
}
function saveLoans(message = 'Changes saved on this device') { localStorage.setItem(STORAGE_KEY, JSON.stringify(loans)); render(); toast(message); }
function safe(text) { const node=document.createElement('span'); node.textContent=text; return node.innerHTML; }
function displayDate(date) { return new Intl.DateTimeFormat('en-PH',{year:'numeric',month:'short',day:'numeric'}).format(new Date(`${date}T00:00:00`)); }
function render() {
  const query=$('#searchInput').value.trim().toLowerCase();
  const shown=loans.filter(l=>l.borrower.toLowerCase().includes(query));
  const totals=loans.reduce((sum,l)=>{const f=loanFigures(l);sum.lent+=f.principal;sum.collected+=f.collected;sum.outstanding+=f.balance;return sum},{lent:0,collected:0,outstanding:0});
  $('#totalLent').textContent=money(totals.lent); $('#totalCollected').textContent=money(totals.collected); $('#totalOutstanding').textContent=money(totals.outstanding);
  $('#loanCount').textContent=`${shown.length} ${shown.length===1?'record':'records'}`; $('#emptyState').hidden=shown.length>0;
  $('#loanList').innerHTML=shown.map(loan=>{const f=loanFigures(loan), overdue=isOverdue(loan), pct=f.total?Math.min(100,(f.collected/f.total)*100):0;return `
    <article class="loan-card"><div class="card-head"><div><h3>${safe(loan.borrower)}</h3><div class="chips"><span class="chip ${f.status.replace(' ','-')}">${f.status}</span>${overdue?'<span class="chip overdue">Overdue</span>':''}</div></div><div class="menu-actions"><button class="icon-button edit" data-id="${loan.id}" aria-label="Edit ${safe(loan.borrower)}">✎</button><button class="icon-button danger delete" data-id="${loan.id}" aria-label="Delete ${safe(loan.borrower)}">⌫</button></div></div>
    <div class="amount-row"><div><span>Initial interest</span><strong>${money(f.initialInterest)}</strong></div><div><span>Overdue interest</span><strong>${money(f.overdueInterest)}</strong></div><div><span>Payments</span><strong>${money(f.collected)}</strong></div><div><span>Remaining balance</span><strong class="balance">${money(f.balance)}</strong></div></div><div class="total-due-line"><span>Total due</span><strong>${money(f.total)}</strong></div><div class="progress" title="${Math.round(pct)}% collected"><span style="width:${pct}%"></span></div>
    <div class="date-grid"><div><span>Loan date</span><strong>${displayDate(loan.loanDate)}</strong></div><div><span>Due date</span><strong>${displayDate(loan.dueDate)}</strong></div></div>
    <p class="interest-explanation">${interestExplanation(loan,f)}</p><div class="card-foot"><p>${loan.rate}% initial flat interest · ${loan.payments.length} payment${loan.payments.length===1?'':'s'}</p><button class="text-button edit" data-id="${loan.id}">View & edit</button></div></article>`}).join('');
}
function interestExplanation(loan,f){if(f.settledOn)return `Fully settled on ${displayDate(f.settledOn)}; overdue interest stopped on that date.`;if(f.overdueInterest===0)return `No overdue charge yet. Each overdue cycle has a 6-day grace period after the due-date anniversary.`;return `Overdue interest is 20% of the original ${money(f.principal)} principal per monthly due-date cycle. Days 7–13 are prorated from day 1; day 14 charges the full monthly amount. Previous cycles are retained.`}
function openForm(id) {
  const loan=loans.find(l=>l.id===id); $('#loanForm').reset(); $('#loanId').value=loan?.id||''; $('#dialogTitle').textContent=loan?'Edit loan':'Add new loan';
  $('#borrower').value=loan?.borrower||''; $('#amount').value=loan?.amount||''; $('#rate').value=loan?.rate??5; $('#loanDate').value=loan?.loanDate||today(); $('#dueDate').value=loan?.dueDate||''; $('#paymentsSection').hidden=!loan; $('#formError').textContent='';
  renderPaymentRows(loan?.payments||[]); updatePreview(); dialog.showModal();
}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function renderPaymentRows(payments){$('#paymentRows').innerHTML=payments.map((p,i)=>`<div class="payment-row"><label>Date<input class="payment-date" type="date" required value="${p.date}"></label><label>Amount (₱)<input class="payment-amount" type="number" min="0.01" step="0.01" inputmode="decimal" required value="${p.amount}"></label><button class="icon-button remove-payment" type="button" data-index="${i}" aria-label="Remove payment">×</button></div>`).join('')}
function getPayments(){return [...document.querySelectorAll('.payment-row')].map(row=>({date:row.querySelector('.payment-date').value,amount:Number(row.querySelector('.payment-amount').value)}))}
function updatePreview(){const f=loanFigures({amount:$('#amount').value,rate:$('#rate').value,dueDate:$('#dueDate').value,payments:getPayments()});$('#previewInterest').textContent=money(f.initialInterest);$('#previewOverdue').textContent=money(f.overdueInterest);$('#previewTotal').textContent=money(f.total)}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2400)}

document.addEventListener('click',e=>{const edit=e.target.closest('.edit'), del=e.target.closest('.delete');if(edit)openForm(edit.dataset.id);if(del){const loan=loans.find(l=>l.id===del.dataset.id);if(confirm(`Delete the loan for ${loan.borrower}? This cannot be undone.`)){loans=loans.filter(l=>l.id!==loan.id);saveLoans('Loan deleted')}}});
['#addLoanTop','#addLoanEmpty','#floatingAdd'].forEach(id=>$(id).addEventListener('click',()=>openForm()));
$('#closeDialog').addEventListener('click',()=>dialog.close()); $('#cancelDialog').addEventListener('click',()=>dialog.close()); $('#searchInput').addEventListener('input',render); $('#amount').addEventListener('input',updatePreview); $('#rate').addEventListener('input',updatePreview); $('#dueDate').addEventListener('input',updatePreview);
$('#addPayment').addEventListener('click',()=>renderPaymentRows([...getPayments(),{date:today(),amount:''}]));
$('#paymentRows').addEventListener('click',e=>{const btn=e.target.closest('.remove-payment');if(btn){const p=getPayments();p.splice(Number(btn.dataset.index),1);renderPaymentRows(p)}});
$('#paymentRows').addEventListener('input',updatePreview);
$('#loanForm').addEventListener('submit',e=>{e.preventDefault();const id=$('#loanId').value;const loan={id:id||crypto.randomUUID(),borrower:$('#borrower').value.trim(),amount:Number($('#amount').value),rate:Number($('#rate').value),loanDate:$('#loanDate').value,dueDate:$('#dueDate').value,payments:id?getPayments():[]};if(!loan.borrower||!loan.amount||!loan.loanDate||!loan.dueDate){$('#formError').textContent='Please complete all required fields.';return}if(loan.dueDate<loan.loanDate){$('#formError').textContent='Due date cannot be before the loan date.';return}const index=loans.findIndex(l=>l.id===id);if(index>=0)loans[index]=loan;else loans.unshift(loan);dialog.close();saveLoans(index>=0?'Loan updated':'Loan added')});
$('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({app:'Utang Talaan',version:1,exportedAt:new Date().toISOString(),loans},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`utang-talaan-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast('Backup downloaded')});
$('#importBtn').addEventListener('click',()=>$('#importFile').click());
$('#importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text()), imported=Array.isArray(data)?data:data.loans;if(!Array.isArray(imported)||!imported.every(l=>l.id&&l.borrower&&Number(l.amount)>=0&&Array.isArray(l.payments)))throw new Error();if(confirm(`Import ${imported.length} loans? This will replace records on this device.`)){loans=imported;saveLoans('Backup imported successfully')}}catch{alert('That file is not a valid Utang Talaan backup.')}e.target.value=''});
render();
