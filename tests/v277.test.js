let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.77: camera angles for aircraft, UAVs and helicopters */
T_('lists',CAMX_AIR.length===6&&CAMX_UAV.length===7&&CAMX_HELI.length===6);
const uavId=Object.keys(AIRCRAFT).find(function(k){ return AIRCRAFT[k].uav; }); T_('a UAV exists',!!uavId);
function run(id,L){ selectedId=id; setAircraft(id); startGame('air'); state='play'; camMode=0; camxSet('chase',true);
  const seen=[]; let err=null; for(let i=0;i<L.length;i++){ toggleCam(); seen.push(camxCur()); try{ cameraUpdate(1/30); cameraUpdate(1/30); }catch(e){ err=e.stack; } }
  T_(id+' cycles through every view',seen.join(',')===L.map(function(x){ return x[0]; }).slice(2).concat(L.slice(0,2).map(function(x){ return x[0]; })).join(','),seen.join(','));
  T_(id+' views run',!err,err); }
run('kaan',CAMX_AIR); if(uavId) run(uavId,CAMX_UAV);
selectedId='kaan'; setAircraft('kaan'); startGame('air'); state='play';
['nose','tail','belly','cine'].forEach(function(v){ camxSet(v,true); T_(v+' is camMode 2',camMode===2&&camxCur()===v); let e=null; try{ cameraUpdate(1/30); }catch(x){ e=x.stack; } T_(v+' camera',!e,e); });
camxSet('cockpit',true); T_('cockpit view',camMode===1); camxSet('chase',true); T_('chase view',camMode===0);
const d=camxMeasure('air-kaan',planeGroup); T_('model measured',d&&d.L>0&&isFinite(d.noseTop)&&isFinite(d.belly));
const P=camxPose('nose',d,false,false), Pt=camxPose('tail',d,false,false), Pb=camxPose('belly',d,false,false);
T_('nose camera at the front',P.p[2]<d.zc); T_('tail camera at the back, above',Pt.p[2]>d.zc&&Pt.p[1]>=d.max.y); T_('belly camera below',Pb.p[1]<d.belly&&Pb.r[0]<-0.5);
/* helicopters */
camMode=0; startWalk(); const H=HELI.list.find(function(h){ return h.id==='t625'; }); heliBoard(H); state='walk';
T_('heli starts in chase',camxCur()==='chase'&&!HELI.fp);
const hs=[]; let he=null; for(let i=0;i<6;i++){ heliCamCycle(); hs.push(camxCur()); try{ walkCam(1/30); }catch(e){ he=e.stack; } }
T_('heli cycle',hs.join(',')==='nose,tail,belly,cine,fp,chase',hs.join(',')); T_('heli views run',!he,he);
heliCamCycle(); heliCamCycle(); heliCamCycle(); heliCamCycle(); heliCamCycle(); T_('heli cockpit is fp',HELI.fp===true&&camxCur()==='fp');
heliBoard(H); T_('boarding resets view',HELI.view==='chase');
console.log('v277: pass '+ok+' fail '+bad);
