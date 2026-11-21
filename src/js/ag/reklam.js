/* ------------------------------------------------------------------ ads (V2.62, income route step 2)
   Only in the Android app (AdMob through the Capacitor plugin); the web game shows no ads. Rules (ROADMAP → Gelir planı):
   • Rewarded ads are always the player's choice: 2× TP at the end of a mission, try a paint pack for 24 hours.
   • Interstitials are rare: only when leaving a finished mission, at most one every 5 minutes, never in the first session.
   • No banners. "Reklamsız" (store) removes interstitials and gives the rewards without an ad.
   • Consent: our own short notice on first launch (personalised or not), then Google's consent form (UMP) where the law
     requires it (EEA/UK). Both can be reopened from Mağaza → Reklam tercihleri.
   • V2.62 uses Google's TEST ad units only (ADS.test): no real ads, no income yet. The real ids come with the AdMob account.
   • ?reklam=dene in the web address simulates ads (an overlay instead of AdMob) to test the flow in a browser. */
const ADS={native:false, sim:false, ok:false, rewReady:false, intReady:false, busy:false, lastInter:0, err:null, test:true,
  ids:{rew:'ca-app-pub-3940256099942544/5224354917', int:'ca-app-pub-3940256099942544/1033173712'},
  st:{runs:0, pers:null}, consent:null};
try{ const s=JSON.parse(stGet('ayy-reklam')||'{}'); if(s&&typeof s==='object') Object.assign(ADS.st,s); }catch(e){}
ADS.native=!!(APP.native&&APP.P.AdMob);
try{ ADS.sim=!ADS.native&&/[?&]reklam=dene\b/.test(location.search); }catch(e){}
ADS.st.runs=(ADS.st.runs||0)+1;
function adsSave(){ try{ stSet('ayy-reklam',JSON.stringify(ADS.st)); }catch(e){} }
adsSave();
function adsNoAds(){ return typeof entOwns==='function'&&entOwns('reklamsiz'); }
/* a rewarded offer can be shown: the player owns Reklamsız (reward without ad) or an ad can be shown */
function adsOfferable(){ return adsNoAds()||ADS.sim||(ADS.native&&ADS.ok); }
function adsNpa(){ return ADS.st.pers!=='evet'; }
function adsPrepare(kind){ if(!ADS.native||!ADS.ok) return; const A=APP.P.AdMob, o={adId:ADS.ids[kind], isTesting:ADS.test, npa:adsNpa(), immersiveMode:true};
  (kind==='rew'?A.prepareRewardVideoAd(o):A.prepareInterstitial(o)).then(function(){ ADS[kind+'Ready']=true; console.log('[AyYildiz] reklam hazır: '+kind); })
    .catch(function(e){ ADS[kind+'Ready']=false; ADS.err=e&&e.message||String(e); console.warn('[AyYildiz] reklam yüklenemedi: '+kind,ADS.err); setTimeout(function(){ adsPrepare(kind); },60000); }); }
/* start AdMob: consent first (Google's form only where required), then the SDK, then the first ads */
function adsStart(){ if(!ADS.native||ADS.ok||ADS.busy) return Promise.resolve(); ADS.busy=true; const A=APP.P.AdMob;
  return A.requestConsentInfo().then(function(c){ ADS.consent=c; if(c&&c.status==='REQUIRED'&&c.isConsentFormAvailable) return A.showConsentForm().then(function(c2){ ADS.consent=c2; }); })
    .catch(function(e){ console.warn('[AyYildiz] reklam izni okunamadı',e&&e.message||e); })
    .then(function(){ if(ADS.consent&&ADS.consent.canRequestAds===false) throw new Error('reklam izni yok'); return A.initialize({initializeForTesting:ADS.test, maxAdContentRating:'Teen'}); })
    .then(function(){ ADS.ok=true; console.log('[AyYildiz] AdMob başladı (deneme: '+ADS.test+')'); adsPrepare('rew'); adsPrepare('int'); if(typeof magRender==='function') magRender(); })
    .catch(function(e){ ADS.err=e&&e.message||String(e); console.warn('[AyYildiz] AdMob başlamadı',ADS.err); })
    .finally(function(){ ADS.busy=false; }); }
