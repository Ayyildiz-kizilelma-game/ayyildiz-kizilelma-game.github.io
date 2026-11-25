/* ------------------------------------------------------------------ 3D cockpit (V1.89, rebuilt V2.74, V2.75)
   Interior view for the piloted aircraft (KAAN, HÜRJET, HÜRKUŞ) and the helicopters (T129 ATAK, T625 GÖKBEY).
   • Drawn as a second pass with its own small camera (near 2 cm) on top of the world, so the interior never clips or z-fights.
   • V2.75: every aircraft has three cockpit layouts (A / B / C), chosen in flight with the 🛩 button or in
     Ayarlar → Uçuş → Kokpit düzeni (remembered per aircraft):
       KAAN    A wide display + HUD · B wide display + up-front panel, no HUD (helmet display) · C night cockpit (amber, red flood)
       HÜRJET  A wide display (KAAN family) · B three MFDs + up-front panel · C rear seat (instructor): student ahead, repeater HUD
       HÜRKUŞ  A military: HUD + three displays · B trainer: two displays + round standby gauges · C simple: one big display, big buttons
       T129    A pilot (rear seat, gunner ahead) · B gunner (front seat, live sight camera) · C night vision goggles
       T625    A two wide 8×20" displays + two touch units · B four displays · C cabin door gunner (looks out of the open door)
   • Every display sits in a bezel with its push buttons; displays are live canvas textures (8 Hz). The T129 gunner's sight
     shows a real zoomed camera picture of the world ahead (render target, 5 Hz).
   • Head movement (setting "Kafa hareketi", default on): G-load pushes the head down, the head leans into turns,
     light buffeting at high speed and in turbulence. Mouse / touch drag still looks around.
   • Lit like the outside world (sun / moon / weather), with warm panel flood light at night (red in the KAAN night cockpit). */
const CKP={scene:null, cam:null, sets:{}, cur:null, t:0, mfdT:0, rtT:0, head:{y:0,p:0,r:0,dy:0}, hemi:null, sun:null, flood:null, rt:null, rtCam:null, nvg:null, btn:null};
const CKP_FOR={kaan:'kaan', hurjet:'hurjet', hurkus:'hurkus'};   /* every manned aircraft its own cockpit */
const CKP_HELI={t129:'t129', t625:'t625'};
const CKP_VARS={
  kaan:{A:'Geniş ekran + HUD', B:'Kask ekranı (HUD yok)', C:'Gece kokpiti'},
  hurjet:{A:'Geniş ekran', B:'Üç ekran + ön panel', C:'Arka koltuk (eğitmen)'},
  hurkus:{A:'Askerî (HUD + üç ekran)', B:'Eğitim (yedek göstergeler)', C:'Sade (büyük düğmeler)'},
  t129:{A:'Pilot (arka koltuk)', B:'Nişancı (ön koltuk)', C:'Gece görüş'},
  t625:{A:'İki geniş ekran', B:'Dört ekran', C:'Kapı topçusu'}};
const CKP_NAMES={kaan:'KAAN', hurjet:'HÜRJET', hurkus:'HÜRKUŞ', t129:'T129 ATAK', t625:'T625 GÖKBEY'};
function ckpVar(kind){ const m=SETTINGS.ckpVar, v=m&&m[kind]; return v==='B'||v==='C'?v:'A'; }
function ckpSetVar(kind,v){ if(!CKP_VARS[kind]) return; if(!SETTINGS.ckpVar||typeof SETTINGS.ckpVar!=='object') SETTINGS.ckpVar={}; SETTINGS.ckpVar[kind]=v==='B'||v==='C'?v:'A'; saveSettings(); syncSettingsUI(); }
function ckpCycle(){ const k=CKP.cur&&CKP.cur.kind; if(!k) return; const L=['A','B','C'], v=L[(L.indexOf(ckpVar(k))+1)%3]; ckpSetVar(k,v);
  toast('Kokpit '+v+' · '+CKP_VARS[k][v],'#ffd27a'); }
function ckpHeadOn(){ return SETTINGS.ckpHead!==false; }
function ckpMat(c,e){ return new THREE.MeshLambertMaterial({color:c, emissive:e||0x000000}); }
function ckpBox(g,m,x,y,z,w,h,d,rx){ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); b.position.set(x,y,z); if(rx) b.rotation.x=rx; g.add(b); return b; }
function ckpCyl(g,m,x,y,z,r,h,rx,rz){ const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),m); c.position.set(x,y,z); if(rx) c.rotation.x=rx; if(rz) c.rotation.z=rz; g.add(c); return c; }
function ckpBall(g,m,x,y,z,r,sy){ const b=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m); b.position.set(x,y,z); if(sy) b.scale.y=sy; g.add(b); return b; }
function ckpScreen(g,w,h,x,y,z,rx,px,transp){ const c=document.createElement('canvas'); c.width=px; c.height=Math.round(px*h/w); const tex=new THREE.CanvasTexture(c);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial(transp?{map:tex,transparent:true,depthWrite:false}:{map:tex})); m.position.set(x,y,z); m.rotation.x=rx||0; g.add(m); return {c:c, x:c.getContext('2d'), tex:tex, m:m}; }
function ckpBar(g,m,a,b,r){ const A=new THREE.Vector3(a[0],a[1],a[2]), B=new THREE.Vector3(b[0],b[1],b[2]), L=A.distanceTo(B);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,8),m); c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize()); g.add(c); return c; }
/* ---- display unit: a tilted group with the bezel, the push buttons round the edge and the live screen */
function ckpScr(S2,g,role,w,h,x,y,z,rx,px,M,osb){ const u=new THREE.Group(); u.position.set(x,y,z); u.rotation.x=rx||0; g.add(u);
  if(M){ ckpBox(u,M.bez,0,0,-0.008,w+0.035,h+0.035,0.014);
    if(osb!==false){ const nx=Math.max(3,Math.round(w/0.04)), ny=Math.max(3,Math.round(h/0.045));
      for(let i=0;i<nx;i++){ const bx=-w/2+(i+0.5)*w/nx; ckpBox(u,M.osb,bx,h/2+0.011,-0.001,0.018,0.009,0.008); ckpBox(u,M.osb,bx,-h/2-0.011,-0.001,0.018,0.009,0.008); }
      for(let i=0;i<ny;i++){ const by=-h/2+(i+0.5)*h/ny; ckpBox(u,M.osb,-w/2-0.011,by,-0.001,0.009,0.016,0.008); ckpBox(u,M.osb,w/2+0.011,by,-0.001,0.009,0.016,0.008); } } }
  const s=ckpScreen(u,w,h,0,0,0.001,0,px); s.role=role; s.unit=u; S2.scr.push(s); return s; }
function ckpStick(S2,g,M,x,y,z,len,side){ const st=new THREE.Group(); st.position.set(x,y,z);
  if(side){ ckpBox(st,M.dark,0,0,0,0.08,0.03,0.12); } else { const boot=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.06,0.07,10),M.boot); boot.position.y=0.03; st.add(boot); }
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.011,0.015,len,10),M.metal); sh.position.y=len/2; st.add(sh);
  const gr=new THREE.Mesh(new THREE.CylinderGeometry(0.019,0.021,0.1,10),M.grip); gr.position.set(0,len+0.04,0.004); gr.rotation.x=-0.18; st.add(gr);
  ckpBox(st,M.grip,0,len+0.095,-0.006,0.036,0.03,0.05); ckpBox(st,M.red,0,len+0.112,-0.016,0.012,0.01,0.012); ckpBox(st,M.metal,0.012,len+0.1,0.012,0.008,0.008,0.008);
  ckpBox(st,M.yel,0,len+0.03,-0.024,0.012,0.022,0.01); g.add(st); S2.stick=st; return st; }
