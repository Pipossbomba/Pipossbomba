/* ═══════════════ LIFE OS v2 — Google (OAuth no dispositivo) ═══════════════
   Portado da v1 quase literalmente — esta camada não depende de rendering.
   Caches de calendário/emails são sinais reativos: quando a sync termina,
   a UI que os usa atualiza sozinha (a v1 precisava de softRender()). */
import {html} from '../vendor/preact-htm.module.js';
import {K,LS,save,signal,toast,todayISO,azParts,classifyEmail,deent,DTF_DM} from './core.js';
import {sheetOpen} from './ui.js';

export const GMAIL_SCOPE='https://www.googleapis.com/auth/gmail.readonly';
export const CAL_SCOPE='https://www.googleapis.com/auth/calendar.readonly';
export const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
export const GOOGLE_WEB_CLIENT_ID='605608011780-te33hr14en2mcfp974p67dg958tr8e2c.apps.googleusercontent.com';
export const gmailClientId=()=>localStorage.getItem('fl_gmail_client')||GOOGLE_WEB_CLIENT_ID;
export const isNative=()=>{try{return !!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())}catch(e){return false}};

/* caches persistentes (última sync fica no dispositivo) + tokens em memória */
export const calSig=signal({evs:(LS(K.calCache,null)||{}).evs||null,ts:(LS(K.calCache,null)||{}).ts||0});
export const mailSig=signal({list:(LS(K.mailCache,null)||{}).list||null,ts:(LS(K.mailCache,null)||{}).ts||0});
let _tok=null;
export const getTok=()=>_tok||sessionStorage.getItem('fl_gmail_tok')||sessionStorage.getItem('fl_cal_tok');
export function setGoogleToken(tok){
  _tok=tok;
  try{sessionStorage.setItem('fl_gmail_tok',tok);sessionStorage.setItem('fl_cal_tok',tok)}catch(e){}
}
function clearTok(){_tok=null;sessionStorage.removeItem('fl_gmail_tok');sessionStorage.removeItem('fl_cal_tok')}

/* login nativo (APK) — o Web Client ID, nunca o Android (DEVELOPER_ERROR 10) */
export async function nativeGoogleToken(){
  const GA=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.GoogleAuth;
  if(!GA)throw new Error('login nativo indisponível');
  try{await GA.initialize({clientId:GOOGLE_WEB_CLIENT_ID,scopes:[GMAIL_SCOPE,CAL_SCOPE,DRIVE_SCOPE],grantOfflineAccess:true})}catch(e){}
  const u=await GA.signIn();
  const tok=u&&u.authentication&&u.authentication.accessToken;
  if(!tok)throw new Error('sem token de acesso');
  return tok;
}
/* mostra o erro real do login (código incluído) para diagnóstico */
export function googleErr(e){
  const lines=[];
  try{
    if(e==null)lines.push('(erro vazio)');
    else{
      if(e.message)lines.push('message: '+e.message);
      if(e.code!==undefined)lines.push('code: '+e.code);
      if(e.errorMessage)lines.push('errorMessage: '+e.errorMessage);
      const raw=JSON.stringify(e,Object.getOwnPropertyNames(e));
      if(raw&&raw!=='{}')lines.push('raw: '+raw);
      if(!lines.length)lines.push(String(e));
    }
  }catch(_){lines.push(String(e))}
  const codeHint=(String(e&&(e.code||e.message))||'').match(/\b(10|12500|12501|12502|7|8)\b/);
  let dica='';
  if(codeHint){const c=codeHint[1];
    if(c==='10')dica='Código 10 = DEVELOPER_ERROR: a credencial Android não existe ou o pacote/SHA-1 não batem certo (ou ainda não propagou).';
    else if(c==='12501')dica='Código 12501: login cancelado pelo utilizador.';
    else if(c==='12500')dica='Código 12500: falha de configuração do Sign-In (consent screen / test user).';
    else if(c==='7')dica='Código 7: sem rede.';
  }
  sheetOpen(()=>html`<h2>⚠ Erro no login Google</h2>
    <div class="ai-out" style="font-size:12px;white-space:pre-wrap;word-break:break-word">${lines.join('\n')}</div>
    ${dica?html`<div class="hint" style="margin-top:10px">${dica}</div>`:null}
    <div class="hint" style="margin-top:8px">Faz uma captura deste ecrã e envia — dá-me o código exato para resolver.</div>`);
}

