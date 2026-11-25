/* ------------------------------------------------------------------ 3D cockpit (V1.89)
   Interior view for the piloted aircraft (KAAN, HÜRJET, HÜRKUŞ) and the T129 front seat.
   • Drawn as a second pass with its own small camera (near 2 cm) on top of the world, so the interior never clips or z-fights.
   • Instrument panel with live multi-function displays (canvas textures, 8 Hz): attitude / air data, tactical map
     (other aircraft, threats, targets, waypoint), engine · fuel · weapons. KAAN has one wide-area display, the others three MFDs.
   • HUD combiner glass, canopy frame, side consoles, control stick and throttle that move with the inputs.
   • Head movement (setting "Kafa hareketi", default on): G-load pushes the head down, the head leans into turns,
     light buffeting at high speed and in turbulence. Mouse / touch drag still looks around (existing cockpit look).
   • Lit like the outside world (sun / moon / weather), with warm panel flood light at night. */
const CKP={scene:null, cam:null, sets:{}, cur:null, t:0, mfdT:0, head:{y:0,p:0,r:0,dy:0}, hemi:null, sun:null, flood:null};
const CKP_FOR={kaan:'kaan', hurjet:'hurjet', hurkus:'hurkus'};   /* V2.74: every manned aircraft its own cockpit */
const CKP_HELI={t129:'t129', t625:'t625'};
function ckpHeadOn(){ return SETTINGS.ckpHead!==false; }
function ckpMat(c,e){ return new THREE.MeshLambertMaterial({color:c, emissive:e||0x000000}); }
function ckpBox(g,m,x,y,z,w,h,d,rx){ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); b.position.set(x,y,z); if(rx) b.rotation.x=rx; g.add(b); return b; }
function ckpScreen(g,w,h,x,y,z,rx,px){ const c=document.createElement('canvas'); c.width=px; c.height=Math.round(px*h/w); const tex=new THREE.CanvasTexture(c);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex})); m.position.set(x,y,z); m.rotation.x=rx||0; g.add(m); return {c:c, x:c.getContext('2d'), tex:tex, m:m}; }
function ckpBar(g,m,a,b,r){ const A=new THREE.Vector3(a[0],a[1],a[2]), B=new THREE.Vector3(b[0],b[1],b[2]), L=A.distanceTo(B);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,6),m); c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize()); g.add(c); return c; }
/* ---- V2.74: one builder per cockpit. Screens carry a role (wide, adi, map, sys, gauge, ufcp) that ckpMFD draws. */
function ckpScr(S2,g,role,w,h,x,y,z,rx,px){ const s=ckpScreen(g,w,h,x,y,z,rx,px); s.role=role; S2.scr.push(s); return s; }
function ckpStick(S2,g,M,x,y,z,len,side){ const st=new THREE.Group(); st.position.set(x,y,z); const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.016,len,8),M.grip); sh.position.y=len/2; st.add(sh);
  const gr=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.09,0.04),M.grip); gr.position.y=len+0.02; st.add(gr); ckpBox(st,M.yel,0,len+0.035,-0.024,0.012,0.02,0.01); if(side) ckpBox(st,M.dark,0,0,0,0.08,0.03,0.12);
  g.add(st); S2.stick=st; return st; }
function ckpThrottle(S2,g,M,x,y,z){ const th=new THREE.Group(); th.position.set(x,y,z); const tg=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.07,0.06),M.grip); tg.position.y=0.06; th.add(tg); g.add(th); S2.thr=th; return th; }
function ckpCollective(S2,g,M,x,y,z){ const c=new THREE.Group(); c.position.set(x,y,z); const bar=ckpBar(c,M.metal,[0,0,0.18],[0,0.05,-0.12],0.014); const hd=ckpBox(c,M.grip,0,0.06,-0.15,0.05,0.05,0.07); g.add(c); S2.thr=c; S2.coll=true; return c; }
function ckpConsoles(g,M,w,len){ [-1,1].forEach(function(s){ ckpBox(g,M.panel,s*w,-0.48,-0.15,0.16,0.07,len); ckpBox(g,M.dark,s*w,-0.44,-0.15,0.13,0.012,len*0.8);
  for(let i=0;i<5;i++) ckpBox(g,i%2?M.yel:M.metal,s*w+(i%2?0.03:-0.03),-0.43,-0.42+i*0.11,0.025,0.02,0.025); }); }
function ckpHUD(g,M,py,pz){ const gm=new THREE.MeshBasicMaterial({color:0x6fffc0,transparent:true,opacity:0.07,depthWrite:false,side:THREE.DoubleSide});
  const hg=new THREE.Mesh(new THREE.PlaneGeometry(0.17,0.15),gm); hg.position.set(0,py+0.33,pz+0.18); hg.rotation.x=0.42; g.add(hg);
  ckpBox(g,M.frame,-0.088,py+0.31,pz+0.18,0.008,0.15,0.008,0.42); ckpBox(g,M.frame,0.088,py+0.31,pz+0.18,0.008,0.15,0.008,0.42); ckpBox(g,M.dark,0,py+0.235,pz+0.14,0.2,0.04,0.09); }
