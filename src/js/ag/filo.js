/* ------------------------------------------------------------------ fleets: player groups (V2.70)
   Kariyer → Filo (supabase/filo.sql). A pilot is in at most one fleet of up to 30; roles komutan, yardımcı, pilot.
   • Without a fleet: the fleet list (this week's TP, search), join an open fleet at once or apply to a closed one (at
     most 3 applications), or found one from Teğmen rank up (name 3–24, tag 2–4 letters, emblem, description).
   • In a fleet: the notice, this week's fleet total and goal (10 000 / 25 000 / 50 000 TP), members with their TP for
     the fleet this week; komutan and yardımcı accept applications and edit the fleet, the komutan sets roles and hands
     over command. When the komutan leaves, the longest-serving yardımcı (or pilot) takes over; the last one closes it.
   • Weekly reward: when last week's fleet total reached a goal, every member who earned TP for it gets 50 / 100 / 200 TP.
   • The fleet tag shows next to call signs in Sıralama, which also gets a "Filolar" tab. Admins can delete a fleet.
   The server checks every rule; the screen only offers what the role allows. */
const FL={me:null, fleet:null, members:null, reqs:null, apps:[], list:null, q:'', view:null, err:null, busy:false, form:null, odul:false, sure:null};
const FL_HEDEF=[[10000,50],[25000,100],[50000,200]], FL_MAX=30, FL_RUTBE=6;
const FL_ROL={komutan:'Komutan', yardimci:'Yardımcı', pilot:'Pilot'};
/* a short list of words fleet names and texts may not contain (the server limits characters and lengths) */
const FL_YASAK=['amk','aq','orospu','oç','piç','yarrak','yarak','sikik','siktir','sikerim','götveren','ibne','pezevenk','kahpe','fuck','shit','bitch'];
function flTemiz(t){ const w=String(t||'').toLocaleLowerCase('tr-TR').split(/[^0-9a-zçğıöşü]+/); return !w.some(function(x){ return x&&FL_YASAK.indexOf(x)>=0; }); }
function flOn(){ return typeof lbOn==='function'&&lbOn(); }
function flUid(){ return ACC.user&&ACC.user.id; }
function flErr(e){ const m=e&&(e.message||e.msg)||String(e||''); return m.replace(/^.*?:\s*/,'')||'bir sorun oluştu'; }
function flQ(p){ return Promise.resolve(p).then(function(r){ if(r&&r.error) throw r.error; return r?r.data:null; }); }
function flRpc(fn,a){ return flQ(ACC.sb.rpc(fn,a||{})); }
/* ---- loading */
function flLoad(){ if(!flOn()){ FL.me=null; FL.fleet=null; flRender(); return Promise.resolve(); } const uid=flUid(); FL.err=null;
  return Promise.all([flQ(ACC.sb.from('filo_uyeler').select('filo_id,rol').eq('user_id',uid).maybeSingle()), flQ(ACC.sb.from('filo_basvuru').select('filo_id').eq('user_id',uid))])
    .then(function(a){ FL.me=a[0]||null; FL.apps=(a[1]||[]).map(function(x){ return x.filo_id; });
      if(FL.me){ FL.view=FL.me.filo_id; return flLoadFleet(FL.me.filo_id); } FL.fleet=null; FL.members=null; FL.reqs=null; return flLoadList(); })
    .then(function(){ flRender(); }).catch(function(e){ FL.err=flErr(e); flRender(); }); }
function flLoadFleet(id){ const mine=FL.me&&FL.me.filo_id===id, off=mine&&FL.me.rol!=='pilot';
  return Promise.all([flQ(ACC.sb.from('filolar').select('*').eq('id',id).maybeSingle()), flRpc('filo_uyeleri',{f:id}), off?flRpc('filo_basvurular'):null])
    .then(function(a){ FL.fleet=a[0]; FL.members=a[1]||[]; FL.reqs=a[2]||[]; if(!FL.fleet&&mine){ FL.me=null; } }); }
