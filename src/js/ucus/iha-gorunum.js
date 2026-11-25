/* ------------------------------------------------------------------ UAV views (V2.74)
   An unmanned aircraft has no cockpit: its "inside" view (camera C) is chosen in Ayarlar → Uçuş → İHA görünümü, or in
   flight with the 📺 button at the top left:
   • Sensör (as before): the nose EO/IR camera with its frame.
   • Yer kontrol istasyonu: the view becomes the operator's console: a top bar (link, time, aircraft), telemetry on the
     left (altitude, speed, heading, climb, fuel, engine, G), the tactical map and the payload on the right, the desk at
     the bottom; the video in the middle carries a time stamp and scan lines. The flight HUD stays on top.
   • VR: side-by-side stereo for phone VR glasses (Cardboard-type), each eye with its lens mask; turning the head turns the
     view (phone motion sensor; off while tilt steering is on). Drawn twice, without the effect passes: heavier on the
     phone, so the effects pause. The flight HUD hides; touch controls stay.
   Manned aircraft and helicopters have their own 3D cockpits (ucus/kokpit). */
const UV={btn:null, gcs:null, map:null, mx:null, t:0, mask:null, st:null, sz:null, ori:null, ref:null, q:null};
const UV_NAMES={sensor:'Sensör', gcs:'Yer kontrol istasyonu', vr:'VR'};
function uavView(){ const v=SETTINGS.uavView; return v==='gcs'||v==='vr'?v:'sensor'; }
function uavIn(){ return (state==='play'||state==='paused')&&camMode===1&&!!(typeof CUR!=='undefined'&&CUR&&CUR.uav)&&!S.crashed; }
function uavVR(){ return state==='play'&&uavIn()&&uavView()==='vr'; }
function uavSet(v){ SETTINGS.uavView=v; saveSettings(); syncSettingsUI(); UV.ref=null; if(v==='vr') uavOriStart(); toast('İHA görünümü: '+UV_NAMES[v]+(v==='vr'?' · telefonu VR gözlüğe tak':''),'#b8ecff'); uavDom(); }
function uavCycle(){ const L=['sensor','gcs','vr'], i=L.indexOf(uavView()); uavSet(L[(i+1)%L.length]); }
/* ---- DOM: the button, the ground control station frame, the VR lens mask */
function uavBuild(){ if(UV.btn||!document.createElement) return; const hud=$('hud');
  UV.btn=document.createElement('button'); UV.btn.type='button'; UV.btn.className='uvbtn hidden'; UV.btn.addEventListener('click',function(e){ e.stopPropagation(); uavCycle(); }); document.body.appendChild(UV.btn);
  UV.gcs=document.createElement('div'); UV.gcs.className='gcs hidden';
  UV.gcs.innerHTML='<div class="gcstop"><b>YER KONTROL İSTASYONU</b><span id="gcsAc"></span><span id="gcsLink"></span><span id="gcsClk"></span></div>'+
    '<div class="gcsL" id="gcsL"></div><div class="gcsR"><canvas id="gcsMap" width="256" height="200"></canvas><div id="gcsP"></div></div>'+
    '<div class="gcsScr"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><span id="gcsTs"></span></div>'+
    '<div class="gcsB"><div class="gk"><span>UÇUŞ KUMANDASI</span><i></i></div><div class="gkb">'+'<i></i>'.repeat(14)+'</div><div class="gk"><span>FAYDALI YÜK</span><i></i></div></div>';
  if(hud&&hud.parentNode) hud.parentNode.insertBefore(UV.gcs,hud); else document.body.appendChild(UV.gcs);
  UV.mask=document.createElement('div'); UV.mask.className='vrmask hidden'; UV.mask.innerHTML='<i></i><i></i><b></b>'; document.body.appendChild(UV.mask);
  UV.map=$('gcsMap'); UV.mx=UV.map&&UV.map.getContext&&UV.map.getContext('2d'); }