function webConnect(scope,cb){
  if(!(window.google&&google.accounts&&google.accounts.oauth2))
    return toast('Google indisponível — precisas de ligação');
  try{
    const tc=google.accounts.oauth2.initTokenClient({
      client_id:gmailClientId(),scope,
      callback:(r)=>{if(r&&r.access_token){setGoogleToken(r.access_token);cb()}else toast('Autorização cancelada')}
    });
    tc.requestAccessToken();
  }catch(e){toast('Falha ao iniciar login Google')}
}
export function calConnect(){
  if(isNative()){
    (async()=>{try{setGoogleToken(await nativeGoogleToken());calRefresh()}
    catch(e){googleErr(e)}})();
    return;
  }
  webConnect(CAL_SCOPE,calRefresh);
}
export function gmailConnect(){
  if(isNative()){
    (async()=>{try{setGoogleToken(await nativeGoogleToken());gmailRefresh()}
    catch(e){googleErr(e)}})();
    return;
  }
  webConnect(GMAIL_SCOPE,gmailRefresh);
}

export const evISO=ev=>{if(ev.allDay)return String(ev.start).slice(0,10);const p=azParts(new Date(ev.start));return `${p.year}-${p.month}-${p.day}`};
export const evHM=ev=>{if(ev.allDay)return '';const p=azParts(new Date(ev.start));return `${p.hour}:${p.minute}`};
export function evWhen(ev){
  const d=new Date(ev.allDay?ev.start+'T12:00:00':ev.start);
  const day=new Intl.DateTimeFormat('pt-PT',{timeZone:'Atlantic/Azores',weekday:'short',day:'2-digit',month:'2-digit'}).format(d);
  const time=ev.allDay?'todo o dia':evHM(ev);
  return {day,time};
}

export async function calRefresh(silent){
  const tok=getTok();
  if(!tok)return silent?null:calConnect();
  const timeMin=new Date(Date.now()-1000*60*60*24).toISOString();
  const timeMax=new Date(Date.now()+1000*60*60*24*30).toISOString();
  const url='https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=40'
    +'&timeMin='+encodeURIComponent(timeMin)+'&timeMax='+encodeURIComponent(timeMax);
  try{
    const r=await fetch(url,{headers:{Authorization:'Bearer '+tok}});
    if(r.status===401){clearTok();
      if(!silent)toast('Sessão expirou — liga outra vez');return}
    if(!r.ok)throw new Error('HTTP '+r.status);
    const j=await r.json();
    const T=todayISO();
    const evs=(j.items||[]).filter(ev=>ev.status!=='cancelled').map(ev=>({
      title:ev.summary||'(sem título)',loc:ev.location||'',
      start:ev.start.dateTime||ev.start.date,allDay:!ev.start.dateTime}))
      .filter(ev=>evISO(ev)>=T);
    const ts=Date.now();
    save(K.calCache,{ts,evs});
    calSig.set({evs,ts});          /* a UI atualiza sozinha */
    if(window._syncNotifs)window._syncNotifs();
    if(!silent)toast(`${evs.length} marcações ✓`);
  }catch(e){if(!silent)toast('Erro no calendário: '+e.message)}
}

export async function gmailRefresh(silent){
  const tok=getTok();
  if(!tok)return silent?null:gmailConnect();
  try{
    const r=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=18&q=in%3Ainbox',{headers:{Authorization:'Bearer '+tok}});
    if(r.status===401){clearTok();
      if(!silent)toast('Sessão expirou — liga outra vez');return}
    if(!r.ok)throw new Error('HTTP '+r.status);
    const {messages}=await r.json();
    /* metadados em paralelo — 18 pedidos sequenciais demoravam 18 RTTs */
    const metas=await Promise.all((messages||[]).slice(0,18).map(m=>
      fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/'+m.id+'?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date',{headers:{Authorization:'Bearer '+tok}})
        .then(d=>d.ok?d.json():null).catch(()=>null)));
    const out=[];
    for(const j of metas){
      if(!j)continue;
      const h={};(j.payload&&j.payload.headers||[]).forEach(x=>h[x.name.toLowerCase()]=x.value);
      const unread=(j.labelIds||[]).includes('UNREAD');
      const cat=classifyEmail(h.from,h.subject,j.snippet,unread);
      const dt=h.date?new Date(h.date):null;
      out.push({id:j.id,de:h.from||'',as:h.subject||'(sem assunto)',snippet:deent(j.snippet||''),unread,
        chip:cat.chip,ch:cat.ch,ic:cat.ic,h:dt?DTF_DM.format(dt):''});
    }
    const order={red:0,orange:1,blue:2,green:3,gray:4};
    out.sort((a,b)=>order[a.chip]-order[b.chip]);
    const ts=Date.now();
    save(K.mailCache,{ts,list:out});
    mailSig.set({list:out,ts});
    if(!silent)toast(`${out.length} emails carregados ✓`);
  }catch(e){
    if(!silent)toast('Erro ao ler o Gmail: '+e.message);
  }
}