function ckpBuild(kind){ const g=new THREE.Group(), S2={g:g, scr:[], kind:kind};
  const pc={kaan:0x22282e, hurjet:0x2b3238, hurkus:0x353b41, t129:0x2c3228, t625:0x30353b}[kind]||0x2a3036;
  const M={panel:ckpMat(pc), dark:ckpMat(0x15191d), frame:ckpMat(kind==='t129'?0x3a4232:0x3a4148), grip:ckpMat(0x101214), yel:ckpMat(0xc9a227), metal:ckpMat(0x7c858d), glass:new THREE.MeshBasicMaterial({color:0x9fd7ff,transparent:true,opacity:0.05,depthWrite:false,side:THREE.DoubleSide})};
  if(kind==='kaan'){
    /* 5th generation: low panel, one panoramic display, side-stick on the right console, nearly frameless bubble canopy */
    const pz=-0.74, py=-0.44; ckpBox(g,M.panel,0,py,pz,0.92,0.32,0.06,-0.25); ckpBox(g,M.dark,0,py+0.18,pz+0.05,0.94,0.03,0.22);
    ckpScr(S2,g,'wide',0.80,0.24,0,py+0.005,pz+0.034,-0.25,1024); ckpHUD(g,M,py,pz); ckpConsoles(g,M,0.37,0.75);
    ckpStick(S2,g,M,0.37,-0.44,-0.26,0.12,true); ckpThrottle(S2,g,M,-0.36,-0.45,-0.05);
    [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.5,-0.3,-0.66],[s*0.5,-0.3,0.4],0.02); ckpBar(g,M.frame,[s*0.47,-0.27,-0.66],[s*0.3,0.05,-0.6],0.008); });
    ckpBar(g,M.frame,[-0.42,0.2,0.32],[0.42,0.2,0.32],0.02); [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.42,0.2,0.32],[s*0.5,-0.3,0.38],0.02); });
  } else if(kind==='hurjet'){
    /* jet trainer: three MFDs, an up-front control panel under the HUD, centre stick, framed windscreen with mirrors */
    const pz=-0.74, py=-0.42; ckpBox(g,M.panel,0,py,pz,0.92,0.34,0.06,-0.25); ckpBox(g,M.dark,0,py+0.19,pz+0.04,0.96,0.035,0.24); ckpBox(g,M.panel,0,py-0.30,pz+0.12,0.30,0.32,0.10);
    [-0.29,0,0.29].forEach(function(x,i){ ckpScr(S2,g,['adi','map','sys'][i],0.23,0.23,x,py-0.01,pz+0.034,-0.25,384); });
    ckpScr(S2,g,'ufcp',0.2,0.07,0,py+0.155,pz+0.07,-0.6,256); ckpHUD(g,M,py,pz); ckpConsoles(g,M,0.37,0.75);
    ckpStick(S2,g,M,0,-0.72,-0.32,0.32); ckpThrottle(S2,g,M,-0.36,-0.45,-0.05);
    [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.47,-0.23,-0.66],[s*0.36,0.16,-0.18],0.018); ckpBar(g,M.frame,[s*0.36,0.16,-0.18],[s*0.2,0.33,0.25],0.016); ckpBar(g,M.frame,[s*0.5,-0.3,-0.66],[s*0.5,-0.3,0.4],0.022);
      const mi=ckpBox(g,ckpMat(0x8fa3b3,0x101820),s*0.33,0.15,-0.2,0.07,0.03,0.01); mi.rotation.y=-s*0.5; });
    ckpBar(g,M.frame,[-0.2,0.33,0.25],[0.2,0.33,0.25],0.016);
  } else if(kind==='hurkus'){
    /* turboprop trainer: two MFDs with round standby gauges between them, power lever, heavier frame, the propeller ahead */
    const pz=-0.72, py=-0.40; ckpBox(g,M.panel,0,py,pz,0.9,0.36,0.07,-0.22); ckpBox(g,M.dark,0,py+0.2,pz+0.05,0.94,0.04,0.25); ckpBox(g,M.panel,0,py-0.30,pz+0.12,0.26,0.30,0.10);
    ckpScr(S2,g,'adi',0.22,0.22,-0.28,py-0.005,pz+0.04,-0.22,384); ckpScr(S2,g,'map',0.22,0.22,0.28,py-0.005,pz+0.04,-0.22,384);
    ckpScr(S2,g,'gauge',0.25,0.25,0,py-0.005,pz+0.04,-0.22,384); ckpConsoles(g,M,0.36,0.7);
    ckpStick(S2,g,M,0,-0.72,-0.32,0.32); ckpThrottle(S2,g,M,-0.35,-0.45,-0.05);
    [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.47,-0.2,-0.64],[s*0.38,0.18,-0.2],0.026); ckpBar(g,M.frame,[s*0.38,0.18,-0.2],[s*0.24,0.34,0.25],0.022); ckpBar(g,M.frame,[s*0.5,-0.28,-0.64],[s*0.5,-0.28,0.4],0.026); });
    ckpBar(g,M.frame,[-0.24,0.34,0.25],[0.24,0.34,0.25],0.022); ckpBar(g,M.frame,[-0.47,-0.2,-0.64],[0.47,-0.2,-0.64],0.02);
    const pc2=document.createElement('canvas'); pc2.width=pc2.height=128; const px2=pc2.getContext('2d'); const gr2=px2.createRadialGradient(64,64,10,64,64,64); gr2.addColorStop(0,'rgba(40,40,40,.55)'); gr2.addColorStop(0.2,'rgba(30,30,30,.18)'); gr2.addColorStop(0.95,'rgba(30,30,30,.12)'); gr2.addColorStop(1,'rgba(30,30,30,0)');
    px2.fillStyle=gr2; px2.fillRect(0,0,128,128); const pt=new THREE.CanvasTexture(pc2);
    const prop=new THREE.Mesh(new THREE.CircleGeometry(1.15,32),new THREE.MeshBasicMaterial({map:pt,transparent:true,depthWrite:false})); prop.position.set(0,-0.32,-2.6); g.add(prop); S2.prop=prop;
  } else if(kind==='t129'){
    /* tandem attack helicopter: narrow cabin, faceted canopy, two displays, cyclic and collective */
    const pz=-0.82, py=-0.40; ckpBox(g,M.panel,0,py,pz,0.72,0.32,0.06,-0.25); ckpBox(g,M.dark,0,py+0.18,pz+0.04,0.76,0.035,0.2);
    ckpScr(S2,g,'adi',0.22,0.22,-0.17,py,pz+0.034,-0.25,384); ckpScr(S2,g,'map',0.22,0.22,0.17,py,pz+0.034,-0.25,384); ckpScr(S2,g,'sys',0.14,0.1,0,py-0.17,pz+0.07,-0.25,256);
    [-1,1].forEach(function(s){ ckpBox(g,M.panel,s*0.33,-0.5,-0.2,0.12,0.07,0.7);
      ckpBar(g,M.frame,[s*0.38,-0.25,-0.8],[s*0.36,0.2,-0.5],0.02); ckpBar(g,M.frame,[s*0.36,0.2,-0.5],[s*0.3,0.42,0.05],0.02); ckpBar(g,M.frame,[s*0.38,-0.25,-0.8],[s*0.42,-0.3,0.3],0.02);
      ckpBar(g,M.frame,[s*0.37,0.0,-0.65],[s*0.4,-0.05,0.2],0.012); });
    ckpBar(g,M.frame,[-0.36,0.2,-0.5],[0.36,0.2,-0.5],0.018); ckpBar(g,M.frame,[0,0.2,-0.5],[0,0.42,0.05],0.014); ckpBar(g,M.frame,[-0.3,0.42,0.05],[0.3,0.42,0.05],0.02);
    ckpStick(S2,g,M,0,-0.72,-0.32,0.3); ckpCollective(S2,g,M,-0.3,-0.5,-0.05);
  } else if(kind==='t625'){
    /* utility helicopter, side by side: the pilot sits on the right; wide panel with four displays, centre console,
       overhead panel, chin windows at the feet, door frames, cyclic and collective */
    const pz=-0.85, py=-0.38, cx=-0.45; ckpBox(g,M.panel,cx,py,pz,1.5,0.3,0.06,-0.2); ckpBox(g,M.dark,cx,py+0.17,pz+0.05,1.55,0.035,0.22);
    ckpScr(S2,g,'adi',0.2,0.2,-0.12,py,pz+0.034,-0.2,384); ckpScr(S2,g,'map',0.2,0.2,0.12,py,pz+0.034,-0.2,384);
    ckpScr(S2,g,'map',0.2,0.2,-0.78,py,pz+0.034,-0.2,256); ckpScr(S2,g,'sys',0.2,0.2,-1.02,py,pz+0.034,-0.2,256);
    ckpBox(g,M.panel,cx,-0.62,-0.45,0.26,0.16,0.8); ckpBox(g,M.dark,cx,-0.53,-0.45,0.2,0.012,0.65);            /* centre console */
    ckpBox(g,M.panel,cx,0.52,-0.25,0.42,0.06,0.65); for(let i=0;i<6;i++) ckpBox(g,i%2?M.yel:M.metal,cx-0.15+i*0.06,0.485,-0.4,0.02,0.015,0.02);   /* overhead */
    [[0.62],[-1.52]].forEach(function(a){ const x=a[0]; ckpBar(g,M.frame,[x,-0.8,-0.9],[x,0.55,-0.55],0.03); ckpBar(g,M.frame,[x,0.55,-0.55],[x,0.6,0.4],0.03); ckpBar(g,M.frame,[x,-0.1,0.3],[x,0.6,0.3],0.025); });
    ckpBar(g,M.frame,[-1.52,0.55,-0.55],[0.62,0.55,-0.55],0.03); ckpBar(g,M.frame,[cx,0.55,-0.55],[cx,-0.25,-0.9],0.03);            /* windscreen centre post */
    ckpBar(g,M.frame,[0.05,-0.75,-0.95],[0.45,-0.75,-0.95],0.02); ckpBar(g,M.frame,[0.05,-0.75,-0.95],[0.05,-0.95,-0.6],0.02); ckpBar(g,M.frame,[0.45,-0.75,-0.95],[0.45,-0.95,-0.6],0.02);   /* chin window */
    [-0.1,0.1].forEach(function(x){ ckpBox(g,M.dark,x+0.15,-0.92,-0.62,0.08,0.03,0.14); });                                     /* pedals */
    ckpStick(S2,g,M,0,-0.75,-0.3,0.34); ckpCollective(S2,g,M,-0.22,-0.55,-0.02);
  }
  g.traverse(function(o){ o.frustumCulled=false; }); return S2; }
