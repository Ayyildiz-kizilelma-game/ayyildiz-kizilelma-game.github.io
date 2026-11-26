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
  CAMX.cine=null; if(!quiet&&typeof toast==='function') toast('🎥 '+camxName(id),'#b8ecff'); camxDom(); }
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
    const o=document.createElement('div'); o.className='camxov hidden'; o.innerHTML='<i class="cxh"></i><i class="cxv"></i><b class="cxbox"></b><span class="cxtl"></span><span class="cxtr"></span><span class="cxbl"></span>'; const gl=$('gl'); if(gl&&gl.parentNode) gl.parentNode.insertBefore(o,gl.nextSibling); else document.body.appendChild(o); CAMX.ov=o; }
  const on=state==='play'||camxHeliOn(); CAMX.btn.classList.toggle('hidden',!on); if(on){ const t='🎥 '+camxName(camxCur())+' ›'; if(CAMX.btn.textContent!==t) CAMX.btn.textContent=t; } else CAMX.list.classList.add('hidden'); }
function camxListOpen(){ camxDom(); const L=camxList(), c=camxCur(); CAMX.list.innerHTML=L.map(function(x,i){ return '<button type="button" data-v="'+x[0]+'"'+(x[0]===c?' aria-pressed="true"':'')+'>'+(i+1)+' · '+x[1]+'</button>'; }).join(''); CAMX.list.classList.remove('hidden'); }
function camxOverlay(){ try{ camxDom(); }catch(e){} if(!CAMX.ov) return; const on=state==='play'&&camMode===2&&CAMX.v==='belly'&&!!(CUR&&CUR.uav);
  CAMX.ov.classList.toggle('hidden',!on); if(!on) return; CAMX.ovT-=1; if(CAMX.ovT>0) return; CAMX.ovT=6;
  const az=((Math.atan2(-camFwdX(),-camFwdZ())*57.3)%360+360)%360, el=Math.asin(clamp(cxV.set(0,0,-1).applyQuaternion(camera.quaternion).y,-1,1))*57.3, rng=el<-2?S.pos.y/Math.sin(-el/57.3):0;
  const q=CAMX.ov.querySelectorAll('span'); if(!q||q.length<3) return; q[0].textContent='IR · '+Math.round(24/(camera.fov||24)*10)+'×'; q[1].textContent='AZ '+String(Math.round(az)).padStart(3,'0')+'°  EL '+Math.round(el)+'°';
  q[2].textContent=rng?'LRF '+(rng/1000).toFixed(1)+' KM':'LRF —'; }
function camFwdX(){ return cxV2.set(0,0,-1).applyQuaternion(camera.quaternion).x; } function camFwdZ(){ return cxV2.set(0,0,-1).applyQuaternion(camera.quaternion).z; }
