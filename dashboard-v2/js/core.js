/* ═══════════════ LIFE OS v2 — núcleo ═══════════════
   Estado reativo + utilitários + dados de domínio.
   As chaves de localStorage são as MESMAS da v1 (fl_*) — as duas versões
   leem e escrevem os mesmos dados, sem migração. */
import {useState,useEffect,html} from '../vendor/preact-htm.module.js';

export const TZ='Atlantic/Azores';
export const K={tasks:'fl_tasks_v3',fin:'fl_fin_v1',set:'fl_settings_v1',habits:'fl_habits_v1',
  water:'fl_water_v1',lab:'fl_lab_v1',labnotes:'fl_labnotes_v1',proj:'fl_proj_v1',
  theme:'fl_theme',key:'fl_anthropic_key',
  routine:'fl_routine_v1',calCache:'fl_cal_cache_v1',mailCache:'fl_mail_cache_v1',goals:'fl_goals_v1',
  finRec:'fl_fin_rec_v1',driveBk:'fl_drive_bk_v1'};

/* ── armazenamento reativo ──
   save() notifica quem usa useKey(k) — a UI atualiza sozinha, sem flags
   manuais nem chamadas explícitas a render*() como na v1. */
const subs=new Set();
export const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
export function emit(k){subs.forEach(f=>f(k))}
export function save(k,v){localStorage.setItem(k,JSON.stringify(v));if(k===K.habits)_hsCache=null;emit(k)}
export function useKey(k,d){
  const[,tick]=useState(0);
  useEffect(()=>{const f=c=>{if(c===k||c==='*')tick(t=>t+1)};subs.add(f);return()=>subs.delete(f)},[k]);
  return LS(k,d);
}
/* sinais: valores reativos que vivem em memória (tokens, caches de sync) */
export function signal(v0){
  const s={v:v0,
    set(n){s.v=n;emit(s)},
    use(){const[,tick]=useState(0);
      useEffect(()=>{const f=c=>{if(c===s)tick(t=>t+1)};subs.add(f);return()=>subs.delete(f)},[]);
      return s.v}};
  return s;
}

/* ── definições ── */
export const DEFAULT_SETTINGS={
  name:'Filipe', startWeight:95, goalWeight:73, height:1.69,
  waterGoal:2.5, fastGoal:14, kcalGoal:1900, protGoal:150,
  budgets:{hab:650,ali:400,tra:180,sau:120,sub:60,pes:150,mat:250,out:100}
};
export const S=()=>({...DEFAULT_SETTINGS,...LS(K.set,{}),budgets:{...DEFAULT_SETTINGS.budgets,...(LS(K.set,{}).budgets||{})}});

/* ── datas pt-PT no fuso dos Açores — formatadores partilhados ── */
export const now=()=>new Date();
const DTF_AZ=new Intl.DateTimeFormat('pt-PT',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
const DTF_DAY=new Intl.DateTimeFormat('pt-PT',{timeZone:'UTC',weekday:'short',day:'numeric'});
const DTF_LONG=new Intl.DateTimeFormat('pt-PT',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long'});
const DTF_MONTH=new Intl.DateTimeFormat('pt-PT',{month:'long',year:'numeric'});
export const DTF_DM=new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'2-digit'});
const NF_EUR0=new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const NF_EUR2=new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:2});
export const azParts=d=>{const p={};DTF_AZ.formatToParts(d).forEach(x=>p[x.type]=x.value);return p};
export const todayISO=()=>{const p=azParts(now());return `${p.year}-${p.month}-${p.day}`};
export const isoAddDays=(iso,n)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
export const weekStartISO=()=>{const d=new Date(todayISO()+'T12:00:00Z');const dow=(d.getUTCDay()+6)%7;return isoAddDays(todayISO(),-dow)};
export const fmtDay=iso=>DTF_DAY.format(new Date(iso+'T12:00:00Z'));
export const fmtLong=iso=>DTF_LONG.format(new Date(iso+'T12:00:00Z'));
export const nowHM=()=>{const p=azParts(now());return `${p.hour}:${p.minute}`};
/* CORRIGIDO vs v1: a v1 usava toISOString() (UTC) — no inverno (UTC−1), entre
   as 23:00 e a meia-noite do fim do mês, os movimentos caíam no mês seguinte. */
