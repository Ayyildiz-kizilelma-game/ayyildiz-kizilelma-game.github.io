/* ------------------------------------------------------------------ seasons and the Harekât Kartı (V2.69)
   Seasons follow national days: 18 Mart (Çanakkale), 19 Mayıs, 30 Ağustos, 29 Ekim. The first real season starts on
   18 March 2027; until then a short free "Hazırlık Dönemi" runs so the system can be played and tested.
   • Sezon puanı (SP): every TP the career gives also counts as SP (2× on the national day itself, "bayram etkinliği"),
     plus three weekly season tasks (500 SP each). 1 000 SP = one level.
   • Two reward tracks: free (TP, a season emblem, a season paint) and the Harekât Kartı (season paints and emblems
     only: money never buys power). Rewards are claimed in the Harekât Kartı screen; whatever was reached but not
     claimed is handed out automatically when the season ends. Season paints and emblems stay forever.
   • The Harekât Kartı is a store product per season ('kart_<season>'); buying comes with Google Play (V2.79), until then
     an admin can grant it to test. Progress lives in the profile (stats.sezon, cloud for accounts). */
const SZ_DAY=864e5;
function szT(s){ const p=s.split('-'); return Date.UTC(+p[0],+p[1]-1,+p[2])-3*3600e3; }   /* 00:00 in Türkiye */
const SEZONLAR=[
  {id:'s0',n:'Hazırlık Dönemi',bas:'2026-11-23',bit:'2027-03-18',lv:10,hazirlik:true,renk:'#9fb38a',
   d:'İlk sezona hazırlık: oyna, sezon puanı topla, ödülleri al. Harekât Kartı ilk sezonla gelir.',
   boya:[{id:'sz0_hazirlik',n:'Hazırlık',liv:{color:'#5d6b4a',camo:2,camo2:'#3a4430'},sw:'#5d6b4a'}], emb:[['sz0_nisan','🎖']]},
  {id:'s1',n:'Çanakkale Geçilmez',bas:'2027-03-18',bit:'2027-05-19',lv:30,renk:'#d8b46a',
   d:'Birinci sezon: 18 Mart Çanakkale Zaferi.',
   boya:[{id:'sz1_gelibolu',n:'Gelibolu',liv:{color:'#7a6a4a',camo:1,camo2:'#4a4030'},sw:'#7a6a4a'},{id:'sz1_seddulbahir',n:'Seddülbahir',liv:{color:'#b9b2a0',camo:3,camo2:'#7a1f1f',camoS:1.4},sw:'#b9b2a0'},
     {id:'sz1_nusret',n:'Nusret',liv:{color:'#2f3a44',camo:2,camo2:'#1d252c'},sw:'#2f3a44'},{id:'sz1_conkbayiri',n:'Conkbayırı',liv:{color:'#6e7550',camo:1,camo2:'#8c7a52',camoS:1.2},sw:'#6e7550'},
     {id:'sz1_altin',n:'Çanakkale Altını',liv:{color:'#d8d2c4',camo:3,camo2:'#b8902c',camoS:1.8,gloss:0.8},sw:'#d8d2c4'}],
   emb:[['sz1_capa','⚓'],['sz1_dalga','🌊'],['sz1_ates','🔥']]},
  {id:'s2',n:'Samsun\'dan Başlayan Yol',bas:'2027-05-19',bit:'2027-08-30',lv:30,renk:'#e05a5a',
   d:'İkinci sezon: 19 Mayıs Atatürk\'ü Anma, Gençlik ve Spor Bayramı.',
   boya:[{id:'sz2_bandirma',n:'Bandırma',liv:{color:'#e8e4da',camo:3,camo2:'#24405f',camoS:1.6},sw:'#e8e4da'},{id:'sz2_samsun',n:'Samsun',liv:{color:'#c8102e',camo:3,camo2:'#f1f1f1',camoS:2},sw:'#c8102e'},
     {id:'sz2_karadeniz',n:'Karadeniz',liv:{color:'#28414f',camo:2,camo2:'#172832'},sw:'#28414f'},{id:'sz2_genclik',n:'Gençlik',liv:{color:'#e9ecef',camo:3,camo2:'#c8102e',camoS:1.4},sw:'#e9ecef'},
     {id:'sz2_kuvayi',n:'Kuvâ-yi Milliye',liv:{color:'#6a5c3e',camo:1,camo2:'#3c3424'},sw:'#6a5c3e'}],
   emb:[['sz2_vapur','⛵'],['sz2_gunes','🌅'],['sz2_at','🐎']]},
  {id:'s3',n:'Büyük Zafer',bas:'2027-08-30',bit:'2027-10-29',lv:30,renk:'#c9a24a',
   d:'Üçüncü sezon: 30 Ağustos Zafer Bayramı.',
   boya:[{id:'sz3_kocatepe',n:'Kocatepe',liv:{color:'#8a7b5a',camo:1,camo2:'#5a4e36'},sw:'#8a7b5a'},{id:'sz3_dumlupinar',n:'Dumlupınar',liv:{color:'#a89a74',camo:2,camo2:'#6c6146'},sw:'#a89a74'},
     {id:'sz3_baskomutan',n:'Başkomutan',liv:{color:'#2a2f35',camo:3,camo2:'#c9a24a',camoS:1.5},sw:'#2a2f35'},{id:'sz3_afyon',n:'Afyon',liv:{color:'#7b8a6a',camo:1,camo2:'#4c5640'},sw:'#7b8a6a'},
     {id:'sz3_altin',n:'Zafer Altını',liv:{color:'#c9a24a',camo:3,camo2:'#8a6d24',camoS:1.6,gloss:0.9},sw:'#c9a24a'}],
   emb:[['sz3_madalya','🏅'],['sz3_kilic','⚔'],['sz3_dag','🗻']]},
  {id:'s4',n:'Cumhuriyet',bas:'2027-10-29',bit:'2028-03-18',lv:30,renk:'#ff6b6b',
   d:'Dördüncü sezon: 29 Ekim Cumhuriyet Bayramı.',
   boya:[{id:'sz4_cumhuriyet',n:'Cumhuriyet',liv:{color:'#f1f2f2',camo:3,camo2:'#c8102e',camoS:2},sw:'#f1f2f2'},{id:'sz4_ankara',n:'Ankara',liv:{color:'#b8a77e',camo:1,camo2:'#7d6f4f'},sw:'#b8a77e'},
     {id:'sz4_meclis',n:'Meclis',liv:{color:'#7a2e2e',camo:3,camo2:'#e8e0d0',camoS:1.3},sw:'#7a2e2e'},{id:'sz4_onuncu',n:'Onuncu Yıl',liv:{color:'#e9ecef',camo:3,camo2:'#c8102e',camoS:1.2},sw:'#e9ecef'},
     {id:'sz4_kirmizibeyaz',n:'Kırmızı Beyaz',liv:{color:'#c8102e',camo:3,camo2:'#ffffff',camoS:2.4,gloss:0.7},sw:'#c8102e'}],
   emb:[['sz4_fisek','🎆'],['sz4_meclis','🏛'],['sz4_yildiz','🌟']]}];
