/* ═══════════════ LIFE OS v2 — HOJE ═══════════════
   Mesmo conteúdo e layout da v1; a diferença é que cada card lê o estado
   via useKey/sinais e atualiza sozinho quando os dados mudam. */
import {html,useState} from '../vendor/preact-htm.module.js';
import {K,LS,save,useKey,S,todayISO,isoAddDays,fmtDay,fmtLong,nowHM,useClock,monthKey,now,
  eur,haptic,toast,priOf,taskSort,dueLabel,toggleTask,getRoutine,ringProg,radarLine,
  habitStreaks,toggleHabitToday,labReceivable,FIN_CATS,askClaude,agoLabel} from './core.js';
import {go,sheetOpen,closeAll,Rings,Num} from './ui.js';
import {calSig,calConnect,calRefresh,evISO,evHM,evWhen,gmailClientId,getTok} from './google.js';

/* linha do tempo de hoje: marcações do calendário + rotina */
export function todayTimeline(evs){
  const T=todayISO();
  const cal=(evs||[]).filter(ev=>evISO(ev)===T).map(ev=>({
    h:ev.allDay?'00:00':evHM(ev),hLbl:ev.allDay?'dia':evHM(ev),ic:'📌',t:ev.title,s:ev.loc||'marcação',cal:true}));
  const rout=getRoutine().map(x=>({h:x.h,hLbl:x.h,ic:x.ic||'📍',t:x.t,s:'rotina'}));
  return [...cal,...rout].sort((a,b)=>a.h<b.h?-1:1);
}

function addWater(){haptic();const w=LS(K.water,{});w[todayISO()]=(w[todayISO()]||0)+0.25;save(K.water,w);toast('＋250 ml 💧')}
function subWater(){haptic();const w=LS(K.water,{});w[todayISO()]=Math.max(0,(w[todayISO()]||0)-0.25);save(K.water,w);toast('−250 ml')}

/* detalhe de um dia: marcações + entregas do lab + tarefas com prazo */
export function openDay(iso){
  haptic();
  sheetOpen(()=>{
    const T=todayISO();
    const cal=calSig.use();
    const jobs=useKey(K.lab,[]).filter(j=>j.fase!=='Entregue'&&j.prazo===iso);
    const tks=useKey(K.tasks,[]).filter(t=>!t.done&&t.due===iso);
    const evs=(cal.evs||[]).filter(ev=>evISO(ev)===iso);
    const seg=(lbl,items)=>items.length?html`
      <div class="xs" style="color:var(--txt3);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:14px 0 4px">${lbl}</div>${items}`:null;
    return html`
    <h2>📅 <span style="text-transform:capitalize">${fmtLong(iso)}</span>${iso===T?html` <span class="tiny muted" style="font-weight:400">· hoje</span>`:null}</h2>
    ${seg('Marcações',evs.map(ev=>html`<div class="li"><div class="ic">📌</div>
      <div class="bd"><b>${ev.title}</b><span>${ev.loc||'marcação'}</span></div>
      <span class="tm">${ev.allDay?'dia':evHM(ev)}</span></div>`))}
    ${seg('Entregas do laboratório',jobs.map(j=>html`<div class="li" style="cursor:pointer" onClick=${()=>{closeAll();go('lab')}}><div class="ic">🦷</div>
      <div class="bd"><b>${j.tipo}</b><span>${j.paciente} · ${j.fase}</span></div>
      ${+j.valor>0?html`<span class="doto tiny" style="color:var(--blue)">${eur(+j.valor)}</span>`:null}</div>`))}
    ${seg('Tarefas com prazo',tks.map(t=>html`<div class="li">
      <button class="chk" aria-label="Marcar '${t.t}' como feita" onClick=${()=>{toggleTask(t.id);closeAll()}}>✓</button>
      <div class="bd"><b>${t.t}</b></div><span class="chip ${priOf(t).c}">${priOf(t).n}</span></div>`))}
    ${!evs.length&&!jobs.length&&!tks.length?html`<div class="empty">Dia livre 🎉<br/><span class="xs">Sem marcações, entregas nem tarefas com prazo.</span></div>`:null}`;
  });
}

