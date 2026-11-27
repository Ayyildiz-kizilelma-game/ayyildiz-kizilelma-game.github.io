/* ------------------------------------------------------------------ ground control stations you can walk into (V2.78)
   Three places to fly a UAV from, on foot (Hızlı Oyun → Üssü Gez, or the map's place list):
     A  YKİ-1 konteyner — at the UAV centre, beside the runway: a shelter with mast, dish and generator. Walk in through
        the door; inside two operator seats, two live monitors (camera feed of the patrolling Akıncı, tactical map),
        racks with blinking lights. At the pilot seat: E → choose a UAV → it takes off from the UAV runway.
     B  İHA Harekât Merkezi — a larger building at the UAV centre: a wall-size screen with the island map, every UAV
        and three live camera feeds; rows of operator desks; your desk is marked. E at your desk → choose a UAV.
     C  Mobil yer istasyonu — a truck parked in the field behind the front (west of Anadolukent, towards Kızıl Bölge):
        the rear door is open, console inside, dish on the roof. E at the rear → the UAV starts in the air above the
        truck. The link reaches 15 km from the truck: the link bar drops with distance, beyond the range the UAV turns
        back towards the truck by itself until the link is back.
   UAVs launched from a station start in the ground control station view (operator console). */
const YKI={sites:[], built:false, ctrl:null, link:1, linkEl:null, pick:null, mapC:null, mapT:null, feed:null, feedCam:null, feedT:0, mapTm:0, leds:[], ledT:0, warnT:0, turnMsgT:0};
const YKI_RANGE=15000;
function ykiMat(c,e){ return new THREE.MeshLambertMaterial({color:c, emissive:e||0}); }
function ykiScreenTex(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; const t=new THREE.CanvasTexture(c); return {c:c, x:c.getContext('2d'), t:t}; }
/* the live tactical map shared by every station screen (island outline, bases, UAVs, the player's last UAV) */
function ykiDrawMap(){ const M=YKI.mapC; if(!M) return; const x=M.x, W=M.c.width, H=M.c.height, S=W/32000;
  x.fillStyle='#06120c'; x.fillRect(0,0,W,H); x.strokeStyle='#123a26'; x.lineWidth=1; for(let i=1;i<8;i++){ x.beginPath(); x.moveTo(i*W/8,0); x.lineTo(i*W/8,H); x.stroke(); x.beginPath(); x.moveTo(0,i*H/8); x.lineTo(W,i*H/8); x.stroke(); }
  const P=function(wx,wz){ return [W/2+wx*S, H/2+wz*S]; };
  x.fillStyle='#1d4a2e'; x.beginPath(); x.ellipse(W/2,H/2,W*0.42,H*0.42,0,0,6.283); x.fill();
  (typeof PLACES!=='undefined'?PLACES:[]).forEach(function(p){ const q=P(p.x,p.z); x.fillStyle=p.k==='enemy'?'#ff5a4a':p.k==='air'?'#5ad0ff':'#2c8a52'; x.fillRect(q[0]-3,q[1]-3,6,6); });
  YKI.sites.forEach(function(s){ const q=P(s.x,s.z); x.strokeStyle='#ffd27a'; x.lineWidth=2; x.strokeRect(q[0]-5,q[1]-5,10,10); if(s.id==='c'){ x.strokeStyle='rgba(255,210,122,.35)'; x.beginPath(); x.arc(q[0],q[1],YKI_RANGE*S,0,6.283); x.stroke(); } });
  const tri=function(wx,wz,h,col){ const q=P(wx,wz); x.save(); x.translate(q[0],q[1]); x.rotate(-h); x.fillStyle=col; x.beginPath(); x.moveTo(0,-8); x.lineTo(6,6); x.lineTo(-6,6); x.closePath(); x.fill(); x.restore(); };
  if(typeof UAV!=='undefined'&&UAV.orbit&&UAV.orbit.group){ const g=UAV.orbit.group; tri(g.position.x,g.position.z,g.rotation.y,'#5dff9a'); }
  if(typeof ACT!=='undefined') ACT.forEach(function(a){ if(a.alive&&a.pos) tri(a.pos.x,a.pos.z,0,a.team==='red'?'#ff5a4a':'#5ad0ff'); });
  x.fillStyle='#5dff9a'; x.font='700 '+Math.round(H*0.045)+'px monospace'; x.textAlign='left'; x.textBaseline='top'; x.fillText('HAREKÂT HARİTASI · '+new Date().toTimeString().slice(0,8),10,8);
  YKI.mapC.t.needsUpdate=true; }