export const monthKey=d=>{const p=azParts(d);return `${p.year}-${p.month}`};
export const monthLabel=mk=>{const[y,m]=mk.split('-');return DTF_MONTH.format(new Date(+y,+m-1,15))};
export const daysInMonth=mk=>{const[y,m]=mk.split('-').map(Number);return new Date(y,m,0).getDate()};
export const eur=n=>(n%1?NF_EUR2:NF_EUR0).format(n);
export const staticNum=(v,dec=0,suffix='',prefix='')=>prefix+v.toLocaleString('pt-PT',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suffix;
export const deent=s=>{const t=document.createElement('textarea');t.innerHTML=String(s||'');return t.value};
export const agoLabel=ts=>{if(!ts)return'';const m=Math.round((Date.now()-ts)/60000);
  return m<1?'agora mesmo':m<60?`há ${m} min`:m<1440?`há ${Math.round(m/60)} h`:`há ${Math.round(m/1440)} d`};

/* relógio partilhado: re-renderiza quem o usa a cada 15 s */
const clockSig=signal(nowHM());
setInterval(()=>{const hm=nowHM();if(hm!==clockSig.v)clockSig.set(hm)},15000);
export const useClock=()=>clockSig.use();

export function haptic(style='light'){
  try{
    const C=window.Capacitor;
    if(C&&C.Plugins&&C.Plugins.Haptics){C.Plugins.Haptics.impact({style:style==='light'?'LIGHT':'MEDIUM'});return}
    if(navigator.vibrate)navigator.vibrate(8);
  }catch(e){}
}
export function toast(msg){const t=document.getElementById('toast');if(!t)return;
  t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2200)}

/* ═══════════════ DADOS DE DOMÍNIO ═══════════════ */
export const FIN_CATS={
  sal:{n:'Salário',ic:'💰',c:'var(--green)'},
  lab:{n:'Lab · trabalho',ic:'⬡',c:'var(--blue)'},
  mat:{n:'Materiais',ic:'🔧',c:'var(--purple)'},
  hab:{n:'Habitação',ic:'🏠',c:'var(--orange)'},
  ali:{n:'Alimentação',ic:'🍽',c:'var(--yellow)'},
  tra:{n:'Transporte',ic:'🚗',c:'var(--pink)'},
  sau:{n:'Saúde',ic:'💪',c:'var(--green)'},
  sub:{n:'Subscrições',ic:'📱',c:'var(--red)'},
  pes:{n:'Pessoal',ic:'🎯',c:'var(--blue)'},
  out:{n:'Outros',ic:'•',c:'var(--txt3)'}
};
export const PRI={alta:{n:'Alta',c:'red',w:0},media:{n:'Média',c:'orange',w:1},baixa:{n:'Baixa',c:'gray',w:2}};
export const priOf=t=>PRI[t.pri]||PRI.media;
export const FASES=['Moldes','Provas','Enceramento','Acrilização','Acabamento','Entregue'];
export const FASE_CORES_V=['var(--blue)','var(--purple)','var(--orange)','#d9a824','var(--green)'];
export const faseIdx=f=>Math.max(0,FASES.indexOf(f));

/* rotina diária */
export const getRoutine=()=>LS(K.routine,[]).slice().sort((a,b)=>a.h<b.h?-1:1);
export function routineIcon(t){
  const s=t.toLowerCase();
  if(/corrida|correr|run/.test(s))return '🏃';
  if(/treino|freeletics|gym|giná|muscula/.test(s))return '💪';
  if(/ler|leitura|livro/.test(s))return '📖';
  if(/estud|ia |curso|aprend/.test(s))return '🧠';
  if(/medita|respira|yoga/.test(s))return '🧘';
  if(/almoço|jantar|refei|comer/.test(s))return '🍽';
  if(/lab|prótese|trabalho/.test(s))return '🦷';
  if(/fecho|planear|rever/.test(s))return '🔒';
  if(/dormir|deitar|sono/.test(s))return '😴';
  return '📍';
}

