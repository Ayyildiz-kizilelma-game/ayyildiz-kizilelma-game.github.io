/* ------------------------------------------------------------------ store (V2.61, income route step 1)
   The game stays free and money never buys power: the store sells cosmetics and comfort. This step builds the store
   screen, the product list and owned products (entitlements); real payments come with Google Play in V2.75, ads in V2.62.
   • STORE: products. A pack unlocks paint schemes (PSCHEMES entries with p:'<product>'); a bundle contains other products.
   • Owned products: cloud table 'entitlements' (supabase/magaza.sql; a player can only read their own rows, only the
     server or an admin writes), cached on the device ('ayy-ent') so the paints stay on offline. Guests own nothing.
   • Hangar paint chips of packs show a cart; choosing one opens the store at that pack.
   • Admins can grant a product to themselves from the store to test (source 'yonetici'). */
NAV_IC.store='<path d="M4 8h16l-1.4 10.2a2 2 0 01-2 1.8H7.4a2 2 0 01-2-1.8L4 8z"/><path d="M8.5 8V6.5a3.5 3.5 0 017 0V8"/>';
NAV_D.store=['OYNA','Mağaza','Kaplama paketleri, reklamsız oyun ve destekçi paketi. Para güç satın almaz: yalnız görünüm ve rahatlık.',[],'Mağazayı aç'];
/* premium paint schemes (camo 1 = patches, 2 = digital, 3 = stripes) */
PSCHEMES.push(
  {id:'kis_kar',n:'Kar beyazı',r:0,p:'paket_kis',liv:{color:'#e6ebef',camo:1,camo2:'#b9c3cc',camoS:1.3,gloss:0.35},sw:'#e6ebef'},
  {id:'kis_buzul',n:'Buzul',r:0,p:'paket_kis',liv:{color:'#cfd9e2',camo:2,camo2:'#8fa3b5'},sw:'#cfd9e2'},
  {id:'kis_kutup',n:'Kutup gecesi',r:0,p:'paket_kis',liv:{color:'#3a4552',camo:1,camo2:'#e3e8ec',camoS:1.6,gloss:0.25},sw:'#3a4552'},
  {id:'deniz_ege',n:'Ege mavisi',r:0,p:'paket_deniz',liv:{color:'#4f7fa8',gloss:0.45},sw:'#4f7fa8'},
  {id:'deniz_derin',n:'Derin deniz',r:0,p:'paket_deniz',liv:{color:'#2c4a68',camo:2,camo2:'#1b2f45'},sw:'#2c4a68'},
  {id:'deniz_firtina',n:'Fırtına grisi',r:0,p:'paket_deniz',liv:{color:'#7d8a96',camo:3,camo2:'#4d5a66',camoS:1.2},sw:'#7d8a96'},
  {id:'tarih_hilal',n:'Hilal',r:0,p:'paket_tarih',liv:{color:'#f1f2f2',camo:3,camo2:'#c8102e',camoS:2.2,gloss:0.7},sw:'#f1f2f2'},
  {id:'tarih_kartal',n:'Kartal',r:0,p:'paket_tarih',liv:{color:'#1f2328',camo:3,camo2:'#d4a72c',camoS:1.8,gloss:0.6},sw:'#1f2328'},
  {id:'tarih_kurtulus',n:'Kurtuluş',r:0,p:'paket_tarih',liv:{color:'#8a7b55',camo:1,camo2:'#4e4a33',camoS:1.1},sw:'#8a7b55'});
const STORE=[
  {id:'reklamsiz',ad:'Reklamsız',tur:'Tek seferlik',ne:'Görev aralarındaki reklamlar kapanır; ödüllü reklamların ödülü (2× TP, günlük ödül, kaldığın yerden devam) reklam izlemeden verilir.'},
  {id:'paket_kis',ad:'Kış Harekâtı kaplamaları',tur:'Kaplama paketi',ne:'Bütün uçaklarda kullanılan 3 kaplama: Kar beyazı, Buzul, Kutup gecesi.'},
  {id:'paket_deniz',ad:'Mavi Vatan kaplamaları',tur:'Kaplama paketi',ne:'Bütün uçaklarda kullanılan 3 kaplama: Ege mavisi, Derin deniz, Fırtına grisi.'},
  {id:'paket_tarih',ad:'Tarihî kaplamalar',tur:'Kaplama paketi',ne:'Bütün uçaklarda kullanılan 3 kaplama: Hilal, Kartal, Kurtuluş.'},
  {id:'destekci',ad:'Destekçi paketi',tur:'Paket',ne:'Reklamsız + Kış Harekâtı ve Mavi Vatan kaplamaları + profilinde "Destekçi" unvanı. Oyunun gelişmesine destek olursun.',icerir:['reklamsiz','paket_kis','paket_deniz']}];
