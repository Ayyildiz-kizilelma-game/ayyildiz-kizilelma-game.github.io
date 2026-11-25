/* ------------------------------------------------------------------ realistic flight model (V2.72)
   Ayarlar → Uçuş → Uçuş modeli: Arcade (default, as before) or Gerçekçi. In Gerçekçi the aircraft has a real velocity
   vector instead of flying where the nose points:
   • Lift ∝ v² × lift coefficient of the angle of attack (α); the coefficient peaks at α 15°, above that the wing stalls
     (lift falls, buffet, the nose drops). Level flight needs α = (Vs / v)² × 15°, Vs = the stall speed.
   • Drag: the aircraft's own drag ∝ v² plus induced drag that grows with lift: hard turns bleed speed (energy).
   • Gravity acts in full: climbing costs speed, diving gains it. Thrust along the nose.
   • The stick commands load factor (G) like a fly-by-wire jet: KAAN, Kızılelma, Hürjet and the UAV flight computers
     limit α short of the stall; the Hürkuş has no limiter and can stall. Real G limits (fighter 9, Hürjet 8, Hürkuş 7,
     UAVs 3–4.5); sideslip turns the nose into the wind (directional stability).
   • Pilots in manned aircraft feel sustained G: above ~6.5 G the view greys and narrows, longer and harder G blacks it out
     and control weakens until G eases (G-LOC). UAVs feel nothing.
   • HUD: α and G, "STALL" warning; Otomatik denge is off in this mode. */
const FM={vw:new THREE.Vector3(), spd:-1, gEn:0, warnT:0, el:null, hud:null, a:0, n:1, stall:false};
const FM_AS=0.26, FM_POST=2.2;
const FM_G={kaan:9,kizilelma:9,hurjet:8,hurkus:7,anka3:6,akinci:4.5,tb2:3.5,tb3:3.5,anka:3.5,aksungur:3.5};
const FM_LIM={kaan:0.95,kizilelma:0.95,hurjet:0.95,anka3:0.9,akinci:0.85,tb2:0.85,tb3:0.85,anka:0.85,aksungur:0.85};   /* α limiter as a share of the stall α; none = can stall */
function fmReal(){ return SETTINGS.fm==='real'; }
function fmVs(){ return CUR.stall[0]*1.05; }
function fmCL(a){ const x=Math.abs(a); if(x<=FM_AS) return a/FM_AS; return Math.sign(a)*Math.max(0.42,1-(x-FM_AS)*FM_POST); }
const _fF=new THREE.Vector3(), _fU=new THREE.Vector3(), _fR=new THREE.Vector3(), _fV=new THREE.Vector3(), _fL=new THREE.Vector3(), _fA=new THREE.Vector3(), _fE=new THREE.Euler(), _fQ=new THREE.Quaternion();
function fmStep(dt,thrust,kD,sp0){
  const id=activeId; _fF.set(0,0,-1).applyQuaternion(S.q); _fU.set(0,1,0).applyQuaternion(S.q); _fR.set(1,0,0).applyQuaternion(S.q);
  /* the speed was changed from outside (takeoff, reset, teleport): start the velocity along the nose */
  if(Math.abs(sp0-FM.spd)>0.5||FM.vw.lengthSq()<1) FM.vw.copy(_fF).multiplyScalar(Math.max(sp0,1));
  const v=Math.max(FM.vw.length(),1); _fV.copy(FM.vw).divideScalar(v);
  const alpha=Math.atan2(-_fV.dot(_fU),_fV.dot(_fF)), beta=Math.asin(clamp(_fV.dot(_fR),-1,1));
  const Vs=fmVs(), q=(v/Vs)*(v/Vs), cl=fmCL(alpha), L=9.81*q*cl;            /* lift acceleration (m/s²) */
  /* lift is perpendicular to the velocity, in the plane of velocity and the aircraft's up */
  _fL.copy(_fU).addScaledVector(_fV,-_fU.dot(_fV)); if(_fL.lengthSq()<1e-6) _fL.copy(_fU); _fL.normalize();
  const Di=0.1*Math.abs(L*cl);                                               /* induced drag */
  _fA.set(0,-9.81,0).addScaledVector(_fF,thrust).addScaledVector(_fV,-(kD*v*v+Di)).addScaledVector(_fL,L).addScaledVector(_fR,-beta*q*2.2);
  /* G-LOC: sustained G greys out the view and weakens control (manned aircraft only) */
  const n=L/9.81; FM.n=n; const manned=!CUR.uav;
  if(manned){ const over=Math.max(0,Math.abs(n)-6.5); FM.gEn=clamp(FM.gEn+(over>0?over*0.09:-0.3)*dt,0,1.2); } else FM.gEn=0;
  const ctl=FM.gEn>1?0.35:1;
  /* stick → load factor; the rotation keeps α tracking the α needed for it */
  const gl=FM_G[id]||Math.min(CUR.gLim,9), up=S.pitchIn*ctl, nCmd=up>=0?1+up*(gl-1):1+up*(1+Math.min(3,gl*0.4));
  let aReq=clamp(nCmd/Math.max(q,0.05),-1.6,1.6)*FM_AS; const lim=FM_LIM[id]; if(lim) aReq=clamp(aReq,-lim*FM_AS,lim*FM_AS); else aReq=clamp(aReq,-FM_AS*1.6,FM_AS*1.6);
  const wPath=_fA.dot(_fL)/v, auth=clamp(v/CUR.authV,0.25,1);
  let pr=wPath+(aReq-alpha)*4.2*auth; pr=clamp(pr,-CUR.pitchMax*1.2,CUR.pitchMax*1.2);
  FM.stall=Math.abs(alpha)>FM_AS*1.02;
  if(FM.stall){ pr-=0.6*Math.sign(alpha); pr+=Math.sin(T*23)*0.08; }       /* buffet, nose drops */
  const rr=S.rollIn*ctl*CUR.roll*auth*(FM.stall?0.45:1)*(1-0.25*smooth(CUR.vTop*0.8,CUR.vTop*1.4,v));
  const yr=S.yawIn*CUR.yaw*auth-beta*2.4*auth;
  _fE.set(pr*dt,-yr*dt,-rr*dt,'YXZ'); _fQ.setFromEuler(_fE); S.q.multiply(_fQ).normalize();
  FM.vw.addScaledVector(_fA,dt); const vn=FM.vw.length(); if(vn>650) FM.vw.multiplyScalar(650/vn);
  S.pos.addScaledVector(FM.vw,dt);
  S.speed=Math.min(650,FM.vw.length()); FM.spd=S.speed; S.vy=FM.vw.y; S.sink=0; FM.a=alpha;
  S.g+=(n-S.g)*(1-Math.exp(-6*dt));
  fmFx(dt); }