/* tarefas */
export const dueW=t=>t.due||'9999-99';
export const taskSort=(a,b)=>(a.done-b.done)||(priOf(a).w-priOf(b).w)||(dueW(a)<dueW(b)?-1:dueW(a)>dueW(b)?1:0);
export const dueLabel=(t,T)=>!t.due||t.done?null
  :t.due<T?html`<b style="color:var(--red)">⚠ atrasada (${fmtDay(t.due)})</b>`
  :t.due===T?html`<b style="color:var(--orange)">prazo hoje</b>`
  :`prazo ${fmtDay(t.due)}`;
export function toggleTask(id){haptic();const t=LS(K.tasks,[]);const x=t.find(y=>y.id===id);
  if(x){x.done=!x.done;if(x.done)x.doneAt=todayISO();else delete x.doneAt}
  save(K.tasks,t);
  if(x&&x.done)toast('Tarefa concluída ✓')}
export function delTask(id){save(K.tasks,LS(K.tasks,[]).filter(t=>t.id!==id))}

/* hábitos — streaks com cache invalidada em save(K.habits) */
let _hsCache=null;
export function habitStreaks(){
  const T=todayISO();
  if(_hsCache&&_hsCache.day===T)return _hsCache.val;
  const H=LS(K.habits,{});let cur=0,best=0;
  Object.values(H).forEach(days=>{
    const start=days[T]?0:1;
    let s=0;for(let d=start;d<366;d++){if(days[isoAddDays(T,-d)])s++;else break}
    cur=Math.max(cur,s);
    let run=0;
    for(let d=120;d>=0;d--){
      if(days[isoAddDays(T,-d)]){run++;if(run>best)best=run}else run=0;
    }
  });
  _hsCache={day:T,val:{cur,best}};
  return _hsCache.val;
}
export function toggleHabitToday(name){
  haptic();
  const H=LS(K.habits,{});if(!H[name])H[name]={};
  const T=todayISO();H[name][T]=!H[name][T];save(K.habits,H);
}

/* progresso dos anéis (Hoje) */
export function ringProg(){
  const st=S();
  const tasks=LS(K.tasks,[]); const ws=weekStartISO();
  const tDone=tasks.filter(t=>t.done&&t.doneAt&&t.doneAt>=ws).length;
  const tTot=tasks.filter(t=>!t.done).length+tDone;
  const pTasks=tTot?tDone/tTot:0;
  const H=LS(K.habits,{}); const hk=Object.keys(H); const hDone=hk.filter(n=>H[n][todayISO()]).length;
  const pHab=hk.length?hDone/hk.length:0;
  const water=LS(K.water,{})[todayISO()]||0; const pWater=Math.min(1,water/st.waterGoal);
  return {pTasks,tDone,tTot,pHab,hDone,hTot:hk.length,water,pWater,st};
}

/* finanças */
export function finStats(mk,all){
  const tx=(all||LS(K.fin,[])).filter(t=>t.m===mk);
  const inc=tx.filter(t=>t.v>0).reduce((a,t)=>a+t.v,0);
  const exp=-tx.filter(t=>t.v<0).reduce((a,t)=>a+t.v,0);
  const byCat={};tx.filter(t=>t.v<0).forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)-t.v);
  return {tx,inc,exp,saldo:inc-exp,poup:inc?Math.round((inc-exp)/inc*100):0,byCat};
}
export const labReceivable=()=>LS(K.lab,[]).filter(j=>j.fase!=='Entregue'&&+j.valor>0).reduce((a,j)=>a+ +j.valor,0);

