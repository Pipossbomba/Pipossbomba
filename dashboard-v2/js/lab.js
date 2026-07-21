/* ═══════════════ LIFE OS v2 — LABORATÓRIO ═══════════════
   O coração da app. O formulário de novo/editar trabalho é o exemplo da
   arquitetura nova: catálogo, arcada e valor são useState locais ao sheet
   (na v1 eram window._newLabCli / _labArc / _labBaseVal globais). */
import {html,useState,useEffect} from '../vendor/preact-htm.module.js';
import {K,LS,save,useKey,todayISO,isoAddDays,fmtDay,fmtLong,monthKey,monthLabel,now,eur,
  haptic,toast,FASES,FASE_CORES_V,faseIdx,labTable,arcLbl,LAB_CORES,labReceivable,
  TEETH_UP,TEETH_LO,toothW,fotoPut,fotoGet,fotoDel,labFotoKeys} from './core.js';
import {go,sheetOpen,closeAll,Num,Bar} from './ui.js';

const syncNotifs=()=>{if(window._syncNotifs)window._syncNotifs()};

/* ── tags de um trabalho (tipo de cliente, arcada, dentes) ── */
function labTags(j){
  const cli=j.cliente||(j.clinica==='Lab'?'lab':'clinica');
  return html`
    <span class="chip gray">${cli==='lab'?'🏠 Lab':'🦷 Clínica'}</span>
    ${j.arcada?html`<span class="chip ${j.arcada==='ambas'?'blue':'gray'}">${arcLbl(j.arcada)}</span>`:null}
    ${j.dentes&&j.dentes.length?html`<span class="chip gray">🦷 ${j.dentes.length} dente${j.dentes.length>1?'s':''}</span>`:null}`;
}

/* ── catálogo (tabela de preços) — mostra só designação + preço ── */
function Catalog({mode,onPick,sel}){
  const [filter,setFilter]=useState('');
  const f=filter.toLowerCase().trim();
  const rows=[];let g='';
  labTable(mode).forEach((p,i)=>{
    if(f&&!p.n.toLowerCase().includes(f))return;
    if(p.g!==g){g=p.g;rows.push(html`<div class="lcat-g">${g}</div>`)}
    rows.push(html`<button type="button" class="lcat-row ${sel===i?'sel':''}" onClick=${()=>onPick(i)}>
      <b>${p.n}</b><span class="p">${eur(p.v)}</span></button>`);
  });
  return html`<div class="frow"><label>Trabalho (tabela de preços)</label>
    <input type="text" placeholder="🔎 procurar trabalho…" autocomplete="off"
      value=${filter} onInput=${e=>setFilter(e.target.value)}/>
    <div class="lcat" style="margin-top:8px"><div class="lcat-list">
      ${rows.length?rows:html`<div class="lcat-empty">Sem resultados para a pesquisa</div>`}
    </div></div>
    <div class="hint">Toca num trabalho para preencher o tipo e o valor. Podes ajustar depois.</div></div>`;
}

