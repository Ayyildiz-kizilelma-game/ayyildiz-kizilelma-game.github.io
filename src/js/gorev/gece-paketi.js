/* ------------------------------------------------------------------ Gece Görev Paketi (V2.71): a mission pack for sale
   Five night missions on the dynamic-mission engine (DYN), each at night with night vision (NVG) switched on at the
   start; the player can cycle to thermal with ` or the 👁 button. The first mission is free to try; the rest need the
   'gece' product from the store (Google Play purchase comes in V2.74; until then an admin can grant it to test).
   Content, not power: the pack gives missions, stars, a first-completion TP bonus like Harekât and the "Gece Kartalı"
   medal. Night and NVG are only for the pack mission: the player's own time of day and view come back afterwards.
   Kariyer → Gece Görev Paketi; Hızlı Oyun → Gece Görev Paketi (no TP there, stars still saved). */
const GP={run:null, sel:0, keep:null, pending:false, prod:'gece'};
const GP_CH=[
  {id:'g1',n:'Karanlık Devriye',sub:'Gece keşfi · ücretsiz',ac:['tb2','aksungur','anka','tb3','akinci','anka3'],bonusTP:150,free:true,
    story:'Gece yarısı Kızıl Bölge\'de araç hareketi görüldü. İHA ile ışıksız uç; gece görüşle üç noktayı tara ve görüntüleri karargâha aktar.',
    pre:[{w:'karargah',t:'{cs}, ay batmak üzere. Gece görüş açık, ışıkların kapalı.'},{w:'karargah',t:'Santral, radar ve zirve. Her birinin üstünde dur, sensörler gerisini halleder.'}],
    post:{w:'karargah',t:'Görüntüler net {cs}. Radarın arkasında yeni bir mevzi kurmuşlar.'},
    D:function(){ return {tp:'uav',name:'Karanlık Devriye',desc:'Üç noktayı gece İHA ile tara.',diff:1,lim:900,xp:240,uav:true,
      obj:[{t:'scan',x:3700,z:-1100,r:600,sec:6,n:'Tara: Rüzgâr santrali'},{t:'scan',x:5360,z:-2680,r:600,sec:6,n:'Tara: Radar istasyonu'},{t:'scan',x:6700,z:-5050,r:650,sec:6,n:'Tara: Kayak zirvesi'}],
      bonus:{t:'fuel',n:'Bonus: yakıtın %50 üstünde bitir'},thr:['Karanlık, dağ rüzgârı'],area:[5000,-3000,6000],load:'rec'}; }},
  {id:'g2',n:'Gece Avcısı',sub:'Gece önleme',ac:['hurjet','kaan','kizilelma','hurkus','akinci','tb3'],bonusTP:250,
    story:'Kamikaze İHA\'lar karanlıktan yararlanıp üsse sızmaya çalışıyor. Altı iz, alçakta. Gece görüşle bul, hepsini düşür.',
    pre:[{w:'awacs',t:'{cs}, Kartal Gözü. Altı küçük iz, ışıksız, alçakta.'},{w:'karargah',t:'Termal kamera motor sıcaklığını gösterir {cs}. Hiçbiri üsse ulaşmasın.'}],
    post:{w:'awacs',t:'Gökyüzü temiz. Gece avı sana yaraşıyor {cs}.'},
    D:function(){ return {tp:'intercept',name:'Gece Avcısı',desc:'Gece sızan İHA sürüsünü önle.',diff:2,lim:540,xp:300,obj:[{t:'intercept',n:'Düşman İHA\'larını düşür',count:6}],
      bonus:{t:'nodamage',n:'Bonus: hasar alma (%80 üstü can)'},thr:['Karanlıkta, alçak uçan İHA\'lar'],area:[-4500,4500,9000],load:'aa'}; }},
  {id:'g3',n:'Ay Işığında Taarruz',sub:'Gece hava desteği',ac:['hurjet','tb2','tb3','akinci','anka','aksungur','hurkus','kaan','anka3','kizilelma'],bonusTP:300,
    story:'Düşman, radarın arkasındaki yeni mevziye gece ikmal yapıyor. Araçlar farlarını kapatmış. Termal kamerayla bul, uçaksavarına dikkat ederek hepsini vur.',
    pre:[{w:'karargah',t:'{cs}, mevzi radarın doğusunda. Araçlar ışıksız ama motorları sıcak.'},{w:'karargah',t:'Termal görüşe geç: sıcak olan her şey hedef.'}],
    post:{w:'karargah',t:'İkmal kesildi. Sabaha kadar toparlanamazlar {cs}.'},
    D:function(){ return {tp:'cas',name:'Ay Işığında Taarruz',desc:'Gece ikmal konvoyunu ve mevziyi vur.',diff:3,lim:600,xp:330,pos:[4600,-2000],ev:'sam',
      obj:[{t:'killset',set:'cas',n:'Mevzideki araçları imha et'}],bonus:{t:'fast',n:'Bonus: 4 dakikada bitir',sec:240},thr:['Düşman uçaksavarı','Görev ortasında yeni SAM'],area:[4600,-2000,2500],load:'ag'}; }},
  {id:'g4',n:'Sessiz Liman',sub:'Gece deniz devriyesi',ac:['tb2','aksungur','anka','hurkus','hurjet','tb3','akinci','anka3','kaan','kizilelma'],bonusTP:250,
    story:'Işıklarını kapatmış gemiler gece kıyıya yanaşmaya çalışıyor. İki devriye noktasından geç, ardından üç gemiyi alçaktan geçerek tanımla.',
    pre:[{w:'awacs',t:'{cs}, Kartal Gözü. Batıda ışıksız üç iz, deniz dalgalı.'},{w:'karargah',t:'600 metrenin altından tanımla, ateş açma. Gece görüşle güverteyi seçebilirsin.'}],
    post:{w:'karargah',t:'Üç gemi de tanımlandı. Sahil Güvenlik yolda {cs}.'},
    D:function(){ return {tp:'sea',name:'Sessiz Liman',desc:'Gece deniz devriyesi ve gemi tanımlama.',diff:2,lim:840,xp:280,ev:'weather',
      obj:[{t:'wp',x:-10500,z:2800,r:900,n:'Deniz devriye noktası: Rüzgâr santrali açığı'},{t:'wp',x:-6000,z:2600,r:900,n:'Deniz devriye noktası: Petrol platformu'},{t:'ship',n:'Üç gemiyi 600 m altında yakından tanımla',count:3}],
      bonus:null,thr:['Karanlık açık deniz','Hava bozabilir'],area:[-8000,2500,8000]}; }},
  {id:'g5',n:'Şafak Öncesi',sub:'Gece refakati',ac:['hurjet','kaan','kizilelma','hurkus','akinci','tb3'],bonusTP:400,
    story:'Şafaktan önce ileri mevziye bir nakliye uçağı gidecek. Düşman avcıları gece görüşle bekliyor. Nakliyeye kadar eşlik et; onu kaybetme.',
    pre:[{w:'kule',t:'{cs}, nakliye ışıksız kalkıyor. Yanından ayrılma.'},{w:'awacs',t:'Kızıl Bölge\'den avcılar havalandı. Karanlıkta füze izlerine dikkat.'}],
    post:{w:'karargah',t:'Nakliye indi, güneş doğuyor. Gece Kartalı unvanı senin {cs}.'},
    D:function(){ return {tp:'escort',name:'Şafak Öncesi',desc:'Nakliye uçağını gece boyunca koru.',diff:3,lim:600,xp:360,route:[[0,0],[-1450,6300],[-3000,12000]],
      obj:[{t:'escort',n:'Nakliye uçağını hedefe kadar koru'}],bonus:{t:'kills',n:'Bonus: 2 düşman avcısı düşür',k:2},thr:['Düşman avcıları (füze)','Karanlık'],area:[-1500,6000,9000],load:'aa'}; }}];