function flLoadList(){ return flRpc('filo_liste',{q:FL.q||null,lim:30,h:null}).then(function(L){ FL.list=L||[]; }); }
function flWeekTotal(){ return (FL.members||[]).reduce(function(s,m){ return s+(+m.tp||0); },0); }
/* ---- rendering */
function flEmb(e){ return typeof lbEmb==='function'?lbEmb(e):'☾'; }
function flTag(t){ return t?'<span class="fltag">'+lbEsc(t)+'</span>':''; }
function flGoal(tot){ let h='<div class="flgoal">'; FL_HEDEF.forEach(function(g){ const p=Math.min(100,Math.round(tot/g[0]*100));
    h+='<div class="'+(tot>=g[0]?'on':'')+'"><div class="lbbt"><i style="width:'+p+'%;background:'+(tot>=g[0]?'#7dffb0':'#ffd27a')+'"></i></div><small>'+(g[0]/1000)+' bin TP → +'+g[1]+' TP</small></div>'; });
  return h+'</div>'; }
function flRenderList(){ const rk=accProfile().rank||rankOf(accProfile().xp||0); let h='<p class="mgn">Filo, birlikte uçan ve haftalık hedefe birlikte çalışan en çok '+FL_MAX+' pilotluk gruptur. Filoda kazandığın TP filonun haftalık toplamına da yazılır; hedefe ulaşan filonun bütün katkı verenleri ödül alır.</p>';
  h+='<div class="flsearch"><input id="flQ" type="search" maxlength="24" placeholder="Filo ara (ad ya da etiket)" value="'+lbEsc(FL.q)+'"><button class="btn" type="button" data-fl="ara">Ara</button>'+
    (rk>=FL_RUTBE?'<button class="btn primary" type="button" data-fl="kurform">＋ Filo kur</button>':'<span class="mgn">Filo kurmak: '+RANKS[FL_RUTBE][0]+' rütbesinde</span>')+'</div>';
  if(FL.form) h+=flRenderForm();
  const L=FL.list; if(!L) h+='<p class="lbempty">Yükleniyor…</p>'; else if(!L.length) h+='<p class="lbempty">'+(FL.q?'Bu adla filo yok.':'Henüz filo yok. İlk filoyu sen kur!')+'</p>';
  else h+='<ol class="lbl fllist">'+L.map(function(f){ const ap=FL.apps.indexOf(f.id)>=0, full=f.uye>=FL_MAX;
    const b=ap?'<button class="btn sm" type="button" data-fl="geri" data-id="'+f.id+'">Başvuruldu ✓ · geri al</button>':full?'<span class="mgn">Dolu</span>':'<button class="btn sm'+(f.acik?' primary':'')+'" type="button" data-fl="katil" data-id="'+f.id+'">'+(f.acik?'Katıl':'Başvur')+'</button>';
    return '<li><span class="lbs">'+f.sira+'</span><span class="lbe">'+flEmb(f.amblem)+'</span><span class="lbn" data-fl="bak" data-id="'+f.id+'"><b>'+flTag(f.etiket)+lbEsc(f.ad)+'</b><small>'+f.uye+' / '+FL_MAX+' pilot · '+(f.acik?'açık':'başvuruyla')+(f.aciklama?' · '+lbEsc(f.aciklama):'')+'</small></span><span class="lbv">'+lbTp(f.tp)+'</span>'+b+'</li>'; }).join('')+'</ol>';
  return h; }
function flEmbOpts(sel){ return (typeof EMBLEMS!=='undefined'?EMBLEMS:[]).filter(function(e){ return !e[2]||(typeof szOwns==='function'&&szOwns(e[0])); }).map(function(e){ return '<option value="'+e[0]+'"'+(e[0]===sel?' selected':'')+'>'+e[1]+'</option>'; }).join(''); }
function flRenderForm(){ const F=FL.form;
  return '<div class="flform"><label>Filo adı<input id="flAd" maxlength="24" value="'+lbEsc(F.ad||'')+'" placeholder="Hilal Kartalları"></label><label>Etiket<input id="flEt" maxlength="4" value="'+lbEsc(F.et||'')+'" placeholder="HK"></label>'+
    '<label>Arma<select id="flAm">'+flEmbOpts(F.am||accProfile().emblem)+'</select></label><label class="w">Açıklama<input id="flAc" maxlength="200" value="'+lbEsc(F.ac||'')+'" placeholder="Akşamları birlikte uçuyoruz"></label>'+
    '<label class="chk"><input id="flAcik" type="checkbox"'+(F.acik!==false?' checked':'')+'> Herkes doğrudan katılabilir (kapalıysa başvuruyla)</label>'+
    '<div class="stack"><button class="btn primary" type="button" data-fl="kur">Filoyu kur</button><button class="btn" type="button" data-fl="vazgec">Vazgeç</button></div></div>'; }