/* insight IA do dia */
export function aiInsight(){
  haptic();
  if(!localStorage.getItem(K.key)){
    sheetOpen(()=>html`<h2>✦ Assistente IA</h2>
      <p class="muted tiny" style="margin-bottom:14px">Para usar o insight diário, adiciona a tua chave API Anthropic nas definições. Fica só no teu dispositivo.</p>
      <button class="btn full" onClick=${()=>window._openSettings&&window._openSettings()}>Abrir definições</button>`);
    return;
  }
  /* estado do pedido vive fora do componente para sobreviver a re-renders */
  const req={busy:true,txt:'',err:null,started:false,upd:null};
  sheetOpen(()=>{
    const [,tick]=useState(0);
    req.upd=()=>tick(t=>t+1);
    if(!req.started){
      req.started=true;
      const r=ringProg();const tasks=LS(K.tasks,[]).filter(t=>!t.done).map(t=>`${t.t} (${priOf(t).n})`);
      const lab=LS(K.lab,[]).filter(j=>j.fase!=='Entregue').map(j=>`${j.tipo} (${j.fase}, ${j.prazo})`);
      const ag=todayTimeline(calSig.v.evs).map(x=>`${x.hLbl} ${x.t}`);
      askClaude(`Hoje é ${fmtLong(todayISO())}, são ${nowHM()}. Água ${r.water.toFixed(1)}/${r.st.waterGoal} L. Hábitos de hoje: ${r.hDone}/${r.hTot}. Agenda de hoje: ${ag.join('; ')||'vazia'}. Tarefas abertas: ${tasks.join('; ')||'nenhuma'}. Trabalhos de lab: ${lab.join('; ')||'nenhum'}. Dá-me um insight/plano curto para o resto do dia.`)
        .then(txt=>{req.busy=false;req.txt=txt;req.upd&&req.upd()})
        .catch(e=>{req.busy=false;req.err=e;req.upd&&req.upd()});
    }
    let body;
    if(req.busy)body=html`<span class="thinking"><i></i><i></i><i></i></span>`;
    else if(!req.err)body=req.txt;
    else{
      const e=req.err,msg=e.message||'';
      const billing=/credit|balance|billing|quota|insufficient/i.test(msg);
      let hint;
      if(msg==='NOKEY')hint='Falta a chave API nas definições.';
      else if(billing)hint='A tua chave é válida, mas a conta de API da Anthropic não tem créditos — é diferente do Claude Plus (subscrição do chat); a API paga-se à parte em console.anthropic.com. O Insight IA é a única parte da app que precisa disto.';
      else if(e.status===401)hint='A chave API parece inválida ou foi revogada — mete uma nova nas definições ⚙.';
      else if(e.status===404||e.modelIssue)hint='O teu acesso não inclui este modelo. Escolhe outro nas definições ⚙.';
      else if(e.status===429)hint='Demasiados pedidos num curto espaço de tempo — tenta daqui a pouco.';
      else hint='Verifica a ligação à internet.';
      body=html`<b style="color:var(--red)">Não consegui gerar o insight.</b><br/><span class="tiny muted">${msg||'erro desconhecido'}</span><br/><br/>${hint}`;
    }
    return html`<h2>✦ Insight do dia</h2><div class="ai-out">${body}</div>`;
  });
}

/* card do calendário — 3 estados como na v1 */
function CalCard(){
  const cal=calSig.use();
  const T=todayISO();
  const calTok=getTok();
  if(!gmailClientId())return html`<div class="card"><h3>📅 Calendário</h3>
    <div style="text-align:center;padding:14px 4px 18px">
      <div style="font-size:36px;margin-bottom:8px">🗓️</div>
      <b style="display:block;margin-bottom:6px">Sincroniza o teu calendário</b>
      <p class="muted tiny" style="line-height:1.6;max-width:320px;margin:0 auto">Vê aqui as tuas marcações reais do Google Calendar. Corre no teu dispositivo, só de leitura, nada é guardado fora do telemóvel.</p>
    </div></div>`;
  if(!calTok&&!cal.evs)return html`<div class="card"><h3>📅 Calendário</h3>
    <div style="text-align:center;padding:16px 4px"><div style="font-size:34px;margin-bottom:8px">🔗</div>
    <p class="muted tiny" style="margin-bottom:14px">Autoriza o acesso de leitura para veres as tuas marcações do Google Calendar.</p>
    <button class="btn" onClick=${()=>calConnect()}>Ligar Calendário</button></div></div>`;
  const evs=cal.evs||[];
  return html`<div class="card"><h3>Próximas marcações <span class="act" style="cursor:pointer" onClick=${()=>calRefresh()}>↻ ${cal.ts?agoLabel(cal.ts):'atualizar'}</span></h3>
    ${evs.length?evs.map((ev,i)=>{const w=evWhen(ev);const isT=evISO(ev)===T;
      return html`<div class="li" style="animation-delay:${i*40}ms">
        <div class="ic">📌</div><div class="bd"><b>${ev.title}</b><span style=${isT?'color:var(--green)':''}>${isT?'hoje':w.day}${ev.loc?' · '+ev.loc:''}</span></div>
        <span class="tm">${w.time}</span></div>`})
    :html`<div class="empty">Sem marcações nos próximos 30 dias</div>`}
  </div>`;
}