const ENT={own:{}, from:'yok', busy:false};
try{ const c=JSON.parse(stGet('ayy-ent')||'null'); if(c&&c.own) ENT.own=c.own; }catch(e){}
function entSave(){ try{ stSet('ayy-ent',JSON.stringify({own:ENT.own,t:Date.now()})); }catch(e){} }
/* owned = bought directly or inside an owned bundle */
/* V2.62: a pack can also be tried for 24 hours after a rewarded ad (ENT.trial: product → end time, this device only) */
ENT.trial={}; try{ const t=JSON.parse(stGet('ayy-ent-dene')||'{}'); if(t&&typeof t==='object') ENT.trial=t; }catch(e){}
function entTrialLeft(pid){ return Math.max(0,(ENT.trial[pid]||0)-Date.now()); }
function entTrial(pid){ ENT.trial[pid]=Date.now()+24*3600e3; try{ stSet('ayy-ent-dene',JSON.stringify(ENT.trial)); }catch(e){} if(typeof paintUI==='function') paintUI(); magRender();
  toast('🎨 '+((STORE.find(function(s){ return s.id===pid; })||{}).ad||'Paket')+' 24 saat açık: hangarda Boya\'dan seç','#7dffb0'); }
setInterval(function(){ let ch=false; Object.keys(ENT.trial).forEach(function(k){ if(ENT.trial[k]<=Date.now()){ delete ENT.trial[k]; ch=true; } });
  if(ch){ try{ stSet('ayy-ent-dene',JSON.stringify(ENT.trial)); }catch(e){} entTidyPaint(); if(typeof paintUI==='function') paintUI(); magRender(); } },60000);
function entOwns(pid){ if(ENT.own[pid]||entTrialLeft(pid)>0) return true; return STORE.some(function(s){ return s.icerir&&s.icerir.indexOf(pid)>=0&&ENT.own[s.id]; }); }
function entSet(list){ const o={}; (list||[]).forEach(function(r){ if(r&&r.product) o[r.product]=r.source||'play'; }); ENT.own=o; entSave(); entTidyPaint(); if(typeof paintUI==='function') paintUI(); magRender(); }
/* a paint of a pack the player does not own (signed out, refund) goes back to standard */
function entTidyPaint(){ let ch=false; Object.keys(PAINT).forEach(function(id){ const P=PSCHEMES.find(function(s){ return s.id===PAINT[id]; }); if(P&&P.p&&!entOwns(P.p)){ delete PAINT[id]; delete LIV.data[id]; ch=true; if(typeof liveryRefresh==='function') liveryRefresh(id); } });
  if(ch) try{ stSet('ayy-paint',JSON.stringify(PAINT)); }catch(e){} }
function entPull(){ if(!ACC||!ACC.sb||!ACC.user) return Promise.resolve(); ENT.busy=true;
  return Promise.resolve().then(function(){ return ACC.sb.from('entitlements').select('product,source'); }).then(function(r){ if(r.error) throw r.error; ENT.from='bulut'; entSet(r.data); })
    .catch(function(e){ ENT.from='hata'; console.warn('ürünler okunamadı',e&&e.message||e); }).then(function(){ ENT.busy=false; }); }