/* ---- the browser simulation */
function adsSimShow(kind){ return new Promise(function(res){ const d=document.createElement('div'); d.className='adsim'; let left=kind==='rew'?3:2;
  d.innerHTML='<div><small>DENEME REKLAMI</small><b>'+(kind==='rew'?'Ödüllü reklam':'Geçiş reklamı')+'</b><p id="adsimT">'+left+'</p><button class="btn" type="button">Kapat</button></div>';
  document.body.appendChild(d); const t=setInterval(function(){ left--; const e=d.querySelector('#adsimT'); if(e) e.textContent=left>0?left:'✓'; if(left<=0) clearInterval(t); },1000);
  d.querySelector('button').addEventListener('click',function(){ clearInterval(t); d.remove(); res(left<=0); }); }); }
/* ---- rewarded: resolves true when the reward is earned */
function adsReward(why){ if(adsNoAds()) return Promise.resolve(true);
  if(ADS.sim) return adsSimShow('rew');
  if(!ADS.native||!ADS.ok||!ADS.rewReady){ toast('Reklam henüz hazır değil, biraz sonra tekrar dene','#ffc24a'); if(ADS.native&&ADS.ok) adsPrepare('rew'); return Promise.resolve(false); }
  const A=APP.P.AdMob; ADS.rewReady=false; let got=false, hs=[];
  return new Promise(function(res){ let done=false; const fin=function(){ if(done) return; done=true; hs.forEach(function(h){ try{ h.remove(); }catch(e){} }); setTimeout(function(){ adsPrepare('rew'); },500); res(got); };
    Promise.all([A.addListener('onRewardedVideoAdReward',function(){ got=true; }), A.addListener('onRewardedVideoAdDismissed',function(){ setTimeout(fin,300); }),
      A.addListener('onRewardedVideoAdFailedToShow',function(){ fin(); })]).then(function(x){ hs=x; return A.showRewardVideoAd(); })
      .then(function(r){ if(r) got=true; }).catch(function(e){ ADS.err=e&&e.message||String(e); fin(); }); })
    .then(function(ok){ console.log('[AyYildiz] ödüllü reklam ('+why+'): '+(ok?'ödül':'ödül yok')); return ok; }); }
/* ---- interstitial: only when leaving a finished mission */
function adsInterDue(){ return !adsNoAds()&&(ADS.sim||(ADS.native&&ADS.ok&&ADS.intReady))&&ADS.st.runs>1&&Date.now()-ADS.lastInter>5*60e3; }
function adsInter(){ if(!adsInterDue()) return Promise.resolve(false); ADS.lastInter=Date.now();
  if(ADS.sim) return adsSimShow('int').then(function(){ return true; });
  const A=APP.P.AdMob; ADS.intReady=false; let hs=[];
  return new Promise(function(res){ let done=false; const fin=function(){ if(done) return; done=true; hs.forEach(function(h){ try{ h.remove(); }catch(e){} }); setTimeout(function(){ adsPrepare('int'); },500); res(true); };
    Promise.all([A.addListener('interstitialAdDismissed',fin), A.addListener('interstitialAdFailedToShow',fin)]).then(function(x){ hs=x; return A.showInterstitial(); }).catch(fin); }); }
(function(){ ['btnMRetry','btnMHangar'].forEach(function(id){ const b=$(id); if(!b||!b.addEventListener) return;
  b.addEventListener('click',function(e){ if(b._adPass){ b._adPass=false; return; } if(!adsInterDue()) return;
    e.preventDefault(); e.stopImmediatePropagation(); adsInter().then(function(){ b._adPass=true; b.click(); }); },true); }); })();
