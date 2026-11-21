/* ------------------------------------------------------------------ in-app quick update (V2.63, Android app only)
   Since V2.62 the game files are inside the APK, so a new game version used to mean downloading a new APK. Now:
   • every release, the Android workflow also publishes the game files as a zip (AyYildiz-www-<v>.zip) and a small
     guncelleme.json ({surum, zip, boyut, enAzKod, baslik, notlar}) on the "android" download page;
   • on launch the app reads guncelleme.json; when it is newer than this game, a card offers "Şimdi güncelle": the zip
     (~2 MB) downloads, the app switches to it and restarts in a few seconds. No APK, no install screen.
   • the switch uses the Capgo updater plugin in self-hosted, manual mode (no Capgo server, no statistics): if the new
     version fails to start (notifyAppReady not called), the plugin goes back to the previous one by itself;
   • when an update needs a newer app shell (new native plugins: enAzKod above this APK's version code), the card offers
     the new APK instead;
   • installing a new APK always starts from the files inside that APK (resetWhenUpdate). */
const GUN={adres:(typeof window!=='undefined'&&window.AYY_GUNCELLEME_ADRES)||'https://github.com/Ayyildiz-kizilelma-game/ayyildiz-kizilelma-game.github.io/releases/download/android/guncelleme.json',
  apk:'https://github.com/Ayyildiz-kizilelma-game/ayyildiz-kizilelma-game.github.io/releases/download/android/',
  oto:!!(typeof window!=='undefined'&&window.AYY_GUNCELLEME_OTO), man:null, checked:!APP.native, busy:false, kod:0, paket:null, skip:null, pct:0};
function gunNum(v){ const m=/(\d+)\.(\d+)/.exec(String(v||'')); return m?(+m[1])*100+(+m[2]):0; }
function gunNewer(man,cur){ return !!(man&&gunNum(man.surum)>gunNum(cur)); }
function gunCanLive(man,kod){ return !!man&&(kod||0)>=(man.enAzKod||0)&&!!man.zip; }
if(APP.native){
  try{ APP.P.Updater.notifyAppReady().then(function(){ console.log('[AyYildiz] sürüm hazır: '+GAME_VERSION); }).catch(function(e){ console.warn('[AyYildiz] notifyAppReady',e&&e.message||e); }); }catch(e){}
  try{ APP.P.Updater.current().then(function(c){ GUN.paket=c&&c.bundle; console.log('[AyYildiz] paket: '+((c&&c.bundle&&c.bundle.version)||'?')+' · uygulama '+((c&&c.native)||'?')+' · oyun '+GAME_VERSION); }).catch(function(){}); }catch(e){}
  try{ APP.P.App.getInfo().then(function(i){ GUN.kod=+(i&&i.build)||0; }).catch(function(){}); }catch(e){}
  try{ const last=stGet('ayy-gun-son'); if(last&&gunNum(GAME_VERSION)>gunNum(last)) setTimeout(function(){ toast('✓ '+GAME_VERSION+' sürümüne güncellendi','#7dffb0'); },4000); stSet('ayy-gun-son',GAME_VERSION); }catch(e){}
}
/* read guncelleme.json natively (GitHub's download links have no CORS headers for the WebView) */
function gunFetch(){ const H=APP.P.Http, url=GUN.adres+(GUN.adres.indexOf('?')<0?'?':'&')+'t='+Date.now();
  return H.request({url:url, method:'GET', headers:{'Accept':'application/json'}, connectTimeout:10000, readTimeout:10000}).then(function(r){
    if(!r||r.status!==200) throw new Error('durum '+(r&&r.status));
    return typeof r.data==='string'?JSON.parse(r.data):r.data; }); }
function gunCheck(){ if(!APP.native||GUN.busy) return Promise.resolve(null);
  return gunFetch().then(function(man){ GUN.man=man; const nw=gunNewer(man,GAME_VERSION);
      console.log('[AyYildiz] güncelleme: sunucuda '+(man&&man.surum)+', bu oyun '+GAME_VERSION+(nw?' → yeni sürüm var':' → güncel'));
      if(nw&&GUN.skip!==man.surum) gunCard(man); else GUN.checked=true; return man; })
    .catch(function(e){ GUN.checked=true; console.warn('[AyYildiz] güncelleme denetlenemedi',e&&e.message||e); return null; }); }
