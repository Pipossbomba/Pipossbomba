/* ═══════════════ LIFE OS v2 — shell e arranque ═══════════════ */
import {html,render,useState,useEffect} from '../vendor/preact-htm.module.js';
import {K,LS,save,useKey,signal,S,todayISO,isoAddDays,fmtDay,fmtLong,nowHM,useClock,
  monthKey,monthLabel,now,eur,haptic,toast,agoLabel,FIN_CATS,priOf,AI_FALLBACKS,
  habitStreaks,getRoutine,senderName} from './core.js';
import {go,navSig,SECS,sheetOpen,closeAll,SheetHost,sideOpen,sideSig} from './ui.js';
import {calSig,mailSig,evISO,evHM,autoSync,driveBackup,driveToken,driveRestoreData,gmailClientId} from './google.js';
import {Home} from './home.js';
import {Lab} from './lab.js';

/* ═══ migrações (idênticas à v1 — as duas versões partilham os dados) ═══ */
['fl_workouts_v2','fl_meals_v2','fl_weight_v1','fl_sleep_v1','fl_run_done_v1','fl_social_v1','fl_read_v1','fl_eod_v1','fl_mcl_v1'].forEach(k=>localStorage.removeItem(k));
(()=>{const map={'Modelo':'Moldes','Prova de estrutura':'Provas','Maquilhagem':'Acabamento'};
  const J=LS(K.lab,[]);let ch=false;
  J.forEach(j=>{if(map[j.fase]){j.fase=map[j.fase];ch=true}});
  if(ch)save(K.lab,J);})();

/* ═══ tema ═══ */
const themeSig=signal(localStorage.getItem(K.theme)||'dark');
function applyTheme(t){
  themeSig.set(t);
  document.documentElement.dataset.theme=t;
  localStorage.setItem(K.theme,t);
  document.querySelector('meta[name="theme-color"]').content=t==='dark'?'#0a0a0a':'#f4f4f2';
  syncStatusBar();
}
async function syncStatusBar(){
  try{
    const C=window.Capacitor;
    if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
    const {StatusBar}=C.Plugins;if(!StatusBar)return;
    const dark=document.documentElement.dataset.theme!=='light';
    await StatusBar.setBackgroundColor({color:dark?'#0a0a0a':'#f4f4f2'});
    await StatusBar.setStyle({style:dark?'DARK':'LIGHT'});
  }catch(e){}
}
applyTheme(themeSig.v);