/* ---- 2× TP at the end of a successful mission */
const ADX={xp:0, used:false};
function adsDoubleBtn(){ const card=$('missionEnd')&&$('missionEnd').querySelector('.card'); if(!card||!card.querySelector) return; let b=$('btnMDouble');
  if(!b){ b=document.createElement('button'); b.id='btnMDouble'; b.type='button'; b.className='btn gold adx';
    b.addEventListener('click',function(){ if(ADX.used||ADX.xp<=0) return; b.disabled=true; adsReward('2x TP').then(function(ok){ if(!ok){ b.disabled=false; return; }
      ADX.used=true; careerAdd(ADX.xp,null,'Ödüllü reklam: 2× TP'); b.textContent='✓ +'+ADX.xp+' TP eklendi'; toast('+'+ADX.xp+' TP','#7dffb0'); }); });
    const st=card.querySelector('.stack'); card.insertBefore(b,st||null); }
  b.disabled=false; b.textContent=(adsNoAds()?'⭐ ':'🎬 Reklam izle · ')+'TP\'yi ikiye katla (+'+ADX.xp+' TP)'; b.classList.toggle('hidden',!(ADX.xp>=20&&adsOfferable())); }
/* the reward to double = the TP this mission's end gave (the ÖDÜL line of the report) */
endMission=HOOK.wrap('endMission','ag/reklam#adsDouble',function(next){ return function(ok){ const was=M.done, p0=(accProfile().xp||0), r=next.apply(this,arguments);
  if(!was&&M.done){ ADX.used=false; ADX.xp=ok&&!NET.on?Math.round((accProfile().xp||0)-p0):0; adsDoubleBtn(); } return r; }; },endMission);
/* ---- consent notice (first launch in the app) and preferences */
function adsPrefOpen(first){ let el=$('adsUI'); if(!el){ el=document.createElement('div'); el.id='adsUI'; el.className='modal hidden';
    el.innerHTML='<div class="card relcard adscard"><h2>Reklamlar ve gizlilik</h2><p>Oyun ücretsiz ve öyle kalacak. Geliştirmeyi, yalnız senin seçtiğinde izlenen ödüllü reklamlar ve görev aralarında seyrek bir reklam destekliyor. Reklamları Google AdMob gösterir.</p>'+
      '<p>Kişiselleştirilmiş reklamda Google cihazının reklam kimliğini ilgi alanına göre reklam seçmek için kullanabilir. İstemezsen yalnız kişiselleştirilmemiş reklam gösterilir. Seçimini Mağaza → Reklam tercihleri\'nden değiştirebilirsin.</p>'+
      '<div class="stack"><button class="btn primary" type="button" data-pers="evet">Kişiselleştirilmiş olabilir</button><button class="btn" type="button" data-pers="hayir">Yalnız kişiselleştirilmemiş</button></div>'+
      '<p class="mgn" id="adsMore"></p><p class="mgn"><a href="privacy.html#reklam" target="_blank" rel="noopener">Gizlilik politikası</a></p></div>';
    document.body.appendChild(el); MODALS.push('adsUI');
    el.addEventListener('click',function(e){ const b=e.target.closest('button[data-pers]'); if(b){ ADS.st.pers=b.dataset.pers; adsSave(); el.classList.add('hidden'); toast(ADS.st.pers==='evet'?'Reklam tercihi kaydedildi':'Yalnız kişiselleştirilmemiş reklam gösterilecek','#b8ecff');
        if(ADS.ok){ adsPrepare('rew'); adsPrepare('int'); } else adsStart(); }
      const g=e.target.closest('button[data-ump]'); if(g&&ADS.native) APP.P.AdMob.showPrivacyOptionsForm().catch(function(){}); }); }
  const more=$('adsMore'); if(more) more.innerHTML=ADS.consent&&ADS.consent.privacyOptionsRequirementStatus==='REQUIRED'?'<button class="btn ghost" type="button" data-ump="1">Google izin ayarları</button>':'';
  el.classList.remove('hidden'); }
/* show the notice once the menu is up (not over the loading screen), then start the ads */
if(ADS.native||ADS.sim){ const wait=setInterval(function(){ if(typeof state==='undefined'||state!=='menu'||(typeof BOOT!=='undefined'&&!BOOT.done)||anyModalOpen()||(typeof GUN!=='undefined'&&!GUN.checked)) return; clearInterval(wait);
    if(!ADS.st.pers) adsPrefOpen(true); else adsStart(); },1500); }