/* ── formulário novo/editar trabalho — todo o estado é local ── */
function LabForm({job}){
  const [cli,setCli]=useState(job?(job.cliente||'clinica'):'clinica');
  const [arc,setArc]=useState(job?(job.arcada||'sup'):'sup');
  const [tipo,setTipo]=useState(job?job.tipo:'');
  const [pac,setPac]=useState(job?job.paciente:'');
  const [clinica,setClinica]=useState(job&&job.clinica!=='Lab'&&job.clinica!=='—'?job.clinica:'');
  const [fase,setFase]=useState(job?job.fase:FASES[0]);
  const [prazo,setPrazo]=useState(job?job.prazo:isoAddDays(todayISO(),3));
  const [valor,setValor]=useState(job?(+job.valor||''):'');
  const [baseVal,setBaseVal]=useState(null); /* valor vindo da tabela — recalcula com a arcada */
  const [selIdx,setSelIdx]=useState(-1);
  const pick=i=>{
    const p=labTable(cli)[i];if(!p)return;haptic();
    setSelIdx(i);setTipo(p.n);setBaseVal(p.v);
    setValor(arc==='ambas'?p.v*2:p.v);
  };
  const setArcada=a=>{haptic();setArc(a);
    if(baseVal!=null)setValor(a==='ambas'?baseVal*2:baseVal)};
  const setMode=m=>{haptic();setCli(m);setSelIdx(-1);setBaseVal(null)};
  const guardar=()=>{
    if(!tipo.trim())return toast('Indica o tipo de trabalho');
    if(!pac.trim())return toast(cli==='lab'?'Indica o cliente':'Indica o paciente');
    const J=LS(K.lab,[]);
    const base={paciente:pac.trim(),clinica:cli==='lab'?'Lab':(clinica.trim()||'—'),cliente:cli,
      arcada:arc,tipo:tipo.trim(),fase,prazo:prazo||isoAddDays(todayISO(),3),
      valor:Math.max(0,parseFloat(valor)||0)};
    if(job){
      const j=J.find(x=>x.id===job.id);if(!j)return;
      Object.assign(j,base);
      if(fase==='Entregue'){if(!j.entregueEm)j.entregueEm=todayISO()}else delete j.entregueEm;
      save(K.lab,J);closeAll();syncNotifs();toast('Trabalho atualizado ✓');
    }else{
      J.push({id:Date.now(),...base,cor:LAB_CORES[J.length%LAB_CORES.length]});
      save(K.lab,J);closeAll();syncNotifs();toast('Trabalho adicionado 🦷');
    }
  };
  return html`
  <h2>${job?'✎ Editar trabalho':'🦷 Novo trabalho'}</h2>
  <div class="frow"><label>Tipo de cliente</label>
    <div class="segbtns">
      <button type="button" class=${cli==='clinica'?'on':''} onClick=${()=>setMode('clinica')}>🦷 Dentista / Clínica</button>
      <button type="button" class=${cli==='lab'?'on':''} onClick=${()=>setMode('lab')}>🏠 Lab (cliente próprio)</button>
    </div></div>
  <${Catalog} mode=${cli} onPick=${pick} sel=${selIdx}/>
  <div class="frow"><label>Tipo de trabalho</label>
    <input value=${tipo} onInput=${e=>setTipo(e.target.value)} placeholder="Ex.: Coroa e-max #24, Esqueleto Cr-Co…"/></div>
  <div class="frow"><label>${cli==='lab'?'Cliente':'Paciente'}</label>
    <input value=${pac} onInput=${e=>setPac(e.target.value)} placeholder="Ex.: Sr. Medeiros"/></div>
  ${cli!=='lab'?html`<div class="frow"><label>Dentista / Clínica</label>
    <input value=${clinica} onInput=${e=>setClinica(e.target.value)} placeholder="Ex.: Clínica Dente Azul — Horta"/></div>`:null}
  <div class="frow"><label>Arcada</label>
    <div class="segbtns">
      <button type="button" class=${arc==='sup'?'on':''} onClick=${()=>setArcada('sup')}>Superior</button>
      <button type="button" class=${arc==='inf'?'on':''} onClick=${()=>setArcada('inf')}>Inferior</button>
      <button type="button" class=${arc==='ambas'?'on':''} onClick=${()=>setArcada('ambas')}>Ambas</button>
    </div>
    <div class="hint">«Ambas» = duas próteses (superior + inferior); o valor da tabela duplica — ajusta se as arcadas forem diferentes.</div></div>
  <div class="fgrid">
    <div class="frow"><label>Fase atual</label>
      <select value=${fase} onChange=${e=>setFase(e.target.value)}>${FASES.map(f=>html`<option>${f}</option>`)}</select></div>
    <div class="frow"><label>Prazo de entrega</label>
      <input type="date" value=${prazo} onInput=${e=>setPrazo(e.target.value)}/></div>
  </div>
  <div class="frow"><label>Valor a receber (€) <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:400">· opcional</span></label>
    <input type="number" step="1" min="0" inputmode="decimal" value=${valor}
      onInput=${e=>{setValor(e.target.value);setBaseVal(null)}}
      placeholder="Ex.: 450 — entra nas Finanças ao entregar"/>
    <div class="hint">Aparece em «A receber» nas Finanças e, quando marcares Entregue, ofereço registar a receita.</div></div>
  <button class="btn full" onClick=${guardar}>${job?'Guardar alterações':'Criar trabalho'}</button>`;
}
const openNewLab=()=>{haptic();sheetOpen(()=>html`<${LabForm}/>`)};
const openEditLab=j=>{haptic();sheetOpen(()=>html`<${LabForm} job=${j}/>`)};