/* ═══ meteo — Horta (open-meteo, com fallback offline) ═══ */
const WX_ICONS={0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',61:'🌧',63:'🌧',65:'🌧',80:'🌦',95:'⛈'};
const wxSig=signal(LS('fl_wx_cache',null));
async function loadWeather(){
  try{
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=38.53&longitude=-28.63&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=5&timezone=Atlantic%2FAzores');
    const j=await r.json();
    const d=j.daily||{};
    const c={t:Math.round(j.current.temperature_2m),c:j.current.weather_code,ts:Date.now(),
      daily:{time:d.time||[],tmax:d.temperature_2m_max||[],tmin:d.temperature_2m_min||[],pp:d.precipitation_probability_max||[],code:d.weather_code||[]}};
    save('fl_wx_cache',c);wxSig.set(c);
  }catch(e){}
}
function openWeather(){
  haptic();
  sheetOpen(()=>{
    const c=wxSig.use();const D=c&&c.daily;
    return html`<h2>${(c&&WX_ICONS[c.c])||'⛅'} Tempo na Horta</h2>
    ${D&&D.time.length?html`${D.time.map((d,i)=>html`<div class="li">
      <div class="ic">${WX_ICONS[D.code[i]]||'⛅'}</div>
      <div class="bd"><b style="text-transform:capitalize">${d===todayISO()?'hoje':fmtDay(d)}</b><span>${D.pp[i]!=null?D.pp[i]+'% probabilidade de chuva':''}</span></div>
      <span class="tm"><b class="doto" style="font-size:15px">${Math.round(D.tmax[i])}°</b> <span class="muted doto">${Math.round(D.tmin[i])}°</span></span></div>`)}
      <div class="hint" style="margin-top:10px">Open-Meteo · atualizado ${c.ts?agoLabel(c.ts):'—'} · funciona offline com a última previsão</div>`
    :html`<div class="empty">Ainda sem previsão em cache — liga-te à internet e volta a tocar no tempo.</div>`}`;
  });
}

/* ═══ notificações locais (só APK) — IDs determinísticos por hash ═══ */
let _notifT=null;
const notifHash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return (Math.abs(h)%2000000000)||1};
function notifPlugin(){
  const C=window.Capacitor;
  return (C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.LocalNotifications)||null;
}
function syncNotifs(){clearTimeout(_notifT);_notifT=setTimeout(doSyncNotifs,1200)}
window._syncNotifs=syncNotifs;
async function doSyncNotifs(){
  const LN=notifPlugin();if(!LN)return;
  try{
    let st=await LN.checkPermissions();
    if(st.display==='prompt'||st.display==='prompt-with-rationale')st=await LN.requestPermissions();
    if(st.display!=='granted')return;
  }catch(e){return}
  try{
    const pend=await LN.getPending();
    if(pend&&pend.notifications&&pend.notifications.length)
      await LN.cancel({notifications:pend.notifications.map(n=>({id:n.id}))});
  }catch(e){}
  const nowMs=Date.now(),T=todayISO();
  const at=(iso,h,m)=>new Date(`${iso}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  const list=[];
  const add=(key,title,body,when)=>{if(when&&when.getTime()>nowMs+30000)list.push({id:notifHash(key),title,body,schedule:{at:when,allowWhileIdle:true}})};
  LS(K.lab,[]).filter(j=>j.fase!=='Entregue'&&j.prazo).forEach(j=>{
    add(`lab-eve-${j.id}-${j.prazo}`,'🦷 Entrega amanhã',`${j.tipo} — ${j.paciente} (fase: ${j.fase})`,at(isoAddDays(j.prazo,-1),20,0));
    add(`lab-day-${j.id}-${j.prazo}`,'🦷 Entrega HOJE',`${j.tipo} — ${j.paciente} (fase: ${j.fase})`,at(j.prazo,8,30));
  });
  LS(K.tasks,[]).filter(t=>!t.done&&t.due).forEach(t=>
    add(`task-${t.id}-${t.due}`,'⚡ Tarefa com prazo hoje',t.t,at(t.due,9,0)));
  (calSig.v.evs||[]).filter(ev=>!ev.allDay).forEach(ev=>{
    const d=evISO(ev);if(d<T||d>isoAddDays(T,1))return;
    add(`cal-${ev.start}-${ev.title}`,'📌 Daqui a 30 minutos',`${ev.title}${ev.loc?' · '+ev.loc:''}`,new Date(new Date(ev.start).getTime()-30*60000));
  });
  if(list.length){try{await LN.schedule({notifications:list.slice(0,60)})}catch(e){}}
}

/* ═══ alertas «a precisar de ti» — gerados dos dados reais ═══ */
function buildAlerts(cal,mail){
  const out=[];const T=todayISO();const hm=nowHM();
  const lab=LS(K.lab,[]).filter(j=>j.fase!=='Entregue');
  lab.filter(j=>j.prazo<T).forEach(j=>out.push({ic:'🦷',chip:'red',ch:'Em atraso',t:`${j.tipo} — ${j.paciente}`,p:`A entrega era ${fmtDay(j.prazo)} e ainda está em ${j.fase.toLowerCase()}.`,sec:'lab'}));
  lab.filter(j=>j.prazo===T).forEach(j=>out.push({ic:'🦷',chip:'red',ch:'Hoje',t:`${j.tipo} — ${j.paciente}`,p:`Entrega HOJE · fase atual: ${j.fase}.`,sec:'lab'}));
  lab.filter(j=>j.prazo>T&&j.prazo<=isoAddDays(T,2)).forEach(j=>out.push({ic:'🦷',chip:'orange',ch:'Lab',t:`${j.tipo} — ${j.paciente}`,p:`Entrega ${fmtDay(j.prazo)} · ${j.fase}.`,sec:'lab'}));
  const alta=LS(K.tasks,[]).filter(t=>!t.done&&t.pri==='alta');
  if(alta.length)out.push({ic:'⚡',chip:'red',ch:'Tarefas',t:`${alta.length===1?'1 tarefa':alta.length+' tarefas'} de prioridade alta`,p:alta.slice(0,3).map(t=>t.t).join(' · ')+(alta.length>3?' …':''),sec:'habits'});
  const dued=LS(K.tasks,[]).filter(t=>!t.done&&t.due&&t.due<=T);
  dued.filter(t=>t.due<T).forEach(t=>out.push({ic:'⚡',chip:'red',ch:'Atrasada',t:t.t,p:`O prazo era ${fmtDay(t.due)}.`,sec:'habits'}));
  dued.filter(t=>t.due===T).forEach(t=>out.push({ic:'⚡',chip:'orange',ch:'Hoje',t:t.t,p:'O prazo termina hoje.',sec:'habits'}));
  ((mail&&mail.list)||[]).filter(e=>e.chip==='red').slice(0,3).forEach(e=>out.push({ic:'📧',chip:'red',ch:'Email urgente',t:e.as,p:senderName(e.de),sec:'emails'}));
  ((cal&&cal.evs)||[]).filter(e=>evISO(e)===T&&!e.allDay&&evHM(e)>=hm).slice(0,3).forEach(e=>out.push({ic:'📌',chip:'blue',ch:'Hoje',t:e.title,p:`às ${evHM(e)}${e.loc?' · '+e.loc:''}`,sec:'home'}));
  const st=S();const mk=monthKey(now());const byCat={};
  LS(K.fin,[]).filter(t=>t.m===mk&&t.v<0).forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)-t.v);
  Object.entries(st.budgets).forEach(([c,b])=>{const v=byCat[c]||0;
    if(b>0&&v>=b)out.push({ic:'💶',chip:'orange',ch:'Orçamento',t:`${FIN_CATS[c].n}: orçamento ultrapassado`,p:`${eur(v)} de ${eur(b)} este mês.`,sec:'fin'})});
  const hasData=LS(K.fin,[]).length||LS(K.tasks,[]).length||LS(K.lab,[]).length||Object.keys(LS(K.habits,{})).length;
  const lb=localStorage.getItem('fl_last_backup');
  if(hasData&&(!lb||isoAddDays(lb,30)<=T))
    out.push({ic:'💾',chip:'blue',ch:'Backup',t:'Faz um backup dos teus dados',p:`Os dados vivem só neste telemóvel. Exporta nas definições ⚙ — último backup: ${lb?fmtDay(lb):'nunca'}.`,settings:true});
  return out;
}
function Side(){
  const on=sideSig.use();
  const cal=calSig.use();const mail=mailSig.use();
  useKey(K.lab,[]);useKey(K.tasks,[]);useKey(K.fin,[]);useKey(K.habits,{});
  const items=buildAlerts(cal,mail);
  return html`<aside class="side ${on?'on':''}">
    <h2>A precisar de ti <button class="icobtn" aria-label="Fechar" onClick=${closeAll}>✕</button></h2>
    <div class="sub">Alertas, notícias e pendentes</div>
    ${on?(items.length?items.map((a,i)=>html`
      <div class="alert" style="animation-delay:${i*70}ms;cursor:pointer" role="button" tabindex="0"
        onClick=${()=>{closeAll();a.settings?openSettings():go(a.sec)}}>
        <span class="chip ${a.chip}">${a.ch}</span>
        <b>${a.ic} ${a.t} <span style="color:var(--txt3);font-weight:400">›</span></b><p>${a.p}</p></div>`)
    :html`<div class="empty" style="padding:40px 10px">Tudo em ordem ✓<br/><br/><span class="xs" style="line-height:1.7">Quando houver entregas do laboratório a chegar, tarefas de prioridade alta, emails urgentes ou orçamentos ultrapassados, aparecem aqui.</span></div>`):null}
  </aside>`;
}
function AlertBadge(){
  const cal=calSig.use();const mail=mailSig.use();
  useKey(K.lab,[]);useKey(K.tasks,[]);useKey(K.fin,[]);useKey(K.habits,{});
  const n=buildAlerts(cal,mail).length;
  return n?html`<span class="badge">${n}</span>`:null;
}

/* ═══ backup local (exportar / importar / reset) ═══ */
function exportBackup(){
  const data={};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('fl_'))data[k]=localStorage.getItem(k)}
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`lifeos-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);
  localStorage.setItem('fl_last_backup',todayISO());
  toast('Backup exportado ⤓');
}
function importBackup(input){
  const f=input.files[0];if(!f)return;
  if(!confirm('Só restaures backups gerados por esta app (Definições → Exportar dados). Um ficheiro de outra origem pode corromper os teus dados. Continuar?')){input.value='';return}
  const rd=new FileReader();
  rd.onload=()=>{try{
    const data=JSON.parse(rd.result);
    if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('formato inválido');
    Object.entries(data).forEach(([k,v])=>{if(k.startsWith('fl_')&&typeof v==='string')localStorage.setItem(k,v)});
    toast('Backup restaurado — a recarregar…');setTimeout(()=>location.reload(),900);
  }catch(e){toast('Ficheiro inválido')}};
  rd.readAsText(f);
  input.value='';
}
function resetAll(){
  if(!confirm('Apagar TODOS os dados e começar do zero?\n\nEsta ação é irreversível. Se quiseres guardar, exporta um backup primeiro.'))return;
  const keys=[];
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('fl_'))keys.push(k)}
  keys.forEach(k=>localStorage.removeItem(k));
  toast('Dados apagados — a recarregar…');setTimeout(()=>location.reload(),700);
}