const SZ_BAYRAM=['03-18','05-19','08-30','10-29'];
const SZ_SP=1000, SZ_TASK_SP=500;
const SZ={ui:false, now:null};
/* ---- calendar */
function szAt(ms){ const t=ms==null?Date.now():ms; return SEZONLAR.find(function(S){ return t>=szT(S.bas)&&t<szT(S.bit); })||null; }
function szNext(ms){ const t=ms==null?Date.now():ms; return SEZONLAR.find(function(S){ return szT(S.bas)>t; })||null; }
function szCur(){ return szAt(SZ.now); }
function szTrDate(ms){ return new Date((ms==null?Date.now():ms)+3*3600e3).toISOString().slice(0,10); }
function szBayram(ms){ return SZ_BAYRAM.indexOf(szTrDate(ms).slice(5))>=0; }
function szDays(ms){ return Math.max(0,Math.ceil(ms/SZ_DAY)); }
/* ---- rewards: a list of {lv, free, kart} where a reward is {tp} | {boya:id} | {emb:id} */
function szTrack(S){ const L=[];
  for(let lv=1;lv<=S.lv;lv++){ const r={lv:lv, free:{tp:50+Math.floor(lv/2)*10}, kart:null};
    if(S.hazirlik){ if(lv===5) r.free={emb:S.emb[0][0]}; if(lv===S.lv) r.free={boya:S.boya[0].id}; }
    else { if(lv===10) r.free={emb:S.emb[0][0]}; if(lv===20) r.free={boya:S.boya[0].id}; if(lv===S.lv) r.free={tp:1000};
      const K={1:{boya:S.boya[1].id},6:{emb:S.emb[1][0]},12:{boya:S.boya[2].id},18:{emb:S.emb[2][0]},24:{boya:S.boya[3].id},30:{boya:S.boya[4].id}}; if(K[lv]) r.kart=K[lv]; }
    L.push(r); }
  return L; }
