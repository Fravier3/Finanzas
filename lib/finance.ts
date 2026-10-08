export type Period = {id:string; start:string; end:string|null; amount:number; cycle:'monthly'|'annual'; day:number; card:string};
export type Payment = {id:string; due:string; date:string; amount:number; card:string; status:'paid'|'pending'|'skipped'; note:string};
export type Saving = {id:string; from:string; to:string|null; amount:number; cycle:'monthly'|'annual'; day:number; anchor:string};
export type Item = {id:string; name:string; kind:'subscription'|'bill'; color:string; notes:string; variable:boolean; periods:Period[]; savings:Saving[]; payments:Payment[]};
export type SavingsSnapshot = {id:string;date:string;amount:number};
export type SavingsPlan = {id:string;start:string;end:string|null;amount:number;day:number};
export type SavingsAccount = {id:string;name:string;color:string;notes:string;snapshots:SavingsSnapshot[];plans:SavingsPlan[];deletedAt?:string};
export type Workspace = {items:Item[];savingsAccounts?:SavingsAccount[]};
export type Charge = Payment & {itemId:string; name:string; kind:Item['kind']; color:string; estimated:boolean};
export const months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export const money=(n:number)=>new Intl.NumberFormat('es-PR',{style:'currency',currency:'USD'}).format(n);
export function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export const uid=()=>crypto.randomUUID();
export const sum=(a:number[])=>Math.round(a.reduce((x,y)=>x+y,0)*100)/100;
export function dateFor(y:number,m:number,day:number){return `${y}-${String(m+1).padStart(2,'0')}-${String(Math.min(day,new Date(y,m+1,0).getDate())).padStart(2,'0')}`;}
export function dates(p:Period,year:number){return Array.from({length:12},(_,m)=>dateFor(year,m,p.day)).filter(d=>d>=p.start&&(!p.end||d<p.end)&&(p.cycle==='monthly'||Number(d.slice(5,7))===Number(p.start.slice(5,7))));}
export function charges(item:Item,year:number):Charge[]{const map=new Map<string,Charge>();const extra={itemId:item.id,name:item.name,kind:item.kind,color:item.color};for(const p of item.periods)for(const due of dates(p,year))map.set(due,{...extra,id:due,due,date:due,amount:p.amount,card:p.card,status:'pending',note:'',estimated:true});for(const p of item.payments)if(Number(p.due.slice(0,4))===year)map.set(p.due,{...p,...extra,estimated:false});return [...map.values()].sort((a,b)=>a.due.localeCompare(b.due));}
export function paidThrough(items:Item[],year:number,cutoff:string){return items.flatMap(i=>charges(i,year)).filter(p=>p.status==='paid'&&p.date<=cutoff&&Number(p.date.slice(0,4))===year);}
// Payments can be posted in a different year from their scheduled due date.
export function actualPayments(items:Item[],year:number,cutoff:string){return items.flatMap(i=>i.payments.filter(p=>p.status==='paid'&&Number(p.date.slice(0,4))===year&&p.date<=cutoff).map(p=>({...p,itemId:i.id,name:i.name,kind:i.kind,color:i.color,estimated:false})));}
// The spending summary reads expense records only. Savings account balances,
// contributions and avoided charges are never inputs to an expense total.
export function expenseSummary(workspace:Workspace,year:number,cutoff:string){
 const items=workspace.items.filter(i=>i.kind==='subscription'||i.kind==='bill');
 const paid=actualPayments(items,year,cutoff);
 const subscriptions=sum(paid.filter(p=>p.kind==='subscription').map(p=>p.amount));
 const bills=sum(paid.filter(p=>p.kind==='bill').map(p=>p.amount));
 const details=items.map(i=>({...i,paid:sum(paid.filter(p=>p.itemId===i.id).map(p=>p.amount)),count:paid.filter(p=>p.itemId===i.id).length})).filter(i=>i.count>0).sort((a,b)=>b.paid-a.paid);
 return {paid,subscriptions,bills,total:sum([subscriptions,bills]),details};
}
export function currentPeriod(i:Item,date=today()){return [...i.periods].reverse().find(p=>p.start<=date&&(!p.end||date<p.end));}
export function monthly(i:Item,date=today()){const p=currentPeriod(i,date);return p?p.amount/(p.cycle==='annual'?12:1):0;}
export function savingDates(s:Saving,year:number){return dates({id:s.id,start:s.anchor,end:s.to,amount:s.amount,cycle:s.cycle,day:s.day,card:''},year).filter(d=>d>=s.from);}
export function saved(i:Item,year:number,cutoff:string){const paidDues=new Set(i.payments.filter(p=>p.status==='paid').map(p=>p.due));return sum(i.savings.flatMap(s=>savingDates(s,year).filter(d=>d<=cutoff&&!paidDues.has(d)).map(()=>s.amount)));}
export function cancelSubscription(item:Item,from:string,amount:number,now=today()):Item{
 const p=item.periods.at(-1);
 if(!p||p.end)throw Error('No hay un calendario vigente para cancelar.');
 if(from<=p.start||from>now)throw Error('La cancelación debe ser posterior al inicio y no puede estar en el futuro.');
 // A charge paid on the cancellation date is historical spending, not savings.
 if(item.payments.some(x=>x.status==='paid'&&x.due>from))throw Error('Hay pagos confirmados con fecha prevista posterior a esta cancelación. Corrígelos o selecciona una fecha posterior.');
 return {...item,periods:item.periods.map(x=>x.id===p.id?{...x,end:from}:x),savings:[...item.savings,{id:uid(),from,to:null,amount,cycle:p.cycle,day:p.day,anchor:p.start}]};
}
export function savingMonthly(i:Item,date=today()){const s=i.savings.find(s=>s.from<=date&&(!s.to||date<s.to));return s?s.amount/(s.cycle==='annual'?12:1):0;}
export function isSaving(i:Item){return i.savings.some(s=>!s.to);}
export function validWorkspace(input:unknown):input is Workspace{if(!input||typeof input!=='object'||!Array.isArray((input as Workspace).items))return false;const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;const amount=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=9999999;const ids=new Set();return validSavingsAccounts((input as Workspace).savingsAccounts)&&(input as Workspace).items.length<=1000&&(input as Workspace).items.every(i=>{if(typeof i.id!=='string'||ids.has(i.id))return false;ids.add(i.id);return typeof i.name==='string'&&i.name.length>0&&i.name.length<=100&&['subscription','bill'].includes(i.kind)&&/^#[0-9a-f]{6}$/i.test(i.color)&&typeof i.notes==='string'&&typeof i.variable==='boolean'&&Array.isArray(i.periods)&&Array.isArray(i.savings)&&Array.isArray(i.payments)&&i.periods.every(p=>typeof p.id==='string'&&date(p.start)&&(p.end===null||(date(p.end)&&p.end>p.start))&&amount(p.amount)&&['monthly','annual'].includes(p.cycle)&&Number.isInteger(p.day)&&p.day>=1&&p.day<=31&&typeof p.card==='string')&&i.savings.every(s=>typeof s.id==='string'&&date(s.from)&&date(s.anchor)&&(s.to===null||(date(s.to)&&s.to>=s.from))&&amount(s.amount)&&['monthly','annual'].includes(s.cycle)&&Number.isInteger(s.day)&&s.day>=1&&s.day<=31)&&i.payments.every(p=>typeof p.id==='string'&&date(p.due)&&date(p.date)&&amount(p.amount)&&typeof p.card==='string'&&typeof p.note==='string'&&['paid','pending','skipped'].includes(p.status))});}

// Keep historical spending separate from today's commitments.
export function spendingBreakdown(items:Item[],year:number,cutoff:string,now=today()){
 const active=items.filter(i=>!!currentPeriod(i,now)&&!isSaving(i));
 const activeIds=new Set(active.map(i=>i.id));
 const payments=actualPayments(items,year,cutoff);
 const activePaid=sum(payments.filter(p=>activeIds.has(p.itemId)).map(p=>p.amount));
 const inactivePaid=sum(payments.filter(p=>!activeIds.has(p.itemId)).map(p=>p.amount));
 return {activePaid,inactivePaid,total:sum([activePaid,inactivePaid]),inactive:items.filter(i=>!activeIds.has(i.id))};
}
export function nextCharge(i:Item,from=today()){
 const year=Number(from.slice(0,4));
 const firstStart=i.periods.filter(p=>!p.end||p.end>=from).map(p=>Number(p.start.slice(0,4)));
 const years=new Set([year,year+1,...firstStart]);
 return [...years].flatMap(y=>charges(i,y)).filter(p=>p.status==='pending'&&p.due>=from).sort((a,b)=>a.due.localeCompare(b.due))[0];
}
export function avoidedCharges(i:Item,from:string,to:string){
 const paid=new Set(i.payments.filter(p=>p.status==='paid').map(p=>p.due));
 const years=Array.from({length:Math.max(0,Number(to.slice(0,4))-Number(from.slice(0,4))+1)},(_,k)=>Number(from.slice(0,4))+k);
 return i.savings.flatMap(s=>years.flatMap(y=>savingDates(s,y)).filter(d=>d>=from&&d<=to&&!paid.has(d)).map(d=>({itemId:i.id,name:i.name,due:d,amount:s.amount}))).sort((a,b)=>a.due.localeCompare(b.due));
}
export function savingsOutlook(items:Item[],now=today()){
 const year=Number(now.slice(0,4));
 const end=dateFor(year+1,Number(now.slice(5,7))-1,Number(now.slice(8,10)));
 const future=items.flatMap(i=>avoidedCharges(i,now,end)).filter(p=>p.due>now).sort((a,b)=>a.due.localeCompare(b.due));
 return {next:future[0],charges:future,total:sum(future.map(p=>p.amount))};
}

// A balance checkpoint already includes all deposits on that date. Only add
// scheduled contributions strictly after it, including while the app is closed.
export function accountContributions(a:SavingsAccount,from:string,to:string){
 if(to<=from)return [];
 const years=Array.from({length:Number(to.slice(0,4))-Number(from.slice(0,4))+1},(_,n)=>Number(from.slice(0,4))+n);
 return a.plans.flatMap(p=>years.flatMap(y=>dates({...p,cycle:'monthly',card:''},y)).filter(d=>d>from&&d<=to).map(d=>({date:d,amount:p.amount}))).sort((a,b)=>a.date.localeCompare(b.date));
}
export function accountBalance(a:SavingsAccount,asOf=today()):number|null{
 const base=[...a.snapshots].filter(s=>s.date<=asOf).sort((a,b)=>b.date.localeCompare(a.date))[0];
 return base?sum([base.amount,...accountContributions(a,base.date,asOf).map(p=>p.amount)]):null;
}
export function totalSavingsBalance(accounts:SavingsAccount[],asOf=today()){
 return sum(accounts.filter(a=>!a.deletedAt).map(a=>accountBalance(a,asOf)??0));
}
export function accountMonthly(a:SavingsAccount,asOf=today()){
 // Upcoming plans are included in the monthly commitment, before their first deposit.
 return a.plans.find(p=>!p.end||asOf<p.end)?.amount??0;
}
export function nextContribution(a:SavingsAccount,asOf=today()){
 const startYear=Number(asOf.slice(0,4));
 const years=new Set([startYear,startYear+1,...a.plans.map(p=>Number(p.start.slice(0,4)))]);
 return [...years].flatMap(y=>a.plans.flatMap(p=>dates({...p,cycle:'monthly',card:''},y).filter(d=>d>asOf&&p.amount>0).map(d=>({date:d,amount:p.amount})))).sort((a,b)=>a.date.localeCompare(b.date))[0];
}
export function updateSavingsAccount(a:SavingsAccount|undefined,fields:{name:string;color:string;notes:string;balance:number;monthly:number;next:string;day:number},now=today()):SavingsAccount{
 if(fields.next<=now&&fields.monthly>0)throw Error('El próximo aporte debe ser posterior al saldo actual: este saldo ya incluye los movimientos de hoy.');
 const next:SavingsAccount={id:a?.id??uid(),name:fields.name.trim(),color:fields.color,notes:fields.notes,snapshots:[...(a?.snapshots??[]).filter(s=>s.date<now),{id:uid(),date:now,amount:fields.balance}],plans:[...(a?.plans??[]).filter(p=>p.start<now).map(p=>({...p,end:!p.end||p.end>now?now:p.end})),...(fields.monthly>0?[{id:uid(),start:fields.next,end:null,amount:fields.monthly,day:fields.day}]:[])]};
 if(!validSavingsAccounts([next]))throw Error('Revisa el nombre, saldo, importe y fechas de la cuenta.');
 return next;
}
export function validSavingsAccounts(value:unknown):value is SavingsAccount[]|undefined{
 if(value===undefined)return true; // Backward-compatible with existing accounts/backups.
 if(!Array.isArray(value)||value.length>200)return false;
 const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
 const amount=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=9999999;
 const ids=new Set<string>();
 return value.every(a=>{if(!a||typeof a.id!=='string'||ids.has(a.id))return false;ids.add(a.id);
  if(typeof a.name!=='string'||!a.name.trim()||a.name.length>100||!/^#[0-9a-f]{6}$/i.test(a.color)||typeof a.notes!=='string'||a.notes.length>2000||(a.deletedAt!==undefined&&!date(a.deletedAt))||!Array.isArray(a.snapshots)||!a.snapshots.length||a.snapshots.length>5000||!Array.isArray(a.plans)||a.plans.length>5000)return false;
  if(!a.snapshots.every((s:SavingsSnapshot)=>s&&typeof s.id==='string'&&date(s.date)&&amount(s.amount))||new Set(a.snapshots.map((s:SavingsSnapshot)=>s.date)).size!==a.snapshots.length)return false;
  if(!a.plans.every((p:SavingsPlan)=>p&&typeof p.id==='string'&&date(p.start)&&(p.end===null||(date(p.end)&&p.end>p.start))&&amount(p.amount)&&Number.isInteger(p.day)&&p.day>=1&&p.day<=31))return false;
  const sorted=[...a.plans].sort((a,b)=>a.start.localeCompare(b.start));
  return sorted.every((p,n)=>!n||(sorted[n-1].end!==null&&sorted[n-1].end<=p.start));
 });
}
