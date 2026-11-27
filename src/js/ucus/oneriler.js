/* ------------------------------------------------------------------ player suggestions (V2.79)
   • Lazer işaretleme: in the UAV EO/IR camera, LAZER now keeps the laser on the point under the crosshair (or on the
     locked point) until pressed again. While a point is lased, laser-guided bombs and missiles (MAM-L, MAM-C, TEBER,
     L-UMTAS…) go to it, also from another aircraft. ATIŞ İSTE calls a KAAN (Kılıç 2) onto the lased point: 8 s later a
     TEBER-82 falls on it. The laser shows as a thin beam and a spot.
   • Ekip modu (single player): OPERATÖR hands the camera to an operator. He finds the nearest ground target ahead
     (6 km), keeps the laser on it and reports; you fly in any view and drop. Network crew (two players) comes later.
   • Fotoğraf modu: field of view slider and four looks (Normal, Sinema, Siyah-beyaz, Sıcak) which go into the photo.
   • Camda yağmur: in the cockpit views of aircraft and helicopters, rain drops on the canopy; they run down when slow
     and are blown back at speed.
   • Kask ekranı (KAAN, T129): looking around in the cockpit, targets in view get a box and their distance; when the
     head is turned away from the HUD, speed, altitude and heading follow the view.
   • İHA kalkışı: on the ground in a UAV, 🛫 Otomatik kalkış: full power, straight down the runway, rotates at take-off
     speed, climbs to 300 m above the ground, gear up, then hands back. Any stick input cancels it. */
const LASE={on:false, p:new THREE.Vector3(), t:0, op:false, opTgt:null, opT:0, strike:null, strikeCd:0, beam:null, spot:null, upT:0};
function laseLaserMun(k){ try{ const mu=typeof munOf==='function'?munOf(activeId,k):null; const s=JSON.stringify(mu||WEAPONS[k]||{}); return /lazer|laser/i.test(s); }catch(e){ return false; } }
function laseTarget(){ return {pos:LASE.p, alive:true, kind:'ground', label:'Lazer noktası', lased:true, r:3}; }
function laseSet(p,quiet){ LASE.on=true; LASE.p.copy(p); LASE.t=0; if(!quiet) toast('🔴 Lazer işaretliyor · '+(camera.position.distanceTo(p)/1000).toFixed(2)+' km','#ff8a7a'); }
function laseOff(quiet){ if(!LASE.on) return; LASE.on=false; if(!quiet) toast('Lazer kapandı','#b8ecff'); }
/* EO/IR buttons: LAZER toggles designation, ATIŞ İSTE, OPERATÖR */
eoirBtn=HOOK.wrap('eoirBtn','ucus/oneriler#_laseBtn',function(next){ return function(k){
  if(k==='laser'){ next(k); if(LASE.on&&!LASE.op){ laseOff(); return; } const h=EOIR.lock||eoirHit(); if(h){ LASE.op=false; laseSet(h); } return; }
  if(k==='strike'){ laseStrike(); return; }
  if(k==='op'){ LASE.op=!LASE.op; LASE.opTgt=null; LASE.opT=0; toast(LASE.op?'👤 Operatör kamerada: hedef arıyor':'👤 Kamera sende','#b8ecff'); if(!LASE.op) laseOff(true); return; }
  next(k); }; },eoirBtn);
function laseStrike(){ if(!LASE.on){ toast('Önce LAZER ile bir nokta işaretle','#ffb25a'); return; } if(LASE.strike||LASE.strikeCd>0){ toast('Kılıç 2: bir sonraki atış '+Math.ceil(Math.max(LASE.strikeCd,LASE.strike?LASE.strike.t:0))+' sn sonra','#ffb25a'); return; }
  LASE.strike={t:8, p:LASE.p.clone(), m:null, ft:0}; LASE.strikeCd=30; toast('📻 Kılıç 2 (KAAN): Lazer noktası görüldü, TEBER bırakıyorum — 8 saniye','#7dffb0'); }