/* live camera feed of the patrolling Akıncı (render target, 2 Hz, only while someone is inside a station) */
function ykiFeed(dt){ if(!YKI.feed||typeof renderer==='undefined'||!renderer||!renderer.setRenderTarget) return; YKI.feedT-=dt; if(YKI.feedT>0) return; YKI.feedT=0.5;
  try{ const o=UAV.orbit&&UAV.orbit.group; if(!o) return; const c=YKI.feedCam; c.position.copy(o.position); c.position.y-=3; c.lookAt(o.position.x+Math.sin(T*0.1)*400,Math.max(terrainH(o.position.x,o.position.z),0),o.position.z+Math.cos(T*0.1)*400); c.updateMatrixWorld();
    renderer.setRenderTarget(YKI.feed); renderer.render(scene,c); renderer.setRenderTarget(null); }catch(e){} }
function ykiFeedMat(){ if(!YKI.feed&&THREE.WebGLRenderTarget){ try{ YKI.feed=new THREE.WebGLRenderTarget(320,200); YKI.feedCam=new THREE.PerspectiveCamera(14,1.6,5,12000); }catch(e){} }
  return YKI.feed?new THREE.MeshBasicMaterial({map:YKI.feed.texture,color:0xc8d4c8}):new THREE.MeshBasicMaterial({color:0x222222}); }
/* a monitor on a stand: bezel + screen (material) */
function ykiMonitor(g,M,mat,x,y,z,w,h,ry){ const u=new THREE.Group(); u.position.set(x,y,z); u.rotation.y=ry||0; g.add(u);
  apBox(u,M.bez,0,-h/2-0.02,0.02,w+0.05,h+0.05,0.04); const s=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat); s.position.set(0,0,0.045); u.add(s); apBox(u,M.dark,0,-h/2-0.2,-0.02,0.05,0.2,0.05); return u; }
function ykiChair(g,M,x,y,z,ry){ const c=new THREE.Group(); c.position.set(x,y,z); c.rotation.y=ry||0; g.add(c); apCyl(c,M.dark,0,0,0,0.05,0.25,0.06,8); apCyl(c,M.metal,0,0.06,0,0.03,0.03,0.38,6);
  apBox(c,M.seat,0,0.44,0,0.5,0.08,0.48); apBox(c,M.seat,0,0.5,0.22,0.48,0.62,0.07); apBox(c,M.dark,-0.27,0.55,0,0.04,0.04,0.36); apBox(c,M.dark,0.27,0.55,0,0.04,0.04,0.36); }
function ykiRack(g,M,x,y,z,w,d){ apBox(g,M.dark,x,y,z,w,1.9,d); for(let i=0;i<7;i++){ apBox(g,M.bez,x,y+0.15+i*0.24,z+d/2+0.005,w-0.06,0.18,0.01);
  for(let k=0;k<3;k++){ const l=apBox(g,i%3?M.led:M.ledR,x-w/2+0.1+k*0.05,y+0.22+i*0.24,z+d/2+0.012,0.02,0.02,0.01); YKI.leds.push(l); } } }