/* ── odontograma FDI ── */
function Odo({id}){
  const J=useKey(K.lab,[]);
  const j=J.find(x=>x.id===id);if(!j)return null;
  const miss=new Set(j.dentes||[]);
  const toggle=fdi=>{
    haptic();
    const all=LS(K.lab,[]);const x=all.find(y=>y.id===id);if(!x)return;
    const s=new Set(x.dentes||[]);
    if(s.has(fdi))s.delete(fdi);else s.add(fdi);
    x.dentes=[...s].sort((a,b)=>a-b);
    save(K.lab,all);
  };
  const clear=()=>{
    if(!confirm('Limpar todos os dentes marcados deste trabalho?'))return;
    const all=LS(K.lab,[]);const x=all.find(y=>y.id===id);if(!x)return;
    x.dentes=[];save(K.lab,all);
  };
  const arch=(arr,lo)=>html`<div class="odo-arch ${lo?'lo':''}">${arr.map(fdi=>html`
    <button type="button" class="odo-t ${miss.has(fdi)?'miss':''}" style="--w:${toothW(fdi)}px"
      onClick=${()=>toggle(fdi)} aria-label="Dente ${fdi}${miss.has(fdi)?' (em falta)':''}">
      <span class="crown"></span><span class="fdi">${fdi}</span></button>`)}</div>`;
  return html`<div class="odo">
    <div class="odo-cap">▲ Superior</div>
    <div class="odo-scroll">${arch(TEETH_UP)}${arch(TEETH_LO,true)}</div>
    <div class="odo-cap" style="margin:5px 0 0">▼ Inferior</div>
    <div class="odo-sum">Dentes em falta: <b class="doto" style="color:${miss.size?'var(--blue)':'var(--txt2)'}">${miss.size}</b>
      ${[...miss].sort((a,b)=>a-b).map(n=>html`<span class="odo-chip">${n}</span>`)}
      ${miss.size?html`<button class="odo-clear" onClick=${clear}>limpar</button>`:null}</div>
    <div class="hint" style="margin-top:6px">Toca num dente para marcar/desmarcar em falta. Guarda-se neste trabalho.</div>
  </div>`;
}

/* ── fotos do trabalho (IndexedDB, comprimidas ≤1280px) ── */
function Fotos({id}){
  const [items,setItems]=useState(null); /* [{k,src}] */
  const [view,setView]=useState(null);   /* {k,src} em ecrã inteiro */
  const load=async()=>{
    try{
      const keys=await labFotoKeys(id);
      const imgs=await Promise.all(keys.map(k=>fotoGet(k)));
      setItems(keys.map((k,i)=>({k,src:imgs[i]})));
    }catch(e){setItems([])}
  };
  useEffect(()=>{load()},[id]);
  const add=input=>{
    const f=input.files[0];input.value='';if(!f)return;
    const rd=new FileReader();
    rd.onload=()=>{
      const img=new Image();
      img.onload=async()=>{
        const MAX=1280,sc=Math.min(1,MAX/Math.max(img.width,img.height));
        const cv=document.createElement('canvas');
        cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);
        cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
        try{await fotoPut(`lab_${id}_${Date.now()}`,cv.toDataURL('image/jpeg',.82));toast('Foto guardada 📷');load()}
        catch(e){toast('Não consegui guardar a foto')}
      };
      img.onerror=()=>toast('Imagem inválida');
      img.src=rd.result;
    };
    rd.readAsDataURL(f);
  };
  const del=async k=>{
    if(!confirm('Apagar esta foto?'))return;
    await fotoDel(k);setView(null);load();toast('Foto apagada');
  };
  let fileEl=null;
  return html`
    <div class="labfotos">
      ${(items||[]).map(it=>html`<button class="labfoto" onClick=${()=>{haptic();setView(it)}} aria-label="Ver foto"><img src=${it.src} alt=""/></button>`)}
      <button class="labfoto add" onClick=${()=>fileEl&&fileEl.click()} aria-label="Adicionar foto">📷</button>
    </div>
    <input type="file" accept="image/*" capture="environment" style="display:none"
      ref=${el=>fileEl=el} onChange=${e=>add(e.target)}/>
    <div class="hint">Comprimidas e guardadas só neste dispositivo — não entram no backup JSON/Drive.</div>
    ${view?html`<div class="fotoview" onClick=${e=>{if(e.target.classList.contains('fotoview'))setView(null)}}>
      <img src=${view.src} alt="Foto do trabalho"/>
      <div class="fv-bar"><button class="btn ghost" onClick=${()=>del(view.k)}>🗑 Apagar</button>
      <button class="btn" onClick=${()=>setView(null)}>Fechar</button></div></div>`:null}`;
}