/* guided weapons follow the laser */
dropBomb=HOOK.wrap('dropBomb','ucus/oneriler#_laseBomb',function(next){ return function(){ const k0=selW, before=bombPool.filter(function(b){ return b.on; }).length, r=next.apply(this,arguments);
  if(r&&LASE.on){ const b=bombPool.filter(function(x){ return x.on; }).pop(); if(b&&laseLaserMun(b.w||k0)){ b.tgt=laseTarget(); b.amax=14; toast('Lazer güdümü: bomba işaretli noktaya gidiyor','#ff8a7a'); } } return r; }; },dropBomb);
launchMissile=HOOK.wrap('launchMissile','ucus/oneriler#_laseMis',function(next){ return function(){
  if(!LASE.on||!laseLaserMun(selW)||(lockTgt&&lockTgt.alive&&lockT>=0.6)) return next.apply(this,arguments);
  const sl=lockTgt, st=lockT, so=SETTINGS.lockOn; lockTgt=laseTarget(); lockT=1; SETTINGS.lockOn=true; let r=false;
  try{ r=next.apply(this,arguments); } finally{ lockTgt=sl; lockT=st; SETTINGS.lockOn=so; } if(r) toast('Lazer güdümü: füze işaretli noktaya gidiyor','#ff8a7a'); return r; }; },launchMissile);
/* per frame: follow the crosshair / lock / operator's target; beam and spot; the called strike */
const laseV=new THREE.Vector3();
function laseStep(dt){ if(LASE.strikeCd>0) LASE.strikeCd-=dt;
  const flying=state==='play'&&!S.crashed;
  if(!flying){ if(LASE.beam) LASE.beam.visible=false; if(LASE.spot) LASE.spot.visible=false; if(state==='menu'){ LASE.on=false; LASE.op=false; LASE.strike=null; } return; }
  /* operator: nearest live ground target ahead within 6 km */
  if(LASE.op&&CUR&&CUR.uav){ LASE.opT-=dt; if(!LASE.opTgt||!LASE.opTgt.alive||LASE.opT<=0){ LASE.opT=2; let best=null, bd=6000; fwdOf(S.q,vF);
      if(typeof gtargets!=='undefined') gtargets.forEach(function(o){ if(!o.alive||!o.pos) return; const d=o.pos.distanceTo(S.pos); if(d<bd&&((o.pos.x-S.pos.x)*vF.x+(o.pos.z-S.pos.z)*vF.z)>-d*0.3){ bd=d; best=o; } });
      if(best!==LASE.opTgt){ LASE.opTgt=best; if(best) toast('👤 Operatör: '+(best.label||'hedef')+' işaretlendi · '+(bd/1000).toFixed(1)+' km','#ff8a7a'); } }
    if(LASE.opTgt&&LASE.opTgt.alive) laseSet(LASE.opTgt.pos,true); else laseOff(true); }
  else if(LASE.on&&typeof eoirOn==='function'&&eoirOn()){ LASE.upT-=dt; if(LASE.upT<=0){ LASE.upT=0.2; const h=EOIR.lock||eoirHit(); if(h) LASE.p.copy(h); } }
  if(LASE.on&&LASE.p.distanceTo(S.pos)>12000){ laseOff(); toast('Lazer menzil dışı','#ffb25a'); }
  /* beam from the UAV, and the spot */
  if(!LASE.beam){ const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,-1,0)]); LASE.beam=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xff4a3a,transparent:true,opacity:0.55,depthWrite:false})); LASE.beam.frustumCulled=false; scene.add(LASE.beam);
    LASE.spot=new THREE.Mesh(new THREE.SphereGeometry(1.2,10,8),new THREE.MeshBasicMaterial({color:0xff3a2a,transparent:true,opacity:0.8,depthWrite:false})); scene.add(LASE.spot); }
  const show=LASE.on&&!!(CUR&&CUR.uav); LASE.beam.visible=show; LASE.spot.visible=LASE.on;
  if(LASE.on){ LASE.t+=dt; LASE.spot.position.copy(LASE.p); const k=1+Math.sin(LASE.t*12)*0.35; LASE.spot.scale.set(k,k,k);
    if(show){ const a=LASE.beam.geometry.attributes&&LASE.beam.geometry.attributes.position; if(a&&a.setXYZ){ laseV.set(0,-1,0).applyQuaternion(S.q).add(S.pos); a.setXYZ(0,laseV.x,laseV.y,laseV.z); a.setXYZ(1,LASE.p.x,LASE.p.y,LASE.p.z); a.needsUpdate=true; } } }
  /* the KAAN strike */
  const st=LASE.strike; if(st){ st.t-=dt; if(LASE.on) st.p.copy(LASE.p);
    if(st.t<=3&&!st.m){ st.m=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,2.6,8),new THREE.MeshPhongMaterial({color:0x6b7680})); scene.add(st.m); }
    if(st.m){ const f=clamp(1-st.t/3,0,1), a=new THREE.Vector3(st.p.x-900,st.p.y+1400,st.p.z+600); st.m.position.lerpVectors(a,st.p,f*f); st.m.lookAt(st.p); st.m.rotateX(Math.PI/2); }
    if(st.t<=0){ if(st.m) scene.remove(st.m); try{ bombImpact(st.p.clone(),false,'gp'); explode(st.p,70,11); }catch(e){} toast('📻 Kılıç 2: Hedef vuruldu','#7dffb0'); LASE.strike=null; } } }