/* Radar: a frase mais relevante do dia, calculada localmente (sem API) */
export function radarLine(){
  const T=todayISO();
  const openJ=LS(K.lab,[]).filter(j=>j.fase!=='Entregue');
  const late=openJ.filter(j=>j.prazo<T);
  if(late.length)return {ic:'⚠️',txt:html`<b style="color:var(--red)">${late.length} entrega${late.length>1?'s':''} em atraso</b> no laboratório — a mais antiga é ${late.sort((a,b)=>a.prazo<b.prazo?-1:1)[0].tipo}.`};
  const todayJ=openJ.filter(j=>j.prazo===T);
  if(todayJ.length)return {ic:'🔥',txt:html`<b>${todayJ.length} entrega${todayJ.length>1?'s':''} HOJE</b>: ${todayJ.map(j=>j.tipo).join(', ')}. Bom trabalho de bancada.`};
  const alta=LS(K.tasks,[]).filter(t=>!t.done&&t.pri==='alta');
  if(alta.length)return {ic:'⚡',txt:html`Tens <b>${alta.length} tarefa${alta.length>1?'s':''} de prioridade alta</b> à espera — a primeira: «${alta[0].t}».`};
  const week=openJ.filter(j=>j.prazo<=isoAddDays(T,7));
  if(week.length){const v=week.reduce((a,j)=>a+ +(j.valor||0),0);
    return {ic:'🦷',txt:html`<b>${week.length} entrega${week.length>1?'s':''} nos próximos 7 dias</b>${v>0?` — ${eur(v)} a receber`:''}. O fluxo está controlado.`}}
  const st=S();const mk=monthKey(now());const byCat={};
  LS(K.fin,[]).filter(t=>t.m===mk&&t.v<0).forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)-t.v);
  const over=Object.entries(st.budgets).find(([c,b])=>b>0&&(byCat[c]||0)>=b);
  if(over)return {ic:'💶',txt:html`O orçamento de <b>${FIN_CATS[over[0]].n}</b> já foi ultrapassado este mês — vale a pena espreitar as Finanças.`};
  const hs=habitStreaks();
  if(hs.cur>=3)return {ic:'🔥',txt:html`<b>${hs.cur} dias seguidos</b> de hábitos cumpridos — hoje é só não quebrar a corrente.`};
  return {ic:'🌤',txt:'Dia limpo: sem atrasos, sem urgências. Aproveita para adiantar o que ninguém te pediu ainda.'};
}

/* emails — categorização por urgência (heurística pt/en) */
export function classifyEmail(from,subject,snippet,unread){
  const s=((subject||'')+' '+(snippet||'')+' '+(from||'')).toLowerCase();
  const has=(...w)=>w.some(x=>s.includes(x));
  const promo=has('newsletter','unsubscribe','cancelar subscri','promo','desconto','discount','% off','sale','coupon','cupão','waitlist','webinar');
  const pessoal=has('inscri','corrida','clube','maratona','convite','aniversár','birthday');
  if(has('urgente','urgent','vence','expira','expire','ação necessária','action required','último dia','last day','prazo','overdue','em atraso','suspens','2 days','2 dias','24 hour','24 hora'))
    return {chip:'red',ch:'Urgente',ic:'🔴'};
  if(has('fatura','invoice','recibo','pagamento','payment','seguro','renova','subscri','preço','price','segurança social','finanças','autoridade tribut','banco','extrato','débito'))
    return {chip:'orange',ch:'Requer ação',ic:'🟠'};
  if(pessoal) return {chip:'green',ch:'Pessoal',ic:'🟢'};
  if(promo) return {chip:'gray',ch:'Informativo',ic:'⚪'};
  if(unread) return {chip:'blue',ch:'Ler depois',ic:'🔵'};
  return {chip:'gray',ch:'Informativo',ic:'⚪'};
}
export const senderName=f=>{const m=/^\s*"?([^"<]+?)"?\s*</.exec(f||'');return (m?m[1]:(f||'').split('<')[0]||f||'').trim()||f};