function entIsSupporter(){ return entOwns('destekci'); }
function magEsc(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function magSw(pid){ return PSCHEMES.filter(function(P){ return P.p===pid; }).map(function(P){ return '<i title="'+magEsc(P.n)+'" style="background:'+P.sw+(P.liv&&P.liv.camo2?';box-shadow:inset -7px -7px 0 '+P.liv.camo2:'')+'"></i>'; }).join(''); }
function magRender(){ const el=$('magBody'); if(!el) return; const admin=typeof accIsAdmin==='function'&&accIsAdmin()&&ACC.user;
  el.innerHTML=STORE.map(function(s){ const own=entOwns(s.id), trial=!ENT.own[s.id]&&entTrialLeft(s.id)>0, canTry=!own&&!s.icerir&&magSw(s.id)&&typeof adsOfferable==='function'&&adsOfferable(), sw=s.icerir?s.icerir.map(magSw).join(''):magSw(s.id);
    return '<div class="mgc'+(own?' own':'')+(MAG.focus===s.id?' fx':'')+'" data-pid="'+s.id+'"><div class="mgh"><b>'+magEsc(s.ad)+'</b><small>'+magEsc(s.tur)+'</small></div>'+
      (sw?'<div class="mgsw">'+sw+'</div>':'')+'<p>'+magEsc(s.ne)+'</p><div class="mga">'+
      (trial?'<span class="mgok">⏳ Deneme: '+Math.ceil(entTrialLeft(s.id)/3600e3)+' saat kaldı</span>':own?'<span class="mgok">✓ Sahipsin</span>':'<button class="btn" type="button" disabled title="Google Play satın alımı V2.75 ile gelecek">Yakında · Google Play</button>')+
      (canTry?'<button class="btn ghost" type="button" data-trial="'+s.id+'">🎬 Reklam izle · 24 saat dene</button>':'')+(admin&&!own?'<button class="btn ghost" type="button" data-grant="'+s.id+'">Kendime tanımla (deneme)</button>':'')+'</div></div>'; }).join('')+
    '<p class="mgn">'+(ACC&&ACC.user?'Sahip olduğun ürünler hesabına bağlı; her cihazda giriş yapınca gelir.':'Satın alınan ürünler hesaba bağlanır; misafir oyuncular için mağaza yalnız tanıtım.')+
    ' Ödeme yalnız Google Play uygulamasından yapılabilecek. Para güç satın almaz: uçaklar ve silahlar ilerledikçe açılır.</p>'+
    (typeof ADS!=='undefined'&&(ADS.native||ADS.sim)?'<p class="mgn"><button class="btn ghost" type="button" data-adpref="1">Reklam tercihleri</button></p>':'');
  const f=el.querySelector('.fx'); if(f&&f.scrollIntoView) try{ f.scrollIntoView({block:'center'}); }catch(e){} }
const MAG={focus:null};
function magGrant(pid){ if(!ACC||!ACC.sb||!ACC.user||!accIsAdmin()) return;
  Promise.resolve().then(function(){ return ACC.sb.from('entitlements').insert({user_id:ACC.user.id, product:pid, source:'yonetici'}); }).then(function(r){ if(r.error) throw r.error; toast('Tanımlandı: '+(STORE.find(function(s){ return s.id===pid; })||{}).ad,'#7dffb0'); return entPull(); })
    .catch(function(e){ toast('Tanımlanamadı: '+(e&&e.message||e),'#ff6a5a'); }); }
function magOpen(focus){ MAG.focus=focus||null; let el=$('magUI'); if(!el&&document.createElement){ el=document.createElement('div'); el.id='magUI'; el.className='modal hidden';
    el.innerHTML='<div class="card wide relcard magcard"><button class="xbtn" type="button" id="magX" aria-label="Kapat">✕</button><h2>Mağaza</h2><div class="relbody magbody" id="magBody"></div></div>';
    document.body.appendChild(el); MODALS.push('magUI');
    el.querySelector('#magX').addEventListener('click',function(){ el.classList.add('hidden'); });
    el.querySelector('#magBody').addEventListener('click',function(e){ const b=e.target.closest('button[data-grant]'); if(b) magGrant(b.dataset.grant);
      const t=e.target.closest('button[data-trial]'); if(t&&typeof adsReward==='function'){ t.disabled=true; adsReward('kaplama').then(function(ok){ if(ok) entTrial(t.dataset.trial); else magRender(); }); }
      const a=e.target.closest('button[data-adpref]'); if(a&&typeof adsPrefOpen==='function') adsPrefOpen(); }); }
  if(!el) return; magRender(); el.classList.remove('hidden'); if(ACC&&ACC.user) entPull(); }
/* hangar: pack paints show a cart and open the store */
paintSet=HOOK.wrap('paintSet','ekran/magaza#_mgPaint',function(next){ return function(id,sid){ const P=PSCHEMES.find(function(s){ return s.id===sid; });
  if(P&&P.p&&!entOwns(P.p)){ magOpen(P.p); return; } return next(id,sid); }; },paintSet);
paintUI=HOOK.wrap('paintUI','ekran/magaza#_mgPaintUI',function(next){ return function(){ next(); const el=$('hPaint'); if(!el||!el.querySelectorAll) return;
  Array.prototype.forEach.call(el.querySelectorAll('button[data-p]'),function(b){ const P=PSCHEMES.find(function(s){ return s.id===b.dataset.p; }); if(P&&P.p&&!entOwns(P.p)){ b.classList.add('buy'); const sp=b.querySelector('span'); if(sp&&sp.textContent.indexOf('🛒')<0) sp.textContent+=' 🛒'; } }); }; },paintUI);
/* the store in the main menu, after the guide */
navRender=HOOK.wrap('navRender','ekran/magaza#_mgNav',function(next){ return function(){ next(); if(NAV.level!=='root') return; const el=$('cNav'); if(!el) return; const h=el.innerHTML; if(h.indexOf('data-act="store"')>=0) return;
  let k=h.indexOf('data-act="guide"'); if(k<0) k=h.indexOf('data-act="notes"'); if(k<0) return; const j=h.indexOf('</button>',k)+9;
  el.innerHTML=h.slice(0,j)+navBtn('store','Mağaza','Kaplamalar · reklamsız · destekçi','store')+h.slice(j); }; },navRender);
titleAct=HOOK.wrap('titleAct','ekran/magaza#_mgAct',function(next){ return function(act){ if(act==='store'&&state==='menu') return magOpen(); return next(act); }; },titleAct);
/* owned products follow the account */
accAfterLogin=HOOK.wrap('accAfterLogin','ekran/magaza#entPull',function(next){ return function(){ const p=next(); Promise.resolve(p).then(function(ok){ if(ok) entPull(); }); return p; }; },accAfterLogin);
/* signing out: the button is bound to accSignOut directly, so listen on the button itself */
{ const o=$('accOut'); if(o&&o.addEventListener) o.addEventListener('click',function(){ entSet([]); }); }
/* a device with a cached list but nobody signed in (session expired) keeps nothing */
/* (offline keeps the list, so bought paints stay on without internet) */
if(ACC&&ACC.cfg&&!ACC.user&&Object.keys(ENT.own).length) setTimeout(function(){ if(!ACC.user&&ACC.status==='guest') entSet([]); },8000);