function ckpThrottle(S2,g,M,x,y,z){ const base=new THREE.Group(); base.position.set(x,y,z); g.add(base); ckpBox(base,M.dark,0,-0.01,-0.04,0.07,0.02,0.24);
  const th=new THREE.Group(); base.add(th); const arm=ckpBox(th,M.metal,0,0.03,0,0.012,0.06,0.012); arm.rotation.x=0.2;
  ckpBox(th,M.grip,0,0.07,0.005,0.055,0.045,0.07); ckpBox(th,M.yel,0.02,0.09,-0.02,0.01,0.01,0.01); ckpBox(th,M.metal,-0.02,0.09,0.0,0.01,0.01,0.01);
  S2.thr=th; return th; }
function ckpCollective(S2,g,M,x,y,z){ const c=new THREE.Group(); c.position.set(x,y,z); ckpBar(c,M.metal,[0,0,0.18],[0,0.05,-0.12],0.014);
  ckpBox(c,M.grip,0,0.06,-0.15,0.05,0.05,0.07); ckpBox(c,M.yel,0.02,0.08,-0.17,0.012,0.012,0.012); ckpBox(c,M.red,-0.02,0.08,-0.17,0.012,0.012,0.012); g.add(c); S2.thr=c; S2.coll=true; return c; }
function ckpPedals(g,M,cx,y,z){ [-0.11,0.11].forEach(function(x){ ckpBox(g,M.dark,cx+x,y,z,0.08,0.025,0.15,-0.5); ckpBox(g,M.metal,cx+x,y-0.04,z+0.05,0.012,0.08,0.012); }); }
function ckpConsoles(g,M,w,len,y){ y=y==null?-0.48:y; [-1,1].forEach(function(s){ ckpBox(g,M.panel,s*w,y,-0.15,0.16,0.07,len); ckpBox(g,M.dark,s*w,y+0.04,-0.15,0.13,0.012,len*0.85);
  for(let i=0;i<6;i++){ const z=-0.45+i*0.1; ckpBox(g,M.bez,s*w,y+0.048,z,0.12,0.004,0.07); ckpCyl(g,i%3?M.metal:M.yel,s*w+(i%2?0.03:-0.03),y+0.058,z,0.008,0.014); ckpBox(g,M.osb,s*w+(i%2?-0.03:0.03),y+0.055,z,0.012,0.01,0.022); } }); }
function ckpSeatSides(g,M,w,y){ [-1,1].forEach(function(s){ ckpBox(g,M.seat,s*w,y,0.18,0.05,0.42,0.12); ckpBox(g,M.yel,s*w,y+0.18,0.12,0.012,0.08,0.012); }); }
function ckpGlare(g,M,w,py,pz,d){ ckpBox(g,M.glare,0,py+0.18,pz+0.05,w,0.03,d||0.22); const lip=ckpBox(g,M.glare,0,py+0.165,pz+0.16,w*0.98,0.02,0.02); return lip; }
function ckpHUD(g,M,py,pz,S2){ const gm=new THREE.MeshBasicMaterial({color:0x6fffc0,transparent:true,opacity:0.08,depthWrite:false,side:THREE.DoubleSide});
  const hg=new THREE.Mesh(new THREE.PlaneGeometry(0.17,0.15),gm); hg.position.set(0,py+0.33,pz+0.18); hg.rotation.x=0.42; g.add(hg);
  ckpBox(g,M.frame,-0.088,py+0.31,pz+0.18,0.008,0.15,0.008,0.42); ckpBox(g,M.frame,0.088,py+0.31,pz+0.18,0.008,0.15,0.008,0.42); ckpBox(g,M.dark,0,py+0.235,pz+0.14,0.2,0.04,0.09);
  if(S2) S2.hud=true; }
function ckpUFCP(S2,g,M,py,pz,w){ w=w||0.22; ckpBox(g,M.panel,0,py+0.13,pz+0.09,w+0.04,0.1,0.05,-0.55); ckpScr(S2,g,'ufcp',w,0.055,0,py+0.15,pz+0.12,-0.55,256,M,false);
  for(let i=0;i<6;i++) ckpBox(g,M.osb,-w/2+0.02+i*(w-0.04)/5,py+0.105,pz+0.105,0.026,0.016,0.012,-0.55); }
function ckpBubble(g,M,len){ [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.5,-0.3,-0.66],[s*0.5,-0.3,len],0.02); ckpBar(g,M.frame,[s*0.47,-0.27,-0.66],[s*0.3,0.05,-0.6],0.008); });
  ckpBar(g,M.frame,[-0.42,0.2,0.32],[0.42,0.2,0.32],0.02); [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.42,0.2,0.32],[s*0.5,-0.3,0.38],0.02); }); }
function ckpFramedScreen(g,M,heavy){ const r=heavy?0.026:0.018; [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.47,-0.23,-0.66],[s*0.36,0.16,-0.18],r); ckpBar(g,M.frame,[s*0.36,0.16,-0.18],[s*0.2,0.33,0.25],r*0.9); ckpBar(g,M.frame,[s*0.5,-0.3,-0.66],[s*0.5,-0.3,0.4],r*1.2); });
  ckpBar(g,M.frame,[-0.2,0.33,0.25],[0.2,0.33,0.25],r*0.9); }
function ckpMirrors(g,M){ [-1,1].forEach(function(s){ const mi=ckpBox(g,M.mirror,s*0.33,0.15,-0.2,0.07,0.03,0.01); mi.rotation.y=-s*0.5; }); }
function ckpProp(S2,g){ const pc2=document.createElement('canvas'); pc2.width=pc2.height=128; const px2=pc2.getContext('2d'); const gr2=px2.createRadialGradient(64,64,10,64,64,64);
  gr2.addColorStop(0,'rgba(40,40,40,.55)'); gr2.addColorStop(0.2,'rgba(30,30,30,.18)'); gr2.addColorStop(0.9,'rgba(30,30,30,.12)'); gr2.addColorStop(0.95,'rgba(255,216,74,.25)'); gr2.addColorStop(1,'rgba(30,30,30,0)');
  px2.fillStyle=gr2; px2.fillRect(0,0,128,128); const pt=new THREE.CanvasTexture(pc2);
  const prop=new THREE.Mesh(new THREE.CircleGeometry(1.15,32),new THREE.MeshBasicMaterial({map:pt,transparent:true,depthWrite:false})); prop.position.set(0,-0.32,-2.6); g.add(prop); S2.prop=prop; }