GP_CH.forEach(function(c,i){ c.ix=i; });
STORE.push({id:'gece', ad:'Gece Görev Paketi', tur:'Görev paketi', ne:'Beş gece görevi: gece görüş (NVG) ve termal kamerayla keşif, İHA avı, taarruz, deniz devriyesi ve refakat. İlk görev ücretsiz denenir. Tamamlayana Gece Kartalı madalyası.'});
/* ---- ownership and progress */
function gpOwns(){ return typeof entOwns==='function'&&entOwns(GP.prod); }
function gpOpenIx(i){ const c=GP_CH[i]; return !!c&&(c.free||gpOwns()); }
function gpProg(){ const st=accProfile().stats||{}; return Object.assign({},st.gece||{}); }
function gpDoneN(){ const P=gpProg(); return GP_CH.filter(function(c){ return P[c.id]>0; }).length; }
function gpSave(id,stars){ const P=gpProg(), first=!P[id]; if(stars>(P[id]||0)) P[id]=stars; const p=accProfile(); accSetProfile({stats:Object.assign({},p.stats,{gece:P})}); return first; }
/* ---- night for the pack mission only */
function gpNight(){ if(!GP.keep) GP.keep={tod:SETTINGS.tod||'day', vis:WX.vis||'off'}; SETTINGS.tod='night'; todReset(); WX.vis='nvg'; try{ visApply(); }catch(e){} }
function gpRestore(){ if(!GP.keep) return; SETTINGS.tod=GP.keep.tod; WX.vis=GP.keep.vis; GP.keep=null; try{ todReset(); visApply(); }catch(e){} }
/* ---- start */
function gpStart(i){ const ch=GP_CH[i]; if(!ch) return;
  if(!gpOpenIx(i)){ toast('🌙 Bu görev Gece Görev Paketi\'nde','#ffc24a'); gpClose(); if(typeof magOpen==='function') magOpen(GP.prod); return; }
  let ac=campAc(ch); if(!ac){ const need=ch.ac.map(function(id){ return LIC2[licFor(id)]; }).filter(Boolean)[0]; toast('🔒 Bu görev için '+(need?need.n:'uygun bir uçak')+' gerekli','#ffc24a'); return; }
  gpClose(); if(typeof CAMP!=='undefined') CAMP.run=null; GP.run=ch;
  if(ac!==selectedId){ selectedId=ac; setAircraft(ac); toast('Bu görev için '+AIRCRAFT[ac].short+' seçildi','#b8ecff'); }
  const D=ch.D(); Object.assign(D,{id:'gece_'+ch.id,kind:'dyn',sub:'air',cat:'dinamik',dur:Math.round(D.lim/60),name:'Gece '+(i+1)+': '+D.name}); ch._D=D;
  DYN.cur=D; MISSIONS.dyn.name=D.name; MISSIONS.dyn.desc=D.desc; MISSIONS.dyn.limit=D.lim; BMETA.dyn={xp:D.xp,dur:D.dur}; selectMission('dyn'); preFlight('missions');
  ch.pre.forEach(function(l,k){ setTimeout(function(){ if(GP.run===ch) radioSay(l,null,{force:true}); },1500+k*200); }); }