function ykiDesk(g,M,x,y,z,w,d){ apBox(g,M.desk,x,y+0.72,z,w,0.05,d); apBox(g,M.dark,x-w/2+0.05,y,z,0.05,0.72,d-0.05); apBox(g,M.dark,x+w/2-0.05,y,z,0.05,0.72,d-0.05); apBox(g,M.dark,x,y+0.2,z-d/2+0.03,w-0.1,0.5,0.03); }
function ykiStick(g,M,x,y,z){ apBox(g,M.dark,x,y,z,0.16,0.04,0.16); apCyl(g,M.metal,x,y+0.04,z,0.012,0.015,0.14,6); apBox(g,M.grip,x,y+0.17,z,0.05,0.09,0.06); }
function ykiSign(g,txt,x,y,z,w,ry){ const T2=apTex(256,64,function(c,W,H){ c.fillStyle='#0b1016'; c.fillRect(0,0,W,H); c.fillStyle='#ffd27a'; let fs=34; c.font='700 '+fs+'px "Chakra Petch",sans-serif'; while(fs>12&&c.measureText&&c.measureText(txt).width>W-16){ fs-=2; c.font='700 '+fs+'px "Chakra Petch",sans-serif'; } c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,W/2,H/2+2); });
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map:T2})); m.position.set(x,y,z); m.rotation.y=ry||0; g.add(m); return m; }
/* walls with a door gap; every wall is a walk-blocking box (local x/z → world, the station has no rotation) */
function ykiWalls(s,g,M,w,d,h,doorX,doorW,mat){ const hw=w/2, hd=d/2, t=0.12, X=s.x, Z=s.z, B=function(x0,x1,z0,z1){ WALKBOX.push({x0:X+x0,x1:X+x1,z0:Z+z0,z1:Z+z1}); };
  apBox(g,mat,0,0,hd,w,h,t); B(-hw,hw,hd-t,hd+t);                     /* back (north) */
  apBox(g,mat,-hw,0,0,t,h,d); B(-hw-t,-hw+t,-hd,hd); apBox(g,mat,hw,0,0,t,h,d); B(hw-t,hw+t,-hd,hd);
  const a=doorX-doorW/2, b=doorX+doorW/2; apBox(g,mat,(-hw+a)/2,0,-hd,a+hw,h,t); B(-hw,a,-hd-t,-hd+t); apBox(g,mat,(b+hw)/2,0,-hd,hw-b,h,t); B(b,hw,-hd-t,-hd+t);
  apBox(g,mat,doorX,2.2,-hd,doorW,h-2.2,t); apBox(g,M.floor,0,0,0,w,0.04,d); apBox(g,mat,0,h,0,w+0.3,0.15,d+0.3);   /* lintel, floor, roof */
  const lm=new THREE.MeshBasicMaterial({color:0xfff4e0}); for(let i=0;i<Math.max(1,Math.round(w/6));i++){ const l=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.04,0.2),lm); l.position.set(-hw+(i+0.5)*w/Math.max(1,Math.round(w/6)),h-0.04,0); g.add(l); }
  s.door={x:X+doorX, z:Z-hd}; }