/* season paints go into the paint list, emblems into the emblem list (locked until earned) */
SEZONLAR.forEach(function(S){ S.boya.forEach(function(b){ PSCHEMES.push({id:b.id,n:b.n,r:0,liv:b.liv,sw:b.sw,sz:S.id}); }); S.emb.forEach(function(e){ EMBLEMS.push([e[0],e[1],S.id]); }); });
function szKart(S){ return !!S&&!S.hazirlik&&typeof entOwns==='function'&&entOwns('kart_'+S.id); }
/* ---- progress (profile stats) */
function szState(){ const p=accProfile(), st=p.stats||(p.stats={}); let z=st.sezon; const S=szCur();
  if(!z||typeof z!=='object') z=st.sezon={id:null,sp:0,al:[],alK:[]};
  if(!Array.isArray(st.koz)) st.koz=[];
  if(S&&z.id!==S.id){ const old=z; st.sezon=z={id:S.id,sp:0,al:[],alK:[]}; if(old.id) szEnd(old,st); }   /* new season first: szEnd gives TP, which comes back here */
  return z; }
function szLevel(z){ const S=SEZONLAR.find(function(s){ return s.id===z.id; }); return Math.min(S?S.lv:0,Math.floor((z.sp||0)/SZ_SP)); }
function szOwns(k){ const st=accProfile().stats||{}; return (st.koz||[]).indexOf(k)>=0; }
function szGive(rw,st,quiet){ if(!rw) return '';
  if(rw.tp){ careerAdd(rw.tp,null,'Sezon ödülü'); return '+'+rw.tp+' TP'; }
  const k=rw.boya||rw.emb; if(st.koz.indexOf(k)<0) st.koz.push(k);
  const P=rw.boya&&PSCHEMES.find(function(s){ return s.id===rw.boya; }), E=rw.emb&&EMBLEMS.find(function(e){ return e[0]===rw.emb; });
  return P?'Kaplama: '+P.n:E?'Amblem '+E[1]:''; }
/* the season ended: hand out what was reached but not claimed */
function szEnd(z,st){ const S=SEZONLAR.find(function(s){ return s.id===z.id; }); if(!S) return; const lv=Math.min(S.lv,Math.floor((z.sp||0)/SZ_SP)), got=[], kart=szKart(S);
  szTrack(S).forEach(function(r){ if(r.lv>lv) return; if(z.al.indexOf(r.lv)<0){ z.al.push(r.lv); got.push(szGive(r.free,st)); } if(r.kart&&kart&&z.alK.indexOf(r.lv)<0){ z.alK.push(r.lv); got.push(szGive(r.kart,st)); } });
  if(got.length) setTimeout(function(){ toast('🎖 '+S.n+' bitti: alınmamış '+got.length+' ödül hesabına eklendi','#ffd27a'); },3000); }
function szClaim(lv,kart){ const z=szState(), S=szCur(); if(!S||lv>szLevel(z)) return false; const st=accProfile().stats, r=szTrack(S)[lv-1]; if(!r) return false;
  const list=kart?z.alK:z.al, rw=kart?r.kart:r.free; if(!rw||list.indexOf(lv)>=0) return false; if(kart&&!szKart(S)) return false;
  list.push(lv); const t=szGive(rw,st); careerSave(); toast('🎖 Seviye '+lv+' ödülü: '+t,'#ffd27a'); return true; }
function szClaimAll(){ const z=szState(), S=szCur(); if(!S) return 0; let n=0; const lv=szLevel(z);
  for(let i=1;i<=lv;i++){ if(szClaim(i,false)) n++; if(szKart(S)&&szClaim(i,true)) n++; } return n; }
function szClaimable(){ const z=szState(), S=szCur(); if(!S) return 0; const lv=szLevel(z), k=szKart(S); let n=0;
  szTrack(S).forEach(function(r){ if(r.lv>lv) return; if(z.al.indexOf(r.lv)<0) n++; if(k&&r.kart&&z.alK.indexOf(r.lv)<0) n++; }); return n; }