function flRenderFleet(){ const F=FL.fleet, M=FL.members||[], uid=flUid(), mine=FL.me&&FL.me.filo_id===F.id, rol=mine?FL.me.rol:null, off=rol==='komutan'||rol==='yardimci', tot=flWeekTotal();
  let h='<div class="flhead"><span class="flem">'+flEmb(F.amblem)+'</span><div><h3>'+flTag(F.etiket)+lbEsc(F.ad)+'</h3><p class="mgn">'+M.length+' / '+FL_MAX+' pilot · '+(F.acik?'herkese açık':'başvuruyla')+(mine?' · rolün: '+FL_ROL[rol]:'')+'</p></div>'+
    (!mine&&!FL.me?(FL.apps.indexOf(F.id)>=0?'<button class="btn" type="button" data-fl="geri" data-id="'+F.id+'">Başvuruyu geri al</button>':M.length<FL_MAX?'<button class="btn primary" type="button" data-fl="katil" data-id="'+F.id+'">'+(F.acik?'Katıl':'Başvur')+'</button>':''):'')+'</div>';
  if(F.aciklama) h+='<p class="flac">'+lbEsc(F.aciklama)+'</p>';
  if(F.duyuru) h+='<p class="fldu">📣 '+lbEsc(F.duyuru)+'</p>';
  h+='<p class="szh">BU HAFTA · '+lbTp(tot)+' · '+(typeof lbLeft==='function'?lbLeft()+' kaldı':'')+'</p>'+flGoal(tot);
  if(off&&FL.reqs&&FL.reqs.length) h+='<p class="szh">BAŞVURULAR</p><ol class="lbl">'+FL.reqs.map(function(r){ return '<li><span class="lbe">'+flEmb(r.emblem)+'</span><span class="lbn"><b>'+lbEsc(r.callsign||'Pilot')+'</b><small>'+lbEsc(RANKS[r.rank||0]?RANKS[r.rank||0][0]:'')+' · '+lbEsc(lbUnit(r.unit))+'</small></span>'+
    '<button class="btn sm primary" type="button" data-fl="kabul" data-id="'+r.user_id+'">Kabul</button><button class="btn sm" type="button" data-fl="red" data-id="'+r.user_id+'">Red</button></li>'; }).join('')+'</ol>';
  h+='<p class="szh">PİLOTLAR</p><ol class="lbl">'+M.map(function(m){ const me=m.user_id===uid; let act='';
    if(mine&&!me){ if(rol==='komutan'){ act+=m.rol==='pilot'?'<button class="btn sm" type="button" data-fl="rol" data-r="yardimci" data-id="'+m.user_id+'">Yardımcı yap</button>':m.rol==='yardimci'?'<button class="btn sm" type="button" data-fl="rol" data-r="pilot" data-id="'+m.user_id+'">Pilot yap</button>':'';
        act+='<button class="btn sm" type="button" data-fl="devret" data-id="'+m.user_id+'">'+(FL.sure==='devret'+m.user_id?'Emin misin? Devret':'Komutanlığı devret')+'</button>'; }
      if(rol==='komutan'||(rol==='yardimci'&&m.rol==='pilot')) act+='<button class="btn sm" type="button" data-fl="cikar" data-id="'+m.user_id+'">'+(FL.sure==='cikar'+m.user_id?'Emin misin? Çıkar':'Çıkar')+'</button>'; }
    return '<li class="'+(me?'me':'')+'"><span class="lbe">'+flEmb(m.emblem)+'</span><span class="lbn"><b>'+lbEsc(m.callsign||'Pilot')+(m.rol!=='pilot'?' <em class="flrol">'+FL_ROL[m.rol]+'</em>':'')+'</b><small>'+lbEsc(RANKS[m.rank||0]?RANKS[m.rank||0][0]:'')+' · '+lbEsc(lbUnit(m.unit))+'</small></span><span class="lbv">'+lbTp(m.tp)+'</span>'+(act?'<span class="flact">'+act+'</span>':'')+'</li>'; }).join('')+'</ol>';
  if(off) h+='<details class="flset"><summary>Filo ayarları</summary><label class="w">Açıklama<input id="flSAc" maxlength="200" value="'+lbEsc(F.aciklama)+'"></label><label class="w">Duyuru (bütün pilotlar görür)<input id="flSDu" maxlength="200" value="'+lbEsc(F.duyuru)+'"></label>'+
    '<label>Arma<select id="flSAm">'+flEmbOpts(F.amblem)+'</select></label><label class="chk"><input id="flSAcik" type="checkbox"'+(F.acik?' checked':'')+'> Herkes doğrudan katılabilir</label><button class="btn primary" type="button" data-fl="kaydet">Kaydet</button></details>';
  if(mine) h+='<div class="stack"><button class="btn danger" type="button" data-fl="ayril">'+(FL.sure==='ayril'?(rol==='komutan'&&M.length>1?'Emin misin? Komutanlık devredilir':M.length<=1?'Emin misin? Filo kapanır':'Emin misin? Ayrıl'):'Filodan ayrıl')+'</button></div>';
  else h+='<div class="stack"><button class="btn" type="button" data-fl="liste">← Filo listesi</button>'+(typeof accIsAdmin==='function'&&accIsAdmin()&&ACC.cfg?'<button class="btn danger" type="button" data-fl="sil" data-id="'+F.id+'">'+(FL.sure==='sil'?'Emin misin? Filoyu sil':'Filoyu sil (yönetici)')+'</button>':'')+'</div>';
  return h; }
