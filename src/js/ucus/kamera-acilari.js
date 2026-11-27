/* ------------------------------------------------------------------ camera angles (V2.77)
   One camera button (C key, the 📷 touch button or the 🎥 chip on screen) steps through every view of the vehicle;
   a long press (or right click) on the chip opens the list.
     Aircraft (KAAN, Hürjet, Hürkuş…):  Kokpit · Takip · Burun · Kuyruk · Gövde altı · Sinematik
     UAVs (TB2, TB3, Akıncı, ANKA, Aksungur, Kızılelma): Sensör / yer istasyonu · Takip · Burun (FPV) · Kuyruk ·
       Gövde altı EO/IR (zoomed gimbal camera with crosshair) · Kanat altı (watch the munitions) · Taktik (from above)
     Helicopters: Kokpit · Takip · Burun altı · Kuyruk · Gövde altı (the cargo hook) · Sinematik
   The new views are camMode 2 (0 chase and 1 cockpit stay as before). Each camera sits on the model's real surface:
   the model is measured once per vehicle (bounding box plus rays onto the nose, the spine, the belly and the wing).
   Dragging still looks around in every view. The cinematic view is a fly-by: a fixed point ahead of the flight path,
   the lens zooms with distance, and it moves on once the vehicle has passed. */
const CAMX={v:'chase', cine:null, cineT:0, dims:{}, btn:null, list:null, ov:null, ovT:0, pressT:0};
const CAMX_AIR=[['cockpit','Kokpit'],['chase','Takip'],['nose','Burun kamerası'],['tail','Kuyruk kamerası'],['belly','Gövde altı'],['cine','Sinematik']];
const CAMX_UAV=[['cockpit','Sensör / yer istasyonu'],['chase','Takip'],['nose','Burun (FPV)'],['tail','Kuyruk kamerası'],['belly','Gövde altı EO/IR'],['wing','Kanat altı'],['tac','Taktik (üstten)']];
const CAMX_HELI=[['fp','Kokpit'],['chase','Takip'],['nose','Burun altı'],['tail','Kuyruk'],['belly','Gövde altı (kanca)'],['cine','Sinematik']];
function camxHeliOn(){ return (state==='walk'||(state==='paused'&&WALK.from==='walk'))&&WALK.mode==='heli'&&!!HELI.cur; }
function camxList(){ if(camxHeliOn()) return CAMX_HELI; return CUR&&CUR.uav?CAMX_UAV:CAMX_AIR; }
function camxCur(){ if(camxHeliOn()) return HELI.fp?'fp':(HELI.view||'chase'); if(camMode===1) return 'cockpit'; if(camMode===0) return 'chase'; return CAMX.v; }
function camxName(id){ const L=camxList(), e=L.find(function(x){ return x[0]===id; }); return e?e[1]:id; }
function camxSet(id,quiet){ const L=camxList(); if(!L.some(function(x){ return x[0]===id; })) id=L[1][0];
  if(camxHeliOn()){ HELI.fp=id==='fp'; HELI.view=id==='fp'?'chase':id; WALK.pitch=0; WALK.cy=0; }
  else { if(id==='cockpit') camMode=1; else if(id==='chase') camMode=0; else { camMode=2; CAMX.v=id; } camSnap=true; CAMU.yaw=0; CAMU.pitch=0; CAMU.zoom=1; }
  CAMX.cine=null; if(typeof EOIR!=='undefined'){ EOIR.lock=null; EOIR.lrf=null; } if(!quiet&&typeof toast==='function') toast('🎥 '+camxName(id),'#b8ecff'); camxDom(); }