function ckpHelmet(g,M,x,y,z,s){ s=s||1; ckpBall(g,M.helm,x,y,z,0.13*s,1.05); const v=ckpBall(g,M.visor,x,y-0.02*s,z-0.06*s,0.1*s,0.7); v.scale.z=0.6; ckpBox(g,M.red,x,y+0.12*s,z+0.01,0.03*s,0.04*s,0.08*s); }
/* ---- the cockpits */
function ckpBuild(kind,v){ v=v||ckpVar(kind); const g=new THREE.Group(), S2={g:g, scr:[], kind:kind, v:v};
  const night=kind==='kaan'&&v==='C';
  const pc=night?0x15191d:({kaan:0x22282e, hurjet:0x2b3238, hurkus:0x353b41, t129:0x2c3228, t625:0x30353b}[kind]||0x2a3036);
  const M={panel:ckpMat(pc), dark:ckpMat(0x15191d), bez:ckpMat(0x0d1013), osb:ckpMat(night?0x1c2024:0x2a3036, night?0x120400:0), glare:ckpMat(night?0x0a0c0e:0x1a1e22),
    frame:ckpMat(kind==='t129'?0x3a4232:0x3a4148), grip:ckpMat(0x101214), boot:ckpMat(0x1a1c1e), yel:ckpMat(0xc9a227, night?0x201800:0), red:ckpMat(0xc8102e, night?0x300000:0),
    metal:ckpMat(0x7c858d), seat:ckpMat(0x262a2e), helm:ckpMat(0xe9edf0), visor:ckpMat(0x1a2028, 0x05080a), mirror:ckpMat(0x8fa3b3,0x101820),
    blue:ckpMat(0x1f3d5c,0x0a1a2a), touch:ckpMat(0x0a1622,0x040a12)};
  S2.night=night;
  if(kind==='kaan'){
    /* 5th generation: low panel, one panoramic display, side-stick on the right console, nearly frameless bubble canopy */
    const pz=-0.74, py=-0.44; ckpBox(g,M.panel,0,py,pz,0.94,0.33,0.06,-0.25); ckpGlare(g,M,0.96,py,pz);
    if(v==='B'){ ckpScr(S2,g,'wide2',0.84,0.24,0,py-0.01,pz+0.034,-0.25,1024,M); ckpUFCP(S2,g,M,py,pz,0.26); S2.hmd=true; }
    else { ckpScr(S2,g,'wide',0.84,0.24,0,py-0.01,pz+0.034,-0.25,1024,M); ckpHUD(g,M,py,pz,S2); }
    ckpConsoles(g,M,0.37,0.75); ckpSeatSides(g,M,0.3,-0.36);
    ckpStick(S2,g,M,0.37,-0.44,-0.26,0.12,true); ckpThrottle(S2,g,M,-0.36,-0.44,-0.05); ckpBubble(g,M,0.4);
    ckpBox(g,M.red,-0.05,py-0.2,pz+0.12,0.05,0.035,0.02); ckpBox(g,M.yel,0.05,py-0.2,pz+0.12,0.05,0.035,0.02);   /* master caution / gear handle area */
  } else if(kind==='hurjet'){
    const rear=v==='C', pz=rear?-0.66:-0.74, py=rear?-0.5:-0.42;
    ckpBox(g,M.panel,0,py,pz,0.92,0.34,0.06,-0.25); ckpGlare(g,M,0.96,py,pz,rear?0.16:0.22);
    if(v==='A'){ ckpScr(S2,g,'wide',0.82,0.24,0,py-0.01,pz+0.034,-0.25,1024,M); ckpHUD(g,M,py,pz,S2); }
    else if(v==='B'){ ckpBox(g,M.panel,0,py-0.30,pz+0.12,0.30,0.32,0.10);
      [-0.29,0,0.29].forEach(function(x,i){ ckpScr(S2,g,['adi','map','sys'][i],0.23,0.23,x,py-0.01,pz+0.034,-0.25,384,M); }); ckpUFCP(S2,g,M,py,pz,0.2); ckpHUD(g,M,py,pz,S2); }
    else { /* rear seat: instructor. The student's seat back and helmet fill the middle of the view; a repeater of the front HUD sits on the glareshield */
      [-0.26,0.26].forEach(function(x,i){ ckpScr(S2,g,['inst','map'][i],0.22,0.2,x,py-0.01,pz+0.034,-0.25,384,M); });
      ckpScr(S2,g,'hudrep',0.17,0.07,0,py+0.24,pz+0.1,-0.35,256,M,false);
      ckpBox(g,M.seat,0,-0.26,-1.02,0.4,0.5,0.12); ckpBox(g,M.dark,0,0.02,-1.03,0.26,0.1,0.13); ckpBox(g,M.yel,-0.15,-0.05,-0.955,0.02,0.1,0.02); ckpBox(g,M.yel,0.15,-0.05,-0.955,0.02,0.1,0.02);
      ckpBox(g,M.seat,-0.2,-0.2,-1.12,0.08,0.18,0.1); ckpBox(g,M.seat,0.2,-0.2,-1.12,0.08,0.18,0.1); ckpHelmet(g,M,0,0.15,-1.12,1); S2.rear=true; }
    ckpConsoles(g,M,0.37,0.75); ckpSeatSides(g,M,0.3,-0.36);
    ckpStick(S2,g,M,0,-0.72,-0.32,0.32); ckpThrottle(S2,g,M,-0.36,-0.45,-0.05);
    if(v==='A') ckpBubble(g,M,0.4); else { ckpFramedScreen(g,M,false); if(!rear) ckpMirrors(g,M); }
    if(rear){ [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.48,0.22,-1.3],[s*0.48,0.22,0.3],0.02); }); ckpBar(g,M.frame,[-0.46,0.3,-0.6],[0.46,0.3,-0.6],0.022); }
  } else if(kind==='hurkus'){
    const pz=-0.72, py=-0.40; ckpBox(g,M.panel,0,py,pz,0.9,0.36,0.07,-0.22); ckpGlare(g,M,0.94,py,pz,0.25);
    if(v==='A'){ ckpScr(S2,g,'adi',0.2,0.2,-0.3,py-0.01,pz+0.04,-0.22,384,M); ckpScr(S2,g,'map',0.2,0.2,0.3,py-0.01,pz+0.04,-0.22,384,M);
      ckpScr(S2,g,'sys',0.2,0.17,0,py-0.04,pz+0.04,-0.22,384,M); ckpUFCP(S2,g,M,py,pz,0.2); ckpHUD(g,M,py,pz,S2); }
    else if(v==='B'){ ckpScr(S2,g,'adi',0.22,0.22,-0.3,py-0.005,pz+0.04,-0.22,384,M); ckpScr(S2,g,'map',0.22,0.22,0.3,py-0.005,pz+0.04,-0.22,384,M);
      ckpScr(S2,g,'gauge',0.25,0.25,0,py-0.005,pz+0.04,-0.22,384,M,false); }
    else { ckpScr(S2,g,'big',0.44,0.2,0,py-0.01,pz+0.04,-0.22,768,M,false);
      [[-0.36,0.04,M.blue],[-0.36,-0.06,M.blue],[0.36,0.04,M.red],[0.36,-0.06,M.blue]].forEach(function(b){ const k=ckpBox(g,b[2],b[0],py+b[1],pz+0.05,0.13,0.07,0.03,-0.22); k.userData.big=1; }); S2.simple=true; }
    ckpBox(g,M.panel,0,py-0.30,pz+0.12,0.26,0.30,0.10); ckpConsoles(g,M,0.36,0.7); ckpSeatSides(g,M,0.3,-0.36);
    ckpStick(S2,g,M,0,-0.72,-0.32,0.32); ckpThrottle(S2,g,M,-0.35,-0.45,-0.05);
    ckpFramedScreen(g,M,v!=='C'); ckpBar(g,M.frame,[-0.47,-0.2,-0.64],[0.47,-0.2,-0.64],0.02); ckpProp(S2,g);
  } else if(kind==='t129'){
    if(v==='B'){ /* gunner, front seat: lowest and furthest forward, the widest view; the sight in the middle, the sensor turret below the nose */
      const pz=-0.7, py=-0.46; ckpBox(g,M.panel,0,py,pz,0.62,0.28,0.06,-0.3); ckpBox(g,M.dark,0,py+0.15,pz+0.04,0.6,0.025,0.14);
      ckpScr(S2,g,'sys',0.17,0.15,-0.25,py-0.03,pz+0.034,-0.3,256,M); ckpScr(S2,g,'map',0.17,0.15,0.25,py-0.03,pz+0.034,-0.3,256,M);
      const hood=ckpBox(g,M.dark,0,py+0.07,pz+0.04,0.28,0.2,0.1,-0.3); hood.userData.hood=1;
      ckpScr(S2,g,'sight',0.22,0.14,0,py+0.05,pz+0.105,-0.3,320,M,false); S2.sight=true;
      ckpBox(g,M.panel,0,-0.78,-1.2,0.56,0.08,0.5,0.35); ckpBox(g,M.panel,0,-0.86,-1.5,0.36,0.08,0.3,0.5); ckpBall(g,M.frame,0,-1.02,-1.62,0.07); ckpBall(g,M.visor,0,-1.03,-1.68,0.04);   /* nose and sensor turret */
      [-1,1].forEach(function(s){ ckpBox(g,M.grip,s*0.24,-0.56,-0.32,0.05,0.09,0.06); ckpBox(g,M.yel,s*0.24,-0.5,-0.34,0.012,0.012,0.012);
        ckpBar(g,M.frame,[s*0.36,-0.4,-0.82],[s*0.32,0.25,-0.45],0.02); ckpBar(g,M.frame,[s*0.32,0.25,-0.45],[s*0.28,0.4,0.1],0.02); ckpBar(g,M.frame,[s*0.36,-0.4,-0.82],[s*0.4,-0.36,0.3],0.02); });
      ckpBar(g,M.frame,[-0.32,0.25,-0.45],[0.32,0.25,-0.45],0.018); ckpBar(g,M.frame,[0,0.25,-0.45],[0,0.4,0.1],0.014);
      ckpCollective(S2,g,M,-0.3,-0.52,-0.05); S2.stick=new THREE.Group(); g.add(S2.stick); S2.front=true;
    } else { /* pilot, rear seat (also the night-vision variant): raised, the gunner's cabin and helmet ahead and below */
      const pz=-0.72, py=-0.46; ckpBox(g,M.panel,0,py,pz,0.66,0.26,0.06,-0.28); ckpBox(g,M.dark,0,py+0.14,pz+0.04,0.66,0.025,0.15);
      ckpScr(S2,g,'adi',0.2,0.19,-0.16,py-0.01,pz+0.034,-0.28,384,M); ckpScr(S2,g,'map',0.2,0.19,0.16,py-0.01,pz+0.034,-0.28,384,M);
      ckpBox(g,M.panel,0,-0.62,-1.35,0.62,0.22,0.5); ckpHelmet(g,M,0,-0.44,-1.55,1.05); ckpBox(g,M.seat,0,-0.54,-1.42,0.36,0.24,0.08);
      [-1,1].forEach(function(s){ ckpBar(g,M.frame,[s*0.34,-0.5,-1.9],[s*0.32,-0.05,-1.4],0.018); });
      [-1,1].forEach(function(s){ ckpBox(g,M.panel,s*0.33,-0.5,-0.2,0.12,0.07,0.7);
        ckpBar(g,M.frame,[s*0.38,-0.25,-0.8],[s*0.36,0.2,-0.5],0.02); ckpBar(g,M.frame,[s*0.36,0.2,-0.5],[s*0.3,0.42,0.05],0.02); ckpBar(g,M.frame,[s*0.38,-0.25,-0.8],[s*0.42,-0.3,0.3],0.02);
        ckpBar(g,M.frame,[s*0.37,0.0,-0.65],[s*0.4,-0.05,0.2],0.012); });
      ckpBar(g,M.frame,[-0.36,0.2,-0.5],[0.36,0.2,-0.5],0.018); ckpBar(g,M.frame,[0,0.2,-0.5],[0,0.42,0.05],0.014); ckpBar(g,M.frame,[-0.3,0.42,0.05],[0.3,0.42,0.05],0.02);
      ckpStick(S2,g,M,0,-0.72,-0.32,0.3); ckpCollective(S2,g,M,-0.3,-0.5,-0.05); S2.rear=true; if(v==='C') S2.nvg=true; }
    ckpPedals(g,M,0,-0.9,-0.55);
  } else if(kind==='t625'){
    if(v==='C'){ /* cabin, at the open left door: the view turns 90° left to look out; frame, seats, the door gun */
      ckpBox(g,M.dark,0,-0.78,0,2.2,0.04,2.4); ckpBox(g,M.panel,0,0.62,0,2.2,0.04,2.4);
      [-0.9,0.9].forEach(function(z){ ckpBox(g,M.frame,-0.95,0,z,0.08,1.4,0.08); }); ckpBox(g,M.frame,-0.95,0.58,0,0.08,0.08,1.9); ckpBox(g,M.frame,-0.95,-0.72,0,0.08,0.08,1.9);
      ckpBox(g,M.panel,0.6,0,-1.2,1.2,1.4,0.06); ckpBox(g,M.panel,0.6,0,1.2,1.2,1.4,0.06);
      for(let i=0;i<3;i++){ const z=-0.7+i*0.7; ckpBox(g,M.seat,0.9,-0.4,z,0.3,0.06,0.5); ckpBox(g,M.seat,1.05,-0.1,z,0.06,0.55,0.5); ckpBar(g,M.yel,[1.0,0.2,z-0.2],[0.85,-0.35,z+0.15],0.008); }
      const gun=new THREE.Group(); gun.position.set(-0.6,-0.5,0.32); g.add(gun); ckpCyl(gun,M.metal,0,-0.2,0,0.02,0.4);
      ckpBox(gun,M.grip,0.12,0.04,0,0.28,0.09,0.08); ckpCyl(gun,M.grip,-0.35,0.06,0,0.012,0.6,0,Math.PI/2); ckpBox(gun,M.yel,0.0,0.1,0.06,0.08,0.06,0.04); ckpBox(gun,M.grip,0.3,0.0,0,0.06,0.12,0.04);
      S2.gun=gun; S2.door=true; S2.stick=gun; S2.thr=new THREE.Group(); g.add(S2.thr);
    } else {
      /* utility helicopter, side by side: the pilot sits on the right */
      const pz=-0.85, py=-0.38, cx=-0.45; ckpBox(g,M.panel,cx,py,pz,1.5,0.3,0.06,-0.2); ckpBox(g,M.glare,cx,py+0.17,pz+0.05,1.55,0.035,0.22);
      if(v==='A'){ ckpScr(S2,g,'wide',0.5,0.2,0,py,pz+0.034,-0.2,768,M); ckpScr(S2,g,'wide',0.5,0.2,-0.9,py,pz+0.034,-0.2,512,M);
        ckpScr(S2,g,'touch',0.12,0.15,cx-0.07,-0.58,-0.55,-0.9,256,M,false); ckpScr(S2,g,'touch2',0.12,0.15,cx+0.07,-0.58,-0.55,-0.9,256,M,false); }
      else { ckpScr(S2,g,'adi',0.2,0.2,-0.12,py,pz+0.034,-0.2,384,M); ckpScr(S2,g,'map',0.2,0.2,0.12,py,pz+0.034,-0.2,384,M);
        ckpScr(S2,g,'map',0.2,0.2,-0.78,py,pz+0.034,-0.2,256,M); ckpScr(S2,g,'sys',0.2,0.2,-1.02,py,pz+0.034,-0.2,256,M);
        ckpScr(S2,g,'radio',0.1,0.06,cx,py+0.02,pz+0.04,-0.2,128,M,false); }
      ckpBox(g,M.panel,cx,-0.62,-0.45,0.3,0.16,0.8); ckpBox(g,M.dark,cx,-0.53,-0.25,0.24,0.012,0.4);
      ckpBox(g,M.panel,cx,0.52,-0.25,0.42,0.06,0.65); for(let i=0;i<8;i++) ckpBox(g,i%2?M.yel:M.metal,cx-0.17+i*0.05,0.485,-0.4+(i%2)*0.08,0.02,0.015,0.02);
      [[0.62],[-1.52]].forEach(function(a){ const x=a[0]; ckpBar(g,M.frame,[x,-0.8,-0.9],[x,0.55,-0.55],0.03); ckpBar(g,M.frame,[x,0.55,-0.55],[x,0.6,0.4],0.03); ckpBar(g,M.frame,[x,-0.1,0.3],[x,0.6,0.3],0.025); });
      ckpBar(g,M.frame,[-1.52,0.55,-0.55],[0.62,0.55,-0.55],0.03); ckpBar(g,M.frame,[cx,0.55,-0.55],[cx,-0.25,-0.9],0.03);
      ckpBar(g,M.frame,[0.05,-0.75,-0.95],[0.45,-0.75,-0.95],0.02); ckpBar(g,M.frame,[0.05,-0.75,-0.95],[0.05,-0.95,-0.6],0.02); ckpBar(g,M.frame,[0.45,-0.75,-0.95],[0.45,-0.95,-0.6],0.02);
      ckpPedals(g,M,0.15,-0.92,-0.62); ckpSeatSides(g,M,0.3,-0.36);
      ckpStick(S2,g,M,0,-0.75,-0.3,0.34); ckpCollective(S2,g,M,-0.22,-0.55,-0.02); }
  }
  g.traverse(function(o){ o.frustumCulled=false; }); return S2; }