/* ---- weekly season tasks (same statistics as the career tasks, their own picks) */
function szTasks(){ const z=szState(), S=szCur(); if(!S) return []; const st=accProfile().stats, wk=weekKey(), snap=function(){ const o={}; TASK_POOL.forEach(function(t){ o[t.k]=st[t.k]||0; }); return o; };
  if(!z.h||z.h.wk!==wk) z.h={wk:wk, base:snap(), done:[]};
  return taskGen('sezon-'+S.id+'-'+wk,3,true).map(function(t){ const v=Math.max(0,(st[t.k]||0)-(z.h.base[t.k]||0)); return Object.assign({},t,{id:'s'+t.id,v:Math.min(v,t.need),done:z.h.done.indexOf('s'+t.id)>=0,sp:SZ_TASK_SP}); }); }
function szAddSP(n,why){ const z=szState(), S=szCur(); if(!S||!(n>0)) return 0; const lv0=szLevel(z); z.sp=Math.min((z.sp||0)+Math.round(n),S.lv*SZ_SP);
  const lv=szLevel(z); if(lv>lv0) setTimeout(function(){ toast('🎖 Sezon seviyesi '+lv+(szClaimable()?' · ödülün Harekât Kartı\'nda':''),'#ffd27a'); },600); return n; }
function szTaskCheck(){ const L=szTasks(), z=szState(); L.forEach(function(t){ if(!t.done&&t.v>=t.need){ z.h.done.push(t.id); szAddSP(SZ_TASK_SP); toast('✅ Sezon görevi: '+t.txt+'  +'+SZ_TASK_SP+' SP','#7dffb0'); } }); }
/* every TP counts as SP (2× on the national day); season rewards themselves do not */
careerAdd=HOOK.wrap('careerAdd','ag/sezon#szAdd',function(next){ return function(xp,patch,why){ const r=next.apply(this,arguments);
  try{ if(szCur()){ if(xp>0&&!/^Sezon/.test(why||'')) szAddSP(xp*(szBayram(SZ.now)?2:1)); szTaskCheck(); } }catch(e){ console.warn('sezon',e); } return r; }; },careerAdd);
/* ---- paints and emblems: locked until earned; other seasons' rewards stay hidden until owned */
function szPaintHidden(P){ return !!(P&&P.sz&&!szOwns(P.id)&&(!szCur()||P.sz!==szCur().id)); }
paintSet=HOOK.wrap('paintSet','ag/sezon#_szPaint',function(next){ return function(id,sid){ const P=PSCHEMES.find(function(s){ return s.id===sid; });
  if(P&&P.sz&&!szOwns(P.id)){ toast('🎖 '+P.n+' bir sezon ödülü: Kariyer → Harekât Kartı','#ffc24a'); return; } return next.apply(this,arguments); }; },paintSet);
paintUI=HOOK.wrap('paintUI','ag/sezon#_szPaintUI',function(next){ return function(){ next(); const el=$('hPaint'); if(!el||!el.querySelectorAll) return;
  Array.prototype.forEach.call(el.querySelectorAll('button[data-p]'),function(b){ const P=PSCHEMES.find(function(s){ return s.id===b.dataset.p; }); if(!P||!P.sz||szOwns(P.id)) return;
    if(szPaintHidden(P)){ b.remove(); return; } b.classList.add('lock'); const sp=b.querySelector('span'); if(sp&&sp.textContent.indexOf('🎖')<0) sp.textContent+=' 🎖'; }); }; },paintUI);
accRender=HOOK.wrap('accRender','ag/sezon#_szEm',function(next){ return function(){ next(); const el=$('accEm'); if(!el||!el.querySelectorAll) return; const cur=accProfile().emblem;
  Array.prototype.forEach.call(el.querySelectorAll('button[data-e]'),function(b){ const E=EMBLEMS.find(function(e){ return e[0]===b.dataset.e; }); if(E&&E[2]&&!szOwns(E[0])&&E[0]!==cur) b.remove(); }); }; },accRender);
/* ---- the store: this season's Harekât Kartı */
(function(){ const S=szAt(); if(!S||S.hazirlik) return; const k=szTrack(S).filter(function(r){ return r.kart; }), nb=k.filter(function(r){ return r.kart.boya; }).length, ne=k.length-nb;
  STORE.push({id:'kart_'+S.id, ad:'Harekât Kartı · '+S.n, tur:'Sezonluk', ne:'Bu sezonun Harekât Kartı yolu: '+nb+' sezon kaplaması ve '+ne+' amblem; seviyeleri oynayarak açarsın. Sezon bitince de senin kalır. Para güç satın almaz.'}); })();