function camxNext(){ const L=camxList(), i=L.findIndex(function(x){ return x[0]===camxCur(); }); camxSet(L[(i+1)%L.length][0]); }
function heliCamCycle(){ camxNext(); }
toggleCam=HOOK.wrap('toggleCam','ucus/kamera-acilari#_camxToggle',function(next){ return function(){ if(state!=='play'){ next(); return; } camxNext(); }; },toggleCam);
/* ---- measuring the model: local bounds and surface heights (rays straight down / up in the model's own frame) */
const cxB=new THREE.Vector3(), cxQ=new THREE.Quaternion(), cxP=new THREE.Vector3(), cxE=new THREE.Euler(0,0,0,'YXZ'), cxQ2=new THREE.Quaternion(), cxV=new THREE.Vector3(), cxV2=new THREE.Vector3();
function camxRay(obj,x,z,up,y0){ try{ const r=new THREE.Raycaster(new THREE.Vector3(x,y0,z),new THREE.Vector3(0,up?1:-1,0),0,200); const h=r.intersectObject(obj,true).filter(function(i){ return i.object.visible!==false; });
  return h.length?h[0].point.y:null; }catch(e){ return null; } }
function camxMeasure(key,obj){ if(CAMX.dims[key]) return CAMX.dims[key]; let d=null;
  try{ cxP.copy(obj.position); cxQ.copy(obj.quaternion); obj.position.set(0,0,0); obj.quaternion.identity(); obj.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(obj), mn=b.min, mx=b.max;
    if(isFinite(mn.x)&&isFinite(mx.x)&&mx.z>mn.z){ const L=mx.z-mn.z, W=mx.x-mn.x, zc=(mn.z+mx.z)/2;
      const nz=mn.z+L*0.1, top=camxRay(obj,0,nz,false,mx.y+5), bot=camxRay(obj,0,zc,true,mn.y-5), spine=camxRay(obj,0,mx.z-L*0.2,false,mx.y+5);
      const wx=mx.x*0.45, wing=camxRay(obj,wx,zc,true,mn.y-5);
      d={min:{x:mn.x,y:mn.y,z:mn.z}, max:{x:mx.x,y:mx.y,z:mx.z}, L:L, W:W, zc:zc, noseTop:top!=null?top:(mn.y+mx.y)/2, noseZ:nz, belly:bot!=null?bot:mn.y, spine:spine!=null?spine:mx.y, wingX:wx, wingY:wing!=null?wing:mn.y+(mx.y-mn.y)*0.3}; }
    obj.position.copy(cxP); obj.quaternion.copy(cxQ); obj.updateMatrixWorld(true); }catch(e){ try{ obj.position.copy(cxP); obj.quaternion.copy(cxQ); }catch(e2){} }
  if(!d){ const L=16; d={min:{x:-6,y:-1.5,z:-L/2}, max:{x:6,y:2,z:L/2}, L:L, W:12, zc:0, noseTop:0.6, noseZ:-L*0.4, belly:-1.2, spine:1.2, wingX:2.7, wingY:-0.2}; }
  CAMX.dims[key]=d; return d; }
/* ---- view definitions in the vehicle's frame: [x,y,z] offset and [pitch,yaw] look, fov */
function camxPose(v,d,uav,heli){ const L=d.L;
  if(v==='nose') return heli?{p:[0,d.belly+0.35,d.min.z+L*0.08],r:[-0.18,0],fov:70}
                     :{p:[0,d.noseTop+(uav?0.12:0.6),d.noseZ+(uav?-L*0.05:L*0.1)],r:[uav?-0.04:-0.15,0],fov:uav?62:70};
  if(v==='tail') return {p:[0,Math.max(d.spine,d.max.y*(heli?0.62:1))+(heli?0.3:0.55),d.max.z-L*(heli?0.12:0.08)],r:[-0.1,0],fov:68};
  if(v==='belly') return {p:[0,d.belly-(heli?0.35:0.45),d.zc+(heli?0:L*0.05)],r:[uav?-1.05:(heli?-1.45:-0.9),0],fov:uav?24:(heli?60:58)};
  if(v==='wing') return {p:[d.wingX+0.25,d.wingY-0.55,d.zc+L*0.28],r:[0.02,0.12],fov:66};
  return null; }