function ckpInit(){ if(CKP.scene) return; const sc=new THREE.Scene(); CKP.scene=sc; CKP.cam=new THREE.PerspectiveCamera(78,1,0.02,6);
  CKP.hemi=new THREE.HemisphereLight(0xc4e0ff,0x3a3f46,0.7); sc.add(CKP.hemi); CKP.sun=new THREE.DirectionalLight(0xfff0d6,1); sc.add(CKP.sun); sc.add(CKP.sun.target);
  CKP.flood=new THREE.PointLight(0xffb070,0,1.6,1); CKP.flood.position.set(0,0.1,-0.3); sc.add(CKP.flood); }
function ckpSet(kind){ ckpInit(); if(!CKP.sets[kind]){ CKP.sets[kind]=ckpBuild(kind); CKP.scene.add(CKP.sets[kind].g); }
  Object.keys(CKP.sets).forEach(function(k){ CKP.sets[k].g.visible=k===kind; }); CKP.cur=CKP.sets[kind]; return CKP.cur; }
/* which interior (if any) is on screen now */
function ckpKind(){ if(state==='play'||state==='paused'||state==='mend'||state==='map'){ if(camMode===1&&!S.crashed&&CKP_FOR[activeId]) return CKP_FOR[activeId]; return null; }
  if((state==='walk'||(state==='paused'&&WALK.from==='walk'))&&WALK.mode==='heli'&&HELI.cur&&HELI.fp&&CKP_HELI[HELI.cur.id]) return CKP_HELI[HELI.cur.id];
  return null; }
