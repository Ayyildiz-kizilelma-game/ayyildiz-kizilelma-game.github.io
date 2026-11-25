/* ------------------------------------------------------------------ leaderboards and the unit race (V2.68)
   Kariyer → Sıralama: four lists from the cloud (supabase/siralama.sql).
   • Bu hafta: TP earned since Monday 00:00 (Türkiye saati). Every TP the career gives (careerAdd) is queued and sent to
     the server a few seconds later (lb_tp_ekle: at most 1 500 per call, 100 000 per week); the queue is kept on the
     device with the account id, so it survives going offline and never lands on another account.
   • Tüm zamanlar: total TP (the profile).
   • Birlik yarışı: the week's TP summed per unit (Hilal Kanatlar, Mavi Kanatlar, Bozkurtlar). A player's points stay with
     the unit they had at their first TP of the week. When the week ends, the members of the winning unit who earned TP
     for it get 150 TP (once, on their next visit to the menu).
   • Yarışlar: best time per race (lb_yaris_kaydet keeps only a better time).
   Guests can read every list; signing in puts them on it. No e-mail is ever shown: call sign, unit, emblem, points. */
const LB={tab:'hafta', race:null, t:0, busy:false, me:null, err:null, data:{}, load:0, zafer:false};
const LB_ODUL=150, LB_PART=1500;
const LB_RENK={hava:'#ff6b6b', deniz:'#5ab8ff', kara:'#e3b35a'};
function lbEsc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
/* ---- weeks: Monday 00:00 in Türkiye (UTC+3 all year) */
function lbWeekStart(ms){ const TR=3*3600e3, d=new Date((ms==null?Date.now():ms)+TR), day=(d.getUTCDay()+6)%7;
  return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-day)-TR; }
function lbWeekId(ms){ return new Date(lbWeekStart(ms)+3*3600e3).toISOString().slice(0,10); }
function lbLeft(ms){ const now=ms==null?Date.now():ms, s=Math.max(0,lbWeekStart(now)+7*864e5-now), d=Math.floor(s/864e5), h=Math.floor(s%864e5/3600e3), m=Math.floor(s%3600e3/60e3);
  return d>0?d+' gün '+h+' saat':h>0?h+' saat '+m+' dakika':m+' dakika'; }
/* ---- the TP queue */
function lbPend(){ try{ const s=JSON.parse(stGet('ayy-lb-bekle')||'null'); if(s&&typeof s==='object') return s; }catch(e){} return {u:null,n:0}; }
function lbPendSet(s){ try{ stSet('ayy-lb-bekle',JSON.stringify(s)); }catch(e){} }
function lbOn(){ return !!(typeof ACC!=='undefined'&&ACC.sb&&ACC.user&&ACC.prof); }
function lbQueue(n){ n=Math.round(n||0); if(!(n>0)||!lbOn()) return 0; const s=lbPend(); if(s.u!==ACC.user.id){ s.u=ACC.user.id; s.n=0; }
  s.n=(s.n||0)+n; lbPendSet(s); clearTimeout(LB.t); LB.t=setTimeout(lbFlush,6000); return s.n; }
function lbFlush(){ if(LB.busy||!lbOn()) return Promise.resolve(0); const s=lbPend(); if(s.u!==ACC.user.id||!(s.n>0)) return Promise.resolve(0);
  const n=Math.min(LB_PART,s.n), uid=s.u; LB.busy=true;
  return Promise.resolve(ACC.sb.rpc('lb_tp_ekle',{n:n})).then(function(r){ LB.busy=false; if(r&&r.error) throw r.error;
      const c=lbPend(); if(c.u===uid){ c.n=Math.max(0,(c.n||0)-n); lbPendSet(c); if(c.n>0){ clearTimeout(LB.t); LB.t=setTimeout(lbFlush,1500); } }
      LB.me=null; return r?r.data:0; })
    .catch(function(e){ LB.busy=false; LB.err=e&&e.message||String(e); console.warn('[AyYildiz] sıralama: TP gönderilemedi',LB.err); clearTimeout(LB.t); LB.t=setTimeout(lbFlush,60000); return 0; }); }
careerAdd=HOOK.wrap('careerAdd','ag/siralama#lbQueue',function(next){ return function(xp){ const r=next.apply(this,arguments); try{ if(xp>0) lbQueue(xp); }catch(e){} return r; }; },careerAdd);
/* ---- race records */
raceFinish=HOOK.wrap('raceFinish','ag/siralama#lbRace',function(next){ return function(){ const R=RACE.def, t=RACE.t, r=next.apply(this,arguments);
  try{ if(R&&lbOn()&&t>0) Promise.resolve(ACC.sb.rpc('lb_yaris_kaydet',{y:R.id, sure:Math.round(t*1000), uc:R.ac||null})).then(function(x){ if(x&&!x.error&&x.data===Math.round(t*1000)) toast('🏁 Süren sıralamaya kaydedildi','#b8ecff'); }).catch(function(){}); }catch(e){}
  return r; }; },raceFinish);