function camxApply(pose,pos,q,dt){ camera.position.copy(cxV.set(pose.p[0],pose.p[1],pose.p[2]).applyQuaternion(q).add(pos));
  cxE.set(pose.r[0]+CAMU.pitch,pose.r[1]+CAMU.yaw,0); camera.quaternion.copy(q).multiply(cxQ2.setFromEuler(cxE));
  const gy=Math.max(terrainH(camera.position.x,camera.position.z),0)+0.3; if(camera.position.y<gy) camera.position.y=gy;
  const fov=pose.fov; if(Math.abs(fov-lastFov)>0.05){ camera.fov=fov; lastFov=fov; camera.updateProjectionMatrix(); } camera.updateMatrixWorld(); }
/* fly-by: a fixed spot ahead of the path, a little to the side; moves on once the vehicle has passed */
function camxCine(pos,fwd,speed,L,dt){ const c=CAMX.cine; CAMX.cineT+=dt;
  const far=!c||camera.position.distanceTo(pos)>L*40||(c&&cxV2.copy(pos).sub(c).dot(fwd)>L*6)||CAMX.cineT>14;
  if(far){ const side=(Math.random()<0.5?-1:1); cxV.set(-fwd.z,0,fwd.x).normalize();
    CAMX.cine=new THREE.Vector3().copy(pos).addScaledVector(fwd,Math.max(L*5,speed*3)).addScaledVector(cxV,side*L*(1.2+Math.random()*1.5)); CAMX.cine.y+=L*(0.2+Math.random()*0.5);
    const g=Math.max(terrainH(CAMX.cine.x,CAMX.cine.z),0)+3; if(CAMX.cine.y<g) CAMX.cine.y=g; CAMX.cineT=0; }
  camera.position.copy(CAMX.cine); camera.lookAt(pos); const dist=camera.position.distanceTo(pos);
  const fov=clamp(2*Math.atan(L*1.6/Math.max(dist,1))*57.3,8,60); if(Math.abs(fov-lastFov)>0.05){ camera.fov=fov; lastFov=fov; camera.updateProjectionMatrix(); } camera.updateMatrixWorld(); }
function camxAir(dt){ const d=camxMeasure('air-'+activeId,planeGroup), v=CAMX.v, uav=!!(CUR&&CUR.uav); planeGroup.visible=!S.crashed;
  if(v==='cine'){ fwdOf(S.q,vF); camxCine(S.pos,vF,S.speed,d.L,dt); return; }
  if(v==='tac'){ fwdOf(S.q,vF); const hd=Math.atan2(-vF.x,-vF.z), h=Math.max(400,S.pos.y*0.6)*(CAMU.zoom||1);
    camera.position.set(S.pos.x,S.pos.y+h,S.pos.z); camera.quaternion.setFromEuler(cxE.set(-Math.PI/2,hd,0)); if(Math.abs(45-lastFov)>0.05){ camera.fov=45; lastFov=45; camera.updateProjectionMatrix(); } camera.updateMatrixWorld(); return; }
  const pose=camxPose(v,d,uav,false); if(!pose){ camMode=0; return; } camxApply(pose,S.pos,S.q,dt); }
cameraUpdate=HOOK.wrap('cameraUpdate','ucus/kamera-acilari#_camxCam',function(next){ return function(dt){ next(dt); if(camMode===2&&state!=='menu'){ try{ camxAir(dt); }catch(e){} } camxOverlay(); }; },cameraUpdate);
/* helicopters */
const cxHQ=new THREE.Quaternion(), cxHP=new THREE.Vector3(), cxHF=new THREE.Vector3();
function heliCamX(dt){ const H=HELI.cur, d=camxMeasure('heli-'+H.id,H.m.g), v=HELI.view;
  cxHQ.setFromEuler(cxE.set(H.pitch*-0.9,H.h,-H.roll*0.9)); cxHP.set(H.x,H.y,H.z);
  if(v==='cine'){ cxHF.set(-Math.sin(H.h),0,-Math.cos(H.h)); const sp=Math.hypot(H.vx,H.vz); if(sp>2) cxHF.set(H.vx,0,H.vz).normalize(); camxCine(cxHP,cxHF,sp,d.L,dt); return; }
  const pose=camxPose(v,d,false,true); if(!pose){ HELI.view='chase'; return; } cxE.set(0,0,0);
  const sv=[CAMU.pitch,CAMU.yaw]; CAMU.pitch=WALK.pitch||0; CAMU.yaw=WALK.cy||0; camxApply(pose,cxHP,cxHQ,dt); CAMU.pitch=sv[0]; CAMU.yaw=sv[1]; }