/* ── gerir um trabalho: fase, valor, odontograma, fotos, editar, apagar ── */
function openLabPhase(id){
  haptic();
  sheetOpen(()=>{
    const J=useKey(K.lab,[]);
    const j=J.find(x=>x.id===id);
    if(!j)return html`<div class="empty">Trabalho não encontrado</div>`;
    const setPhase=f=>{
      const all=LS(K.lab,[]);const x=all.find(y=>y.id===id);if(!x)return;
      const wasDelivered=x.fase==='Entregue';
      x.fase=f;
      if(f==='Entregue')x.entregueEm=todayISO();else delete x.entregueEm;
      save(K.lab,all);closeAll();syncNotifs();
      /* magia: ao entregar um trabalho com valor, oferece registar a receita */
      if(f==='Entregue'&&!wasDelivered&&+x.valor>0){
        if(confirm(`Registar receita de ${eur(+x.valor)} (${x.tipo} — ${x.paciente}) nas Finanças?`)){
          const fin=LS(K.fin,[]);
          fin.push({m:monthKey(now()),d:+todayISO().slice(8),n:`${x.tipo} — ${x.paciente}`,cat:'lab',v:Math.abs(+x.valor)});
          save(K.fin,fin);
          toast(`Receita de ${eur(+x.valor)} registada ✓`);
          return;
        }
      }
      toast(f==='Entregue'?`${x.paciente}: entregue ✓`:`${x.paciente}: ${f}`);
    };
    const setValor=v=>{
      const all=LS(K.lab,[]);const x=all.find(y=>y.id===id);if(!x)return;
      x.valor=Math.max(0,parseFloat(v)||0);save(K.lab,all);
    };
    const del=()=>{
      if(!confirm('Apagar o trabalho de '+j.paciente+'? Esta ação é irreversível.'))return;
      save(K.lab,LS(K.lab,[]).filter(x=>x.id!==id));closeAll();syncNotifs();toast('Trabalho apagado');
      labFotoKeys(id).then(ks=>ks.forEach(fotoDel)).catch(()=>{});
    };
    return html`
    <h2>🦷 ${j.tipo}</h2>
    <div class="tiny muted" style="margin:-8px 0 16px">${j.paciente} · ${j.clinica}${+j.valor>0?html` · <b style="color:var(--blue)">${eur(+j.valor)}</b>`:null}<br/>Em que fase está o trabalho?</div>
    ${FASES.map(f=>html`<button class="btn full ${f===j.fase?'':'ghost'}" style="margin-bottom:8px;justify-content:space-between" onClick=${()=>setPhase(f)}>
      <span>${f}</span>${f===j.fase?html`<span>✓ atual</span>`:null}</button>`)}
    <div class="divider"></div>
    <div class="frow"><label>Valor a receber (€)</label>
      <input type="number" step="1" min="0" inputmode="decimal" value=${+j.valor||''} placeholder="opcional"
        onChange=${e=>setValor(e.target.value)}/></div>
    <div class="frow"><label>🦷 Mapa de dentes</label><${Odo} id=${id}/></div>
    <div class="frow"><label>📷 Fotos do trabalho</label><${Fotos} id=${id}/></div>
    <button class="btn full ghost" style="margin-bottom:8px" onClick=${()=>openEditLab(j)}>✎ ${' '}Editar detalhes (tipo, cliente, prazo…)</button>
    <button class="btn full ghost" style="color:var(--red);border-color:color-mix(in srgb,var(--red) 45%,var(--border2))" onClick=${del}>🗑 Apagar trabalho</button>`;
  });
}

