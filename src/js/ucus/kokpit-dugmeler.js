/* ------------------------------------------------------------------ clickable cockpit (V2.73)
   In the 3D cockpit of KAAN, HÜRJET and HÜRKUŞ (each its own cockpit since V2.74) two side panels sit left and right of the instrument panel; click or tap
   them (a tap without dragging; dragging still looks around):
   • Left panel: İNİŞ TAKIMI lever (lights green when down), MASTER ARM switch (SAFE blocks every weapon: gun, missiles,
     bombs; ARM again for each flight), FIRLAT handle (two pulls, like J twice).
   • Right panel: FLARE (with the count), SİLAH (shows the selected weapon, steps to the next), GÖRÜŞ (off → gece görüş →
     termal).
   • Tapping the tactical map display changes its range (6 · 12 · 24 km).
   The panels are canvas textures redrawn when something changes; a pressed control flashes. On a mouse, the control under
   the pointer is outlined and its name and key show next to it. */
const CKB={arm:true, rng:12000, panels:null, press:null, pressT:0, hover:null, sig:'', tip:null, ray:new THREE.Raycaster(), ndc:new THREE.Vector2()};
const CKB_RNG=[6000,12000,24000];
const CKB_DEF={
  L:[{id:'gear',x:20,y:16,w:216,h:150,n:'İNİŞ TAKIMI',k:'G'},{id:'arm',x:20,y:182,w:216,h:86,n:'MASTER ARM',k:'—'},{id:'eject',x:20,y:284,w:216,h:84,n:'FIRLATMA KOLU',k:'J ×2'}],
  R:[{id:'flare',x:20,y:16,w:216,h:110,n:'FLARE',k:'Z'},{id:'wpn',x:20,y:142,w:216,h:110,n:'SİLAH SEÇİMİ',k:'N'},{id:'vis',x:20,y:268,w:216,h:100,n:'GECE GÖRÜŞ / TERMAL',k:'`'}]};
function ckbBuild(S2){ if(S2.ckb||ckpIsHeli(S2.kind)) return S2.ckb; const kaan=S2.kind==='kaan', P={};
  [['L',-1],['R',1]].forEach(function(a){ const s=a[1], scr=ckpScreen(S2.g,0.16,0.24,s*0.57,-0.31,-0.6,-0.3,256); scr.m.rotation.set(-0.3,-s*0.62,0,'YXZ');
    scr.m.userData.ckb=a[0]; const back=ckpBox(S2.g,ckpMat(kaan?0x23292f:0x2a3036),s*0.575,-0.31,-0.608,0.18,0.26,0.012); back.rotation.set(-0.3,-s*0.62,0,'YXZ');
    P[a[0]]=scr; });
  S2.ckb=P; S2.ckbMap=S2.scr.find(function(x){ return x.role==='wide'||x.role==='map'; })||null; return P; }
/* ---- drawing */
function ckbLamp(x,cx,cy,r,on,col){ x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.fillStyle=on?col:'#1b2228'; x.fill(); if(on){ x.shadowColor=col; x.shadowBlur=12; x.fill(); x.shadowBlur=0; } x.strokeStyle='#05080a'; x.lineWidth=2; x.stroke(); }
function ckbBox(x,b,lit){ x.fillStyle=lit?'#3a4652':'#1d242b'; x.strokeStyle=CKB.hover===b.id?'#ffd27a':'#53606c'; x.lineWidth=CKB.hover===b.id?4:2;
  x.beginPath(); if(x.roundRect) x.roundRect(b.x,b.y,b.w,b.h,10); else x.rect(b.x,b.y,b.w,b.h); x.fill(); x.stroke();
  x.fillStyle='#c8d4de'; x.font='700 17px "Chakra Petch",monospace'; x.textAlign='center'; x.fillText(b.n,b.x+b.w/2,b.y+24); }