update=HOOK.wrap('update','ucus/oneriler#_laseUpd',function(next){ return function(dt){ ato(dt,true); next(dt); ato(dt,false); laseStep(dt); }; },update);
/* ---- UAV automatic take-off */
const ATO={on:false, hd:0, pad:null, btn:null};
function atoStart(){ if(!(state==='play'&&CUR&&CUR.uav&&S.onGround)) return; fwdOf(S.q,vF); ATO.hd=Math.atan2(vF.x,-vF.z); ATO.on=true; S.clearance=true; S.taxi=false; S.brake=false; if(typeof stopTaxi==='function') try{ stopTaxi(); }catch(e){}
  toast('🛫 Otomatik kalkış: tam güç, 300 m\'ye tırmanıyor (kumandaya dokununca bırakır)','#7dffb0'); }
function atoStop(msg){ if(!ATO.on) return; ATO.on=false; if(msg) toast(msg,'#7dffb0'); }
function ato(dt,pre){ if(!ATO.on){ if(pre) atoBtn(); return; }
  if(state!=='play'||S.crashed||!(CUR&&CUR.uav)){ ATO.on=false; return; }
  if(pre){ const user=Math.abs(kb('air','noseUp')-kb('air','noseDown')+TOUCH.pitch+(PAD.on?PAD.pitch:0))+Math.abs(kb('air','rollR')-kb('air','rollL')+TOUCH.roll+(PAD.on?PAD.roll:0));
      if(user>0.3){ atoStop('🛫 Otomatik kalkış bırakıldı — kumanda sende'); return; }
    ATO.pad={p:PAD.pitch,r:PAD.roll,y:PAD.yaw}; S.throttle=1; S.brake=false; fwdOf(S.q,vF); const hd=Math.atan2(vF.x,-vF.z), pitch=Math.asin(clamp(vF.y,-1,1));
    let e=ATO.hd-hd; e=Math.atan2(Math.sin(e),Math.cos(e));
    if(S.onGround){ PAD.roll=clamp(e*4,-1,1); PAD.yaw=0; PAD.pitch=S.speed>CUR.vr*1.02?0.8:0; }
    else { const r=new THREE.Vector3(1,0,0).applyQuaternion(S.q), u=new THREE.Vector3(0,1,0).applyQuaternion(S.q), bank=Math.atan2(-r.y,u.y);
      PAD.roll=clamp(-bank*2+e*0.8,-1,1); PAD.pitch=clamp((0.16-pitch)*4,-1,1); PAD.yaw=0;
      if(S.gear&&S.pos.y-Math.max(terrainH(S.pos.x,S.pos.z),0)>30) try{ toggleGear(); }catch(x){} }
    return; }
  if(ATO.pad){ PAD.pitch=ATO.pad.p; PAD.roll=ATO.pad.r; PAD.yaw=ATO.pad.y; ATO.pad=null; }
  if(!S.onGround&&S.pos.y-Math.max(terrainH(S.pos.x,S.pos.z),0)>300) atoStop('🛫 Otomatik kalkış tamam: 300 m — kumanda sende'); }