/* ── registo de entregas (arquivo mensal) ── */
function openDelivered(){
  haptic();
  sheetOpen(()=>{
    const J=useKey(K.lab,[]).filter(j=>j.fase==='Entregue');
    const groups={};
    J.forEach(j=>{const mk=((j.entregueEm||j.prazo)||'').slice(0,7);if(mk)(groups[mk]=groups[mk]||[]).push(j)});
    const mks=Object.keys(groups).sort().reverse();
    const del=id=>{
      if(!confirm('Remover esta entrega do registo?'))return;
      save(K.lab,LS(K.lab,[]).filter(x=>x.id!==id));toast('Removida do registo');
    };
    return html`<h2>📦 Registo de entregas <span class="tiny muted" style="font-weight:400">· ${J.length} no total</span></h2>
    ${mks.length?mks.map(mk=>html`
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin:16px 0 6px">
        <span class="xs" style="color:var(--txt3);font-weight:700;letter-spacing:1px;text-transform:uppercase">${monthLabel(mk)}</span>
        <span class="doto tiny" style="color:var(--green)">${groups[mk].length} entrega${groups[mk].length>1?'s':''}${(t=>t>0?' · '+eur(t):'')(groups[mk].reduce((a,j)=>a+ +(j.valor||0),0))}</span>
      </div>
      ${groups[mk].sort((a,b)=>(b.entregueEm||b.prazo)<(a.entregueEm||a.prazo)?-1:1).map(j=>html`
        <div class="li"><div class="ic">✅</div>
          <div class="bd"><b>${j.tipo}</b><span>${j.paciente} · ${j.clinica}</span></div>
          <div style="text-align:right"><span class="tm">${fmtDay(j.entregueEm||j.prazo)}</span></div>
          <button class="icobtn" aria-label="Apagar entrega" style="width:26px;height:26px;font-size:10px" onClick=${()=>del(j.id)}>✕</button>
        </div>`)}`)
      :html`<div class="empty">Ainda sem entregas registadas.<br/>Quando marcares um trabalho como Entregue, ele fica aqui arquivado por mês.</div>`}`;
  });
}

/* ── todas as entregas em curso, agrupadas por dia ── */
function openLabAll(){
  haptic();
  sheetOpen(()=>{
    const open=useKey(K.lab,[]).filter(j=>j.fase!=='Entregue').sort((a,b)=>a.prazo<b.prazo?-1:1);
    const byDay={};open.forEach(j=>(byDay[j.prazo]=byDay[j.prazo]||[]).push(j));
    return html`<h2>📦 Todas as entregas <span class="tiny muted" style="font-weight:400">· ${open.length} em curso</span></h2>
    ${Object.keys(byDay).sort().map(d=>html`
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin:16px 0 6px">
        <span class="xs" style="color:var(--txt3);font-weight:700;letter-spacing:1px;text-transform:uppercase">${fmtLong(d)}${d<todayISO()?html` · <b style="color:var(--red)">atrasada</b>`:null}</span>
        <span class="doto tiny" style="color:var(--orange)">${byDay[d].length} entrega${byDay[d].length>1?'s':''}</span></div>
      ${byDay[d].map(j=>html`<div class="li" style="cursor:pointer" onClick=${()=>openLabPhase(j.id)}><div class="ic">🦷</div>
        <div class="bd"><b>${j.tipo}</b><span>${j.paciente} · ${j.fase}</span></div>
        ${+j.valor>0?html`<span class="doto tiny" style="color:var(--blue)">${eur(+j.valor)}</span>`:null}</div>`)}`)}
    ${!open.length?html`<div class="empty">Nada em curso 🎉</div>`:null}`;
  });
}