/* ── tabelas de preços do laboratório (Filipe Lemos Unipessoal) ── */
export const LAB_PRECOS_LAB=[
  {g:'Prótese Acrílica',cod:'P14',n:'Prótese Total 14 dentes',v:300},
  {g:'Prótese Acrílica',cod:'P13',n:'Prótese Parcial 13 dentes',v:290},
  {g:'Prótese Acrílica',cod:'P12',n:'Prótese Parcial 12 dentes',v:280},
  {g:'Prótese Acrílica',cod:'P11',n:'Prótese Parcial 11 dentes',v:270},
  {g:'Prótese Acrílica',cod:'P10',n:'Prótese Parcial 10 dentes',v:260},
  {g:'Prótese Acrílica',cod:'P09',n:'Prótese Parcial 9 dentes',v:250},
  {g:'Prótese Acrílica',cod:'P08',n:'Prótese Parcial 8 dentes',v:240},
  {g:'Prótese Acrílica',cod:'P07',n:'Prótese Parcial 7 dentes',v:220},
  {g:'Prótese Acrílica',cod:'P06',n:'Prótese Parcial 6 dentes',v:200},
  {g:'Prótese Acrílica',cod:'P05',n:'Prótese Parcial 5 dentes',v:180},
  {g:'Prótese Acrílica',cod:'P04',n:'Prótese Parcial 4 dentes',v:160},
  {g:'Prótese Acrílica',cod:'P03',n:'Prótese Parcial 3 dentes',v:140},
  {g:'Prótese Acrílica',cod:'P02',n:'Prótese Parcial 2 dentes',v:120},
  {g:'Prótese Acrílica',cod:'P01',n:'Prótese Parcial 1 dente',v:100},
  {g:'Diversos em Acrílico',cod:'D01',n:'Rebasamento',v:50},
  {g:'Diversos em Acrílico',cod:'D02',n:'Acrescento de Gancho',v:20},
  {g:'Diversos em Acrílico',cod:'D03',n:'Acrescento de Dente',v:40},
  {g:'Diversos em Acrílico',cod:'D04',n:'Acrescentos Seguintes',v:10},
  {g:'Diversos em Acrílico',cod:'D05',n:'Reparação de Fratura',v:40},
  {g:'Diversos em Acrílico',cod:'D06',n:'Reparação de Fratura com Reforço',v:50},
  {g:'Diversos em Acrílico',cod:'D07',n:'Limpeza e Polimento',v:30},
  {g:'Diversos em Acrílico',cod:'D08',n:'Coroa Provisória Acrílica',v:40}];
export const LAB_PRECOS_CLINICA=[
  {g:'Prótese Acrílica',cod:'PA',n:'Prótese Total 14 dentes',v:190},
  {g:'Prótese Acrílica',cod:'P14',n:'Prótese Parcial 14 dentes',v:180},
  {g:'Prótese Acrílica',cod:'P13',n:'Prótese Parcial 13 dentes',v:170},
  {g:'Prótese Acrílica',cod:'P12',n:'Prótese Parcial 12 dentes',v:160},
  {g:'Prótese Acrílica',cod:'P11',n:'Prótese Parcial 11 dentes',v:150},
  {g:'Prótese Acrílica',cod:'P10',n:'Prótese Parcial 10 dentes',v:140},
  {g:'Prótese Acrílica',cod:'P09',n:'Prótese Parcial 9 dentes',v:130},
  {g:'Prótese Acrílica',cod:'P08',n:'Prótese Parcial 8 dentes',v:120},
  {g:'Prótese Acrílica',cod:'P07',n:'Prótese Parcial 7 dentes',v:110},
  {g:'Prótese Acrílica',cod:'P06',n:'Prótese Parcial 6 dentes',v:100},
  {g:'Prótese Acrílica',cod:'P05',n:'Prótese Parcial 5 dentes',v:90},
  {g:'Prótese Acrílica',cod:'P04',n:'Prótese Parcial 4 dentes',v:80},
  {g:'Prótese Acrílica',cod:'P03',n:'Prótese Parcial 3 dentes',v:70},
  {g:'Prótese Acrílica',cod:'P02',n:'Prótese Parcial 2 dentes',v:60},
  {g:'Prótese Acrílica',cod:'P01',n:'Prótese Parcial 1 dente',v:60},
  {g:'Goteira',cod:'G01',n:'Goteira de Relaxamento',v:80},
  {g:'Goteira',cod:'G02',n:'Goteira de Branqueamento',v:50},
  {g:'Goteira',cod:'G03',n:'Moldeira a vácuo para desporto',v:35},
  {g:'Oclusão',cod:'O01',n:'Modelo de estudo',v:10},
  {g:'Oclusão',cod:'O02',n:'Moldeiras individuais',v:10},
  {g:'Oclusão',cod:'O04',n:'Ceras de articulação simples',v:10},
  {g:'Oclusão',cod:'O05',n:'Ceras de articulação em base estabilizada',v:15},
  {g:'Diversos em Acrílico',cod:'D01',n:'Rebasamento',v:40},
  {g:'Diversos em Acrílico',cod:'D02',n:'Acrescento de Gancho',v:15},
  {g:'Diversos em Acrílico',cod:'D03',n:'Acrescento de dente',v:30},
  {g:'Diversos em Acrílico',cod:'D04',n:'Acrescentos seguintes',v:10},
  {g:'Diversos em Acrílico',cod:'D05',n:'Reparação de fratura',v:30},
  {g:'Diversos em Acrílico',cod:'D06',n:'Reparação de fratura com reforço',v:35},
  {g:'Diversos em Acrílico',cod:'D07',n:'Limpeza e polimento',v:25},
  {g:'Diversos em Acrílico',cod:'D08',n:'Coroa provisória acrílica',v:30}];