function ckpInit(){ if(CKP.scene) return; const sc=new THREE.Scene(); CKP.scene=sc; CKP.cam=new THREE.PerspectiveCamera(78,1,0.02,6);
  CKP.hemi=new THREE.HemisphereLight(0xc4e0ff,0x3a3f46,0.7); sc.add(CKP.hemi); CKP.sun=new THREE.DirectionalLight(0xfff0d6,1); sc.add(CKP.sun); sc.add(CKP.sun.target);
  CKP.flood=new THREE.PointLight(0xffb070,0,1.6,1); CKP.flood.position.set(0,0.1,-0.3); sc.add(CKP.flood); }
function ckpSet(kind){ ckpInit(); const v=ckpVar(kind), key=kind+'-'+v; if(!CKP.sets[key]){ CKP.sets[key]=ckpBuild(kind,v); CKP.scene.add(CKP.sets[key].g); }
  Object.keys(CKP.sets).forEach(function(k){ CKP.sets[k].g.visible=k===key; }); CKP.cur=CKP.sets[key]; return CKP.cur; }
/* which interior (if any) is on screen now */
function ckpKind(){ if(state==='play'||state==='paused'||state==='mend'||state==='map'){ if(camMode===1&&!S.crashed&&CKP_FOR[activeId]) return CKP_FOR[activeId]; return null; }
  if((state==='walk'||(state==='paused'&&WALK.from==='walk'))&&WALK.mode==='heli'&&HELI.cur&&HELI.fp&&CKP_HELI[HELI.cur.id]) return CKP_HELI[HELI.cur.id];
  return null; }