function uavDom(){ uavBuild(); if(!UV.btn) return; const inn=uavIn()&&state==='play', v=uavView();
  UV.btn.classList.toggle('hidden',!inn); UV.btn.textContent='📺 '+UV_NAMES[v]+' ›';
  UV.gcs.classList.toggle('hidden',!(inn&&v==='gcs')); UV.mask.classList.toggle('hidden',!(inn&&v==='vr'));
  const hud=$('hud'); if(hud&&hud.style) hud.style.visibility=inn&&v==='vr'?'hidden':''; }
function uavRow(k,v,c){ return '<p><small>'+k+'</small><b'+(c?' style="color:'+c+'"':'')+'>'+v+'</b></p>'; }
function uavGcs(){ if(!UV.gcs||UV.gcs.classList.contains('hidden')) return; fwdOf(S.q,vF);
  const hdg=((Math.atan2(vF.x,-vF.z)*57.3)%360+360)%360, d=new Date(), real=typeof REALP!=='undefined'&&REALP[activeId];
  $('gcsAc').textContent=(AIRCRAFT[activeId].short||activeId).toUpperCase()+' · '+(accProfile().callsign||'HİLAL 1').toLocaleUpperCase('tr-TR');
  const dist=Math.hypot(S.pos.x,S.pos.z), link=Math.max(40,Math.round(100-dist/300)); $('gcsLink').textContent=(dist>9000?'SATCOM':'LOS')+' · LİNK %'+link;
  $('gcsClk').textContent=d.toISOString().slice(11,19)+' UTC';
  $('gcsTs').textContent='EO · '+d.toISOString().slice(0,10)+' '+d.toISOString().slice(11,19)+' · '+(S.pos.x/1000).toFixed(2)+' / '+(S.pos.z/1000).toFixed(2)+' km';
  $('gcsL').innerHTML=uavRow('İRTİFA',Math.round(S.pos.y)+' m')+uavRow('HIZ',Math.round(S.speed*1.944)+' kt')+uavRow('BAŞ',String(Math.round(hdg)).padStart(3,'0')+'°')+
    uavRow('DİKEY',((S.vy||0)>=0?'+':'')+(S.vy||0).toFixed(1)+' m/s')+uavRow('YAKIT',S.fuel!=null?Math.round(S.fuel*100)+'%':'—',S.fuel!=null&&S.fuel<0.2?'#ff5a4a':null)+
    uavRow('MOTOR',(S.eng||0)>0.3?'HASAR':'NORMAL',(S.eng||0)>0.3?'#ff5a4a':null)+uavRow('GAZ',Math.round(S.throttle*100)+'%')+(real&&real.endur?uavRow('DAYANIM',real.endur+' sa'):'');
  let w='—'; try{ if(selW&&WEAPONS[selW]) w=WEAPONS[selW].short+' ×'+(INV[selW]||0); }catch(e){}
  $('gcsP').innerHTML=uavRow('SİLAH',w,'#ffd27a')+uavRow('SENSÖR',WX.vis==='flir'?'IR':WX.vis==='nvg'?'EO-NV':'EO')+uavRow('LAZER',typeof lockTgt!=='undefined'&&lockTgt?'İŞARETLİYOR':'HAZIR');
  if(UV.mx){ try{ mfdMap(UV.mx,0,0,UV.map.width,UV.map.height,false); }catch(e){} } }
/* ---- VR: stereo render (no effect passes) and head tracking from the phone's motion sensor */
renderFrame=HOOK.wrap('renderFrame','ucus/iha-gorunum#_vr',function(next){ return function(dt){ if(!uavVR()) return next.apply(this,arguments);
  try{ nearPlane(); }catch(e){} if(!UV.st){ UV.st=new THREE.StereoCamera(); UV.sz=new THREE.Vector2(); } const sz=renderer.getSize(UV.sz), w=sz.x, h=sz.y, a0=camera.aspect;
  camera.aspect=(w/2)/h; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); UV.st.eyeSep=0.6; UV.st.update(camera);
  const ac=renderer.autoClear; renderer.setScissorTest(true);
  renderer.setScissor(0,0,w/2,h); renderer.setViewport(0,0,w/2,h); renderer.render(scene,UV.st.cameraL);
  renderer.setScissor(w/2,0,w/2,h); renderer.setViewport(w/2,0,w/2,h); renderer.render(scene,UV.st.cameraR);
  renderer.setScissorTest(false); renderer.setViewport(0,0,w,h); renderer.autoClear=ac; camera.aspect=a0; camera.updateProjectionMatrix(); }; },renderFrame);