/* sync automática no arranque: renova token em silêncio (nativo) ou
   reaproveita a sessão do browser; backup diário no Drive pelo caminho */
export async function autoSync(){
  try{
    let tok=getTok();
    if(!tok&&isNative()){
      const GA=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.GoogleAuth;
      if(GA){
        try{await GA.initialize({clientId:GOOGLE_WEB_CLIENT_ID,scopes:[GMAIL_SCOPE,CAL_SCOPE,DRIVE_SCOPE],grantOfflineAccess:true})}catch(e){}
        try{const a=await GA.refresh();tok=a&&(a.accessToken||(a.authentication&&a.authentication.accessToken))||null}catch(e){}
      }
    }
    if(!tok)return;
    setGoogleToken(tok);
    calRefresh(true);gmailRefresh(true);
    driveBackup(tok,false).catch(()=>{});
  }catch(e){}
}

/* ── backup automático no Google Drive (scope drive.file, ficheiro único) ── */
const DRIVE_FILE='lifeos-backup.json';
export function backupPayload(){
  const data={};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('fl_'))data[k]=localStorage.getItem(k)}
  return JSON.stringify(data);
}
async function driveApi(tok,url,opt){
  const res=await fetch(url,{...opt,headers:{Authorization:'Bearer '+tok,...(opt&&opt.headers||{})}});
  if(!res.ok){const e=new Error('drive http '+res.status);e.status=res.status;throw e}
  return res.json();
}
export async function driveFindFile(tok){
  const q=encodeURIComponent(`name='${DRIVE_FILE}' and trashed=false`);
  const r=await driveApi(tok,`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)`);
  return (r.files&&r.files[0])||null;
}
export async function driveBackup(tok,manual){
  const st=LS(K.driveBk,{});const T=todayISO();
  if(!manual&&st.last===T)return;
  try{
    let id=st.fileId;
    if(!id){const f=await driveFindFile(tok);id=f&&f.id}
    if(!id){const c=await driveApi(tok,'https://www.googleapis.com/drive/v3/files',
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:DRIVE_FILE})});id=c.id}
    await driveApi(tok,`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`,
      {method:'PATCH',headers:{'Content-Type':'application/json'},body:backupPayload()});
    save(K.driveBk,{fileId:id,last:T,err:null});
    localStorage.setItem('fl_last_backup',T);
    if(manual)toast('Backup no Drive feito ☁ ✓');
  }catch(e){
    if(e.status===404&&st.fileId){save(K.driveBk,{...st,fileId:null});return driveBackup(tok,manual)}
    save(K.driveBk,{...LS(K.driveBk,{}),err:e.status===403?'perm':'net'});
    if(manual)toast(e.status===403?'Sem permissão Drive — desliga e volta a ligar a conta Google':'Backup no Drive falhou — tenta mais tarde');
    throw e;
  }
}
export async function driveToken(){
  let tok=getTok();
  if(!tok&&isNative()){try{tok=await nativeGoogleToken()}catch(e){}}
  return tok;
}
export async function driveRestoreData(){
  const tok=await driveToken();
  if(!tok){toast('Liga primeiro a conta Google');return false}
  const f=await driveFindFile(tok);
  if(!f){toast('Nenhum backup encontrado no Drive');return false}
  const res=await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`,{headers:{Authorization:'Bearer '+tok}});
  if(!res.ok)throw new Error('http '+res.status);
  const data=await res.json();
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('formato inválido');
  Object.entries(data).forEach(([k,v])=>{if(k.startsWith('fl_')&&typeof v==='string')localStorage.setItem(k,v)});
  return true;
}