/* ---- displays */
const CKC={bg:'#03100a', g:'#5dff9a', d:'#2c8a52', w:'#e6fff0', a:'#ffb25a', r:'#ff5a4a', c:'#5ad0ff'};
const CKC_DAY=Object.assign({},CKC), CKC_NIGHT={bg:'#060200', g:'#ff9a3c', d:'#8a4a14', w:'#ffd2a8', a:'#ffcf6a', r:'#ff4a3a', c:'#e08a4a'};
function mfdFrame(x,X0,Y0,W,H,title){ x.fillStyle=CKC.bg; x.fillRect(X0,Y0,W,H); x.strokeStyle=CKC.d; x.lineWidth=2; x.strokeRect(X0+3,Y0+3,W-6,H-6);
  x.fillStyle=CKC.d; x.font='700 '+Math.round(H*0.055)+'px "Chakra Petch",monospace'; x.textAlign='center'; x.textBaseline='top'; x.fillText(title,X0+W/2,Y0+8); }
function ckpAtt(heli){ let pitch, bank, spd, alt, hdg;
  if(heli){ const Hh=HELI.cur; pitch=-Hh.pitch; bank=-Hh.roll; spd=Math.hypot(Hh.vx,Hh.vz)*3.6; alt=Hh.y; hdg=((-Hh.h*57.3)%360+360)%360; }
  else { fwdOf(S.q,vF); const r=new THREE.Vector3(1,0,0).applyQuaternion(S.q), u=new THREE.Vector3(0,1,0).applyQuaternion(S.q); pitch=Math.asin(clamp(vF.y,-1,1)); bank=Math.atan2(-r.y,u.y); spd=S.speed*3.6; alt=S.pos.y; hdg=((Math.atan2(vF.x,-vF.z)*57.3)%360+360)%360; }
  return {pitch:pitch, bank:bank, spd:spd, alt:alt, hdg:hdg}; }
function mfdADI(x,X0,Y0,W,H,heli){ mfdFrame(x,X0,Y0,W,H,'PFD'); const cx=X0+W/2, cy=Y0+H*0.52, R=Math.min(W,H)*0.33, A=ckpAtt(heli);
  x.save(); x.beginPath(); x.arc(cx,cy,R,0,6.283); x.clip(); x.translate(cx,cy); x.rotate(-A.bank); const off=A.pitch*R*1.6;
  x.fillStyle=CKC===CKC_NIGHT||CKC.bg===CKC_NIGHT.bg?'#2a1404':'#1d5a9e'; x.fillRect(-R*2,-R*3+off,R*4,R*3); x.fillStyle=CKC.bg===CKC_NIGHT.bg?'#1a0a02':'#6b4a22'; x.fillRect(-R*2,off,R*4,R*3); x.strokeStyle=CKC.w; x.lineWidth=2; x.beginPath(); x.moveTo(-R*2,off); x.lineTo(R*2,off); x.stroke();
  x.lineWidth=1.2; for(let p=-30;p<=30;p+=10){ if(!p) continue; const y=off-p/57.3*R*1.6; x.beginPath(); x.moveTo(-R*0.25,y); x.lineTo(R*0.25,y); x.stroke(); } x.restore();
  x.strokeStyle=CKC.a; x.lineWidth=3; x.beginPath(); x.moveTo(cx-R*0.45,cy); x.lineTo(cx-R*0.12,cy); x.lineTo(cx-R*0.06,cy+R*0.07); x.moveTo(cx+R*0.45,cy); x.lineTo(cx+R*0.12,cy); x.lineTo(cx+R*0.06,cy+R*0.07); x.stroke();
  x.strokeStyle=CKC.d; x.lineWidth=2; x.beginPath(); x.arc(cx,cy,R,0,6.283); x.stroke();
  const f=Math.round(H*0.075); x.font='700 '+f+'px "Chakra Petch",monospace'; x.fillStyle=CKC.g; x.textBaseline='middle';
  x.textAlign='left'; x.fillText(Math.round(A.spd)+'', X0+10, cy); x.fillStyle=CKC.d; x.font='700 '+Math.round(f*0.6)+'px monospace'; x.fillText('KM/SA',X0+10,cy+f*0.8);
  x.textAlign='right'; x.fillStyle=CKC.g; x.font='700 '+f+'px "Chakra Petch",monospace'; x.fillText(Math.round(A.alt)+'',X0+W-10,cy); x.fillStyle=CKC.d; x.font='700 '+Math.round(f*0.6)+'px monospace'; x.fillText('M',X0+W-10,cy+f*0.8);
  x.textAlign='center'; x.fillStyle=CKC.w; x.font='700 '+Math.round(f*0.85)+'px "Chakra Petch",monospace'; x.fillText(String(Math.round(A.hdg)).padStart(3,'0')+'°',cx,Y0+H-f*0.8); }
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
/* round standby gauges (Hürkuş B): airspeed, attitude, altimeter, engine torque */
function mfdGauge(x,X0,Y0,W,H){ x.fillStyle='#0b0e11'; x.fillRect(X0,Y0,W,H); const r=W*0.22, P=[[W*0.27,H*0.27],[W*0.73,H*0.27],[W*0.27,H*0.73],[W*0.73,H*0.73]], A=ckpAtt(false);
  const dial=function(cx,cy,lbl,frac,txt){ x.fillStyle='#14181c'; x.beginPath(); x.arc(cx,cy,r,0,6.283); x.fill(); x.strokeStyle='#c8ccd0'; x.lineWidth=3; x.stroke();
    x.strokeStyle='#e9edf0'; x.lineWidth=2; for(let i=0;i<10;i++){ const a=-2.4+i*0.533; x.beginPath(); x.moveTo(cx+Math.cos(a)*r*0.82,cy+Math.sin(a)*r*0.82); x.lineTo(cx+Math.cos(a)*r*0.95,cy+Math.sin(a)*r*0.95); x.stroke(); }
    const a=-2.4+clamp(frac,0,1)*4.8; x.strokeStyle='#ffd27a'; x.lineWidth=4; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*r*0.78,cy+Math.sin(a)*r*0.78); x.stroke();
    x.fillStyle='#c8ccd0'; x.font='700 '+Math.round(r*0.22)+'px monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(lbl,cx,cy+r*0.42); x.fillStyle='#ffffff'; x.fillText(txt,cx,cy-r*0.38); };
  dial(P[0][0],P[0][1],'KNOT',S.speed/CUR.vTop,Math.round(S.speed*1.944)+'');
  const c=P[1]; x.save(); x.beginPath(); x.arc(c[0],c[1],r,0,6.283); x.clip(); x.translate(c[0],c[1]); x.rotate(-A.bank); const off=A.pitch*r*1.5;
  x.fillStyle='#2d6fb8'; x.fillRect(-r*2,-r*3+off,r*4,r*3); x.fillStyle='#7a5226'; x.fillRect(-r*2,off,r*4,r*3); x.strokeStyle='#fff'; x.lineWidth=2; x.beginPath(); x.moveTo(-r*2,off); x.lineTo(r*2,off); x.stroke(); x.restore();
  x.strokeStyle='#c8ccd0'; x.lineWidth=3; x.beginPath(); x.arc(c[0],c[1],r,0,6.283); x.stroke(); x.strokeStyle='#ffb25a'; x.beginPath(); x.moveTo(c[0]-r*0.5,c[1]); x.lineTo(c[0]+r*0.5,c[1]); x.stroke();
  dial(P[2][0],P[2][1],'M',(S.pos.y%1000)/1000,Math.round(S.pos.y)+'');
  dial(P[3][0],P[3][1],'TORK %',(S.ab?1:S.throttle),Math.round((S.ab?1:S.throttle)*100)+''); }