function gunCard(man){ let el=$('gunUI'); if(!el){ el=document.createElement('div'); el.id='gunUI'; el.className='modal hidden';
    el.innerHTML='<div class="card relcard guncard"><h2 id="gunT"></h2><p class="sub" id="gunS"></p><ul id="gunN"></ul><div class="gunbar hidden" id="gunBar"><i></i></div><p class="mgn" id="gunM"></p><div class="stack" id="gunB"></div></div>';
    document.body.appendChild(el); MODALS.push('gunUI');
    el.addEventListener('click',function(e){ const b=e.target.closest('button[data-g]'); if(!b) return; const a=b.dataset.g;
      if(a==='simdi') gunApply(GUN.man); else if(a==='apk'){ try{ APP.P.Browser.open({url:GUN.apk+'AyYildiz-'+String(GUN.man.surum).replace(/^V/,'')+'.apk'}); }catch(x){} }
      else { GUN.skip=GUN.man&&GUN.man.surum; el.classList.add('hidden'); GUN.checked=true; } }); }
  const live=gunCanLive(man,GUN.kod), mb=man.boyut?' ('+(man.boyut/1048576).toFixed(1)+' MB)':'';
  $('gunT').textContent='Yeni sürüm: '+man.surum;
  $('gunS').textContent=(man.baslik||'')+(live?' · Oyunu yeniden indirmeden, birkaç saniyede güncellenir.':'');
  $('gunN').innerHTML=(man.notlar||[]).slice(0,4).map(function(t){ return '<li>'+String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</li>'; }).join('');
  $('gunM').textContent=live?'Bu sürüm '+GAME_VERSION+'. İlerlemen ve ayarların korunur.':'Bu güncelleme uygulamanın yeni hâlini istiyor: yeni APK\'yı indirip kur (eskisinin üstüne kurulur, ilerlemen korunur).';
  $('gunB').innerHTML=(live?'<button class="btn primary" type="button" data-g="simdi">Şimdi güncelle'+mb+'</button>':'<button class="btn primary" type="button" data-g="apk">Yeni APK\'yı indir</button>')+'<button class="btn" type="button" data-g="sonra">Sonra</button>';
  $('gunBar').classList.add('hidden'); el.classList.remove('hidden');
  if(GUN.oto&&live) gunApply(man); }
function gunApply(man){ if(GUN.busy||!man) return; GUN.busy=true; const U=APP.P.Updater, bar=$('gunBar'), msg=$('gunM'); let h=null;
  if(bar){ bar.classList.remove('hidden'); bar.firstChild.style.width='0%'; } if(msg) msg.textContent='İndiriliyor…';
  Array.prototype.forEach.call(document.querySelectorAll('#gunB button'),function(b){ b.disabled=true; });
  try{ if(typeof depoFlush==='function') depoFlush(); if(typeof careerSave==='function') careerSave(); }catch(e){}
  Promise.resolve(U.addListener('download',function(d){ const p=Math.round((d&&d.percent)||0); GUN.pct=p; if(bar) bar.firstChild.style.width=p+'%'; if(msg) msg.textContent='İndiriliyor… %'+p; })).then(function(x){ h=x; })
    .then(function(){ console.log('[AyYildiz] güncelleme indiriliyor: '+man.surum); const o={url:man.zip, version:String(man.surum).replace(/^V/,'')}; if(man.sha256) o.checksum=man.sha256; return U.download(o); })
    .then(function(b){ if(msg) msg.textContent='Kuruluyor, oyun yeniden açılıyor…'; console.log('[AyYildiz] güncelleme indirildi: '+(b&&b.id)); try{ depoFlush(); }catch(e){} return U.set({id:b.id}); })
    .catch(function(e){ GUN.busy=false; console.warn('[AyYildiz] güncelleme başarısız',e&&e.message||e); if(msg) msg.textContent='Güncellenemedi: '+(e&&e.message||e)+'. İnternet bağlantını kontrol edip tekrar dene.';
      Array.prototype.forEach.call(document.querySelectorAll('#gunB button'),function(b){ b.disabled=false; }); })
    .finally(function(){ try{ h&&h.remove(); }catch(e){} }); }
/* once the menu is up: check, and again when the app comes back after an hour or more */
if(APP.native){ const w=setInterval(function(){ if(typeof state==='undefined'||state!=='menu'||(typeof BOOT!=='undefined'&&!BOOT.done)||anyModalOpen()) return; clearInterval(w); gunCheck(); },1000);
  GUN.lastBg=0; try{ APP.P.App.addListener('appStateChange',function(s){ if(!s.isActive){ GUN.lastBg=Date.now(); return; }
    if(GUN.lastBg&&Date.now()-GUN.lastBg>3600e3&&state==='menu'&&!anyModalOpen()) gunCheck(); }); }catch(e){} }
