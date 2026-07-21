/* ═══════════════ LIFE OS v2 — UI partilhada ═══════════════
   Sheets/side/scrim como componentes reativos (o estado dos formulários
   vive DENTRO de cada sheet — acabaram os window._newLabCli globais). */
import {html,useState,useEffect,useRef} from '../vendor/preact-htm.module.js';
import {signal,haptic,staticNum} from './core.js';

/* ── navegação por secções ── */
export const SECS=['home','emails','lab','fin','habits','proj'];
export const navSig=signal({sec:'home',dir:null});
export function go(sec,dir){
  haptic();
  closeAll();
  navSig.set({sec,dir:dir||null});
  window.scrollTo({top:0,left:0,behavior:'instant'});
  const btn=document.querySelector(`nav [data-sec="${sec}"]`);
  if(btn&&btn.scrollIntoView)try{btn.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})}catch(e){}
}

/* ── sheet (modal de baixo) ── */
/* content é uma função-componente; mantém-se montada durante a animação de fecho */
const sheetSig=signal({content:null,on:false});
export function sheetOpen(content){sheetSig.set({content,on:true})}
export function closeAll(){const s=sheetSig.v;if(s.on)sheetSig.set({...s,on:false});if(sideSig.v)sideSig.set(false)}
export function SheetHost(){
  const s=sheetSig.use();
  const side=sideSig.use();
  return html`
    <div class="scrim ${s.on||side?'on':''}" onClick=${closeAll}></div>
    <div class="sheet ${s.on?'on':''}"><div class="grab"></div><div>${s.content?html`<${s.content}/>`:null}</div></div>`;
}

/* ── painel lateral (alertas) ── */
export const sideSig=signal(false);
export function sideOpen(){haptic();sideSig.set(true)}

/* ── anéis de progresso ──
   O dashoffset é definido via style — o preact só o altera quando o valor
   muda, por isso a transição CSS corre uma vez por mudança real (o bug de
   "animação repete em cada render" da v1 desaparece por construção). */
export function Rings({r,size=150}){
  const mounted=useRef(false);
  const [go,setGo]=useState(false);
  useEffect(()=>{if(!mounted.current){mounted.current=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>setGo(true)))}},[]);
  const k=size/150,cx=size/2,sw=Math.round(11*k);
  const ring=(rad,color,p,delay)=>{
    const c=2*Math.PI*rad;
    return html`
      <circle cx=${cx} cy=${cx} r=${rad} stroke="var(--track)" stroke-width=${sw}></circle>
      <circle cx=${cx} cy=${cx} r=${rad} stroke=${color} stroke-width=${sw}
        stroke-dasharray=${c} stroke-dashoffset=${go?c*(1-Math.min(1,p)):c}
        style="transition-delay:${delay}ms"></circle>`;
  };
  return html`<svg width=${size} height=${size} viewBox="0 0 ${size} ${size}">
    ${ring(Math.round(64*k),'var(--green)',r.pTasks,0)}
    ${ring(Math.round(50*k),'var(--purple)',r.pHab,120)}
    ${ring(Math.round(36*k),'var(--blue)',r.pWater,240)}
  </svg>`;
}

/* ── barra de progresso animada ── */
export function Bar({w,color,height}){
  const [go,setGo]=useState(false);
  useEffect(()=>{requestAnimationFrame(()=>requestAnimationFrame(()=>setGo(true)))},[]);
  return html`<div class="bar" style=${height?`height:${height}`:''}>
    <i style="width:${go?w:'0%'};${color?`background:${color}`:''}"></i></div>`;
}

/* ── número que conta do 0 na primeira montagem, estático depois ── */
export function Num({v,dec=0,suf='',pre='',className='',style=''}){
  const el=useRef(null);
  const first=useRef(true);
  useEffect(()=>{
    if(!el.current)return;
    if(first.current){first.current=false;
      const t0=performance.now(),dur=1100,target=+v||0;
      const step=t=>{
        const p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,3);
        if(el.current)el.current.textContent=staticNum(target*e,dec,suf,pre);
        if(p<1)requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }else el.current.textContent=staticNum(+v||0,dec,suf,pre);
  },[v]);
  return html`<span ref=${el} class=${className} style=${style}>${staticNum(0,dec,suf,pre)}</span>`;
}