function ckbWpn(){ try{ return selW&&WEAPONS[selW]?WEAPONS[selW].name+' ×'+(INV[selW]||0):'—'; }catch(e){ return '—'; } }
function ckbDraw(P){ const now=CKB.press&&performance.now()<CKB.pressT?CKB.press:null;
  let x=P.L.x; x.fillStyle='#14191e'; x.fillRect(0,0,256,384);
  CKB_DEF.L.forEach(function(b){ ckbBox(x,b,now===b.id); });
  /* gear lever: up or down, three green lamps when down */
  const g=CKB_DEF.L[0], gx=g.x+60, down=!!S.gear; x.strokeStyle='#8c969f'; x.lineWidth=8; x.beginPath(); x.moveTo(gx,g.y+90); x.lineTo(gx,down?g.y+128:g.y+50); x.stroke();
  x.fillStyle='#e9eef2'; x.beginPath(); x.arc(gx,down?g.y+132:g.y+46,14,0,Math.PI*2); x.fill(); x.fillStyle='#b8c3cc'; x.font='700 14px monospace'; x.textAlign='left'; x.fillText(down?'AÇIK':'KAPALI',gx+26,g.y+94);
  [0,1,2].forEach(function(i){ ckbLamp(x,g.x+150+(i===1?0:(i?22:-22)),g.y+(i===1?60:96),11,down,'#5dff9a'); });
  const a=CKB_DEF.L[1]; x.textAlign='center'; x.font='800 26px "Chakra Petch",monospace'; x.fillStyle=CKB.arm?'#ffb25a':'#7d8a95'; x.fillText(CKB.arm?'ARM':'SAFE',a.x+a.w/2-30,a.y+68); ckbLamp(x,a.x+a.w-46,a.y+58,13,CKB.arm,'#ff9a3a');
  const e=CKB_DEF.L[2]; for(let i=0;i<8;i++){ x.fillStyle=i%2?'#111':'#e3b52a'; x.fillRect(e.x+20+i*22,e.y+40,22,24); }
  x.fillStyle=ckbEjArmed()?'#ff5a4a':'#c8d4de'; x.font='700 14px monospace'; x.fillText(ckbEjArmed()?'TEKRAR ÇEK!':'İKİ KEZ ÇEK',e.x+e.w/2,e.y+80);
  P.L.tex.needsUpdate=true;
  x=P.R.x; x.fillStyle='#14191e'; x.fillRect(0,0,256,384);
  CKB_DEF.R.forEach(function(b){ ckbBox(x,b,now===b.id); });
  const f=CKB_DEF.R[0]; x.font='800 34px "Chakra Petch",monospace'; x.fillStyle=flaresLeft>0?'#5dff9a':'#ff5a4a'; x.textAlign='center'; x.fillText(String(flaresLeft),f.x+f.w/2,f.y+80);
  const w=CKB_DEF.R[1]; x.font='700 18px "Chakra Petch",monospace'; x.fillStyle='#ffd27a'; x.fillText(ckbWpn(),w.x+w.w/2,w.y+66); x.font='600 13px monospace'; x.fillStyle='#8c969f'; x.fillText('dokun: sıradaki ›',w.x+w.w/2,w.y+92);
  const v=CKB_DEF.R[2], vm=typeof WX!=='undefined'?WX.vis:'off'; x.font='800 22px "Chakra Petch",monospace'; x.fillStyle=vm==='nvg'?'#5dff9a':vm==='flir'?'#f0f0f0':'#7d8a95'; x.fillText(vm==='nvg'?'GECE GÖRÜŞ':vm==='flir'?'TERMAL':'KAPALI',v.x+v.w/2,v.y+70);
  P.R.tex.needsUpdate=true; }
function ckbSig(){ return [S.gear?1:0,CKB.arm?1:0,flaresLeft,typeof selW!=='undefined'?selW:'',typeof INV!=='undefined'&&typeof selW!=='undefined'?INV[selW]:0,typeof WX!=='undefined'?WX.vis:'',ckbEjArmed()?1:0,CKB.hover||'',CKB.press&&performance.now()<CKB.pressT?CKB.press:''].join('|'); }
function ckbEjArmed(){ return typeof DMG!=='undefined'&&DMG.ejT!=null&&T-DMG.ejT<1.2; }
/* ---- actions */
function ckbDo(id){ CKB.press=id; CKB.pressT=performance.now()+180; try{ sndPlay('cue'); }catch(e){}
  if(id==='gear') toggleGear();
  else if(id==='arm'){ CKB.arm=!CKB.arm; toast(CKB.arm?'MASTER ARM: silahlar hazır':'MASTER ARM: silahlar emniyette','#ffb25a'); }
  else if(id==='eject') ejArm();
  else if(id==='flare') dropFlares();
  else if(id==='wpn') cycleWeapon(1);
  else if(id==='vis') visCycle();
  else if(id==='map'){ const i=CKB_RNG.indexOf(CKB.rng); CKB.rng=CKB_RNG[(i+1)%CKB_RNG.length]; toast('Taktik harita: '+CKB.rng/1000+' km','#b8ecff'); CKP.mfdT=0; }
  CKB.sig=''; }
