/* ------------------------------------------------------------------ Android app shell (V2.62, Capacitor)
   Since V2.62 the Android app is a Capacitor app: the game files are inside the APK (android-app/, tools/android-hazirla.py)
   and run in the system WebView, so AdMob ads and later Google Play purchases work without owning a domain.
   • APP.native: true inside the app; APP.P holds the native plugins (App, Browser, AdMob).
   • Back button: closes the open screen like Esc; on the main menu it closes the app.
   • Google sign-in: Google refuses sign-in inside a WebView, so the app opens it in a browser tab (Custom Tab). Supabase sends
     the browser back to the game's web address with ?uyg=giris; that page (below, web side) hands the tokens to the app
     through an intent link that only this package can receive, and the app signs in with them. Email sign-in works directly. */
const APP={native:false, P:{}, scheme:'tr.ayyildiz.hedefkizilelma', bridge:'https://ayyildiz-kizilelma-game.github.io/?uyg=giris'};
try{ const C=window.Capacitor; APP.native=!!(C&&C.isNativePlatform&&C.isNativePlatform());
  if(APP.native) ['App','Browser','AdMob'].forEach(function(n){ try{ APP.P[n]=C.registerPlugin?C.registerPlugin(n):(C.Plugins&&C.Plugins[n]); }catch(e){ APP.P[n]=C.Plugins&&C.Plugins[n]; } }); }catch(e){}
function appQuery(t){ const o={}; String(t||'').split('&').forEach(function(kv){ if(!kv) return; const i=kv.indexOf('='); try{ o[decodeURIComponent(i<0?kv:kv.slice(0,i))]=i<0?'':decodeURIComponent(kv.slice(i+1).replace(/\+/g,' ')); }catch(e){} }); return o; }
/* ---- web side: the page Google sign-in returns to when it was started in the app */
function appBridgeTarget(search,hash){ if(String(search||'').indexOf('uyg=giris')<0) return null;
  const p=appQuery(String(hash||'').replace(/^#/,'')), at=p.access_token, rt=p.refresh_token, err=p.error_description||p.error;
  const q=at?'at='+encodeURIComponent(at)+'&rt='+encodeURIComponent(rt||''):'hata='+encodeURIComponent(err||'giriş tamamlanmadı');
  return 'intent://giris?'+q+'#Intent;scheme='+APP.scheme+';package='+APP.scheme+';end'; }
(function(){ if(APP.native) return; let t=null; try{ t=appBridgeTarget(location.search,location.hash); }catch(e){} if(!t) return;
  try{ history.replaceState(null,'',location.pathname); }catch(e){}   /* tokens leave the address bar before the web game could use them */
  try{ const d=document.createElement('div'); d.id='appBridge';
    d.innerHTML='<div><b>Giriş tamamlandı</b><p>Oyuna dönmek için dokun.</p><a class="btn primary" href="'+t.replace(/"/g,'&quot;')+'">Uygulamaya dön</a></div>';
    document.body.appendChild(d); }catch(e){}
  try{ location.href=t; }catch(e){} })();
/* ---- app side */
function appHandleUrl(url){ if(!url||String(url).indexOf(APP.scheme+'://giris')!==0) return false;
  const u=String(url), q=appQuery(u.indexOf('?')<0?'':u.slice(u.indexOf('?')+1).split('#')[0]);
  try{ APP.P.Browser&&APP.P.Browser.close().catch(function(){}); }catch(e){}
  if(!q.at){ toast('Google ile giriş yapılamadı: '+(q.hata||'bilinmeyen hata'),'#ff6a5a'); return true; }
  const go=function(){ return ACC.sb.auth.setSession({access_token:q.at, refresh_token:q.rt}).then(function(r){ if(r.error) throw r.error; toast('Google ile giriş yapıldı','#7dffb0'); if(typeof accClose==='function') try{ accClose(); }catch(e){} }); };
  (ACC.sb?Promise.resolve():accInit()).then(go).catch(function(e){ toast('Giriş tamamlanamadı: '+(e&&e.message||e),'#ff6a5a'); });
  return true; }
function appGoogle(){ if(!ACC.sb){ toast('Bulut bağlantısı yok','#ffc24a'); return; }
  ACC.sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:APP.bridge,skipBrowserRedirect:true}}).then(function(r){ if(r.error||!r.data||!r.data.url) throw r.error||new Error('giriş adresi alınamadı');
    return APP.P.Browser.open({url:r.data.url}); }).catch(function(e){ toast('Google ile giriş açılamadı: '+(e&&e.message||e),'#ff6a5a'); }); }
function appBack(){ const open=Array.prototype.some.call(document.querySelectorAll('.modal'),function(m){ return !m.classList.contains('hidden'); });
  if(state==='menu'&&!open&&(typeof NAV==='undefined'||NAV.level==='root')){ try{ APP.P.App.exitApp(); }catch(e){} return 'exit'; }
  ['keydown','keyup'].forEach(function(t){ document.dispatchEvent(new KeyboardEvent(t,{key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true})); }); return 'esc'; }
if(APP.native){
  try{ INST.standalone=true; instBtn(); }catch(e){}
  try{ document.documentElement.classList.add('app-native'); }catch(e){}
  /* the Google button is bound to accSignInGoogle directly: catch the click first */
  document.addEventListener('click',function(e){ if(e.target&&e.target.closest&&e.target.closest('#accGoogle')){ e.preventDefault(); e.stopImmediatePropagation(); appGoogle(); } },true);
  try{ APP.P.App.addListener('backButton',function(){ appBack(); }); }catch(e){}
  try{ APP.P.App.addListener('appUrlOpen',function(ev){ appHandleUrl(ev&&ev.url); }); APP.P.App.getLaunchUrl().then(function(r){ if(r&&r.url) appHandleUrl(r.url); }).catch(function(){}); }catch(e){}
  console.log('[AyYildiz] uygulama kabuğu: Capacitor');
}