function ykiBuildA(M,s){ const g=new THREE.Group(); g.position.set(s.x,s.y,s.z); scene.add(g); const w=12, d=3, h=2.9;
  ykiWalls(s,g,M,w,d,h,-4.4,1.1,M.shell); apBox(g,M.shell2,0,h+0.15,0,w+0.1,0.06,d+0.1);
  for(let i=-5;i<=5;i+=1){ apBox(g,M.rib,i,0,-d/2-0.07,0.08,h,0.04); apBox(g,M.rib,i,0,d/2+0.07,0.08,h,0.04); }   /* corrugation */
  apBox(g,M.dark,-4.4,-0.2,-d/2-0.4,1.4,0.2,0.7); apBox(g,M.dark,-4.4,-0.4,-d/2-0.9,1.4,0.2,0.5);   /* steps */
  ykiSign(g,'YKİ-1',-2.6,2.3,-d/2-0.08,1.6,Math.PI);
  /* inside: desk along the back wall, two seats, four monitors, racks at the east end */
  ykiDesk(g,M,-0.6,0,d/2-0.5,6.2,0.9); const feedM=ykiFeedMat(), mapM=new THREE.MeshBasicMaterial({map:YKI.mapC.t});
  ykiMonitor(g,M,feedM,-2.4,1.18,d/2-0.7,0.9,0.56,Math.PI); ykiMonitor(g,M,mapM,-1.4,1.18,d/2-0.7,0.9,0.56,Math.PI);
  ykiMonitor(g,M,mapM,0.4,1.18,d/2-0.7,0.9,0.56,Math.PI); ykiMonitor(g,M,feedM,1.4,1.18,d/2-0.7,0.9,0.56,Math.PI);
  ykiStick(g,M,-1.6,0.77,d/2-0.4); ykiStick(g,M,0.9,0.77,d/2-0.4); apBox(g,M.dark,-1.9,0.77,d/2-0.45,0.45,0.03,0.16); apBox(g,M.dark,0.6,0.77,d/2-0.45,0.45,0.03,0.16);
  ykiChair(g,M,-1.9,0,0.3,Math.PI); ykiChair(g,M,0.9,0,0.3,Math.PI); ykiSign(g,'PİLOT',-1.9,2.05,d/2-0.07,0.8,Math.PI); ykiSign(g,'OPERATÖR',0.9,2.05,d/2-0.07,0.8,Math.PI);
  ykiRack(g,M,4.6,0,0.6,0.7,0.8); ykiRack(g,M,4.6,0,-0.6,0.7,0.8); apBox(g,M.ac,-5.6,2.1,0,0.3,0.5,1.0);
  WALKBOX.push({x0:s.x-3.75,x1:s.x+2.6,z0:s.z+0.55,z1:s.z+1.5}, {x0:s.x+4.2,x1:s.x+5.0,z0:s.z-1.0,z1:s.z+1.0});
  /* outside: mast, dish, generator, cable */
  apCyl(g,M.metal,5.2,h,0.9,0.06,0.08,7,8); const lt=apBox(g,M.ledR,5.2,h+7,0.9,0.14,0.14,0.14); YKI.leds.push(lt); apBox(g,M.metal,5.2,h+5,0.9,1.2,0.05,0.05);
  if(typeof dish==='function') dish(g,M,3.4,h+0.2,0.2,1.2,0.7); apBox(g,M.gen,0,0,-d/2-2.6,2.2,1.4,1.2); WALKBOX.push({x0:s.x-1.1,x1:s.x+1.1,z0:s.z-d/2-3.2,z1:s.z-d/2-2.0});
  s.seat={x:s.x-1.9, z:s.z+0.3}; s.g=g; }