/* which control is under the screen point */
function ckbPick(cx,cy){ const S2=CKP.cur; if(!S2||!S2.ckb||!CKP.cam) return null;
  CKB.ndc.set(cx/window.innerWidth*2-1,-(cy/window.innerHeight)*2+1); CKB.ray.setFromCamera(CKB.ndc,CKP.cam);
  const objs=[S2.ckb.L.m,S2.ckb.R.m]; if(S2.ckbMap) objs.push(S2.ckbMap.m);
  const h=CKB.ray.intersectObjects(objs,false)[0]; if(!h||!h.uv) return null;
  if(S2.ckbMap&&h.object===S2.ckbMap.m){ if(S2.ckbMap.role!=='wide') return 'map'; return h.uv.x>1/3&&h.uv.x<2/3?'map':null; }
  const side=h.object.userData.ckb, px=h.uv.x*256, py=(1-h.uv.y)*384;
  const b=CKB_DEF[side].find(function(d){ return px>=d.x&&px<=d.x+d.w&&py>=d.y&&py<=d.y+d.h; }); return b?b.id:null; }
function ckbActive(){ return state==='play'&&camMode===1&&!S.crashed&&!!CKP_FOR[activeId]&&!!(CKP.cur&&CKP.cur.ckb); }
clickPick=HOOK.wrap('clickPick','ucus/kokpit-dugmeler#ckb',function(next){ return function(e){ if(ckbActive()){ const id=ckbPick(e.clientX,e.clientY); if(id){ ckbDo(id); return; } } return next.apply(this,arguments); }; },clickPick);
/* mouse hover: outline and a small label */
window.addEventListener('pointermove',function(e){ if(e.pointerType!=='mouse') return; let id=null; if(ckbActive()) id=ckbPick(e.clientX,e.clientY);
  if(id!==CKB.hover){ CKB.hover=id; try{ const c=renderer.domElement; c.style.cursor=id?'pointer':''; }catch(x){} }
  if(!CKB.tip&&document.createElement){ CKB.tip=document.createElement('div'); CKB.tip.className='ckbtip hidden'; document.body.appendChild(CKB.tip); }
  if(!CKB.tip) return; if(!id){ CKB.tip.classList.add('hidden'); return; }
  const d=CKB_DEF.L.concat(CKB_DEF.R).find(function(b){ return b.id===id; }), t=id==='map'?'TAKTİK HARİTA ÖLÇEĞİ':d.n, k=id==='map'?'':(d.k&&d.k!=='—'?' · '+d.k:'');
  CKB.tip.textContent=t+k; CKB.tip.style.left=(e.clientX+14)+'px'; CKB.tip.style.top=(e.clientY+12)+'px'; CKB.tip.classList.remove('hidden'); },{passive:true});
/* ---- MASTER ARM: SAFE blocks the gun and every store; ARM again at each new flight */
fire=HOOK.wrap('fire','ucus/kokpit-dugmeler#_ckbFire',function(next){ return function(){ if(!CKB.arm){ ckbSafeTip(); return; } return next.apply(this,arguments); }; },fire);
fireWeapon=HOOK.wrap('fireWeapon','ucus/kokpit-dugmeler#_ckbWpn',function(next){ return function(){ if(!CKB.arm&&state==='play'){ ckbSafeTip(); return false; } return next.apply(this,arguments); }; },fireWeapon);
function ckbSafeTip(){ const n=performance.now(); if(n-(CKB.tipT||0)<2500) return; CKB.tipT=n; toast('Silahlar emniyette: kokpitte MASTER ARM','#ffc24a'); }
resetFlight=HOOK.wrap('resetFlight','ucus/kokpit-dugmeler#_ckbReset',function(next){ return function(){ CKB.arm=true; CKB.sig=''; return next.apply(this,arguments); }; },resetFlight);
/* ---- per frame: build once per cockpit, redraw when something on the panels changed */
cameraUpdate=HOOK.wrap('cameraUpdate','ucus/kokpit-dugmeler#_ckbCam',function(next){ return function(dt){ next(dt); if(!CKP.on||!CKP.cur||ckpIsHeli(CKP.cur.kind)) return;
  const P=ckbBuild(CKP.cur); if(!P) return; const sg=ckbSig(); if(sg!==CKB.sig){ CKB.sig=sg; try{ ckbDraw(P); }catch(e){} } }; },cameraUpdate);