function gpHit(){ const ch=GP.run; return !!(ch&&ch._D&&missionId==='dyn'&&DYN.cur===ch._D); }
setupMission=HOOK.wrap('setupMission','gorev/gece-paketi#gpSetup',function(next){ return function(){ const hit=gpHit(); if(!hit){ GP.run=null; gpRestore(); } const r=next.apply(this,arguments);
  if(hit){ gpNight(); setTimeout(function(){ if(gpHit()) toast('🌙 Gece görüş açık · termal için '+(typeof TOUCH!=='undefined'&&TOUCH.vis?'👁 düğmesi':'` tuşu'),'#b8ecff'); },2500); }
  return r; }; },setupMission);
function gpDone(ch,ok,stars){ if(!ok){ toast('Görev başarısız — tekrar dene','#ff8a5a'); return; }
  const first=gpSave(ch.id,Math.max(1,stars)); setTimeout(function(){ radioSay(ch.post,null,{force:true}); },2600);
  if(first&&PLAY.mode==='career') try{ careerAdd(ch.bonusTP,null,'Gece paketi: '+ch.n); }catch(e){}
  const all=gpDoneN()===GP_CH.length; toast(all&&first?'🌙 GECE GÖREV PAKETİ TAMAMLANDI · Gece Kartalı madalyası':'🌙 Gece görevi tamamlandı: '+ch.n,'#ffd27a');
  if(all) try{ const p=accProfile(), st=p.stats||{}, m=(st.medals||[]).slice(); if(m.indexOf('gecekartali')<0){ m.push('gecekartali'); accSetProfile({stats:Object.assign({},st,{medals:m})}); } }catch(e){}
  GP.pending=true; GP.sel=Math.min(GP_CH.length-1,ch.ix+(all?0:1)); }