/* ═══ definições ═══ */
function openSettings(){
  haptic();
  sheetOpen(()=>{
    const st=S();
    const bk=useKey(K.driveBk,{});
    let fileEl=null;
    const guardar=()=>{
      const cur=LS(K.set,{});
      const budgets={};document.querySelectorAll('[data-budget]').forEach(i=>budgets[i.dataset.budget]=+i.value||0);
      save(K.set,{...cur,
        name:document.getElementById('sName').value.trim()||'Filipe',
        waterGoal:+document.getElementById('sWa').value||2.5,
        budgets});
      const k=document.getElementById('sKey').value.trim();
      if(k)localStorage.setItem(K.key,k);else localStorage.removeItem(K.key);
      const mdl=document.getElementById('sModel');if(mdl)localStorage.setItem('fl_ai_model',mdl.value);
      closeAll();toast('Definições guardadas ✓');
    };
    return html`<h2>⚙ Definições</h2>
    <div class="fgrid">
      <div class="frow"><label for="sName">O teu nome</label><input id="sName" value=${st.name}/></div>
      <div class="frow"><label for="sWa">Meta de água (L)</label><input id="sWa" type="number" step="0.1" value=${st.waterGoal}/></div>
    </div>
    <div class="divider"></div>
    <h2>💰 Orçamentos mensais</h2>
    <div class="fgrid">
      ${Object.entries(st.budgets).map(([c,v])=>html`<div class="frow"><label>${FIN_CATS[c].ic} ${FIN_CATS[c].n}</label><input data-budget=${c} type="number" value=${v}/></div>`)}
    </div>
    <div class="divider"></div>
    <h2>✦ Assistente IA</h2>
    <div class="frow"><label for="sKey">Chave API Anthropic</label>
      <input id="sKey" type="password" placeholder="sk-ant-…" value=${localStorage.getItem(K.key)||''}/>
      <div class="hint">Guardada apenas neste dispositivo (localStorage). Nunca é enviada para lado nenhum exceto para a API da Anthropic.</div></div>
    <div class="frow"><label for="sModel">Modelo</label>
      <select id="sModel">${AI_FALLBACKS.map(m=>html`<option value=${m} selected=${(localStorage.getItem('fl_ai_model')||AI_FALLBACKS[0])===m}>${m}</option>`)}</select>
      <div class="hint">Se um modelo der erro, a app tenta os seguintes automaticamente.</div></div>
    <div class="divider"></div>
    <h2>💾 Backup</h2>
    <div class="frow"><div class="hint" style="margin-top:0">☁ <b>Google Drive:</b> ${bk.last?html`último backup a <b>${fmtLong(bk.last)}</b>`:'ainda sem backup automático'}${bk.err==='perm'?html` · <b style="color:var(--orange)">sem permissão — desliga e volta a ligar a conta Google para autorizar o Drive</b>`:bk.err==='net'?html` · <b style="color:var(--orange)">última tentativa falhou</b>`:null}. Automático 1×/dia no arranque, para o ficheiro privado <i>lifeos-backup.json</i>.</div></div>
    <div style="display:flex;gap:10px;margin-bottom:10px">
      <button class="btn ghost" style="flex:1" onClick=${async()=>{haptic();const tok=await driveToken();if(!tok)return toast('Liga primeiro a conta Google (Agenda ou Emails)');try{await driveBackup(tok,true)}catch(e){}}}>☁ Backup agora</button>
      <button class="btn ghost" style="flex:1" onClick=${async()=>{haptic();
        if(!confirm('Substituir os dados desta app pelo backup do Drive?\n\nOs dados atuais deste dispositivo serão sobrepostos.'))return;
        try{if(await driveRestoreData()){toast('Backup restaurado — a recarregar…');setTimeout(()=>location.reload(),900)}}
        catch(e){toast('Restauro do Drive falhou')}}}>☁⤓ Restaurar do Drive</button>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn ghost" style="flex:1" onClick=${exportBackup}>⤓ Exportar</button>
      <button class="btn ghost" style="flex:1" onClick=${()=>fileEl&&fileEl.click()}>⤒ Importar</button>
      <input type="file" accept="application/json" style="display:none" ref=${el=>fileEl=el} onChange=${e=>importBackup(e.target)}/>
    </div>
    <div class="divider"></div>
    <h2>🧹 Começar do zero</h2>
    <div class="frow"><div class="hint" style="margin-top:0">Apaga todos os dados e deixa a app vazia, pronta para os teus próprios dados. Exporta um backup primeiro se quiseres guardar algo.</div></div>
    <button class="btn full ghost" style="color:var(--red);border-color:color-mix(in srgb,var(--red) 45%,var(--border2))" onClick=${resetAll}>Apagar tudo e começar do zero</button>
    <div class="divider"></div>
    <button class="btn full" onClick=${guardar}>Guardar definições</button>`;
  });
}
window._openSettings=openSettings;