/* Otomatik denge does not fly the aircraft in realistic mode */
stabOn=function(){ return !fmReal()&&SETTINGS.stab!==false; };
/* ---- view and HUD: grey-out / black-out, α, G, STALL */
function fmFx(dt){ if(!FM.el&&document.createElement&&document.body){ FM.el=document.createElement('div'); FM.el.className='fmgloc'; document.body.appendChild(FM.el);
    FM.hud=document.createElement('div'); FM.hud.className='fmhud'; document.body.appendChild(FM.hud); }
  if(!FM.el) return; const g=FM.gEn, k=clamp(g,0,1);
  FM.el.style.opacity=String(k); try{ FM.el.style.setProperty('--r',Math.round(70-55*k)+'%'); }catch(e){}
  FM.hud.innerHTML='α '+(FM.a*57.3).toFixed(0)+'° · '+FM.n.toFixed(1)+' G'+(FM.stall?' <b>STALL</b>':(Math.abs(FM.a)>FM_AS*0.85?' <i>α</i>':''));
  FM.hud.classList.toggle('warn',FM.stall); FM.warnT-=dt;
  if(FM.stall&&FM.warnT<=0){ FM.warnT=1.2; try{ sndPlay('cue'); }catch(e){} try{ rumble(120,0.4,0.4); }catch(e){} } }
function fmFxOff(){ if(FM.el){ FM.el.style.opacity='0'; FM.hud.classList.add('hidden'); } }
function fmFxOn(){ if(FM.hud) FM.hud.classList.remove('hidden'); }
update=HOOK.wrap('update','ucus/gercekci-ucus#_fmUpd',function(next){ return function(dt){ next(dt); FM.seen=performance.now();
  if(!(fmReal()&&state==='play'&&!S.onGround&&!S.crashed)){ fmFxOff(); FM.gEn=Math.max(0,FM.gEn-dt); FM.spd=-1; } else fmFxOn(); }; },update);
setInterval(function(){ if(FM.el&&(!FM.seen||performance.now()-FM.seen>300)) fmFxOff(); },300);   /* walking, driving, helicopter, menus */
/* ---- setting: Ayarlar → Uçuş → Uçuş modeli */
(function(){ const st=$('setStab'); const row=st&&st.closest&&st.closest('.srow'); if(!row||!document.createElement) return;
  const r=document.createElement('div'); r.className='srow';
  r.innerHTML='<div class="sl"><b>Uçuş modeli</b><small>Arcade: uçak burnun gösterdiği yere gider · Gerçekçi: hücum açısı ve stol, enerji (sert dönüş hız kaybettirir), tam yerçekimi, gerçek G sınırları, pilotta G etkisi (kararma); otomatik denge kapalı</small></div><div class="seg" id="setFM"><button type="button" data-m="arcade">Arcade</button><button type="button" data-m="real">Gerçekçi</button></div>';
  row.parentNode.insertBefore(r,row);
  r.querySelector('#setFM').addEventListener('click',function(e){ const b=e.target.closest('button[data-m]'); if(!b) return; SETTINGS.fm=b.dataset.m; FM.spd=-1; saveSettings(); syncSettingsUI();
    toast(b.dataset.m==='real'?'Gerçekçi uçuş: hıza ve hücum açısına dikkat':'Arcade uçuş','#b8ecff'); }); })();
syncSettingsUI=HOOK.wrap('syncSettingsUI','ucus/gercekci-ucus#_fmSync',function(next){ return function(){ next(); const s=$('setFM'); if(s&&s.children) Array.prototype.forEach.call(s.children,function(b){ b.setAttribute('aria-pressed',String(b.dataset.m===(SETTINGS.fm||'arcade'))); });
  const c=$('setStab'); if(c){ c.checked=SETTINGS.stab!==false; c.disabled=fmReal(); } };   /* show the player's own choice, unused while realistic */ },syncSettingsUI);