function ykiBuildB(M,s){ const g=new THREE.Group(); g.position.set(s.x,s.y,s.z); scene.add(g); const w=30, d=20, h=6.5;
  ykiWalls(s,g,M,w,d,h,0,2.4,M.wall); ykiSign(g,'İHA HAREKÂT MERKEZİ',0,4.2,-d/2-0.09,9,Math.PI);
  /* the wall screen: map in the middle, three camera feeds round it */
  apBox(g,M.bez,0,1.6,d/2-0.25,17,4.4,0.3); const mapM=new THREE.MeshBasicMaterial({map:YKI.mapC.t}), feedM=ykiFeedMat();
  const big=new THREE.Mesh(new THREE.PlaneGeometry(9,4),mapM); big.position.set(-3.6,3.8,d/2-0.42); big.rotation.y=Math.PI; g.add(big);
  [[3.6,4.85],[3.6,2.75]].forEach(function(p){ const f=new THREE.Mesh(new THREE.PlaneGeometry(4,1.9),feedM); f.position.set(p[0]+2.2,p[1],d/2-0.42); f.rotation.y=Math.PI; g.add(f); });
  const empty=new THREE.Mesh(new THREE.PlaneGeometry(3.9,1.9),new THREE.MeshBasicMaterial({color:0x111418})); empty.position.set(3.8,3.8,d/2-0.42); empty.rotation.y=Math.PI; g.add(empty);
  /* rows of desks facing the wall screen (north); yours is the front middle one, with a yellow edge */
  for(let r=0;r<3;r++) for(let c=0;c<4;c++){ const x=-9+c*6, z=3-r*4.2, mine=r===0&&c===1;
    ykiDesk(g,M,x,0,z,3.6,0.9); if(mine) apBox(g,M.yel,x,0.77,z-0.46,3.6,0.03,0.03);
    ykiMonitor(g,M,c%2?mapM:feedM,x-0.8,1.18,z+0.2,0.8,0.5,Math.PI); ykiMonitor(g,M,c%2?feedM:mapM,x+0.8,1.18,z+0.2,0.8,0.5,Math.PI); ykiStick(g,M,x-0.3,0.77,z-0.1);
    ykiChair(g,M,x,0,z-0.9,Math.PI); WALKBOX.push({x0:s.x+x-1.8,x1:s.x+x+1.8,z0:s.z+z-0.45,z1:s.z+z+0.45}); }
  ykiSign(g,'SENİN MASAN',-3,1.6,3.5,1.4,Math.PI);
  ykiRack(g,M,-14,0,-6,0.8,0.8); ykiRack(g,M,-14,0,-4.8,0.8,0.8); ykiRack(g,M,14,0,-6,0.8,0.8); WALKBOX.push({x0:s.x-14.5,x1:s.x-13.5,z0:s.z-6.5,z1:s.z-4.3},{x0:s.x+13.5,x1:s.x+14.5,z0:s.z-6.5,z1:s.z-5.5});
  if(typeof dish==='function'){ dish(g,M,10,h+0.15,-5,2.2,0.8); dish(g,M,-10,h+0.15,-5,1.6,0.7); } apCyl(g,M.metal,12,h,6,0.08,0.1,9,8); const lt=apBox(g,M.ledR,12,h+9,6,0.18,0.18,0.18); YKI.leds.push(lt);
  s.seat={x:s.x-3, z:s.z+3-0.9}; s.g=g; }