/* ---- screen */
function szRw(rw){ if(!rw) return '<span class="szno">—</span>'; if(rw.tp) return '<span class="sztp">+'+rw.tp+' TP</span>';
  if(rw.boya){ const P=PSCHEMES.find(function(s){ return s.id===rw.boya; }); return '<span class="szbo"><i style="background:'+P.sw+(P.liv.camo2?';box-shadow:inset -6px -6px 0 '+P.liv.camo2:'')+'"></i>'+P.n+'</span>'; }
  const E=EMBLEMS.find(function(e){ return e[0]===rw.emb; }); return '<span class="szem"><b>'+(E?E[1]:'?')+'</b>Amblem</span>'; }
function szRender(){ const el=$('szBody'); if(!el) return; const S=szCur(), N=szNext(SZ.now);
  if(!S){ el.innerHTML='<p class="lbempty">Şu an sezon yok.'+(N?' Sıradaki: '+N.n+', '+szDays(szT(N.bas)-Date.now())+' gün sonra.':'')+'</p>'; return; }
  const z=szState(), lv=szLevel(z), kart=szKart(S), into=lv>=S.lv?SZ_SP:(z.sp||0)-lv*SZ_SP, left=szT(S.bit)-(SZ.now==null?Date.now():SZ.now), cl=szClaimable();
  let h='<div class="szhead" style="--szc:'+S.renk+'"><div><p class="k">'+(S.hazirlik?'SEZON 0':'SEZON '+S.id.slice(1))+' · '+szDays(left)+' GÜN KALDI</p><h3>'+S.n+'</h3><p class="mgn">'+S.d+'</p></div>'+
    '<div class="szlv"><b>'+lv+'</b><small>/ '+S.lv+'</small></div></div>'+
    '<div class="szbar"><i style="width:'+Math.round(into/SZ_SP*100)+'%"></i></div><p class="mgn">'+(lv>=S.lv?'Son seviyedesin.':into+' / '+SZ_SP+' SP · kariyerde kazandığın her TP sezon puanı da sayılır')+'</p>';
  if(szBayram(SZ.now)) h+='<p class="szbay">🇹🇷 Bayram etkinliği: bugün kazandığın her TP 2 kat sezon puanı.</p>';
  const T=szTasks(); h+='<p class="szh">BU HAFTANIN SEZON GÖREVLERİ</p><div class="sztasks">'+T.map(function(t){ return '<div class="tk'+(t.done?' on':'')+'"><b>'+(t.done?'✓ ':'')+t.txt+'</b><div class="pbar"><i style="width:'+Math.round(t.v/t.need*100)+'%"></i></div><small>'+(t.k==='flightSec'||t.k==='heliSec'?Math.floor(t.v/60)+' / '+t.need/60+' dk':t.k==='dist'?Math.floor(t.v/1000)+' / '+t.need/1000+' km':t.v+' / '+t.need)+' · +'+t.sp+' SP</small></div>'; }).join('')+'</div>';
  h+='<div class="szth"><p class="szh">ÖDÜLLER</p>'+(cl?'<button class="btn primary" type="button" data-szall="1">Hepsini al ('+cl+')</button>':'')+'</div>';
  if(S.hazirlik) h+='<p class="mgn">Harekât Kartı ilk sezonla gelir'+(N?': '+N.n+', '+szDays(szT(N.bas)-Date.now())+' gün sonra':'')+'.</p>';
  else if(!kart) h+='<div class="szkart"><b>Harekât Kartı</b><span>Sağdaki yol: sezon kaplamaları ve amblemler. Seviyeleri oynayarak açarsın; para güç satın almaz.</span><button class="btn" type="button" data-szbuy="1">Mağazada gör</button></div>';
  h+='<div class="sztrack'+(S.hazirlik?' solo':'')+'"><div class="szrow szhdr"><span>Sv.</span><span>Ücretsiz</span>'+(S.hazirlik?'':'<span>Harekât Kartı'+(kart?' ✓':' 🔒')+'</span>')+'</div>'+szTrack(S).map(function(r){ const on=r.lv<=lv;
    const cell=function(rw,k){ if(!rw) return '<span class="szc">'+szRw(null)+'</span>'; const got=(k?z.alK:z.al).indexOf(r.lv)>=0, can=on&&!got&&(!k||kart);
      return '<span class="szc'+(got?' got':'')+(k&&!kart?' lk':'')+'">'+szRw(rw)+(got?'<em>✓</em>':can?'<button class="btn sm" type="button" data-szl="'+r.lv+'" data-szk="'+(k?1:0)+'">Al</button>':'')+'</span>'; };
    return '<div class="szrow'+(on?' on':'')+(r.lv===lv+1?' nx':'')+'"><span class="szn">'+r.lv+'</span>'+cell(r.free,false)+(S.hazirlik?'':cell(r.kart,true))+'</div>'; }).join('')+'</div>';
  if(N&&!S.hazirlik) h+='<p class="mgn">Sıradaki sezon: '+N.n+' ('+N.bas.split('-').reverse().join('.')+').</p>';
  else if(N) h+='<p class="mgn">Sezonlar millî günlerde başlar: 18 Mart, 19 Mayıs, 30 Ağustos, 29 Ekim. Sezon bitince alınmamış ödüller kendiliğinden verilir; sezon kaplamaları ve amblemler senin kalır.</p>';
  el.innerHTML=h; }