function flRender(){ const el=$('flBody'); if(!el) return; let h='';
  if(typeof ACC==='undefined'||!ACC.sb) h='<p class="lbempty">Filolar için internet bağlantısı gerekiyor.</p>';
  else if(!flOn()) h='<p class="lbempty">Filoya katılmak ya da filo kurmak için giriş yap (Profil → Hesap).</p>';
  else if(FL.err) h='<p class="lbempty">'+lbEsc(FL.err)+'</p><div class="stack"><button class="btn" type="button" data-fl="yenile">Yeniden dene</button></div>';
  else if(FL.view&&FL.fleet) h=flRenderFleet();
  else h=flRenderList();
  el.innerHTML=h; }
/* ---- actions */
function flDo(p,msg){ if(FL.busy) return; FL.busy=true; FL.sure=null;
  return Promise.resolve(p).then(function(r){ FL.busy=false; if(msg) toast(typeof msg==='function'?msg(r):msg,'#7dffb0'); return flLoad(); })
    .catch(function(e){ FL.busy=false; toast('Filo: '+flErr(e),'#ffc24a'); flRender(); }); }
function flSure(k){ if(FL.sure===k){ FL.sure=null; return true; } FL.sure=k; flRender(); return false; }
function flClick(e){ const b=e.target.closest('[data-fl]'); if(!b||FL.busy) return; const a=b.dataset.fl, id=b.dataset.id;
  if(a==='ara'){ FL.q=($('flQ')&&$('flQ').value||'').trim(); FL.list=null; flRender(); flLoadList().then(flRender).catch(function(x){ FL.err=flErr(x); flRender(); }); return; }
  if(a==='kurform'){ FL.form={acik:true}; flRender(); return; }
  if(a==='vazgec'){ FL.form=null; flRender(); return; }
  if(a==='yenile'){ FL.err=null; flLoad(); return; }
  if(a==='liste'){ FL.view=null; FL.fleet=null; FL.sure=null; if(!FL.list) flLoadList().then(flRender); flRender(); return; }
  if(a==='bak'){ FL.view=id; FL.sure=null; flLoadFleet(id).then(flRender).catch(function(x){ toast('Filo: '+flErr(x),'#ffc24a'); }); return; }
  if(a==='kur'){ const ad=$('flAd').value.trim(), et=$('flEt').value.trim(), ac=$('flAc').value.trim();
    FL.form={ad:ad,et:et,ac:ac,am:$('flAm').value,acik:$('flAcik').checked};
    if(ad.length<3) return toast('Filo adı en az 3 harf','#ffc24a'); if(!/^[0-9A-Za-zÇĞİÖŞÜçğıöşü]{2,4}$/.test(et)) return toast('Etiket 2–4 harf ya da rakam','#ffc24a');
    if(!flTemiz(ad)||!flTemiz(et)||!flTemiz(ac)) return toast('Bu ad ya da açıklama uygun değil','#ffc24a');
    return flDo(flRpc('filo_kur',{ad:ad,etiket:et.toLocaleUpperCase('tr-TR'),amblem:FL.form.am,aciklama:ac,acik:FL.form.acik}).then(function(r){ FL.form=null; FL.q=''; return r; }),'Filo kuruldu: '+ad); }
  if(a==='katil') return flDo(flRpc('filo_katil',{f:id}),function(r){ return r==='uye'?'Filoya katıldın':r==='basvuru'?'Başvurun gönderildi; komutan onaylayınca filodasın':'Filo dolu'; });
  if(a==='geri') return flDo(flRpc('filo_basvuru_geri',{f:id}),'Başvuru geri alındı');
  if(a==='kabul'||a==='red') return flDo(flRpc('filo_basvuru_karar',{u:id,kabul:a==='kabul'}),function(r){ return r==='uye'?'Pilot filoya katıldı':r==='red'?'Başvuru reddedildi':r==='dolu'?'Filo dolu':'Pilot başka bir filoya katılmış'; });
  if(a==='rol') return flDo(flRpc('filo_rol',{u:id,rol_:b.dataset.r}),'Rol değişti');
  if(a==='devret'){ if(!flSure('devret'+id)) return; return flDo(flRpc('filo_rol',{u:id,rol_:'komutan'}),'Komutanlık devredildi'); }
  if(a==='cikar'){ if(!flSure('cikar'+id)) return; return flDo(flRpc('filo_cikar',{u:id}),'Pilot filodan çıkarıldı'); }
  if(a==='ayril'){ if(!flSure('ayril')) return; FL.view=null; return flDo(flRpc('filo_ayril'),'Filodan ayrıldın'); }
  if(a==='sil'){ if(!flSure('sil')) return; FL.view=null; return flDo(flRpc('filo_sil',{f:id}),'Filo silindi'); }
  if(a==='kaydet'){ const ac=$('flSAc').value.trim(), du=$('flSDu').value.trim(); if(!flTemiz(ac)||!flTemiz(du)) return toast('Bu metin uygun değil','#ffc24a');
    return flDo(flRpc('filo_duzenle',{aciklama_:ac,duyuru_:du,acik_:$('flSAcik').checked,amblem_:$('flSAm').value}),'Filo ayarları kaydedildi'); } }