/* ---- displays */
const CKC={bg:'#03100a', g:'#5dff9a', d:'#2c8a52', w:'#e6fff0', a:'#ffb25a', r:'#ff5a4a', c:'#5ad0ff'};
function mfdFrame(x,X0,Y0,W,H,title){ x.fillStyle=CKC.bg; x.fillRect(X0,Y0,W,H); x.strokeStyle=CKC.d; x.lineWidth=2; x.strokeRect(X0+3,Y0+3,W-6,H-6);
  x.fillStyle=CKC.d; x.font='700 '+Math.round(H*0.055)+'px "Chakra Petch",monospace'; x.textAlign='center'; x.textBaseline='top'; x.fillText(title,X0+W/2,Y0+8); }
function mfdADI(x,X0,Y0,W,H,heli){ mfdFrame(x,X0,Y0,W,H,'PFD'); const cx=X0+W/2, cy=Y0+H*0.52, R=Math.min(W,H)*0.33;
  let pitch, bank, spd, alt, hdg;
  if(heli){ const Hh=HELI.cur; pitch=-Hh.pitch; bank=-Hh.roll; spd=Math.hypot(Hh.vx,Hh.vz)*3.6; alt=Hh.y; hdg=((-Hh.h*57.3)%360+360)%360; }
  else { fwdOf(S.q,vF); const r=new THREE.Vector3(1,0,0).applyQuaternion(S.q), u=new THREE.Vector3(0,1,0).applyQuaternion(S.q); pitch=Math.asin(clamp(vF.y,-1,1)); bank=Math.atan2(-r.y,u.y); spd=S.speed*3.6; alt=S.pos.y; hdg=((Math.atan2(vF.x,-vF.z)*57.3)%360+360)%360; }
  x.save(); x.beginPath(); x.arc(cx,cy,R,0,6.283); x.clip(); x.translate(cx,cy); x.rotate(-bank); const off=pitch*R*1.6;
  x.fillStyle='#1d5a9e'; x.fillRect(-R*2,-R*3+off,R*4,R*3); x.fillStyle='#6b4a22'; x.fillRect(-R*2,off,R*4,R*3); x.strokeStyle='#fff'; x.lineWidth=2; x.beginPath(); x.moveTo(-R*2,off); x.lineTo(R*2,off); x.stroke();
  x.lineWidth=1.2; for(let p=-30;p<=30;p+=10){ if(!p) continue; const y=off-p/57.3*R*1.6; x.beginPath(); x.moveTo(-R*0.25,y); x.lineTo(R*0.25,y); x.stroke(); } x.restore();
  x.strokeStyle=CKC.a; x.lineWidth=3; x.beginPath(); x.moveTo(cx-R*0.45,cy); x.lineTo(cx-R*0.12,cy); x.lineTo(cx-R*0.06,cy+R*0.07); x.moveTo(cx+R*0.45,cy); x.lineTo(cx+R*0.12,cy); x.lineTo(cx+R*0.06,cy+R*0.07); x.stroke();
  x.strokeStyle=CKC.d; x.lineWidth=2; x.beginPath(); x.arc(cx,cy,R,0,6.283); x.stroke();
  const f=Math.round(H*0.075); x.font='700 '+f+'px "Chakra Petch",monospace'; x.fillStyle=CKC.g; x.textBaseline='middle';
  x.textAlign='left'; x.fillText(Math.round(spd)+'', X0+10, cy); x.fillStyle=CKC.d; x.font='700 '+Math.round(f*0.6)+'px monospace'; x.fillText('KM/SA',X0+10,cy+f*0.8);
  x.textAlign='right'; x.fillStyle=CKC.g; x.font='700 '+f+'px "Chakra Petch",monospace'; x.fillText(Math.round(alt)+'',X0+W-10,cy); x.fillStyle=CKC.d; x.font='700 '+Math.round(f*0.6)+'px monospace'; x.fillText('M',X0+W-10,cy+f*0.8);
  x.textAlign='center'; x.fillStyle=CKC.w; x.font='700 '+Math.round(f*0.85)+'px "Chakra Petch",monospace'; x.fillText(String(Math.round(hdg)).padStart(3,'0')+'°',cx,Y0+H-f*0.8); }