heliCam=HOOK.wrap('heliCam','ucus/kamera-acilari#_camxHeli',function(next){ return function(dt){ if(!HELI.fp&&HELI.view&&HELI.view!=='chase'&&HELI.cur){ try{ heliCamX(dt); camxOverlay(); return; }catch(e){ HELI.view='chase'; } } next(dt); camxOverlay(); }; },heliCam);
heliBoard=HOOK.wrap('heliBoard','ucus/kamera-acilari#_camxBoard',function(next){ return function(H){ HELI.view='chase'; CAMX.cine=null; return next(H); }; },heliBoard);
/* ---- on screen: the camera chip (tap = next view, long press / right click = list) and the EO/IR overlay of the UAV belly camera */
function camxDom(){ if(!document.createElement) return;
  if(!CAMX.btn){ const b=document.createElement('button'); b.type='button'; b.className='cambtn hidden';
    b.addEventListener('pointerdown',function(){ CAMX.pressT=Date.now(); }); b.addEventListener('contextmenu',function(e){ e.preventDefault(); camxListOpen(); });
    b.addEventListener('click',function(e){ e.stopPropagation(); if(Date.now()-CAMX.pressT>550) camxListOpen(); else camxNext(); }); document.body.appendChild(b); CAMX.btn=b;
    const l=document.createElement('div'); l.className='camxlist hidden'; l.addEventListener('click',function(e){ const t=e.target.closest('button[data-v]'); if(t){ camxSet(t.dataset.v); } l.classList.add('hidden'); e.stopPropagation(); }); document.body.appendChild(l); CAMX.list=l;
    const o=document.createElement('div'); o.className='camxov hidden'; o.innerHTML='<i class="cxh"></i><i class="cxv"></i><b class="cxbox"></b><span class="cxtl"></span><span class="cxtr"></span><span class="cxbl"></span><span class="cxlk"></span><i class="cxn">▲<br>K</i><canvas class="cxmap" width="160" height="160"></canvas><div class="cxbtns"><button type="button" data-e="mode">EO / IR</button><button type="button" data-e="out">−</button><button type="button" data-e="in">+</button><button type="button" data-e="lock">KİLİTLE</button><button type="button" data-e="laser">LAZER</button><button type="button" data-e="strike">ATIŞ İSTE</button><button type="button" data-e="op">OPERATÖR</button></div>'; o.addEventListener('click',function(e){ const b=e.target.closest('button[data-e]'); if(!b) return; e.stopPropagation(); eoirBtn(b.dataset.e); }); const gl=$('gl'); if(gl&&gl.parentNode) gl.parentNode.insertBefore(o,gl.nextSibling); else document.body.appendChild(o); CAMX.ov=o; }
  const on=state==='play'||camxHeliOn(); CAMX.btn.classList.toggle('hidden',!on); if(on){ const t='🎥 '+camxName(camxCur())+' ›'; if(CAMX.btn.textContent!==t) CAMX.btn.textContent=t; } else CAMX.list.classList.add('hidden'); }
function camxListOpen(){ camxDom(); const L=camxList(), c=camxCur(); CAMX.list.innerHTML=L.map(function(x,i){ return '<button type="button" data-v="'+x[0]+'"'+(x[0]===c?' aria-pressed="true"':'')+'>'+(i+1)+' · '+x[1]+'</button>'; }).join(''); CAMX.list.classList.remove('hidden'); }
/* ---- V2.78: the UAV EO/IR gimbal camera (belly view): day (EO) or thermal white-hot (IR), 1× · 4× · 12× · 24× zoom,
   KİLİTLE holds the camera on a ground point while the UAV flies on, LAZER measures the range and the coordinates of the
   point under the crosshair. North arrow and a small map with the UAV, the look line and the locked point. */
