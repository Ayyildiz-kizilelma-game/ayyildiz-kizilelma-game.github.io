let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.62: Android app shell (Capacitor) and ads — web side behaves as before, app pieces are testable without a phone */
T_('web: not native',APP.native===false&&ADS.native===false);
T_('web: no ads offered to guests',!adsOfferable());
const t=appBridgeTarget('?uyg=giris','#access_token=AAA&refresh_token=BBB&expires_in=3600');
T_('bridge: intent link to the app package',/^intent:\/\/giris\?at=AAA&rt=BBB#Intent;scheme=tr\.ayyildiz\.hedefkizilelma;package=tr\.ayyildiz\.hedefkizilelma;end$/.test(t),t);
T_('bridge: error passed on',/hata=/.test(appBridgeTarget('?uyg=giris','#error=access_denied')));
T_('bridge: other pages untouched',appBridgeTarget('?src=app','#access_token=x')===null);
T_('test ad units only',ADS.test===true&&/^ca-app-pub-3940256099942544\//.test(ADS.ids.rew)&&/^ca-app-pub-3940256099942544\//.test(ADS.ids.int));
T_('no interstitial without ads',adsInterDue()===false);
/* Reklamsız: rewards without an ad */
entSet([{product:'reklamsiz',source:'yonetici'}]);
T_('reklamsiz offers rewards',adsOfferable());
T_('reklamsiz: reward without ad',adsNoAds()&&typeof adsReward('test').then==='function');
/* trial of a pack */
entSet([]); T_('pack not owned',!entOwns('paket_tarih')); entTrial('paket_tarih'); T_('trial owns the pack',entOwns('paket_tarih')&&entTrialLeft('paket_tarih')>23*3600e3);
ENT.trial.paket_tarih=Date.now()-1; T_('expired trial',!entOwns('paket_tarih'));
/* 2× TP button after a successful mission */
CAR.sess={t:Date.now(),xp:180,dur:60,res:'—'}; M.done=false; M.id=M.id||'rings'; entSet([{product:'reklamsiz',source:'yonetici'}]);
try{ endMission(true,12); }catch(e){ console.log('endMission',e.message); }
T_('double = mission reward',ADX.xp>=150,ADX.xp);
console.log('v262: pass '+ok+' fail '+bad);