function szOpen(){ let el=$('szUI'); if(!el&&document.createElement){ el=document.createElement('div'); el.id='szUI'; el.className='modal hidden';
    el.innerHTML='<div class="card wide relcard szcard"><button class="xbtn" type="button" id="szX" aria-label="Kapat">✕</button><h2>Harekât Kartı</h2><div class="relbody szbody" id="szBody"></div></div>';
    document.body.appendChild(el); MODALS.push('szUI');
    el.querySelector('#szX').addEventListener('click',function(){ el.classList.add('hidden'); if(state==='menu') navRender(); });
    el.querySelector('#szBody').addEventListener('click',function(e){ const b=e.target.closest('button[data-szl]'); if(b){ szClaim(+b.dataset.szl,b.dataset.szk==='1'); szRender(); return; }
      if(e.target.closest('button[data-szall]')){ const n=szClaimAll(); if(n>1) toast('🎖 '+n+' ödül alındı','#ffd27a'); szRender(); return; }
      if(e.target.closest('button[data-szbuy]')&&typeof magOpen==='function'){ const S=szCur(); el.classList.add('hidden'); magOpen(S&&'kart_'+S.id); } }); }
  if(!el) return; szRender(); el.classList.remove('hidden'); }
/* ---- Kariyer → Harekât Kartı */
NAV_IC.sezon='<path d="M5 3h14v18l-7-4-7 4z"/><path d="M9 8h6M9 12h6"/>';
NAV_D.c_sezon=['KARİYER','Harekât Kartı','Sezon ilerlemesi: kariyerde kazandığın her TP sezon puanı da sayılır. Seviye atladıkça TP, sezon kaplaması ve amblem kazanırsın. Haftalık sezon görevleri ve millî günlerde 2 kat puan. Sezonlar 18 Mart, 19 Mayıs, 30 Ağustos ve 29 Ekim\'de başlar.',[],'Harekât Kartı\'nı aç'];
navRender=HOOK.wrap('navRender','ag/sezon#_szNav',function(next){ return function(){ next(); if(NAV.level!=='career') return; const el=$('cNav'); if(!el) return; const h=el.innerHTML;
  if(h.indexOf('data-act="c_sezon"')>=0) return; const k=h.indexOf('data-act="c_missions"'); if(k<0) return; const j=h.lastIndexOf('<button',k), S=szCur();
  let sub='Sezon yok'; if(S){ const z=szState(), c=szClaimable(); sub=S.n+' · seviye '+szLevel(z)+' / '+S.lv+(c?' · '+c+' ödül hazır':''); }
  el.innerHTML=h.slice(0,j)+navBtn('c_sezon','Harekât Kartı',sub,'sezon')+h.slice(j); tFocus=Math.min(tFocus,Math.max(0,titleItems().length-1)); titleFocus(tFocus); }; },navRender);
titleAct=HOOK.wrap('titleAct','ag/sezon#_szAct',function(next){ return function(act){ if(act==='c_sezon'&&state==='menu'){ playMode('career'); return szOpen(); } return next.apply(this,arguments); }; },titleAct);