const EOIR={mode:'ir', zi:1, Z:[[40,'1×'],[12,'4×'],[4,'12×'],[1.8,'24×']], lock:null, lrf:null, lrfT:0, filt:false};
function eoirOn(){ return state==='play'&&camMode===2&&CAMX.v==='belly'&&!!(CUR&&CUR.uav); }
function eoirHit(){ const o=camera.position, f=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); let t=0, st=15;
  for(let i=0;i<900&&t<40000;i++){ t+=st; const y=o.y+f.y*t, g=Math.max(terrainH(o.x+f.x*t,o.z+f.z*t),0);
    if(y<=g){ let a=t-st, b=t; for(let k=0;k<14;k++){ const m=(a+b)/2; if(o.y+f.y*m<=Math.max(terrainH(o.x+f.x*m,o.z+f.z*m),0)) b=m; else a=m; } return new THREE.Vector3(o.x+f.x*b,o.y+f.y*b,o.z+f.z*b); }
    st=Math.min(250,st*1.04); } return null; }
function eoirBtn(k){ if(k==='mode'){ EOIR.mode=EOIR.mode==='ir'?'eo':'ir'; toast(EOIR.mode==='ir'?'Termal kamera (IR)':'Gündüz kamerası (EO)','#b8ecff'); }
  else if(k==='in') EOIR.zi=Math.min(3,EOIR.zi+1); else if(k==='out') EOIR.zi=Math.max(0,EOIR.zi-1);
  else if(k==='lock'){ if(EOIR.lock){ EOIR.lock=null; toast('Kilit bırakıldı','#b8ecff'); } else { const h=eoirHit(); if(h){ EOIR.lock=h; toast('🎯 Nokta kilitlendi','#ffd27a'); } else toast('Kilit: zemin görünmüyor','#ffb25a'); } }
  else if(k==='laser'){ const h=eoirHit(); if(h){ EOIR.lrf={d:camera.position.distanceTo(h), x:h.x, z:h.z, y:h.y}; EOIR.lrfT=10; } else { EOIR.lrf=null; toast('LAZER: menzil dışı','#ffb25a'); } }
  CAMX.ovT=0; }
/* aim: zoomed field of view, and the locked point stays under the crosshair */
function eoirAim(){ if(!eoirOn()) return; const f=EOIR.Z[EOIR.zi][0]; if(EOIR.lock){ camera.lookAt(EOIR.lock); camera.updateMatrixWorld(); }
  if(Math.abs(camera.fov-f)>0.01){ camera.fov=f; lastFov=f; camera.updateProjectionMatrix(); } }
try{ window.addEventListener('wheel',function(e){ if(!eoirOn()) return; eoirBtn(e.deltaY<0?'in':'out'); },{passive:true}); }catch(e){}
function eoirFilter(on){ const el=$('gl'); if(!el||!el.style) return;
  const hud=$('hud');
  if(on){ const f=EOIR.mode==='ir'?'grayscale(1) brightness(0.62) contrast(1.7)':'saturate(1.05) contrast(1.06)'; if(el.style.filter!==f) el.style.filter=f; EOIR.filt=true; if(hud&&hud.style&&hud.style.opacity!=='0.3') hud.style.opacity='0.3'; }
  else if(EOIR.filt){ EOIR.filt=false; el.style.filter=''; if(hud&&hud.style) hud.style.opacity=''; if(typeof visApply==='function') visApply(); } }
