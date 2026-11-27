let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.79: laser designation, AI operator and strike, UAV auto take-off, helmet display, rain, photo looks, door gunner */
selectedId='tb2'; setAircraft('tb2'); startGame('air'); state='play'; camxSet('belly',true);
let e=null; try{ cameraUpdate(1/30); eoirBtn('laser'); }catch(x){ e=x.stack; } T_('laser button runs',!e,e);
LASE.op=false; laseSet(new THREE.Vector3(S.pos.x+800,0,S.pos.z-800),true); T_('designation on',LASE.on);
T_('laser munition detected',['gp','bnk','m1','m2','m3'].some(function(k){ return WEAPONS[k]&&laseLaserMun(k); })||Object.keys(INV).some(function(k){ return laseLaserMun(k); }));
e=null; try{ update(1/30); }catch(x){ e=x.stack; } T_('update with laser',!e,e);
eoirBtn('strike'); T_('strike called',!!LASE.strike); e=null; try{ for(let i=0;i<300;i++) update(1/30); }catch(x){ e=x.stack; } T_('strike lands',!e&&!LASE.strike,e);
eoirBtn('strike'); T_('strike cooldown',!LASE.strike||LASE.strikeCd>0);
/* operator */
gtargets.forEach(function(o){ o.alive=false; }); const G=gtargets[0]; if(G){ G.alive=true; G.pos.set(S.pos.x+200,0,S.pos.z-1500); }
eoirBtn('op'); T_('operator on',LASE.op); for(let i=0;i<5;i++) update(1/30); T_('operator lases the target',!G||(LASE.on&&LASE.p.distanceTo(G.pos)<1),LASE.p);
eoirBtn('op'); T_('operator off',!LASE.op&&!LASE.on);
/* guided bomb follows the laser */
laseSet(new THREE.Vector3(S.pos.x,0,S.pos.z-600),true); const lk=Object.keys(INV).find(function(k){ return INV[k]>0&&WEAPONS[k]&&WEAPONS[k].kind==='bomb'&&laseLaserMun(k); });
if(lk){ selW=lk; bombCd=0; dropBomb(); const b=bombPool.filter(function(x){ return x.on; }).pop(); T_('bomb guided by laser',b&&b.tgt&&b.tgt.lased,b&&b.tgt); } else T_('a laser bomb on TB2 (MAM-L counts as bomb or missile)',Object.keys(INV).some(function(k){ return INV[k]>0&&laseLaserMun(k); }));
state='menu'; laseStep(0.1); T_('laser cleared in menu',!LASE.on);
/* auto take-off */
selectedId='tb2'; setAircraft('tb2'); startGame('runway'); state='play'; T_('on the ground',S.onGround);
atoStart(); T_('auto take-off engaged',ATO.on); e=null; let up=false; try{ for(let i=0;i<30*90&&ATO.on;i++){ update(1/30); if(!S.onGround) up=true; } }catch(x){ e=x.stack; }
T_('auto take-off runs',!e,e); T_('lifted off',up,[S.speed,CUR.vr]); T_('hands back at 300 m',!ATO.on&&!S.crashed,[S.pos.y,S.crashed]);
/* helmet display, rain */
selectedId='kaan'; setAircraft('kaan'); startGame('air'); state='play'; camMode=1; CAMU.yaw=0.8; e=null; try{ cameraUpdate(1/30); T_('helmet display active',hmdKind()==='air'); hmdDraw(); }catch(x){ e=x.stack; } T_('helmet display draws',!e,e); CAMU.yaw=0;
WX.cur.rain=0.8; T_('rain in the cockpit',rainOn()); e=null; try{ rainStep(1/30); rainStep(1/30); }catch(x){ e=x.stack; } T_('rain draws',!e,e); WX.cur.rain=0; T_('no rain when dry',!rainOn());
/* photo looks */
e=null; try{ enterPhoto(); T_('photo mode',state==='photo'); PHX.look='bw'; phxApply(); cameraUpdate(1/30); exitPhoto(); cameraUpdate(1/30); }catch(x){ e=x.stack; } T_('photo looks run',!e,e); T_('look cleared after photo',!PHX.applied);
/* door gunner aims where he looks */
camMode=0; startWalk(); const H=HELI.list.find(function(h){ return h.id==='t625'; }); heliBoard(H); state='walk'; ckpSetVar('t625','C'); HELI.fp=true; H.ground=false; H.y+=50;
e=null; try{ walkCam(1/30); walkCam(1/30); }catch(x){ e=x.stack; } T_('door view runs',!e&&CKP.cur&&CKP.cur.door,e);
console.log('v279: pass '+ok+' fail '+bad);