export const labTable=mode=>mode==='lab'?LAB_PRECOS_LAB:LAB_PRECOS_CLINICA;
export const arcLbl=a=>a==='ambas'?'Sup+Inf':a==='inf'?'Inferior':'Superior';
export const LAB_CORES=['blue','purple','orange','green','pink'];

/* odontograma: numeração FDI */
export const TEETH_UP=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
export const TEETH_LO=[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
export const toothW=fdi=>{const d=fdi%10;return d<=2?13:d===3?15:d<=5?17:20};

/* ── fotos do laboratório em IndexedDB (fora do localStorage — quota) ── */
let _idbP=null;
function idbOpen(){return _idbP||(_idbP=new Promise((res,rej)=>{
  const r=indexedDB.open('lifeos',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('fotos');
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
function idbTx(mode,fn){return idbOpen().then(db=>new Promise((res,rej)=>{
  const t=db.transaction('fotos',mode);const rq=fn(t.objectStore('fotos'));
  t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error)}))}
export const fotoPut=(k,v)=>idbTx('readwrite',s=>s.put(v,k));
export const fotoGet=k=>idbTx('readonly',s=>s.get(k));
export const fotoDel=k=>idbTx('readwrite',s=>s.delete(k));
export async function labFotoKeys(id){
  const all=await idbTx('readonly',s=>s.getAllKeys());
  return (all||[]).filter(k=>String(k).startsWith('lab_'+id+'_')).sort();
}

/* ═══════════════ IA — Anthropic (chave no dispositivo) ═══════════════ */
export const AI_FALLBACKS=['claude-opus-4-8','claude-sonnet-4-5','claude-3-5-sonnet-latest','claude-3-5-haiku-latest'];
export function aiModels(){
  const pref=localStorage.getItem('fl_ai_model');
  return [...new Set([pref,...AI_FALLBACKS].filter(Boolean))];
}
async function callAnthropic(key,model,prompt){
  const res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':key,
      'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model,max_tokens:600,
      system:'És o assistente do Life OS de Filipe Lemos, prostético dentário de 35 anos no Faial, Açores. Responde SEMPRE em português de Portugal, de forma curta, prática e motivadora (máx. 5 frases).',
      messages:[{role:'user',content:prompt}]})});
  let body=null;try{body=await res.json()}catch(e){}
  if(!res.ok){
    const msg=(body&&body.error&&body.error.message)||('HTTP '+res.status);
    const modelIssue=res.status===404||/model/i.test(msg);
    const err=new Error(msg);err.status=res.status;err.modelIssue=modelIssue;throw err;
  }
  if(body&&body.stop_reason==='refusal')return 'O pedido foi recusado pelos filtros de segurança.';
  return (body&&body.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('')||'(sem resposta)';
}
export async function askClaude(prompt){
  const key=localStorage.getItem(K.key);
  if(!key)throw new Error('NOKEY');
  const models=aiModels();let lastErr=null;
  for(const m of models){
    try{
      const out=await callAnthropic(key,m,prompt);
      localStorage.setItem('fl_ai_model',m);
      return out;
    }catch(e){
      lastErr=e;
      if(!(e.modelIssue))throw e;
    }
  }
  throw lastErr||new Error('sem modelos disponíveis');
}