function flOpen(){ let el=$('flUI'); if(!el&&document.createElement){ el=document.createElement('div'); el.id='flUI'; el.className='modal hidden';
    el.innerHTML='<div class="card wide relcard flcard"><button class="xbtn" type="button" id="flX" aria-label="Kapat">✕</button><h2>Filo</h2><div class="relbody lbbody" id="flBody"></div></div>';
    document.body.appendChild(el); MODALS.push('flUI');
    el.querySelector('#flX').addEventListener('click',function(){ el.classList.add('hidden'); FL.sure=null; if(state==='menu') navRender(); });
    el.querySelector('#flBody').addEventListener('click',flClick);
    el.querySelector('#flBody').addEventListener('keydown',function(e){ if(e.key==='Enter'&&e.target&&e.target.id==='flQ'){ e.preventDefault(); const b=el.querySelector('[data-fl="ara"]'); if(b) b.click(); } }); }
  if(!el) return; FL.view=FL.me?FL.me.filo_id:null; FL.err=null; flRender(); el.classList.remove('hidden'); return flLoad(); }
/* ---- weekly fleet reward: checked once per session after login, in the menu */
function flOdulTier(tot){ let r=0; FL_HEDEF.forEach(function(g){ if(tot>=g[0]) r=g[1]; }); return r; }
function flOdul(){ if(FL.odul||!flOn()) return Promise.resolve(0); FL.odul=true; const uid=flUid(), prev=lbWeekId(lbWeekStart()-864e5), key=uid+':'+prev;
  if(stGet('ayy-filo-odul')===key) return Promise.resolve(0);
  return flQ(ACC.sb.from('lb_filo_hafta').select('filo_id,user_id,tp').eq('hafta',prev).eq('user_id',uid)).then(function(mine){
      if(!mine||!mine.length) return 0; const row=mine.slice().sort(function(a,b){ return b.tp-a.tp; })[0]; if(!(row.tp>0)) return 0;
      return flQ(ACC.sb.from('lb_filo_hafta').select('tp').eq('hafta',prev).eq('filo_id',row.filo_id)).then(function(all){ const tot=(all||[]).reduce(function(s,x){ return s+(+x.tp||0); },0), n=flOdulTier(tot);
        stSet('ayy-filo-odul',key); if(n>0){ careerAdd(n,null,'Filo ödülü'); toast('🛩 Filon geçen hafta '+lbTp(tot)+' topladı: +'+n+' TP','#ffd27a'); } return n; }); })
    .catch(function(e){ FL.odul=false; console.warn('[AyYildiz] filo ödülü denetlenemedi',e&&e.message||e); return 0; }); }