function ykiBuildC(M,s){ const g=new THREE.Group(); g.position.set(s.x,s.y,s.z); scene.add(g);
  /* 6×6 tactical truck pointing north: cab at the front, shelter box with the rear door open (south), dish mast on top */
  const L=8.5, W=2.5; [-2.8,0.2,1.8].forEach(function(z){ [-1,1].forEach(function(q){ const wh=apCyl(g,M.tyre,q*1.15,0.55,z,0.55,0.55,0.4,14); wh.rotation.z=Math.PI/2; wh.position.y=0.55; }); });
  apBox(g,M.olive,0,0.9,-2.9,W,0.5,L-0.4); apBox(g,M.olive,0,1.4,-3.35,W,1.6,1.8); apBox(g,M.glass,0,2.1,-4.27,W-0.3,0.7,0.05); apBox(g,M.dark,0,1.1,-4.3,W-0.2,0.3,0.1);   /* chassis, cab, windscreen, grille */
  apBox(g,M.olive2,0,1.4,0.15,W+0.1,2.5,5.2); const shellZ0=0.15-2.6;   /* shelter box */
  apBox(g,M.olive2,-W/2-0.4,1.4,2.75,0.06,2.4,0.9).rotation.y=-0.9;   /* the open rear door swung aside */
  apBox(g,M.dark,0,0.55,3.3,1.4,0.08,0.8); apBox(g,M.dark,0,0.25,3.7,1.4,0.08,0.4);   /* steps */
  apBox(g,M.floor,0,1.42,0.15,W-0.15,0.04,5.0); ykiDesk(g,M,0,1.42,-1.2,W-0.3,0.8); ykiMonitor(g,M,ykiFeedMat(),-0.5,2.6,-1.35,0.8,0.5,Math.PI); ykiMonitor(g,M,new THREE.MeshBasicMaterial({map:YKI.mapC.t}),0.5,2.6,-1.35,0.8,0.5,Math.PI);
  ykiStick(g,M,-0.3,2.19,-1.05); ykiChair(g,M,0,1.42,-0.2,Math.PI); ykiRack(g,M,-0.9,1.42,1.6,0.5,0.6); const lm=new THREE.Mesh(new THREE.BoxGeometry(1,0.04,0.2),new THREE.MeshBasicMaterial({color:0xfff4e0})); lm.position.set(0,3.85,0); g.add(lm);
  apCyl(g,M.metal,0.8,2.65,1.8,0.06,0.08,5,8); if(typeof dish==='function') dish(g,M,0.8,7.6,1.8,1.4,0.6); apCyl(g,M.metal,-0.9,2.65,2.2,0.03,0.03,7,6); const lt=apBox(g,M.ledR,-0.9,9.7,2.2,0.12,0.12,0.12); YKI.leds.push(lt);
  [-1,1].forEach(function(q){ apBox(g,M.dark,q*1.4,0,-2.2,0.15,0.6,0.15); apBox(g,M.dark,q*1.4,0,2.3,0.15,0.6,0.15); });   /* stabiliser legs */
  apBox(g,M.net,-4,0,-1,4,2.4,0.05).rotation.y=0.4; ykiSign(g,'MOBİL YKİ',0,3.2,2.8,1.6,0);
  WALKBOX.push({x0:s.x-W/2-0.1,x1:s.x+W/2+0.1,z0:s.z-L/2-1.0,z1:s.z+2.75});
  s.seat={x:s.x, z:s.z+3.5}; s.door={x:s.x,z:s.z+3.5}; s.g=g; }
function ykiBuild(){ if(YKI.built) return; YKI.built=true; YKI.mapC=ykiScreenTex(512,512); ykiDrawMap();
  const M=apMats(), X={bez:ykiMat(0x0d1013), dark:ykiMat(0x1b1f24), metal:ykiMat(0x8a939b), seat:ykiMat(0x2a3138), desk:ykiMat(0x5b636b), floor:ykiMat(0x3a4046), grip:ykiMat(0x101214),
    shell:ykiMat(0xc9c2a3), shell2:ykiMat(0xb5ae90), rib:ykiMat(0xb3ac8e), wall:ykiMat(0x9aa2a8), gen:ykiMat(0x55603f), ac:ykiMat(0xe6e8ea), yel:ykiMat(0xc9a227,0x3a2a00),
    led:ykiMat(0x1a3a22,0x2cff70), ledR:ykiMat(0x3a1a1a,0xff3a2a), olive:ykiMat(0x55603f), olive2:ykiMat(0x5d6845), tyre:ykiMat(0x141414), glass:ykiMat(0x6f8aa3,0x0a1018), net:ykiMat(0x4f5a39)};
  const MM=Object.assign({},M,X), Y=(typeof UAV!=='undefined'?UAV.y:45);
  YKI.sites=[{id:'a', name:'YKİ-1 konteyner', x:11480, z:11620, y:Y, launch:'runway'},
             {id:'b', name:'İHA Harekât Merkezi', x:11620, z:11400, y:Y, launch:'runway'},
             {id:'c', name:'Mobil yer istasyonu', x:-7000, z:6200, y:Math.max(terrainH(-7000,6200),0), launch:'air'}];
  try{ ykiBuildA(MM,YKI.sites[0]); }catch(e){ console.warn('YKİ-1',e); }
  try{ ykiBuildB(MM,YKI.sites[1]); }catch(e){ console.warn('Harekât merkezi',e); }
  try{ ykiBuildC(MM,YKI.sites[2]); }catch(e){ console.warn('Mobil YKİ',e); } }