export function Lab(){
  const J=useKey(K.lab,[]);
  const N=useKey(K.labnotes,[]);
  const T=todayISO();
  const open=J.filter(j=>j.fase!=='Entregue');
  const recv=open.filter(j=>+j.valor>0).reduce((a,j)=>a+ +j.valor,0);
  /* faturação: valor dos trabalhos entregues, por mês (últimos 6 meses) */
  const fatur={};J.filter(j=>j.fase==='Entregue'&&+j.valor>0).forEach(j=>{
    const mk=((j.entregueEm||j.prazo)||'').slice(0,7);if(mk)fatur[mk]=(fatur[mk]||0)+ +j.valor});
  const fmks=[...Array(6)].map((_,i)=>{const d=now();return monthKey(new Date(d.getFullYear(),d.getMonth()-(5-i),15))});
  const fmax=Math.max(1,...fmks.map(mk=>fatur[mk]||0));
  const hasFat=fmks.some(mk=>fatur[mk]);
  const nextDeliv=open.slice().sort((a,b)=>a.prazo<b.prazo?-1:1).slice(0,4);
  const openSorted=open.slice().sort((a,b)=>a.prazo<b.prazo?-1:a.prazo>b.prazo?1:0);
  const addNote=()=>{
    const i=document.getElementById('labNoteIn');const v=i.value.trim();if(!v)return;
    const all=LS(K.labnotes,[]);all.push({d:todayISO(),n:v});save(K.labnotes,all);toast('Nota guardada');
  };
  const delNote=idx=>{
    const all=LS(K.labnotes,[]);all.splice(idx,1);save(K.labnotes,all);toast('Nota apagada');
  };
  return html`
  <div class="kpis three">
    <div class="kpi lk"><div class="lbl"><i style="background:var(--blue)"></i>Em curso</div><div class="val"><${Num} v=${open.length}/></div><div class="sub">trabalhos</div><span class="kic">🦷</span></div>
    <div class="kpi lk"><div class="lbl"><i style="background:var(--orange)"></i>Esta semana</div><div class="val"><${Num} v=${open.filter(j=>j.prazo<=isoAddDays(T,7)).length}/></div><div class="sub">entregas</div><span class="kic">📦</span></div>
    <div class="kpi lk" style="cursor:pointer" onClick=${openDelivered}><div class="lbl"><i style="background:var(--green)"></i>Entregues</div><div class="val"><${Num} v=${J.filter(j=>j.fase==='Entregue'&&((j.entregueEm||j.prazo)||'').slice(0,7)===monthKey(now())).length}/></div><div class="sub">este mês · registo ›</div><span class="kic">✔</span></div>
  </div>
  ${recv>0?html`<div class="card" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;border-color:color-mix(in srgb,var(--blue) 30%,var(--border))" onClick=${()=>go('fin')}>
    <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:1px;font-weight:700">A receber</div><div class="tiny muted" style="margin-top:2px">${open.filter(j=>+j.valor>0).length} trabalho${open.filter(j=>+j.valor>0).length>1?'s':''} por entregar</div></div>
    <div style="display:flex;align-items:center;gap:12px"><span class="doto" style="font-size:24px;font-weight:900;color:var(--blue)">${eur(recv)}</span><span class="icobtn" style="width:32px;height:32px">→</span></div>
  </div>`:null}
  <div class="card"><h3>Fluxo de trabalho <span class="act">${open.length} em curso</span></h3>
    <div class="lflow">
      ${FASES.slice(0,5).map((f,i)=>{const jobs=open.filter(j=>j.fase===f);
        return html`<div class="lfcol">
          <div class="lfhead">${f}</div>
          <div class="lfn">${jobs.length}</div>
          <div class="lfbar" style="background:${FASE_CORES_V[i]}"></div>
          ${jobs.slice(0,2).map(j=>html`<button class="lfjob" onClick=${()=>openLabPhase(j.id)}>
            <b>${j.tipo}</b><span>${j.paciente}</span>
            <span style="color:${FASE_CORES_V[i]}">● ${j.prazo<T?'atrasado':j.prazo===T?'hoje':fmtDay(j.prazo)}</span></button>`)}
          ${!jobs.length?html`<div class="lfempty">—</div>`:null}
          ${jobs.length>2?html`<div class="xs muted" style="text-align:center">+${jobs.length-2} mais</div>`:null}
        </div>`})}
    </div>
  </div>
  <div class="card"><h3>Trabalhos em curso <span class="act">toca para gerir</span></h3>
    ${openSorted.map((j,i)=>{const fi=Math.min(faseIdx(j.fase),4);const col=FASE_CORES_V[fi];
      return html`<div class="li ljob" style="animation-delay:${i*60}ms" role="button" tabindex="0" onClick=${()=>openLabPhase(j.id)} onKeyDown=${e=>{if(e.key==='Enter')openLabPhase(j.id)}}>
      <div class="ic">🦷</div>
      <div class="bd"><b>${j.tipo}</b><span>${j.paciente} · ${j.clinica}${+j.valor>0?html` · <b style="color:var(--blue)">${eur(+j.valor)}</b>`:null}</span>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="chip" style="background:color-mix(in srgb,${col} 16%,transparent);color:${col}">${j.fase} ▾</span>${labTags(j)}</div>
        <div class="lsteps">${FASES.slice(0,5).map((_,s)=>html`<i class=${s===fi?'cur':''} style=${s<=fi?`background:${col}`:''}></i>${s<4?html`<u style=${s<fi?`background:${col}`:''}></u>`:null}`)}</div>
      </div>
      <div style="text-align:right;flex:0 0 auto"><span class="xs" style="color:${j.prazo<T?'var(--red)':j.prazo===T?'var(--orange)':'var(--txt2)'};font-weight:${j.prazo<=T?'700':'400'}">${j.prazo<T?'⚠ ':''}${fmtDay(j.prazo)}</span><div class="muted" style="margin-top:6px">›</div></div>
    </div>`})}
    ${!openSorted.length?html`<div class="empty">Nada em curso 🎉</div>`:null}
    <button class="btn full" style="margin-top:14px" onClick=${openNewLab}>🦷 ${' '}Novo trabalho</button>
  </div>
  <div class="lab2">
    <div class="card"><h3>Entregas próximas <span class="act" style="cursor:pointer" onClick=${openLabAll}>ver todas ›</span></h3>
      ${nextDeliv.map(j=>html`<div class="li" style="cursor:pointer" onClick=${()=>openLabPhase(j.id)}>
        <div class="ldia"><span>${fmtDay(j.prazo).split(',')[0].slice(0,3)}</span><b>${j.prazo.slice(8)}</b></div>
        <div class="bd" style="margin-left:4px"><b>${j.tipo}</b><span>${j.paciente}</span></div>
        <span class="doto tiny" style="color:${+j.valor>0?'var(--blue)':'var(--txt3)'}">${+j.valor>0?eur(+j.valor):'—'}</span></div>`)}
      ${!nextDeliv.length?html`<div class="empty">Sem entregas agendadas</div>`:null}
    </div>
  </div>
  ${hasFat?html`<div class="card"><h3>💶 Faturação <span class="act doto" style="color:var(--green)">${eur(fatur[monthKey(now())]||0)} este mês</span></h3>
    ${fmks.map(mk=>html`<div style="display:flex;align-items:center;gap:10px;margin:7px 0">
      <span class="xs" style="width:34px;color:var(--txt2);text-transform:capitalize;flex:0 0 auto">${monthLabel(mk).slice(0,3)}</span>
      <div style="flex:1"><${Bar} w="${Math.round((fatur[mk]||0)/fmax*100)}%" color="var(--green)" height="8px"/></div>
      <span class="doto tiny" style="width:70px;text-align:right;flex:0 0 auto">${fatur[mk]?eur(fatur[mk]):'—'}</span></div>`)}
    <div class="hint" style="font-size:11px;color:var(--txt3);margin-top:6px">Soma dos trabalhos marcados como Entregue com valor definido.</div>
  </div>`:null}
  <div class="card"><h3>Notas de bancada</h3>
    ${N.slice().reverse().map((n,i)=>html`<div class="li"><div class="ic">✍️</div><div class="bd"><b style="white-space:normal">${n.n}</b><span>${fmtDay(n.d)}</span></div>
      <button class="icobtn" aria-label="Apagar nota" style="width:28px;height:28px;font-size:11px" onClick=${()=>delNote(N.length-1-i)}>✕</button></div>`)}
    ${!N.length?html`<div class="empty">Sem notas</div>`:null}
    <div class="addrow"><input id="labNoteIn" placeholder="Nova nota…" onKeyDown=${e=>{if(e.key==='Enter')addNote()}}/><button class="btn" onClick=${addNote}>＋</button></div>
  </div>`;
}