endMission=HOOK.wrap('endMission','gorev/gece-paketi#gpEnd',function(next){ return function(ok,tm){ const ch=GP.run; let hit=false, st=0;
  if(ch&&M&&!M.done&&gpHit()){ hit=true; try{ st=bStarsFor(ok); }catch(e){ st=1; } }
  const r=next.apply(this,arguments); if(hit) gpDone(ch,ok,st); return r; }; },endMission);
misGo=HOOK.wrap('misGo','gorev/gece-paketi#gpMisGo',function(next){ return function(){ GP.run=null; gpRestore(); return next.apply(this,arguments); }; },misGo);
quickPlay=HOOK.wrap('quickPlay','gorev/gece-paketi#gpQuick',function(next){ return function(){ GP.run=null; gpRestore(); return next.apply(this,arguments); }; },quickPlay);
/* back on the title screen: night ends; after a mission the pack opens with the next one selected */
refreshTitle=HOOK.wrap('refreshTitle','gorev/gece-paketi#gpTitle',function(next){ return function(){ const r=next.apply(this,arguments);
  if(state==='menu'){ gpRestore(); if(GP.pending){ GP.pending=false; setTimeout(function(){ if(state==='menu'&&!anyModalOpen()) gpOpen(GP.sel); },450); } } return r; }; },refreshTitle);
if(typeof MEDALS!=='undefined'&&!MEDALS.some(function(m){ return m[0]==='gecekartali'; })) MEDALS.push(['gecekartali','Gece Kartalı','Gece Görev Paketi\'nin beş görevini tamamla',function(st){ return !!(st&&st.gece&&GP_CH.every(function(c){ return st.gece[c.id]>0; })); }]);
/* ---- screen (same layout as Harekât) */
function gpOpen(i){ let el=$('gpUI'); if(!el&&document.createElement){ el=document.createElement('div'); el.id='gpUI'; el.className='modal fs hidden campui gpui';
    el.innerHTML='<button class="btn back" id="btnGpX" type="button">← Geri</button><div class="campwrap"><header class="camphd"><p class="k">GÖREV PAKETİ</p><h2>GECE</h2><p class="csum" id="gpSum"></p><div class="cbar"><i id="gpBar"></i></div></header><div class="campgrid"><nav class="camplist" id="gpList"></nav><section class="campdet" id="gpDet"></section></div></div>';
    document.body.appendChild(el); MODALS.push('gpUI');
    el.querySelector('#gpList').addEventListener('click',function(e){ const b=e.target.closest('button[data-i]'); if(!b) return; GP.sel=+b.dataset.i; gpRender(); });
    el.querySelector('#gpDet').addEventListener('click',function(e){ if(e.target.closest('#gpGo')) gpStart(GP.sel); else if(e.target.closest('#gpBuy')){ gpClose(); if(typeof magOpen==='function') magOpen(GP.prod); } });
    el.querySelector('#btnGpX').addEventListener('click',function(){ gpClose(); if(state==='menu') refreshTitle(); }); }
  if(!el) return; closeModals(); if(i==null){ i=GP_CH.findIndex(function(c,k){ return gpOpenIx(k)&&!gpProg()[c.id]; }); if(i<0) i=0; } GP.sel=i; gpRender(); el.classList.remove('hidden'); }