buildUAV=HOOK.wrap('buildUAV','dunya/yer-istasyonu#_ykiBuild',function(next){ return function(){ const r=next.apply(this,arguments); try{ ykiBuild(); }catch(e){ console.warn('YKİ',e); } return r; }; },buildUAV);
/* map places: walk straight to the doors */
try{ PLACES.push({id:'yki',n:'YKİ-1 (İHA yer istasyonu)',k:'air',x:11480,z:11620,g:[11475.6,11612,Math.PI]},
  {id:'hmk',n:'İHA Harekât Merkezi',k:'air',x:11620,z:11400,g:[11620,11384,Math.PI]},
  {id:'mobil',n:'Mobil yer istasyonu',k:'army',x:-7000,z:6200,g:[-7000,6211,0]}); }catch(e){}
/* ---- on foot: near a pilot seat (or the truck's rear door) → E opens the UAV list */
function ykiNear(p){ let best=null, bd=1e9; YKI.sites.forEach(function(s){ if(!s.seat) return; const d=Math.hypot(p.x-s.seat.x,p.z-s.seat.z); if(d<(s.id==='c'?3.2:1.8)&&d<bd){ bd=d; best=s; } }); return best; }
walkUpdate=HOOK.wrap('walkUpdate','dunya/yer-istasyonu#_ykiWalk',function(next){ return function(dt){ next(dt); if(state!=='walk') return;
  if(WALK.mode==='foot'&&YKI.sites.length){ const s=ykiNear(WALK.pos); WALK.nearGcs=s; if(s&&(!WALK.near||WALK.near==='plane')) WALK.near='gcs'; else if(!s&&WALK.near==='gcs') WALK.near=null; }
  const c=camera.position, inside=YKI.sites.some(function(s){ return Math.abs(c.x-s.x)<20&&Math.abs(c.z-s.z)<14; });
  if(inside){ ykiFeed(dt); YKI.mapTm-=dt; if(YKI.mapTm<=0){ YKI.mapTm=0.5; ykiDrawMap(); } YKI.ledT+=dt; if(YKI.ledT>0.35){ YKI.ledT=0; YKI.leds.forEach(function(l){ l.visible=Math.random()>0.25; }); } } }; },walkUpdate);
walkInteract=HOOK.wrap('walkInteract','dunya/yer-istasyonu#_ykiAct',function(next){ return function(){ if(state==='walk'&&WALK.mode==='foot'&&WALK.near==='gcs'&&WALK.nearGcs){ ykiPickOpen(WALK.nearGcs); return; } next(); }; },walkInteract);
/* ---- UAV list */
function ykiUavs(){ return Object.keys(AIRCRAFT).filter(function(k){ return AIRCRAFT[k].uav; }); }
function ykiPickOpen(s){ if(!document.createElement) return; if(!YKI.pick){ const d=document.createElement('div'); d.className='ykipick hidden'; d.setAttribute('role','dialog');
    d.addEventListener('click',function(e){ const b=e.target.closest('button[data-id]'); if(b&&!b.disabled){ ykiLaunch(YKI.pickSite,b.dataset.id); return; } if(e.target.closest('.ykix')||e.target===d) ykiPickClose(); }); document.body.appendChild(d); YKI.pick=d; }
  YKI.pickSite=s; try{ if(document.pointerLockElement) document.exitPointerLock(); }catch(e){}
  YKI.pick.innerHTML='<div class="ykicard"><button type="button" class="ykix" aria-label="Kapat">✕</button><h3>'+s.name+'</h3><p>'+(s.launch==='air'?'İHA kamyonun üstünde havada başlar. Bağlantı menzili 15 km.':'İHA, İHA ve Test Merkezi pistinden kalkar.')+' Uçuş yer kontrol istasyonu görünümünde başlar; kamera düğmesiyle diğer açılara geçebilirsin.</p><div class="ykilist">'+
    ykiUavs().map(function(k){ const lk=typeof rankLocked==='function'&&rankLocked(k); return '<button type="button" data-id="'+k+'"'+(lk?' disabled':'')+'><b>'+AIRCRAFT[k].name+'</b><small>'+(lk?'🔒 rütbe gerekiyor':(AIRCRAFT[k].kind||'İHA'))+'</small></button>'; }).join('')+'</div></div>';
  YKI.pick.classList.remove('hidden'); }