function uavOriEvt(e){ if(e.alpha==null) return; UV.ori={a:e.alpha,b:e.beta,g:e.gamma}; }
function uavOriStart(){ if(UV.oriOn) return; const go=function(){ window.addEventListener('deviceorientation',uavOriEvt); UV.oriOn=true; };
  try{ if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function') DeviceOrientationEvent.requestPermission().then(function(r){ if(r==='granted') go(); }).catch(function(){}); else go(); }catch(e){} }
const _uvE=new THREE.Euler(), _uvQ=new THREE.Quaternion(), _uvQ1=new THREE.Quaternion(-Math.sqrt(0.5),0,0,Math.sqrt(0.5)), _uvQ0=new THREE.Quaternion(), _uvZ=new THREE.Vector3(0,0,1), _uvRel=new THREE.Quaternion();
function uavHead(){ const o=UV.ori; if(!o||(typeof GYRO!=='undefined'&&GYRO.on)) return; const D=Math.PI/180, sa=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  _uvE.set(o.b*D,o.a*D,-o.g*D,'YXZ'); _uvQ.setFromEuler(_uvE); _uvQ.multiply(_uvQ1); _uvQ.multiply(_uvQ0.setFromAxisAngle(_uvZ,-sa*D));
  if(!UV.ref){ UV.ref=_uvQ.clone(); return; } _uvRel.copy(UV.ref).invert().multiply(_uvQ); _uvE.setFromQuaternion(_uvRel,'YXZ');
  CAMU.yaw=clamp(_uvE.y,-2.4,2.4); CAMU.pitch=clamp(_uvE.x,-1.2,1.2); }
/* per frame */
cameraUpdate=HOOK.wrap('cameraUpdate','ucus/iha-gorunum#_uvCam',function(next){ return function(dt){ if(uavVR()) uavHead(); next(dt); }; },cameraUpdate);
setInterval(function(){ try{ uavDom(); if(uavIn()&&uavView()==='gcs') uavGcs(); }catch(e){} },200);
/* ---- setting: Ayarlar → Uçuş → İHA görünümü */
(function(){ const st=$('setStab'); const row=st&&st.closest&&st.closest('.srow'); if(!row||!document.createElement) return;
  const r=document.createElement('div'); r.className='srow';
  r.innerHTML='<div class="sl"><b>İHA görünümü</b><small>İHA\'da kokpit kamerası (C): Sensör: burun kamerası · Yer kontrol istasyonu: operatör konsolu, telemetri ve harita · VR: telefon VR gözlüğü için çift görüntü, başını çevirince bakış döner (telefonda daha ağır, efektler durur)</small></div><div class="seg" id="setUav"><button type="button" data-v="sensor">Sensör</button><button type="button" data-v="gcs">Yer istasyonu</button><button type="button" data-v="vr">VR</button></div>';
  row.parentNode.insertBefore(r,row); r.querySelector('#setUav').addEventListener('click',function(e){ const b=e.target.closest('button[data-v]'); if(b) uavSet(b.dataset.v); }); })();
syncSettingsUI=HOOK.wrap('syncSettingsUI','ucus/iha-gorunum#_uvSync',function(next){ return function(){ next(); const s=$('setUav'); if(s&&s.children) Array.prototype.forEach.call(s.children,function(b){ b.setAttribute('aria-pressed',String(b.dataset.v===uavView())); }); }; },syncSettingsUI);