function gpClose(){ const el=$('gpUI'); if(el) el.classList.add('hidden'); }
function gpRender(){ if(!$('gpList')) return; const P=gpProg(), n=gpDoneN(), own=gpOwns();
  $('gpSum').textContent=n+' / '+GP_CH.length+' görev · '+GP_CH.reduce(function(a,c){ return a+(P[c.id]||0); },0)+' / '+GP_CH.length*3+' ★'+(own?'':' · ilk görev ücretsiz');
  $('gpBar').style.width=Math.round(n/GP_CH.length*100)+'%';
  $('gpList').innerHTML=GP_CH.map(function(c,i){ const open=gpOpenIx(i), s=P[c.id]||0;
    return '<button type="button" class="cch'+(i===GP.sel?' on':'')+(open?'':' lock')+(s?' done':'')+'" data-i="'+i+'"><span class="cn">'+(open?(s?'✓':i+1):'🌙')+'</span><span class="ct"><b>'+c.n+'</b><small>'+c.sub+'</small></span>'+(s?starsHTML(s):'')+'</button>'; }).join('');
  const c=GP_CH[GP.sel], open=gpOpenIx(GP.sel), s=P[c.id]||0; let objs=[]; try{ objs=c.D().obj.map(function(o){ return o.n; }); }catch(e){}
  const veh=c.ac.slice(0,4).map(function(id){ return AIRCRAFT[id].short; }).join(' · ');
  $('gpDet').innerHTML='<p class="k">GECE '+(GP.sel+1)+' · '+c.sub.toLocaleUpperCase('tr-TR')+'</p><h3>'+c.n+'</h3>'+(s?'<div class="cst">'+starsHTML(s)+'</div>':'')+
    '<p class="cstory">'+c.story+'</p><div class="cobj"><b>Görevler</b><ul>'+objs.map(function(o){ return '<li>'+o+'</li>'; }).join('')+'</ul></div>'+
    '<p class="cveh"><b>Araç:</b> '+veh+' · <b>Saat:</b> gece, gece görüş açık</p><p class="crw">'+(PLAY.mode==='career'?'Ödül: görev TP\'si + ilk tamamlamada '+c.bonusTP+' TP':'Hızlı oyunda TP kazanılmaz; yıldızlar yine kaydedilir')+'</p>'+
    (open?'<button type="button" class="btn primary wide" id="gpGo">'+(s?'▶ Görevi tekrar oyna':'▶ Görevi başlat')+'</button>':'<div class="gpbuy"><p>🌙 Bu görev <b>Gece Görev Paketi</b>\'nde: beş gece görevi ve Gece Kartalı madalyası.</p><button type="button" class="btn primary wide" id="gpBuy">Mağazada gör</button></div>')+
    (n===GP_CH.length?'<p class="cfin">🌙 Paket tamamlandı — Gece Kartalı madalyası senin.</p>':''); }
/* ---- menu entries: Kariyer and Hızlı Oyun */
NAV_IC.gece='<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>';
NAV_D.c_gece=['KARİYER','Gece Görev Paketi','Beş gece görevi: gece görüş ve termal kamerayla keşif, İHA avı, taarruz, deniz devriyesi ve refakat. İlk görev ücretsiz; diğerleri paketle açılır. İlk tamamlamada TP bonusu, hepsinde Gece Kartalı madalyası.',[],'Paketi aç'];
NAV_D.q_gece=['HIZLI OYUN','Gece Görev Paketi','Beş gece görevi, gece görüş açık. İlk görev ücretsiz. Hızlı oyunda TP kazanılmaz, yıldızlar kaydedilir.',[],'Paketi aç'];
navRender=HOOK.wrap('navRender','gorev/gece-paketi#_gpNav',function(next){ return function(){ next(); const el=$('cNav'); if(!el) return; const h=el.innerHTML;
  let act=null, before=null; if(NAV.level==='career'){ act='c_gece'; before='data-act="c_missions"'; } else if(NAV.level==='start'){ act='q_gece'; before='data-act="back"'; } else return;
  if(h.indexOf('data-act="'+act+'"')>=0) return; const k=h.indexOf(before); if(k<0) return; const j=h.lastIndexOf('<button',k);
  const sub=gpDoneN()+' / '+GP_CH.length+' görev · '+(gpOwns()?'gece görüş':'ilk görev ücretsiz');
  el.innerHTML=h.slice(0,j)+navBtn(act,'Gece Görev Paketi',sub,'gece')+h.slice(j); tFocus=Math.min(tFocus,Math.max(0,titleItems().length-1)); titleFocus(tFocus); }; },navRender);
titleAct=HOOK.wrap('titleAct','gorev/gece-paketi#_gpAct',function(next){ return function(act){ if(state==='menu'&&(act==='c_gece'||act==='q_gece')){ playMode(act==='c_gece'?'career':'quick'); return gpOpen(); } return next.apply(this,arguments); }; },titleAct);