function atoBtn(){ if(!document.createElement) return; const on=state==='play'&&!!(CUR&&CUR.uav)&&S.onGround&&!S.crashed&&!ATO.on;
  if(!ATO.btn){ if(!on) return; const b=document.createElement('button'); b.type='button'; b.className='atobtn hidden'; b.textContent='🛫 Otomatik kalkış'; b.addEventListener('click',function(e){ e.stopPropagation(); atoStart(); }); document.body.appendChild(b); ATO.btn=b; }
  ATO.btn.classList.toggle('hidden',!on); }
/* ---- rain on the canopy (cockpit views) */
const RAIN={c:null, x:null, d:[], on:false};
function rainOn(){ if(typeof WX==='undefined'||WX.cur.rain<0.05) return false;
  const ck=(state==='play'&&camMode===1&&!S.crashed)||((state==='walk')&&WALK.mode==='heli'&&HELI.fp);
  if(!ck) return false; const c=camera.position; if(typeof coveredAt==='function'&&coveredAt(c.x,c.y,c.z)) return false; return true; }
function rainStep(dt){ const on=rainOn();
  if(!RAIN.c){ if(!on||!document.createElement) return; RAIN.c=document.createElement('canvas'); RAIN.c.className='ckrain'; const gl=$('gl'); if(gl&&gl.parentNode) gl.parentNode.insertBefore(RAIN.c,gl.nextSibling); else document.body.appendChild(RAIN.c); RAIN.x=RAIN.c.getContext('2d'); }
  RAIN.c.style.display=on?'':'none'; if(!on||!RAIN.x) { RAIN.d.length=0; return; }
  const W=Math.round(innerWidth/2), H=Math.round(innerHeight/2); if(RAIN.c.width!==W||RAIN.c.height!==H){ RAIN.c.width=W; RAIN.c.height=H; }
  const sp=state==='play'?S.speed:Math.hypot(HELI.cur.vx,HELI.cur.vz), fast=clamp(sp/60,0,1), n=Math.round(WX.cur.rain*(60+fast*60));
  while(RAIN.d.length<n) RAIN.d.push({x:Math.random()*W, y:Math.random()*H*0.75, r:1+Math.random()*2.6, v:0, life:2+Math.random()*4});
  const x=RAIN.x; x.clearRect(0,0,W,H); x.lineCap='round';
  for(let i=RAIN.d.length-1;i>=0;i--){ const d=RAIN.d[i]; d.life-=dt;
    if(fast>0.15){ const dx=d.x-W/2, dy=d.y-H*0.45, L=Math.hypot(dx,dy)||1; d.x+=dx/L*fast*260*dt; d.y+=(dy/L*fast*260-30*fast)*dt; }   /* blown outwards from the middle */
    else { d.v+=dt*(d.r>2.2?60:8); d.y+=d.v*dt; }   /* big drops run down */
    if(d.life<=0||d.x<-10||d.x>W+10||d.y>H+10||d.y<-10){ RAIN.d.splice(i,1); continue; }
    const tail=fast>0.15?fast*14:Math.min(d.v*0.2,10); x.strokeStyle='rgba(210,225,240,0.32)'; x.lineWidth=d.r; x.beginPath(); x.moveTo(d.x,d.y); x.lineTo(d.x-(d.x-W/2)*0.02*tail/5,d.y-tail); x.stroke();
    x.fillStyle='rgba(235,245,255,0.45)'; x.beginPath(); x.arc(d.x-d.r*0.25,d.y-d.r*0.25,d.r*0.4,0,6.283); x.fill(); } }