/* ---- loading */
function lbRpc(fn,args){ return Promise.resolve(ACC.sb.rpc(fn,args||{})).then(function(r){ if(r&&r.error) throw r.error; return r?r.data:null; }); }
function lbFetch(tab){ const prev=lbWeekId(lbWeekStart()-864e5);
  if(tab==='hafta') return lbRpc('lb_hafta_liste2',{h:null,lim:50});
  if(tab==='genel') return lbRpc('lb_genel_liste2',{lim:50});
  if(tab==='filo') return lbRpc('filo_liste',{q:null,lim:50,h:null});
  if(tab==='birlik') return Promise.all([lbRpc('lb_birlik',{h:null}),lbRpc('lb_birlik',{h:prev})]).then(function(a){ return {now:a[0]||[], prev:a[1]||[]}; });
  return lbRpc('lb_yaris_liste2',{y:LB.race,lim:20}); }   /* *2: with the fleet tag (V2.70) */
function lbLoad(){ const tab=LB.tab, k=tab==='yaris'?'yaris:'+LB.race:tab, id=++LB.load; LB.err=null;
  if(typeof ACC==='undefined'||!ACC.sb){ lbRender(); return Promise.resolve(); }
  const first=lbOn()?lbFlush():Promise.resolve();
  return first.then(function(){ return Promise.all([lbFetch(tab), lbOn()?lbRpc('lb_benim').catch(function(){ return null; }):null]); })
    .then(function(a){ if(id!==LB.load) return; LB.data[k]=a[0]||[]; const m=a[1]; LB.me=Array.isArray(m)?m[0]||null:m; lbRender(); })
    .catch(function(e){ if(id!==LB.load) return; LB.err=e&&e.message||String(e); lbRender(); }); }
/* ---- rendering */
const LB_TABS=[['hafta','Bu hafta'],['genel','Tüm zamanlar'],['birlik','Birlik yarışı'],['filo','Filolar'],['yaris','Yarışlar']];
function lbEmb(e){ const x=(typeof EMBLEMS!=='undefined'?EMBLEMS:[]).find(function(m){ return m[0]===e; }); return x?x[1]:'☾'; }
function lbUnit(u){ return (typeof UNITS!=='undefined'&&UNITS[u])||UNITS.hava; }
function lbRows(L,val,unitOf){ const me=lbOn()?ACC.user.id:null;
  if(!L||!L.length) return '<p class="lbempty">Henüz kimse yok. İlk sen ol!</p>';
  return '<ol class="lbl">'+L.map(function(r){ return '<li class="'+(r.user_id===me?'me':'')+'"><span class="lbs">'+r.sira+'</span><span class="lbe">'+lbEmb(r.emblem)+'</span><span class="lbn"><b>'+(r.etiket?'<span class="fltag">'+lbEsc(r.etiket)+'</span>':'')+lbEsc(r.callsign||'Pilot')+'</b><small style="color:'+(LB_RENK[r.unit]||'#ccc')+'">'+lbEsc(lbUnit(r.unit))+'</small></span><span class="lbv">'+val(r)+'</span></li>'; }).join('')+'</ol>'; }
function lbTp(n){ return (Math.round(n)||0).toLocaleString('tr-TR')+' TP'; }
function lbMeLine(){ if(!lbOn()) return '<p class="lbme">Sıralamada görünmek için giriş yap: kazandığın TP ve yarış sürelerin buraya işlenir.</p>';
  const m=LB.me; if(!m) return '';
  const w=m.hafta_sira?'Bu hafta <b>'+m.hafta_sira+'.</b> ('+lbTp(m.hafta_tp)+')':'Bu hafta henüz TP yok', g=m.genel_sira?'tüm zamanlarda <b>'+m.genel_sira+'.</b>':'';
  return '<p class="lbme">'+w+(g?' · '+g:'')+'</p>'; }