function ykiPickClose(){ if(YKI.pick) YKI.pick.classList.add('hidden'); }
function ykiLaunch(s,id){ ykiPickClose(); const sp=SETTINGS.startPlace; selectedId=id; if(activeId!==id) setAircraft(id);
  if(s.launch==='runway'){ SETTINGS.startPlace='uav'; try{ startGame('runway'); } finally{ SETTINGS.startPlace=sp; } YKI.ctrl=null; }
  else { try{ startGame('air'); } finally{ SETTINGS.startPlace=sp; }
    const gy=Math.max(terrainH(s.x,s.z),0); S.pos.set(s.x,gy+600,s.z-300); S.q.setFromAxisAngle(UP,Math.atan2(-(-9600-s.x),-(9600-s.z)));   /* towards Kızıl Bölge */ S.speed=CUR.airV; S.throttle=0.7; S.gear=false; S.onGround=false;
    YKI.ctrl={x:s.x, z:s.z, r:YKI_RANGE, name:s.name}; }
  SETTINGS.uavView='gcs'; camMode=1; camSnap=true; YKI.link=1; toast('📡 '+s.name+' · '+AIRCRAFT[id].name+' kontrolde','#b8ecff'); }
/* ---- link range of the mobile station: link bar, and beyond the range the UAV turns home by itself */
const ykiQ=new THREE.Quaternion();
update=HOOK.wrap('update','dunya/yer-istasyonu#_ykiLink',function(next){ return function(dt){ next(dt); ykiLinkStep(dt); }; },update);
function ykiLinkStep(dt){ const C=YKI.ctrl, on=!!C&&state==='play'&&!!(CUR&&CUR.uav);
  if(!on){ if(YKI.linkEl) YKI.linkEl.classList.add('hidden'); if(C&&state==='menu') YKI.ctrl=null; return; }
  const d=Math.hypot(S.pos.x-C.x,S.pos.z-C.z); YKI.link=clamp(1-(d-C.r*0.6)/(C.r*0.4),0,1);
  if(!YKI.linkEl&&document.createElement){ YKI.linkEl=document.createElement('div'); YKI.linkEl.className='ykilink'; document.body.appendChild(YKI.linkEl); }
  if(YKI.linkEl){ YKI.linkEl.classList.remove('hidden'); YKI.linkEl.classList.toggle('weak',YKI.link<0.35); const t='📡 '+C.name+' · '+(d/1000).toFixed(1)+' km · bağlantı %'+Math.round(YKI.link*100); if(YKI.linkEl.textContent!==t) YKI.linkEl.textContent=t; }
  if(d>C.r&&!S.onGround){ fwdOf(S.q,vF); const want=Math.atan2(-(C.x-S.pos.x),-(C.z-S.pos.z)), cur=Math.atan2(-vF.x,-vF.z); let da=want-cur; da=Math.atan2(Math.sin(da),Math.cos(da));
    S.q.premultiply(ykiQ.setFromAxisAngle(UP,clamp(da,-1,1)*Math.min(1,dt*0.5))); YKI.turnMsgT-=dt; if(YKI.turnMsgT<=0){ YKI.turnMsgT=8; toast('📡 Bağlantı menzil dışında — İHA istasyona dönüyor','#ffb25a'); } } }