/* ---- helmet display (KAAN fighters, T129) */
const HMD_ON={kaan:1, t129:1}, hmdV=new THREE.Vector3();
function hmdKind(){ if(state==='play'&&camMode===1&&!S.crashed&&HMD_ON[activeId]) return 'air'; if(state==='walk'&&WALK.mode==='heli'&&HELI.fp&&HELI.cur&&HMD_ON[HELI.cur.id]) return 'heli'; return null; }
function hmdDraw(){ const k=hmdKind(); if(!k||typeof hx==='undefined'||!hud) return; const W=hud.width, H=hud.height, s=H/900;
  hx.save(); hx.strokeStyle='rgba(125,255,176,0.9)'; hx.fillStyle='rgba(125,255,176,0.95)'; hx.lineWidth=Math.max(1.5,2*s); hx.font='700 '+Math.round(13*s)+'px "Chakra Petch",monospace'; hx.textAlign='center'; hx.textBaseline='top';
  const box=function(p,lbl,red){ hmdV.copy(p).project(camera); if(hmdV.z>1||Math.abs(hmdV.x)>0.95||Math.abs(hmdV.y)>0.95) return; const x=(hmdV.x+1)/2*W, y=(1-hmdV.y)/2*H, r=14*s;
    hx.strokeStyle=red?'rgba(255,120,100,0.95)':'rgba(125,255,176,0.9)'; hx.strokeRect(x-r,y-r,2*r,2*r); hx.fillStyle=hx.strokeStyle; hx.fillText(lbl,x,y+r+3*s); };
  const me=k==='air'?S.pos:new THREE.Vector3(HELI.cur.x,HELI.cur.y,HELI.cur.z);
  if(typeof gtargets!=='undefined') gtargets.forEach(function(o){ if(o.alive&&o.pos){ const d=o.pos.distanceTo(me); if(d<15000) box(o.pos,(d/1000).toFixed(1)+' km',true); } });
  if(typeof targets!=='undefined') targets.forEach(function(o){ if(o.alive&&o.pos){ const d=o.pos.distanceTo(me); if(d<15000) box(o.pos,(d/1000).toFixed(1)+' km',true); } });
  if(typeof ACT!=='undefined') ACT.forEach(function(a){ if(a.alive&&a.pos&&a.pos.distanceTo(me)<15000) box(a.pos,a.team==='red'?'DÜŞMAN':'DOST',a.team==='red'); });
  if(LASE.on) box(LASE.p,'LAZER',true);
  /* off the HUD: the flight data follows the head */
  const away=k==='air'?(Math.abs(CAMU.yaw)>0.35||Math.abs(CAMU.pitch)>0.3):(Math.abs(WALK.cy||0)>0.35||Math.abs(WALK.pitch||0)>0.3);
  if(away){ let spd, alt, hdg; if(k==='air'){ fwdOf(S.q,vF); spd=S.speed*3.6; alt=S.pos.y; hdg=Math.atan2(vF.x,-vF.z); } else { const Hh=HELI.cur; spd=Math.hypot(Hh.vx,Hh.vz)*3.6; alt=Hh.y; hdg=-Hh.h; }
    const y=H*0.7; hx.fillStyle='rgba(125,255,176,0.95)'; hx.font='700 '+Math.round(16*s)+'px "Chakra Petch",monospace';
    hx.textAlign='right'; hx.fillText(Math.round(spd)+' KM/SA',W/2-30*s,y); hx.textAlign='left'; hx.fillText(Math.round(alt)+' M',W/2+30*s,y);
    hx.textAlign='center'; hx.fillText(String(Math.round(((hdg*57.3)%360+360)%360)).padStart(3,'0')+'°',W/2,y+22*s); hx.strokeRect(W/2-8*s,y+2*s,16*s,12*s); }
  hx.restore(); }