/* up-front control panel: radio, heading, altitude, keypad */
function mfdUfcp(x,X0,Y0,W,H){ x.fillStyle=CKC.bg; x.fillRect(X0,Y0,W,H); x.font='700 '+Math.round(H*0.32)+'px monospace'; x.textBaseline='middle'; x.textAlign='left'; x.fillStyle=CKC.g;
  const A=ckpAtt(false); x.fillText('UHF 251.0  HDG '+String(Math.round(A.hdg)).padStart(3,'0')+'  ALT '+Math.round(A.alt),X0+8,Y0+H*0.32);
  x.fillStyle=CKC.d; for(let i=0;i<8;i++) x.fillRect(X0+8+i*(W-16)/8,Y0+H*0.6,(W-16)/8-6,H*0.3); }
/* Hürkuş C: one big, plain display */
function mfdBig(x,W,H){ x.fillStyle='#04110b'; x.fillRect(0,0,W,H); const A=ckpAtt(false), hw=H*0.92;
  x.save(); x.beginPath(); x.rect(H*0.04,H*0.04,hw,hw); x.clip(); x.translate(H*0.04+hw/2,H*0.5); x.rotate(-A.bank); const off=A.pitch*hw;
  x.fillStyle='#2a6fb8'; x.fillRect(-hw,-hw*1.5+off,hw*2,hw*1.5); x.fillStyle='#7a5226'; x.fillRect(-hw,off,hw*2,hw*1.5); x.strokeStyle='#fff'; x.lineWidth=3; x.beginPath(); x.moveTo(-hw,off); x.lineTo(hw,off); x.stroke(); x.restore();
  x.strokeStyle='#ffb25a'; x.lineWidth=6; x.beginPath(); x.moveTo(H*0.04+hw*0.22,H*0.5); x.lineTo(H*0.04+hw*0.42,H*0.5); x.moveTo(H*0.04+hw*0.58,H*0.5); x.lineTo(H*0.04+hw*0.78,H*0.5); x.stroke();
  const L=hw+H*0.12; x.textAlign='left'; x.textBaseline='middle'; x.fillStyle='#5dff9a'; x.font='700 '+Math.round(H*0.2)+'px "Chakra Petch",sans-serif';
  x.fillText(Math.round(S.speed*1.944)+' KT',L,H*0.2); x.fillText(Math.round(A.alt*3.281)+' FT',L,H*0.47);
  x.fillStyle='#9fd7ff'; x.font='700 '+Math.round(H*0.12)+'px "Chakra Petch",sans-serif'; x.fillText('ROTA '+String(Math.round(A.hdg)).padStart(3,'0')+'° · GAZ '+Math.round((S.ab?1:S.throttle)*100)+'%',L,H*0.72);
  x.fillStyle=S.fuel!=null&&S.fuel<0.2?'#ff5a4a':'#2c8a52'; x.fillText('YAKIT '+(S.fuel!=null?Math.round(S.fuel*100)+'%':'—')+(S.gear?' · TEKER İNİK':''),L,H*0.88); }
/* Hürjet C: instructor page and the repeater of the front HUD */
function mfdInst(x,W,H){ mfdFrame(x,0,0,W,H,'EĞİTMEN'); const f=Math.round(H*0.075); let y=H*0.2; x.textAlign='left'; x.textBaseline='top';
  const row=function(k,v,c){ x.font='700 '+Math.round(f*0.75)+'px monospace'; x.fillStyle=CKC.d; x.fillText(k,12,y); x.font='700 '+f+'px "Chakra Petch",monospace'; x.fillStyle=c||CKC.g; x.textAlign='right'; x.fillText(v,W-12,y-2); x.textAlign='left'; y+=f*1.5; };
  row('ÖĞRENCİ G',(S.g||1).toFixed(1),(S.g||1)>6?CKC.r:CKC.g); row('HÜCUM AÇISI',Math.round((S.aoa||0)*57.3)+'°'); row('HIZ',Math.round(S.speed*3.6)+' km/sa'); row('ARIZA VER','▸',CKC.a); row('KUMANDA','ARKADA',CKC.c); }
function mfdHudRep(x,W,H){ x.fillStyle='#020804'; x.fillRect(0,0,W,H); const A=ckpAtt(false); x.save(); x.translate(W/2,H/2); x.rotate(-A.bank);
  x.strokeStyle='#7dffb0'; x.lineWidth=2; x.beginPath(); x.moveTo(-W*0.35,A.pitch*H*1.4); x.lineTo(W*0.35,A.pitch*H*1.4); x.stroke(); x.restore();
  x.strokeStyle='#7dffb0'; x.beginPath(); x.arc(W/2,H/2,5,0,6.283); x.stroke(); x.fillStyle='#7dffb0'; x.font='700 '+Math.round(H*0.24)+'px monospace'; x.textBaseline='middle';
  x.textAlign='left'; x.fillText(Math.round(S.speed*1.944)+'',6,H/2); x.textAlign='right'; x.fillText(Math.round(A.alt)+'',W-6,H/2); x.textAlign='center'; x.fillText('HUD',W/2,H*0.16); }