function eoirMap(cv,hd){ const x=cv.getContext&&cv.getContext('2d'); if(!x) return; const W=cv.width, H=cv.height, R=W/2, rng=6000, s=R/rng;
  x.clearRect(0,0,W,H); x.fillStyle='rgba(6,18,12,.85)'; x.beginPath(); x.arc(R,R,R-1,0,6.283); x.fill(); x.strokeStyle='#2c8a52'; x.lineWidth=1; x.beginPath(); x.arc(R,R,R*0.5,0,6.283); x.stroke(); x.beginPath(); x.arc(R,R,R-1,0,6.283); x.stroke();
  const P=function(wx,wz){ const dx=wx-S.pos.x, dz=wz-S.pos.z; return [R+dx*s, R+dz*s]; };   /* north up */
  if(typeof gtargets!=='undefined') gtargets.forEach(function(t){ if(!t.alive||!t.pos) return; const q=P(t.pos.x,t.pos.z); if(Math.hypot(q[0]-R,q[1]-R)<R) { x.fillStyle='#ffb25a'; x.fillRect(q[0]-2,q[1]-2,4,4); } });
  const h=eoirHit(); if(h){ const q=P(h.x,h.z); x.strokeStyle='#ffe14a'; x.beginPath(); x.moveTo(R,R); x.lineTo(q[0],q[1]); x.stroke(); }
  if(EOIR.lock){ const q=P(EOIR.lock.x,EOIR.lock.z); x.strokeStyle='#ff5a4a'; x.lineWidth=2; x.strokeRect(q[0]-5,q[1]-5,10,10); }
  x.save(); x.translate(R,R); x.rotate(-hd); x.fillStyle='#e6fff0'; x.beginPath(); x.moveTo(0,-7); x.lineTo(5,6); x.lineTo(0,3); x.lineTo(-5,6); x.closePath(); x.fill(); x.restore();
  x.fillStyle='#5dff9a'; x.font='700 10px monospace'; x.textAlign='center'; x.fillText('6 km',R,H-6); }
function camxOverlay(){ try{ camxDom(); }catch(e){} if(!CAMX.ov) return; const on=eoirOn();
  CAMX.ov.classList.toggle('hidden',!on); eoirFilter(on); if(!on) return; eoirAim(); if(EOIR.lrfT>0) EOIR.lrfT-=1/30; CAMX.ovT-=1; if(CAMX.ovT>0) return; CAMX.ovT=6;
  const fx=camFwdX(), fz=camFwdZ(), az=((Math.atan2(fx,-fz)*57.3)%360+360)%360, el=Math.asin(clamp(cxV.set(0,0,-1).applyQuaternion(camera.quaternion).y,-1,1))*57.3;
  const q=CAMX.ov.querySelectorAll('span'); if(!q||q.length<4) return;
  q[0].textContent=(EOIR.mode==='ir'?'IR · BEYAZ SICAK':'EO · GÜNDÜZ')+' · '+EOIR.Z[EOIR.zi][1]+' · FOV '+EOIR.Z[EOIR.zi][0]+'°';
  q[1].textContent='AZ '+String(Math.round(az)).padStart(3,'0')+'°  EL '+Math.round(el)+'°';
  const L=EOIR.lrf; q[2].textContent=L&&EOIR.lrfT>0?'LRF '+(L.d/1000).toFixed(2)+' KM · HEDEF X '+(L.x/1000).toFixed(2)+' · Z '+(L.z/1000).toFixed(2)+' · '+Math.round(L.y)+' M':'LAZER: mesafe ölç';
  q[3].textContent=EOIR.lock?'● KİLİTLİ':'';
  const n=CAMX.ov.querySelector('.cxn'); if(n&&n.style) n.style.transform='rotate('+(-az)+'deg)';
  const cv=CAMX.ov.querySelector('.cxmap'); fwdOf(S.q,vF); if(cv) eoirMap(cv,Math.atan2(vF.x,-vF.z)); }
function camFwdX(){ return cxV2.set(0,0,-1).applyQuaternion(camera.quaternion).x; } function camFwdZ(){ return cxV2.set(0,0,-1).applyQuaternion(camera.quaternion).z; }