function lbBirlik(D){ const now=D&&D.now||[], prev=D&&D.prev||[], tot={}, cnt={}; let sum=0;
  now.forEach(function(r){ tot[r.unit]=+r.tp||0; cnt[r.unit]=+r.oyuncu||0; sum+=+r.tp||0; });
  const order=['hava','deniz','kara'].sort(function(a,b){ return (tot[b]||0)-(tot[a]||0); }), lead=sum>0?order[0]:null;
  const pw=prev.slice().sort(function(a,b){ return b.tp-a.tp; })[0], myU=LB.me&&LB.me.unit||(lbOn()&&ACC.prof.unit)||null;
  let h='<p class="lbinfo">Görevlerde kazandığın her TP birliğinin bu haftaki toplamına eklenir. Hafta bitince kazanan birlikte o hafta TP kazanan herkese <b>'+LB_ODUL+' TP</b> ödül.</p>';
  h+='<div class="lbbars">'+order.map(function(u){ const v=tot[u]||0, p=sum>0?Math.round(v/sum*100):0;
    return '<div class="lbbar'+(u===myU?' me':'')+'"><div class="lbbh"><b>'+(u===lead?'👑 ':'')+lbEsc(lbUnit(u))+'</b><span>'+lbTp(v)+' · '+(cnt[u]||0)+' pilot</span></div><div class="lbbt"><i style="width:'+p+'%;background:'+LB_RENK[u]+'"></i></div></div>'; }).join('')+'</div>';
  h+='<p class="mgn">Hafta Pazartesi 00:00\'da (Türkiye saati) biter: '+lbLeft()+' kaldı.'+(pw&&pw.tp>0?' Geçen haftanın kazananı: <b>'+lbEsc(lbUnit(pw.unit))+'</b> ('+lbTp(pw.tp)+').':'')+'</p>';
  if(lbOn()) h+='<p class="lbme">Birliğin: <b style="color:'+(LB_RENK[myU]||'#fff')+'">'+lbEsc(lbUnit(myU))+'</b>'+(LB.me?' · bu hafta katkın '+lbTp(LB.me.hafta_tp):'')+'. Birliğini Profil\'den değiştirebilirsin; bu haftanın puanı ilk birliğinde kalır.</p>';
  return h; }
function lbRender(){ const el=$('lbBody'); if(!el) return; const tab=LB.tab;
  let h='<div class="seg sm lbtabs">'+LB_TABS.map(function(t){ return '<button type="button" data-lbt="'+t[0]+'" aria-pressed="'+(t[0]===tab)+'">'+t[1]+'</button>'; }).join('')+'</div>';
  if(tab==='yaris'){ if(!LB.race&&typeof RACES!=='undefined'&&RACES.length) LB.race=RACES[0].id;
    h+='<div class="seg sm wrap lbraces">'+(typeof RACES!=='undefined'?RACES:[]).map(function(R){ return '<button type="button" data-lbr="'+R.id+'" aria-pressed="'+(R.id===LB.race)+'">'+lbEsc(R.n)+'</button>'; }).join('')+'</div>'; }
  if(typeof ACC==='undefined'||!ACC.sb) h+='<p class="lbempty">Sıralama için internet bağlantısı gerekiyor.</p>';
  else if(LB.err) h+='<p class="lbempty">Sıralama yüklenemedi: '+lbEsc(LB.err)+'</p>';
  else { const k=tab==='yaris'?'yaris:'+LB.race:tab, D=LB.data[k];
    if(D===undefined) h+='<p class="lbempty">Yükleniyor…</p>';
    else if(tab==='birlik') h+=lbBirlik(D);
    else if(tab==='filo') h+='<p class="mgn">Filoların bu haftaki toplam TP\'si · '+lbLeft()+' kaldı</p>'+(D.length?'<ol class="lbl">'+D.map(function(f){ const mine=typeof FL!=='undefined'&&FL.me&&FL.me.filo_id===f.id; return '<li class="'+(mine?'me':'')+'"><span class="lbs">'+f.sira+'</span><span class="lbe">'+lbEmb(f.amblem)+'</span><span class="lbn"><b><span class="fltag">'+lbEsc(f.etiket)+'</span>'+lbEsc(f.ad)+'</b><small>'+f.uye+' pilot</small></span><span class="lbv">'+lbTp(f.tp)+'</span></li>'; }).join('')+'</ol>':'<p class="lbempty">Henüz filo yok. Kariyer → Filo\'dan kurabilirsin.</p>');
    else { if(tab==='hafta') h+='<p class="mgn">Pazartesiden beri kazanılan TP · '+lbLeft()+' kaldı</p>';
      h+=lbRows(D,tab==='yaris'?function(r){ return typeof fmtT==='function'?fmtT(r.ms/1000):(r.ms/1000).toFixed(1)+' sn'; }:function(r){ return lbTp(r.tp); }); } }
  h+=lbMeLine(); el.innerHTML=h; }