function mfdMap(x,X0,Y0,W,H,heli){ mfdFrame(x,X0,Y0,W,H,'TAKTİK'); const cx=X0+W/2, cy=Y0+H*0.62, R=Math.min(W,H)*0.42, rng=heli?4000:(typeof CKB!=='undefined'?CKB.rng:12000);
  let px,pz,hd; if(heli){ px=HELI.cur.x; pz=HELI.cur.z; hd=HELI.cur.h; } else { fwdOf(S.q,vF); px=S.pos.x; pz=S.pos.z; hd=Math.atan2(-vF.x,-vF.z); }
  x.strokeStyle=CKC.d; x.lineWidth=1.2; [0.33,0.66,1].forEach(function(k){ x.beginPath(); x.arc(cx,cy,R*k,Math.PI,2*Math.PI); x.stroke(); });
  x.font='700 '+Math.round(H*0.045)+'px monospace'; x.fillStyle=CKC.d; x.textAlign='left'; x.fillText(Math.round(rng/1000)+' km',cx+4,cy-R-2);
  const toS=function(wx,wz){ const dx=wx-px, dz=wz-pz, c=Math.cos(hd), s=Math.sin(hd), rx=dx*c-dz*s, rz=dx*s+dz*c; return [cx+rx/rng*R, cy+rz/rng*R]; };
  x.save(); x.beginPath(); x.rect(X0+4,Y0+4,W-8,H-8); x.clip();
  try{ const ap=toS(0,0); x.strokeStyle=CKC.c; x.lineWidth=3; x.beginPath(); x.moveTo(ap[0],ap[1]-R*0.08); x.lineTo(ap[0],ap[1]+R*0.08); x.stroke(); }catch(e){}
  if(typeof ACT!=='undefined') ACT.forEach(function(a){ if(!a.alive||!a.pos) return; const p=toS(a.pos.x,a.pos.z); x.fillStyle=a.team==='red'?CKC.r:CKC.c; x.beginPath(); x.moveTo(p[0],p[1]-6); x.lineTo(p[0]+5,p[1]+5); x.lineTo(p[0]-5,p[1]+5); x.closePath(); x.fill(); });
  if(typeof targets!=='undefined') targets.forEach(function(t){ if(!t.alive||!t.pos) return; const p=toS(t.pos.x,t.pos.z); x.strokeStyle=CKC.r; x.lineWidth=2; x.strokeRect(p[0]-4,p[1]-4,8,8); });
  if(typeof gtargets!=='undefined') gtargets.forEach(function(t){ if(!t.alive||!t.pos) return; const p=toS(t.pos.x,t.pos.z); x.fillStyle=CKC.a; x.fillRect(p[0]-3,p[1]-3,6,6); });
  x.restore(); x.fillStyle=CKC.w; x.beginPath(); x.moveTo(cx,cy-9); x.lineTo(cx+6,cy+7); x.lineTo(cx,cy+3); x.lineTo(cx-6,cy+7); x.closePath(); x.fill(); }