/* ═══ secções ainda não portadas nesta pré-visualização ═══ */
const Stub=({nome,emoji})=>()=>html`<div class="card">
  <h3>${emoji} ${nome}</h3>
  <div class="empty" style="padding:30px 10px">Esta secção ainda não foi portada para a v2.<br/><br/>
  <span class="xs" style="line-height:1.7">Os teus dados estão intactos — a v1 continua a funcionar em paralelo com exatamente os mesmos dados. Esta pré-visualização mostra a arquitetura nova em Hoje e Laboratório primeiro.</span></div></div>`;

/* ═══ shell ═══ */
const NAV=[['home','🏠 Hoje'],['emails','📧 Emails'],['lab','🔬 Laboratório'],['fin','💰 Finanças'],['habits','📊 Hábitos'],['proj','🚀 Projetos']];
const SECTIONS={home:Home,emails:Stub({nome:'Emails',emoji:'📧'}),lab:Lab,
  fin:Stub({nome:'Finanças',emoji:'💰'}),habits:Stub({nome:'Hábitos',emoji:'📊'}),proj:Stub({nome:'Projetos',emoji:'🚀'})};

function Wx(){
  const c=wxSig.use();
  return html`<button class="wx" onClick=${openWeather} aria-label="Previsão do tempo">
    <span>${(c&&WX_ICONS[c.c])||'⛅'}</span><b class="doto">${c?c.t+'°':'—'}</b><span>Horta</span></button>`;
}
function Greet(){
  const hm=useClock();
  useKey(K.set,{});
  const h=+hm.split(':')[0];
  const g=h<6?'Boa noite':h<13?'Bom dia':h<20?'Boa tarde':'Boa noite';
  return html`<h1>${g}, ${S().name}<small style="display:block;color:var(--txt2);font-weight:400;font-size:13px;margin-top:2px;text-transform:capitalize">${fmtLong(todayISO())}</small></h1>`;
}
function App(){
  const nav=navSig.use();
  const theme=themeSig.use();
  const hm=useClock();
  const Sec=SECTIONS[nav.sec];
  return html`
  <header class="top">
    <div class="brand"><span class="pulse"></span>LIFE<em>OS</em></div>
    <div class="top-r">
      <${Wx}/>
      <button class="icobtn" aria-label="Alertas" onClick=${sideOpen}>◉<${AlertBadge}/></button>
      <button class="icobtn" aria-label="Tema" onClick=${()=>{haptic();applyTheme(theme==='dark'?'light':'dark')}}>◐</button>
      <button class="icobtn" aria-label="Definições" onClick=${openSettings}>⚙</button>
    </div>
  </header>
  <div class="datebar">
    <${Greet}/>
    <div class="clock">${hm}</div>
  </div>
  <nav role="tablist" aria-label="Secções">
    ${NAV.map(([id,lbl])=>html`<button data-sec=${id} class=${nav.sec===id?'on':''} role="tab"
      aria-selected=${nav.sec===id} onClick=${()=>go(id)}>${lbl}</button>`)}
  </nav>
  <main>
    <section class="sec on ${nav.dir?(nav.dir==='left'?'sw-l':'sw-r'):''}" role="tabpanel" key=${nav.sec}>
      <${Sec}/>
    </section>
  </main>
  <${Side}/>
  <${SheetHost}/>`;
}