accAfterLogin=HOOK.wrap('accAfterLogin','ag/filo#flLogin',function(next){ return function(){ const p=next.apply(this,arguments);
  Promise.resolve(p).then(function(ok){ if(!ok) return; FL.me=null; FL.odul=false;
    const w=setInterval(function(){ if(!flOn()){ clearInterval(w); return; } if(state!=='menu'||anyModalOpen()) return; clearInterval(w); flOdul();
      flQ(ACC.sb.from('filo_uyeler').select('filo_id,rol').eq('user_id',flUid()).maybeSingle()).then(function(m){ FL.me=m||null; if(state==='menu') navRender(); }).catch(function(){}); },5000); }); return p; }; },accAfterLogin);
/* ---- Kariyer → Filo */
NAV_IC.filo='<path d="M12 3l3 6h-6z"/><path d="M5 13l3 5H2zM19 13l3 5h-6z"/><path d="M12 9v6M8 18h8"/>';
NAV_D.c_filo=['KARİYER','Filo','En çok '+FL_MAX+' pilotluk filonu kur ya da birine katıl. Filoda kazandığın TP filonun haftalık toplamına da yazılır; filo 10, 25 ya da 50 bin TP\'ye ulaşınca katkı veren herkes 50–200 TP alır. Filo etiketin sıralamada adının yanında görünür.',[],'Filoyu aç'];
navRender=HOOK.wrap('navRender','ag/filo#_flNav',function(next){ return function(){ next(); if(NAV.level!=='career') return; const el=$('cNav'); if(!el) return; const h=el.innerHTML;
  if(h.indexOf('data-act="c_filo"')>=0) return; const k=h.indexOf('data-act="c_rank"'); if(k<0) return; const j=h.lastIndexOf('<button',k);
  const sub=FL.me&&FL.fleet&&FL.fleet.id===FL.me.filo_id?'['+FL.fleet.etiket+'] '+FL.fleet.ad:FL.me?'Filondasın · '+FL_ROL[FL.me.rol]:'Kur ya da katıl · haftalık filo hedefi';
  el.innerHTML=h.slice(0,j)+navBtn('c_filo','Filo',sub,'filo')+h.slice(j); tFocus=Math.min(tFocus,Math.max(0,titleItems().length-1)); titleFocus(tFocus); }; },navRender);
titleAct=HOOK.wrap('titleAct','ag/filo#_flAct',function(next){ return function(act){ if(act==='c_filo'&&state==='menu') return flOpen(); return next.apply(this,arguments); }; },titleAct);