function mfdSys(x,X0,Y0,W,H,heli){ mfdFrame(x,X0,Y0,W,H,heli?'SİLAH':'SİSTEM'); const f=Math.round(H*0.06), L=X0+14; let y=Y0+H*0.18; x.textAlign='left'; x.textBaseline='top';
  const row=function(k,v,col){ x.font='700 '+Math.round(f*0.75)+'px monospace'; x.fillStyle=CKC.d; x.fillText(k,L,y); x.font='700 '+f+'px "Chakra Petch",monospace'; x.fillStyle=col||CKC.g; x.textAlign='right'; x.fillText(v,X0+W-14,y-2); x.textAlign='left'; y+=f*1.45; };
  if(heli&&HELI.cur.id==='t625'){ const Hh=HELI.cur; row('İRTİFA',Math.round(Hh.y)+' m'); row('DİKEY',(Hh.vy||0).toFixed(1)+' m/s',Math.abs(Hh.vy||0)>3?CKC.a:CKC.g); row('HIZ',Math.round(Math.hypot(Hh.vx,Hh.vz)*3.6)+' km/sa'); row('ASKI YRD.',typeof HO!=='undefined'&&HO.assist?'AÇIK':'KAPALI',CKC.c); return; }
  if(heli){ const Hh=HELI.cur, am=Hh.ammo||{}; row('TOP',String(am.gun!=null?am.gun:'—')); row('CİRİT',String(am.cirit!=null?am.cirit:'—')); row('UMTAS',String(am.umtas!=null?am.umtas:'—')); row('SEÇİLİ',String(Hh.sel||'—').toUpperCase(),CKC.a); row('ASKI YRD.',typeof HO!=='undefined'&&HO.assist?'AÇIK':'KAPALI',CKC.c); return; }
  const thr=Math.round((S.ab?1:S.throttle)*100); row('GAZ',thr+'%'+(S.ab?' AB':''),S.ab?CKC.a:CKC.g);
  if(S.fuel!=null) row('YAKIT',Math.round(S.fuel*100)+'%',S.fuel<0.2?CKC.r:CKC.g);
  row('MOTOR',(S.eng||0)>=1?'ARIZA':(S.eng||0)>0.3?'HASAR':'NORMAL',(S.eng||0)>0.3?CKC.r:CKC.g); row('G',(S.g||1).toFixed(1)); row('TEKER',S.gear?'İNİK':'KALKIK',S.gear?CKC.a:CKC.g);
  if(typeof WORDER!=='undefined'&&typeof INV!=='undefined'){ const ws=WORDER.filter(function(k){ return INV[k]>0; }).slice(0,3); ws.forEach(function(k){ row(WEAPONS[k].short,String(INV[k]),k===selW?CKC.a:CKC.g); }); }
  if(typeof flaresLeft!=='undefined') row('FLARE',String(flaresLeft),flaresLeft?CKC.g:CKC.r); }
