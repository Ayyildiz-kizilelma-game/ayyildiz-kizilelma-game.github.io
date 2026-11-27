let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.78: walk-in ground control stations */
T_('three stations built',YKI.built&&YKI.sites.length===3,YKI.sites.length);
T_('every station has a seat',YKI.sites.every(function(s){ return s.seat&&s.g; }));
T_('places on the map',['yki','hmk','mobil'].every(function(id){ return PLACES.some(function(p){ return p.id===id; }); }));
T_('UAV list',ykiUavs().length>=5,ykiUavs());
startWalk(); state='walk'; const A=YKI.sites[0]; WALK.mode='foot'; WALK.pos.set(A.seat.x,50,A.seat.z+0.2); WALK.near=null;
let e=null; try{ walkUpdate(1/30); }catch(x){ e=x.stack; } T_('walk update',!e,e); T_('near the pilot seat',WALK.near==='gcs'&&WALK.nearGcs===A,WALK.near);
const n=WALKBOX.length; T_('walls block walking',n>20);
/* runway launch from A */
e=null; try{ ykiLaunch(A,'tb2'); }catch(x){ e=x.stack; } T_('launch from A',!e&&state==='play'&&activeId==='tb2',e);
T_('starts in the ground station view',camMode===1&&uavView()==='gcs'); T_('no link limit at the UAV centre',YKI.ctrl===null);
T_('on the UAV runway',Math.abs(S.pos.x-UAV.rw.x)<50,S.pos.x);
/* air launch from the truck, link range */
const C=YKI.sites[2]; startWalk(); state='walk'; e=null; try{ ykiLaunch(C,'akinci'); }catch(x){ e=x.stack; } T_('launch from truck',!e&&state==='play'&&!!YKI.ctrl,e);
T_('starts above the truck',Math.hypot(S.pos.x-C.x,S.pos.z-C.z)<500&&!S.onGround);
ykiLinkStep(0.1); T_('full link nearby',YKI.link>0.99);
S.pos.set(C.x+16000,800,C.z); fwdOf(S.q,vF); const before=Math.atan2(-vF.x,-vF.z); for(let i=0;i<60;i++) ykiLinkStep(0.1); fwdOf(S.q,vF); const after=Math.atan2(-vF.x,-vF.z);
T_('link lost beyond range',YKI.link<0.05,YKI.link); T_('turns back towards the truck',Math.abs(after-before)>0.1,[before,after]);
state='menu'; ykiLinkStep(0.1); T_('link cleared in the menu',YKI.ctrl===null);
e=null; try{ ykiDrawMap(); }catch(x){ e=x.stack; } T_('map draws',!e,e);
console.log('v278: pass '+ok+' fail '+bad);
/* EO/IR camera */
(function(){ let ok2=0,bad2=0; const t=function(n,c,i){ if(c) ok2++; else { bad2++; console.log('FAIL',n,i===undefined?'':i); } };
  selectedId='tb2'; setAircraft('tb2'); startGame('air'); state='play'; camxSet('belly',true); t('EO/IR on',eoirOn());
  let e=null; try{ cameraUpdate(1/30); }catch(x){ e=x.stack; } t('runs',!e,e);
  const z0=EOIR.zi; eoirBtn('in'); t('zoom in',EOIR.zi===Math.min(3,z0+1)); eoirBtn('out'); eoirBtn('out'); eoirBtn('out'); eoirBtn('out'); t('zoom bottom',EOIR.zi===0);
  const m0=EOIR.mode; eoirBtn('mode'); t('EO/IR switch',EOIR.mode!==m0);
  e=null; try{ eoirBtn('lock'); eoirBtn('laser'); cameraUpdate(1/30); }catch(x){ e=x.stack; } t('lock and laser run',!e,e);
  camxSet('chase',true); t('lock cleared on view change',EOIR.lock===null&&!eoirOn());
  console.log('v278 eoir: pass '+ok2+' fail '+bad2); })();