export function Home(){
  const tasks=useKey(K.tasks,[]);
  const habits=useKey(K.habits,{});
  useKey(K.water,{});useKey(K.set,{});useKey(K.routine,[]);
  const labJ=useKey(K.lab,[]);
  const fin=useKey(K.fin,[]);
  const cal=calSig.use();
  const hm=useClock();
  const T=todayISO();
  const r=ringProg();
  const open=tasks.filter(t=>!t.done);
  const openSorted=open.slice().sort(taskSort);
  const nAlta=open.filter(t=>t.pri==='alta').length;
  const today=todayTimeline(cal.evs);
  const next=today.find(x=>x.h>hm);
  const calOn=!!(cal.evs&&cal.evs.length)||!!getTok();
  const lab=labJ.filter(j=>j.fase!=='Entregue'&&j.prazo<=isoAddDays(T,1));
  const saldo=fin.filter(t=>t.m===monthKey(now())).reduce((a,t)=>a+t.v,0);
  const hs=habitStreaks();
  const week=[...Array(7)].map((_,i)=>isoAddDays(T,i));
  const openAll=labJ.filter(j=>j.fase!=='Entregue');
  const evByDay={};(cal.evs||[]).forEach(ev=>{const iso=evISO(ev);(evByDay[iso]=evByDay[iso]||[]).push(ev)});
  const isVirgin=!tasks.length&&!Object.keys(habits).length&&!labJ.length
    &&!(cal.evs&&cal.evs.length)&&!fin.length&&!getRoutine().length;
  const rd=radarLine();
  return html`
  ${isVirgin?html`<div class="card">
    <h3>👋 Bem-vindo ao Life OS</h3>
    <p class="muted tiny" style="line-height:1.7;margin-bottom:14px">A app está vazia e pronta para os teus dados reais — nada de exemplos inventados. Começa por ligar o Google (emails + calendário) ou cria a primeira tarefa.</p>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1" onClick=${()=>calConnect()}>Ligar Google</button>
      <button class="btn ghost" style="flex:1" onClick=${()=>go('habits')}>Criar tarefa</button>
    </div>
  </div>`:null}
  ${lab.length?html`<div class="card" style="border-color:color-mix(in srgb,var(--red) 45%,var(--border))">
    <h3 style="color:var(--red)">⚠ Urgente no laboratório</h3>
    ${lab.map(j=>html`<div class="li"><div class="ic">🦷</div><div class="bd"><b>${j.tipo} — ${j.paciente}</b><span>${j.fase} · entrega ${j.prazo===T?'HOJE':fmtDay(j.prazo)}</span></div><span class="chip red">${j.prazo===T?'hoje':'amanhã'}</span></div>`)}
  </div>`:null}
  <div class="card">
    <h3>Tarefas prioritárias <span class="act">${nAlta?html`<span style="color:var(--red)">${nAlta} alta${nAlta>1?'s':''}</span> · `:null}${open.length} abertas</span></h3>
    ${openSorted.slice(0,5).map((t,i)=>html`<div class="li" style="animation-delay:${i*60}ms">
      <button class="chk" aria-pressed="false" aria-label="Marcar '${t.t}' como feita" onClick=${()=>toggleTask(t.id)}></button>
      <div class="bd"><b>${t.t}</b><span>${dueLabel(t,T)||t.ctx}</span></div>
      <span class="chip ${priOf(t).c}">${priOf(t).n}</span></div>`)}
    ${!openSorted.length?html`<div class="empty">Tudo feito ✓</div>`:null}
    ${open.length>5?html`<button class="btn sm ghost full" style="margin-top:10px" onClick=${()=>go('habits')}>ver todas (${open.length}) ›</button>`:null}
  </div>
  <div class="card">
    <h3>Agenda de hoje ${next?html`<span class="act">próximo: ${next.hLbl} ${next.t.length>16?next.t.slice(0,15)+'…':next.t}</span>`:cal.ts?html`<span class="act">↻ ${agoLabel(cal.ts)}</span>`:null}</h3>
    ${today.length?html`<div class="tl">${today.map(x=>html`<div class="li ${next&&next===x?'now':''}">
      <div class="ic">${x.ic}</div><div class="bd"><b>${x.t}</b><span>${x.s}</span></div><span class="tm">${x.hLbl}</span></div>`)}</div>`
    :calOn?html`<div class="empty">Sem marcações nem rotina para hoje 🎉</div>`
    :html`<div style="text-align:center;padding:8px 0 4px">
        <p class="muted tiny" style="margin-bottom:12px">Liga o Google Calendar para veres aqui as marcações de hoje.</p>
        <button class="btn sm" onClick=${()=>calConnect()}>Ligar Calendário</button></div>`}
  </div>
  <div class="card"><h3>Semana <span class="act">toca num dia</span></h3>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">
      ${week.map((d,i)=>{const hasLab=openAll.some(j=>j.prazo===d);const hasEv=!!evByDay[d];const hasTask=tasks.some(t=>!t.done&&t.due===d);
        return html`<button onClick=${()=>openDay(d)} aria-label="Ver o dia ${fmtLong(d)}" style="text-align:center;padding:10px 2px;border-radius:var(--rxs);border:1px solid ${i===0?'var(--txt2)':'var(--border)'};background:${i===0?'var(--surface2)':'transparent'}">
        <div class="xs muted" style="text-transform:capitalize">${fmtDay(d).split(',')[0].slice(0,3)}</div>
        <div class="doto" style="font-size:17px;margin-top:3px">${d.slice(8)}</div>
        <div style="height:6px;margin-top:5px;display:flex;gap:3px;justify-content:center">
          ${hasEv?html`<i style="width:5px;height:5px;border-radius:50%;background:var(--blue)"></i>`:null}
          ${hasLab?html`<i style="width:5px;height:5px;border-radius:50%;background:var(--orange)"></i>`:null}
          ${hasTask?html`<i style="width:5px;height:5px;border-radius:50%;background:var(--green)"></i>`:null}
        </div></button>`})}
    </div>
    <div class="xs muted" style="margin-top:10px;display:flex;gap:14px"><span><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--blue);margin-right:5px"></i>marcação</span><span><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--orange);margin-right:5px"></i>entrega lab</span><span><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--green);margin-right:5px"></i>tarefa</span></div>
  </div>
  <${CalCard}/>
  <div class="card">
    <h3>O teu dia <span class="act doto">${hm}</span></h3>
    <div class="dayrow">
      <div class="rings"><${Rings} r=${r} size=${112}/></div>
      <div class="hchips">
        ${Object.keys(habits).length?Object.keys(habits).map(n=>{const on=!!(habits[n]||{})[T];
          return html`<button class="hchip ${on?'on':''}" aria-pressed=${on} onClick=${()=>toggleHabitToday(n)}><i></i>${n}</button>`})
        :html`<button class="hchip" onClick=${()=>go('habits')}>＋ criar o primeiro hábito ›</button>`}
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px">
      <span class="wstep"><button onClick=${subWater} aria-label="Retirar 250 ml">−</button><b>💧 ${r.water.toFixed(2).replace(/\.?0+$/,'')} / ${r.st.waterGoal} L</b><button onClick=${addWater} aria-label="Adicionar 250 ml">＋</button></span>
      ${hs.cur>0?html`<span class="chip orange" style="min-height:40px;padding:9px 14px">🔥 ${hs.cur} dia${hs.cur>1?'s':''} seguidos</span>`:null}
    </div>
  </div>
  <div class="card">
    <h3>Radar <span class="act" style="cursor:pointer" onClick=${aiInsight}>✦ perguntar à IA</span></h3>
    <div class="radar-line"><span class="ric">${rd.ic}</span><span>${rd.txt}</span></div>
    <div class="pulse-row">
      <div class="pulse-c" onClick=${()=>go('fin')} role="button" tabindex="0"><div class="pv" style="color:${saldo<0?'var(--red)':'var(--green)'}"><${Num} v=${Math.round(saldo)} suf=" €"/></div><div class="pl">saldo do mês</div></div>
      <div class="pulse-c" onClick=${()=>go('lab')} role="button" tabindex="0"><div class="pv" style="color:var(--blue)"><${Num} v=${Math.round(labReceivable())} suf=" €"/></div><div class="pl">a receber</div></div>
      <div class="pulse-c" onClick=${()=>go('habits')} role="button" tabindex="0"><div class="pv" style="color:var(--purple)"><${Num} v=${hs.cur}/></div><div class="pl">streak · melhor ${hs.best}</div></div>
    </div>
  </div>`;
}