function ckpIsHeli(kind){ return kind==='t129'||kind==='t625'; }
/* round standby gauges (Hürkuş): airspeed, attitude, altimeter, engine torque */
function mfdGauge(x,X0,Y0,W,H){ x.fillStyle='#0b0e11'; x.fillRect(X0,Y0,W,H); const r=W*0.22, P=[[W*0.27,H*0.27],[W*0.73,H*0.27],[W*0.27,H*0.73],[W*0.73,H*0.73]];
  fwdOf(S.q,vF); const rr=new THREE.Vector3(1,0,0).applyQuaternion(S.q), uu=new THREE.Vector3(0,1,0).applyQuaternion(S.q), pitch=Math.asin(clamp(vF.y,-1,1)), bank=Math.atan2(-rr.y,uu.y);
  const dial=function(cx,cy,lbl,frac,txt){ x.fillStyle='#14181c'; x.beginPath(); x.arc(cx,cy,r,0,6.283); x.fill(); x.strokeStyle='#c8ccd0'; x.lineWidth=3; x.stroke();
    x.strokeStyle='#e9edf0'; x.lineWidth=2; for(let i=0;i<10;i++){ const a=-2.4+i*0.533; x.beginPath(); x.moveTo(cx+Math.cos(a)*r*0.82,cy+Math.sin(a)*r*0.82); x.lineTo(cx+Math.cos(a)*r*0.95,cy+Math.sin(a)*r*0.95); x.stroke(); }
    const a=-2.4+clamp(frac,0,1)*4.8; x.strokeStyle='#ffd27a'; x.lineWidth=4; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*r*0.78,cy+Math.sin(a)*r*0.78); x.stroke();
    x.fillStyle='#c8ccd0'; x.font='700 '+Math.round(r*0.22)+'px monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(lbl,cx,cy+r*0.42); x.fillStyle='#ffffff'; x.fillText(txt,cx,cy-r*0.38); };
  dial(P[0][0],P[0][1],'KNOT',S.speed/CUR.vTop,Math.round(S.speed*1.944)+'');
  const c=P[1]; x.save(); x.beginPath(); x.arc(c[0],c[1],r,0,6.283); x.clip(); x.translate(c[0],c[1]); x.rotate(-bank); const off=pitch*r*1.5;
  x.fillStyle='#2d6fb8'; x.fillRect(-r*2,-r*3+off,r*4,r*3); x.fillStyle='#7a5226'; x.fillRect(-r*2,off,r*4,r*3); x.strokeStyle='#fff'; x.lineWidth=2; x.beginPath(); x.moveTo(-r*2,off); x.lineTo(r*2,off); x.stroke(); x.restore();
  x.strokeStyle='#c8ccd0'; x.lineWidth=3; x.beginPath(); x.arc(c[0],c[1],r,0,6.283); x.stroke(); x.strokeStyle='#ffb25a'; x.beginPath(); x.moveTo(c[0]-r*0.5,c[1]); x.lineTo(c[0]+r*0.5,c[1]); x.stroke();
  dial(P[2][0],P[2][1],'M',(S.pos.y%1000)/1000,Math.round(S.pos.y)+'');
  dial(P[3][0],P[3][1],'TORK %',(S.ab?1:S.throttle),Math.round((S.ab?1:S.throttle)*100)+''); }
/* up-front control panel (Hürjet): radio, waypoint, autopilot-style keypad */
function mfdUfcp(x,X0,Y0,W,H){ x.fillStyle='#0b0f0c'; x.fillRect(X0,Y0,W,H); x.font='700 '+Math.round(H*0.32)+'px monospace'; x.textBaseline='middle'; x.textAlign='left'; x.fillStyle=CKC.g;
  fwdOf(S.q,vF); const hdg=((Math.atan2(vF.x,-vF.z)*57.3)%360+360)%360; x.fillText('UHF 251.0  HDG '+String(Math.round(hdg)).padStart(3,'0')+'  ALT '+Math.round(S.pos.y),X0+8,Y0+H*0.32);
  x.fillStyle=CKC.d; for(let i=0;i<8;i++) x.fillRect(X0+8+i*(W-16)/8,Y0+H*0.6,(W-16)/8-6,H*0.3); }
function ckpMFD(){ const S2=CKP.cur; if(!S2) return; const heli=ckpIsHeli(S2.kind);
  S2.scr.forEach(function(s){ const x=s.x, W=s.c.width, H=s.c.height;
    if(s.role==='wide'){ const w3=W/3; mfdADI(x,0,0,w3,H,false); mfdMap(x,w3,0,w3,H,false); mfdSys(x,w3*2,0,w3,H,false); }
    else if(s.role==='adi') mfdADI(x,0,0,W,H,heli); else if(s.role==='map') mfdMap(x,0,0,W,H,heli); else if(s.role==='sys') mfdSys(x,0,0,W,H,heli);
    else if(s.role==='gauge') mfdGauge(x,0,0,W,H); else if(s.role==='ufcp') mfdUfcp(x,0,0,W,H);
    s.tex.needsUpdate=true; }); }