drawHUD=HOOK.wrap('drawHUD','ucus/oneriler#_hmd',function(next){ return function(){ const r=next.apply(this,arguments); try{ hmdDraw(); }catch(e){} return r; }; },drawHUD);
heliHUD=HOOK.wrap('heliHUD','ucus/oneriler#_hmdHeli',function(next){ return function(w,h,s){ const r=next.apply(this,arguments); try{ hmdDraw(); }catch(e){} return r; }; },heliHUD);
/* ---- photo mode: field of view and looks */
const PHX={fov:0, look:'normal', bar:null};
const PHX_LOOK={normal:['Normal',''], cine:['Sinema','contrast(1.15) saturate(0.85) sepia(0.15) brightness(0.95)'], bw:['Siyah-beyaz','grayscale(1) contrast(1.2)'], warm:['Sıcak','sepia(0.35) saturate(1.3) brightness(1.04)']};
function phxUI(){ const bar=$('photoBar'); if(!bar||PHX.bar||!document.createElement) return; const d=document.createElement('div'); d.className='phx';
  d.innerHTML='<label>Görüş açısı <input type="range" min="15" max="100" value="60" id="phxFov"></label><div class="seg" id="phxLook">'+Object.keys(PHX_LOOK).map(function(k){ return '<button type="button" data-v="'+k+'"'+(k==='normal'?' aria-pressed="true"':'')+'>'+PHX_LOOK[k][0]+'</button>'; }).join('')+'</div>';
  bar.appendChild(d); PHX.bar=d;
  d.querySelector('#phxFov').addEventListener('input',function(e){ PHX.fov=+e.target.value; });
  d.querySelector('#phxLook').addEventListener('click',function(e){ const b=e.target.closest('button[data-v]'); if(!b) return; PHX.look=b.dataset.v; Array.prototype.forEach.call(d.querySelectorAll('#phxLook button'),function(x){ x.setAttribute('aria-pressed',String(x===b)); }); phxApply(); }); }
function phxApply(){ const el=$('gl'); if(!el||!el.style) return; if(state==='photo'){ el.style.filter=PHX_LOOK[PHX.look][1]; PHX.applied=true; } }
function phxClear(){ if(!PHX.applied) return; PHX.applied=false; PHX.fov=0; const el=$('gl'); if(el&&el.style) el.style.filter=''; if(typeof visApply==='function') visApply(); }
enterPhoto=HOOK.wrap('enterPhoto','ucus/oneriler#_phxIn',function(next){ return function(){ next(); if(state!=='photo') return; phxUI(); PHX.fov=camera.fov||60; PHX.applied=true; const f=PHX.bar&&PHX.bar.querySelector('#phxFov'); if(f) f.value=String(Math.round(PHX.fov)); phxApply(); }; },enterPhoto);
cameraUpdate=HOOK.wrap('cameraUpdate','ucus/oneriler#_phxCam',function(next){ return function(dt){ next(dt); if(state!=='photo') phxClear(); if(state==='photo'&&PHX.fov&&Math.abs(camera.fov-PHX.fov)>0.05){ camera.fov=PHX.fov; lastFov=PHX.fov; camera.updateProjectionMatrix(); }
  try{ rainStep(dt); }catch(e){} }; },cameraUpdate);
walkCam=HOOK.wrap('walkCam','ucus/oneriler#_rainWalk',function(next){ return function(dt){ next(dt); try{ rainStep(dt); }catch(e){} }; },walkCam);
/* the chosen look goes into the saved photo too (runs after the game's own photo button handler) */
function phxShot(){ const f=PHX_LOOK[PHX.look][1], img=$('photoImg'); if(!f||!img||!img.src||!document.createElement) return;
  const src=new Image(); src.onload=function(){ try{ const c=document.createElement('canvas'); c.width=src.width; c.height=src.height; const x=c.getContext('2d'); x.filter=f; x.drawImage(src,0,0); img.src=c.toDataURL('image/png'); }catch(e){} }; src.src=img.src; }
(function(){ const b=$('btnShot'); if(b&&b.addEventListener) b.addEventListener('click',phxShot); })();