function lbOpen(tab){ if(tab) LB.tab=tab; let el=$('lbUI'); if(!el&&document.createElement){ el=document.createElement('div'); el.id='lbUI'; el.className='modal hidden';
    el.innerHTML='<div class="card wide relcard lbcard"><button class="xbtn" type="button" id="lbX" aria-label="Kapat">✕</button><h2>Sıralama</h2><div class="relbody lbbody" id="lbBody"></div></div>';
    document.body.appendChild(el); MODALS.push('lbUI');
    el.querySelector('#lbX').addEventListener('click',function(){ el.classList.add('hidden'); });
    el.querySelector('#lbBody').addEventListener('click',function(e){ const t=e.target.closest('button[data-lbt]'); if(t){ LB.tab=t.dataset.lbt; lbRender(); lbLoad(); return; }
      const r=e.target.closest('button[data-lbr]'); if(r){ LB.race=r.dataset.lbr; lbRender(); lbLoad(); } }); }
  if(!el) return; lbRender(); el.classList.remove('hidden'); return lbLoad(); }
/* ---- the unit race reward: checked once per session, in the menu */
function lbZafer(){ if(LB.zafer||!lbOn()) return Promise.resolve(false); LB.zafer=true; const prev=lbWeekId(lbWeekStart()-864e5), key=ACC.user.id+':'+prev;
  if(stGet('ayy-lb-zafer')===key) return Promise.resolve(false);
  return Promise.all([lbRpc('lb_birlik',{h:prev}), Promise.resolve(ACC.sb.from('lb_hafta').select('tp,unit').eq('user_id',ACC.user.id).eq('hafta',prev).maybeSingle()).then(function(r){ return r&&r.data; })])
    .then(function(a){ const L=(a[0]||[]).slice().sort(function(x,y){ return y.tp-x.tp; }), w=L[0], mine=a[1];
      if(!w||!(w.tp>0)||(L[1]&&L[1].tp===w.tp)) return false;   /* no winner on a tie */
      if(!mine||!(mine.tp>0)||mine.unit!==w.unit) return false;
      stSet('ayy-lb-zafer',key); careerAdd(LB_ODUL,null,'Birlik zaferi'); toast('🏆 Geçen hafta '+lbUnit(w.unit)+' kazandı! Birlik zaferi: +'+LB_ODUL+' TP','#ffd27a'); return true; })
    .catch(function(e){ LB.zafer=false; console.warn('[AyYildiz] birlik ödülü denetlenemedi',e&&e.message||e); return false; }); }
accAfterLogin=HOOK.wrap('accAfterLogin','ag/siralama#lbLogin',function(next){ return function(){ const p=next.apply(this,arguments);
  Promise.resolve(p).then(function(ok){ if(!ok) return; LB.me=null; setTimeout(function(){ lbFlush(); },3000);
    const w=setInterval(function(){ if(!lbOn()){ clearInterval(w); return; } if(state!=='menu'||anyModalOpen()) return; clearInterval(w); lbZafer(); },4000); }); return p; }; },accAfterLogin);
/* ---- Kariyer → Sıralama */
NAV_IC.trophy='<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 20h8M9 17h6"/>';
NAV_D.c_rank=['KARİYER','Sıralama','Bu haftanın ve tüm zamanların en çok TP kazanan pilotları, yarış rekorları ve birlik yarışı: Hilal Kanatlar, Mavi Kanatlar, Bozkurtlar. Hafta Pazartesi başlar.',[],'Sıralamayı aç'];
navRender=HOOK.wrap('navRender','ag/siralama#_lbNav',function(next){ return function(){ next(); if(NAV.level!=='career') return; const el=$('cNav'); if(!el) return; const h=el.innerHTML;
  if(h.indexOf('data-act="c_rank"')>=0) return; const k=h.indexOf('data-act="back"'); if(k<0) return; const j=h.lastIndexOf('<button',k);
  const sub=LB.me&&LB.me.hafta_sira?'Bu hafta '+LB.me.hafta_sira+'. · birlik yarışı':'Haftalık · tüm zamanlar · birlik yarışı';
  el.innerHTML=h.slice(0,j)+navBtn('c_rank','Sıralama',sub,'trophy')+h.slice(j); tFocus=Math.min(tFocus,Math.max(0,titleItems().length-1)); titleFocus(tFocus); }; },navRender);
titleAct=HOOK.wrap('titleAct','ag/siralama#_lbAct',function(next){ return function(act){ if(act==='c_rank'&&state==='menu') return lbOpen(); return next.apply(this,arguments); }; },titleAct);