/* T625: touch command units and the radio strip */
function mfdTouch(x,W,H,two){ x.fillStyle='#0a1622'; x.fillRect(0,0,W,H); const L=two?['GÖREV','YÜK','ASKI','ROTA','IŞIK','ACİL']:['TELSİZ','IFF','NAV','HARİTA','INT','KAYIT'];
  x.font='700 '+Math.round(H*0.075)+'px "Chakra Petch",sans-serif'; x.textAlign='center'; x.textBaseline='middle';
  L.forEach(function(t,i){ const c=i%2, r=(i/2)|0, bx=W*0.06+c*W*0.47, by=H*0.06+r*H*0.31; x.fillStyle=t==='ACİL'?'#4a1a1a':'#1f3d5c'; x.fillRect(bx,by,W*0.41,H*0.26); x.strokeStyle=t==='ACİL'?'#d85a5a':'#5aa0d8'; x.lineWidth=2; x.strokeRect(bx,by,W*0.41,H*0.26); x.fillStyle='#e6f3ff'; x.fillText(t,bx+W*0.205,by+H*0.13); }); }
function mfdRadio(x,W,H){ x.fillStyle='#04110b'; x.fillRect(0,0,W,H); x.fillStyle='#5dff9a'; x.font='700 '+Math.round(H*0.3)+'px monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('VHF 122.8',W/2,H*0.3); x.fillText('UHF 251.0',W/2,H*0.72); }
/* T129 B: crosshair, range and mode over the sight camera picture */
function mfdSightOv(x,W,H){ x.clearRect(0,0,W,H); x.strokeStyle='rgba(255,255,255,.9)'; x.lineWidth=2; const cx=W/2, cy=H/2;
  x.beginPath(); x.moveTo(cx,H*0.1); x.lineTo(cx,cy-H*0.1); x.moveTo(cx,cy+H*0.1); x.lineTo(cx,H*0.9); x.moveTo(W*0.15,cy); x.lineTo(cx-W*0.06,cy); x.moveTo(cx+W*0.06,cy); x.lineTo(W*0.85,cy); x.stroke(); x.strokeRect(cx-W*0.06,cy-H*0.1,W*0.12,H*0.2);
  x.fillStyle='#fff'; x.font='700 '+Math.round(H*0.08)+'px monospace'; x.textBaseline='top'; x.textAlign='left'; x.fillText('IR · 12×',8,6); x.textAlign='right';
  let rng='—'; try{ const Hh=HELI.cur; rng=(Math.max(80,Hh.y/Math.tan(0.22))/1000).toFixed(1)+' KM'; }catch(e){} x.fillText('LRF '+rng,W-8,6); }
function ckpMFD(){ const S2=CKP.cur; if(!S2) return; const heli=ckpIsHeli(S2.kind);
  if(S2.night) Object.assign(CKC,CKC_NIGHT);
  try{ S2.scr.forEach(function(s){ const x=s.x, W=s.c.width, H=s.c.height;
    if(s.role==='wide'){ const w3=W/3; mfdADI(x,0,0,w3,H,heli); mfdMap(x,w3,0,w3,H,heli); mfdSys(x,w3*2,0,w3,H,heli); }
    else if(s.role==='wide2'){ const w2=W/2; mfdADI(x,0,0,w2,H,heli); mfdMap(x,w2,0,w2,H,heli); }
    else if(s.role==='adi') mfdADI(x,0,0,W,H,heli); else if(s.role==='map') mfdMap(x,0,0,W,H,heli); else if(s.role==='sys') mfdSys(x,0,0,W,H,heli);
    else if(s.role==='gauge') mfdGauge(x,0,0,W,H); else if(s.role==='ufcp') mfdUfcp(x,0,0,W,H); else if(s.role==='big') mfdBig(x,W,H);
    else if(s.role==='inst') mfdInst(x,W,H); else if(s.role==='hudrep') mfdHudRep(x,W,H); else if(s.role==='touch') mfdTouch(x,W,H,false); else if(s.role==='touch2') mfdTouch(x,W,H,true);
    else if(s.role==='radio') mfdRadio(x,W,H); else if(s.role==='sight') mfdSightOv(x,W,H);
    s.tex.needsUpdate=true; }); }
  finally{ if(S2.night) Object.assign(CKC,CKC_DAY); } }
/* T129 B: the sight shows the world through a narrow camera under the nose (render target, 5 Hz, IR-like grey) */
function ckpSight(S2,dt){ if(!S2.sight||typeof renderer==='undefined'||!renderer||!renderer.setRenderTarget) return; CKP.rtT-=dt; if(CKP.rtT>0) return; CKP.rtT=0.2;
  try{ if(!CKP.rt){ CKP.rt=new THREE.WebGLRenderTarget(320,208); CKP.rtCam=new THREE.PerspectiveCamera(9,320/208,2,9000);
      const s=S2.scr.find(function(q){ return q.role==='sight'; }); if(s){ const pic=new THREE.Mesh(new THREE.PlaneGeometry(0.22,0.14),new THREE.MeshBasicMaterial({map:CKP.rt.texture,color:0xb8c8b8})); pic.position.z=-0.0005; s.unit.add(pic);
        s.m.material.transparent=true; s.m.material.depthWrite=false; } }
    const Hh=HELI.cur; CKP.rtCam.position.set(Hh.x-Math.sin(Hh.h)*3, Hh.y+0.6, Hh.z-Math.cos(Hh.h)*3); CKP.rtCam.quaternion.setFromEuler(ckSE.set(-0.22+(WALK.pitch||0)*0.5,Hh.h+(WALK.cy||0)*0.5,0)); CKP.rtCam.updateMatrixWorld();
    renderer.setRenderTarget(CKP.rt); renderer.render(scene,CKP.rtCam); renderer.setRenderTarget(null); }catch(e){} }
/* T129 C: night-vision goggles over the whole view (below the HUD) */
function ckpNvg(on){ if(!CKP.nvg){ if(!on||!document.createElement) return; CKP.nvg=document.createElement('div'); CKP.nvg.className='ckpnvg hidden'; const hud=$('hud'); if(hud&&hud.parentNode) hud.parentNode.insertBefore(CKP.nvg,hud); else document.body.appendChild(CKP.nvg); }
  CKP.nvg.classList.toggle('hidden',!on); }
/* in-flight button: 🛩 Kokpit A · name › (cycles A → B → C) */
function ckpBtn(kind){ if(!CKP.btn){ if(!kind||!document.createElement) return; const b=document.createElement('button'); b.type='button'; b.className='ckbtn hidden'; b.addEventListener('click',function(e){ e.stopPropagation(); ckpCycle(); }); document.body.appendChild(b); CKP.btn=b; }
  const on=!!kind&&(state==='play'||state==='walk'); CKP.btn.classList.toggle('hidden',!on); if(on){ const v=ckpVar(kind), t='🛩 Kokpit '+v+' · '+CKP_VARS[kind][v]+' ›'; if(CKP.btn.textContent!==t) CKP.btn.textContent=t; } }
/* ---- per frame: pose, lighting, head */
const ckSE=new THREE.Euler(0,0,0,'YXZ'), ckE=new THREE.Euler(0,0,0,'YXZ'), ckQ=new THREE.Quaternion(), ckQi=new THREE.Quaternion(), ckV=new THREE.Vector3(), ckHQ=new THREE.Quaternion();
function ckpUpdate(dt){ const kind=ckpKind(); CKP.on=!!kind; try{ ckpBtn(kind); }catch(e){} if(!kind){ if(CKP.nvg) ckpNvg(false); return; } const S2=ckpSet(kind), heli=ckpIsHeli(kind);
  CKP.mfdT-=dt; if(CKP.mfdT<=0){ CKP.mfdT=0.12; try{ ckpMFD(); }catch(e){} }
  ckpNvg(!!S2.nvg&&state==='walk');
  /* inputs move the stick / throttle */
  if(heli){ const inp=typeof heliInput==='function'?heliInput():{f:0,r:0,c:0}; if(S2.door){ S2.gun.rotation.set(0,-(WALK.cy||0)*0.4,(WALK.pitch||0)*0.4); } else { S2.stick.rotation.set(-inp.f*0.25,0,-inp.r*0.25); S2.thr.rotation.x=(inp.c||0)*0.35; } }
  else { S2.stick.rotation.set(-(S.pitchIn||0)*0.28,0,-(S.rollIn||0)*0.28); S2.thr.position.z=-(S.ab?1:S.throttle)*0.12; if(S2.prop){ S2.prop.material.opacity=0.35+0.65*(S.ab?1:S.throttle); S2.prop.rotation.z+=dt*40; } }
  /* head movement */
  const H=CKP.head, on=ckpHeadOn(); let ty=0,tp=0,tdy=0;
  if(on&&!heli&&state==='play'){ tdy=-clamp((S.g||1)-1,-1,7)*0.012; ty=-(S.rollIn||0)*0.12-(S.yawIn||0)*0.08; tp=-(S.pitchIn||0)*0.03; }
  const k=1-Math.exp(-dt*4); H.y+=(ty-H.y)*k; H.p+=(tp-H.p)*k; H.dy+=(tdy-H.dy)*(1-Math.exp(-dt*6));
  let shake=0; if(on&&state==='play'&&!heli){ shake=clamp((S.speed-CUR.vTop*0.85)/(CUR.vTop*0.5),0,1)*0.004+(typeof WX!=='undefined'?Math.max(0,WX.cur.turb-0.08)*(typeof turbK==='function'?turbK():0.35)*0.006:0); }
  const sx=shake?Math.sin(T*37)*shake:0, sy=shake?Math.sin(T*29+1)*shake:0;
  if(heli){ CKP.cam.position.set(0,0,0); ckE.set((WALK.pitch||0)-0.12,(WALK.cy||0)+(S2.door?Math.PI/2:0),0);
    /* seat position: T129 pilot sits one metre behind and above the gunner; the T625 door gunner in the cabin, looking out of the left door */
    const Hh=HELI.cur; let ox=0,oy=0,oz=0; if(kind==='t129'&&S2.rear){ oy=0.35; oz=1.05; } else if(S2.door){ ox=-0.95; oy=-0.25; oz=2.6; }
    if(ox||oy||oz){ ckHQ.setFromEuler(new THREE.Euler(Hh.pitch*-0.9,Hh.h,-Hh.roll*0.9,'YXZ')); camera.position.add(ckV.set(ox,oy,oz).applyQuaternion(ckHQ)); }
    if(S2.door){ ckQ.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2); camera.quaternion.multiply(ckQ); }
    if(ox||oy||oz||S2.door) camera.updateMatrixWorld(); ckpSight(S2,dt); }
  else { CKP.cam.position.set(sx,H.dy+sy,0); ckE.set(CAMU.pitch+H.p,CAMU.yaw+H.y,0); }
  CKP.cam.quaternion.setFromEuler(ckE); CKP.cam.fov=camera.fov; CKP.cam.aspect=camera.aspect; CKP.cam.updateProjectionMatrix(); CKP.cam.updateMatrixWorld();
  /* apply the same head offsets to the world camera (fighters; heli fp already handled by heliCam); the Hürjet rear seat sits 1 m back and a little higher */
  if(!heli&&(H.y||H.p||H.dy||shake||S2.rear)){ ckQ.setFromEuler(ckE.set(H.p,H.y,0)); camera.quaternion.multiply(ckQ); camera.position.add(ckV.set(sx,H.dy+sy+(S2.rear?0.12:0),S2.rear?1.05:0).applyQuaternion(S.q)); camera.updateMatrixWorld(); }
  /* light: world sun / sky expressed in the cockpit frame */
  if(heli){ const Hh=HELI.cur; ckQi.setFromEuler(ckE.set(Hh.pitch*-0.9,Hh.h,-Hh.roll*0.9)).invert(); } else ckQi.copy(S.q).invert();
  CKP.sun.position.copy(SUN).applyQuaternion(ckQi).multiplyScalar(5); CKP.sun.target.position.set(0,0,0); CKP.sun.color.copy(sunLight.color); CKP.sun.intensity=sunLight.intensity*0.9;
  CKP.hemi.color.copy(HEMI.color); CKP.hemi.groundColor.copy(HEMI.groundColor); CKP.hemi.intensity=HEMI.intensity*0.8+0.12;
  if(S2.night){ CKP.flood.color.setHex(0xff3a2a); CKP.flood.intensity=0.5+(TOD.nightK||0)*0.6; } else { CKP.flood.color.setHex(0xffb070); CKP.flood.intensity=(TOD.nightK||0)*0.9+(typeof WX!=='undefined'?WX.cur.dark*0.3:0); } }