/* ---- per frame: pose, lighting, head */
const ckE=new THREE.Euler(0,0,0,'YXZ'), ckQ=new THREE.Quaternion(), ckQi=new THREE.Quaternion(), ckV=new THREE.Vector3();
function ckpUpdate(dt){ const kind=ckpKind(); CKP.on=!!kind; if(!kind) return; const S2=ckpSet(kind), heli=ckpIsHeli(kind);
  CKP.mfdT-=dt; if(CKP.mfdT<=0){ CKP.mfdT=0.12; try{ ckpMFD(); }catch(e){} }
  /* inputs move the stick / throttle */
  if(heli){ const inp=typeof heliInput==='function'?heliInput():{f:0,r:0,c:0}; S2.stick.rotation.set(-inp.f*0.25,0,-inp.r*0.25); S2.thr.rotation.x=(inp.c||0)*0.35; }
  else { S2.stick.rotation.set(-(S.pitchIn||0)*0.28,0,-(S.rollIn||0)*0.28); S2.thr.position.z=-0.05-(S.ab?1:S.throttle)*0.12; if(S2.prop){ S2.prop.material.opacity=0.35+0.65*(S.ab?1:S.throttle); S2.prop.rotation.z+=dt*40; } }
  /* head movement */
  const H=CKP.head, on=ckpHeadOn(); let ty=0,tp=0,tr=0,tdy=0;
  if(on&&!heli&&state==='play'){ tdy=-clamp((S.g||1)-1,-1,7)*0.012; ty=-(S.rollIn||0)*0.12-(S.yawIn||0)*0.08; tp=-(S.pitchIn||0)*0.03; tr=0; }
  const k=1-Math.exp(-dt*4); H.y+=(ty-H.y)*k; H.p+=(tp-H.p)*k; H.dy+=(tdy-H.dy)*(1-Math.exp(-dt*6));
  let shake=0; if(on&&state==='play'&&!heli){ shake=clamp((S.speed-CUR.vTop*0.85)/(CUR.vTop*0.5),0,1)*0.004+(typeof WX!=='undefined'?Math.max(0,WX.cur.turb-0.08)*(typeof turbK==='function'?turbK():0.35)*0.006:0); }
  const sx=shake?Math.sin(T*37)*shake:0, sy=shake?Math.sin(T*29+1)*shake:0;
  if(heli){ CKP.cam.position.set(0,0,0); ckE.set((WALK.pitch||0)-0.12,(WALK.cy||0),0); }
  else { CKP.cam.position.set(sx,H.dy+sy,0); ckE.set(CAMU.pitch+H.p,CAMU.yaw+H.y,0); }
  CKP.cam.quaternion.setFromEuler(ckE); CKP.cam.fov=camera.fov; CKP.cam.aspect=camera.aspect; CKP.cam.updateProjectionMatrix(); CKP.cam.updateMatrixWorld();
  /* apply the same head offsets to the world camera (fighters; heli fp already handled by heliCam) */
  if(!heli&&(H.y||H.p||H.dy||shake)){ ckQ.setFromEuler(ckE.set(H.p,H.y,0)); camera.quaternion.multiply(ckQ); camera.position.add(ckV.set(sx,H.dy+sy,0).applyQuaternion(S.q)); camera.updateMatrixWorld(); }
  /* light: world sun / sky expressed in the cockpit frame */
  if(heli){ const Hh=HELI.cur; ckQi.setFromEuler(ckE.set(Hh.pitch*-0.9,Hh.h,-Hh.roll*0.9)).invert(); } else ckQi.copy(S.q).invert();
  CKP.sun.position.copy(SUN).applyQuaternion(ckQi).multiplyScalar(5); CKP.sun.target.position.set(0,0,0); CKP.sun.color.copy(sunLight.color); CKP.sun.intensity=sunLight.intensity*0.9;
  CKP.hemi.color.copy(HEMI.color); CKP.hemi.groundColor.copy(HEMI.groundColor); CKP.hemi.intensity=HEMI.intensity*0.8+0.12;
  CKP.flood.intensity=(TOD.nightK||0)*0.9+(typeof WX!=='undefined'?WX.cur.dark*0.3:0); }
renderFrame=HOOK.wrap('renderFrame','ucus/kokpit#_ckpRender',function(_ckpRender){ return function(dt){ _ckpRender(dt); const on=CKP.on; CKP.on=false; if(!on||!CKP.scene) return; const ac=renderer.autoClear; renderer.autoClear=false; renderer.clearDepth(); renderer.render(CKP.scene,CKP.cam); renderer.autoClear=ac; }; },renderFrame);
cameraUpdate=HOOK.wrap('cameraUpdate','ucus/kokpit#_ckpCam',function(_ckpCam){ return function(dt){ _ckpCam(dt); if(state!=='replay') ckpUpdate(dt); }; },cameraUpdate);
walkCam=HOOK.wrap('walkCam','ucus/kokpit#_ckpWalkCam',function(_ckpWalkCam){ return function(dt){ _ckpWalkCam(dt); ckpUpdate(dt); }; },walkCam);
/* settings */
(function(){ const c=$('setCkpHead'); if(c) c.addEventListener('change',function(){ SETTINGS.ckpHead=c.checked; saveSettings(); }); })();
syncSettingsUI=HOOK.wrap('syncSettingsUI','ucus/kokpit#_ckpSync',function(_ckpSync){ return function(){ _ckpSync(); const c=$('setCkpHead'); if(c) c.checked=ckpHeadOn(); }; },syncSettingsUI);