/* ── swipe horizontal para mudar de secção (idêntico à v1) ── */
let _swX=0,_swY=0,_swOK=false;
document.addEventListener('touchstart',e=>{
  _swOK=false;
  if(document.querySelector('.sheet.on,.side.on'))return;
  const t=e.touches[0];if(!t)return;
  if(e.target.closest('nav,.fchips,.chartbox,canvas,input,select,textarea,.sheet,.side,.lflow,.hmap,.odo-scroll'))return;
  _swX=t.clientX;_swY=t.clientY;_swOK=true;
},{passive:true});
document.addEventListener('touchend',e=>{
  if(!_swOK)return;_swOK=false;
  const t=e.changedTouches[0];if(!t)return;
  const dx=t.clientX-_swX,dy=t.clientY-_swY;
  if(Math.abs(dx)<64||Math.abs(dx)<Math.abs(dy)*1.6)return;
  const i=SECS.indexOf(navSig.v.sec)+(dx<0?1:-1);
  if(i<0||i>=SECS.length)return;
  go(SECS[i],dx<0?'left':'right');
},{passive:true});

/* ═══ nativo (Capacitor): botão voltar + notificações no arranque ═══ */
async function initNative(){
  const C=window.Capacitor;
  if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
  syncStatusBar();
  try{
    const {App:CapApp}=C.Plugins;
    if(CapApp)CapApp.addListener('backButton',()=>{
      const anyOpen=document.querySelector('.sheet.on,.side.on');
      if(anyOpen){closeAll();return}
      if(navSig.v.sec!=='home')go('home');
      else CapApp.exitApp();
    });
  }catch(e){}
  syncNotifs();
}

/* ═══ arranque ═══ */
render(html`<${App}/>`,document.getElementById('app'));
loadWeather();
initNative();
autoSync();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))
  navigator.serviceWorker.register('sw.js').catch(()=>{});