renderFrame=HOOK.wrap('renderFrame','ucus/kokpit#_ckpRender',function(_ckpRender){ return function(dt){ _ckpRender(dt); const on=CKP.on; CKP.on=false; if(!on||!CKP.scene) return; const ac=renderer.autoClear; renderer.autoClear=false; renderer.clearDepth(); renderer.render(CKP.scene,CKP.cam); renderer.autoClear=ac; }; },renderFrame);
cameraUpdate=HOOK.wrap('cameraUpdate','ucus/kokpit#_ckpCam',function(_ckpCam){ return function(dt){ _ckpCam(dt); if(state!=='replay') ckpUpdate(dt); }; },cameraUpdate);
walkCam=HOOK.wrap('walkCam','ucus/kokpit#_ckpWalkCam',function(_ckpWalkCam){ return function(dt){ _ckpWalkCam(dt); ckpUpdate(dt); }; },walkCam);
/* settings: head movement; cockpit layout per aircraft (Ayarlar → Uçuş → Kokpit düzeni) */
(function(){ const c=$('setCkpHead'); if(c) c.addEventListener('change',function(){ SETTINGS.ckpHead=c.checked; saveSettings(); }); })();
(function(){ const c=$('setCkpHead'); const row=c&&c.closest&&c.closest('.srow'); if(!row||!document.createElement) return;
  const r=document.createElement('div'); r.className='srow ckvrow';
  r.innerHTML='<div class="sl"><b>Kokpit düzeni</b><small>Her uçak ve helikopter için üç kokpit. Uçuşta kokpit görünümündeki 🛩 düğmesiyle de değişir.</small></div><div class="ckvars" id="setCkpVar">'+
    Object.keys(CKP_VARS).map(function(k){ return '<div class="ckv"><span>'+CKP_NAMES[k]+'</span><div class="seg" data-k="'+k+'">'+['A','B','C'].map(function(v){ return '<button type="button" data-v="'+v+'" title="'+CKP_VARS[k][v]+'">'+v+'</button>'; }).join('')+'</div></div>'; }).join('')+'</div>';
  row.parentNode.insertBefore(r,row.nextSibling);
  r.querySelector('#setCkpVar').addEventListener('click',function(e){ const b=e.target.closest('button[data-v]'); if(!b) return; const k=b.closest('.seg').dataset.k; ckpSetVar(k,b.dataset.v); toast(CKP_NAMES[k]+' · Kokpit '+b.dataset.v+' · '+CKP_VARS[k][b.dataset.v],'#ffd27a'); }); })();
syncSettingsUI=HOOK.wrap('syncSettingsUI','ucus/kokpit#_ckpSync',function(_ckpSync){ return function(){ _ckpSync(); const c=$('setCkpHead'); if(c) c.checked=ckpHeadOn();
  const w=$('setCkpVar'); if(w&&w.querySelectorAll) Array.prototype.forEach.call(w.querySelectorAll('.seg'),function(sg){ const k=sg.dataset.k; Array.prototype.forEach.call(sg.children,function(b){ b.setAttribute('aria-pressed',String(b.dataset.v===ckpVar(k))); }); }); }; },syncSettingsUI);
