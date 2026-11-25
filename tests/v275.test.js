let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.75: three cockpit layouts per aircraft, VR removed */
const kinds=['kaan','hurjet','hurkus','t129','t625'];
T_('every aircraft has A B C',kinds.every(function(k){ return CKP_VARS[k]&&CKP_VARS[k].A&&CKP_VARS[k].B&&CKP_VARS[k].C; }));
const sv=SETTINGS.ckpVar; SETTINGS.ckpVar=null; T_('default layout A',kinds.every(function(k){ return ckpVar(k)==='A'; }));
SETTINGS.ckpVar={kaan:'Z'}; T_('unknown layout → A',ckpVar('kaan')==='A');
ckpSetVar('hurkus','C'); T_('set per aircraft',ckpVar('hurkus')==='C'&&ckpVar('kaan')==='A');
const sig={}; kinds.forEach(function(k){ ['A','B','C'].forEach(function(v){ let S2=null; try{ S2=ckpBuild(k,v); }catch(e){ T_('build '+k+v,false,e.stack); return; }
  T_('stick and lever '+k+v,!!S2.stick&&!!S2.thr); T_('layout remembered '+k+v,S2.v===v&&S2.kind===k);
  sig[k+v]=S2.scr.map(function(s){ return s.role; }).join(',')+'|'+['hud','hmd','night','rear','simple','sight','front','nvg','door'].filter(function(f){ return S2[f]; }).join(','); }); });
kinds.forEach(function(k){ T_('three different layouts '+k,new Set([sig[k+'A'],sig[k+'B'],sig[k+'C']]).size===3,[sig[k+'A'],sig[k+'B'],sig[k+'C']]); });
T_('KAAN A has a HUD, B none (helmet display)',/hud/.test(sig.kaanA)&&!/hud/.test(sig.kaanB.split('|')[1])&&/hmd/.test(sig.kaanB));
T_('KAAN C night palette',/night/.test(sig.kaanC));
T_('Hürjet C rear seat with HUD repeater',/hudrep/.test(sig.hurjetC)&&/rear/.test(sig.hurjetC));
T_('Hürkuş C one big display',sig.hurkusC.split('|')[0]==='big');
T_('Hürkuş props in every layout',['A','B','C'].every(function(v){ return !!ckpBuild('hurkus',v).prop; }));
T_('T129 B gunner sight',/sight/.test(sig.t129B)&&/front/.test(sig.t129B));
T_('T129 C night vision',/nvg/.test(sig.t129C));
T_('T625 A two wide displays and touch units',sig.t625A.split('|')[0]==='wide,wide,touch,touch2',sig.t625A);
T_('T625 C door gunner',/door/.test(sig.t625C));
/* displays draw in every layout */
selectedId='kaan'; setAircraft('kaan'); startGame('air'); state='play'; camMode=1;
let err=null; ['A','B','C'].forEach(function(v){ ckpSetVar('kaan',v); try{ cameraUpdate(1/30); ckpMFD(); }catch(e){ err=e.stack; } T_('KAAN '+v+' on screen',CKP.cur&&CKP.cur.v===v); }); T_('KAAN layouts run',!err,err);
T_('night palette restored after drawing',CKC.bg===CKC_DAY.bg);
selectedId='hurjet'; setAircraft('hurjet'); startGame('air'); state='play'; camMode=1; ckpSetVar('hurjet','C'); err=null; try{ cameraUpdate(1/30); ckpMFD(); }catch(e){ err=e.stack; } T_('Hürjet rear seat runs',!err&&CKP.cur.rear,err);
selectedId='hurkus'; setAircraft('hurkus'); startGame('air'); state='play'; camMode=1; ckpSetVar('hurkus','C'); err=null; try{ cameraUpdate(1/30); ckpMFD(); }catch(e){ err=e.stack; } T_('Hürkuş simple runs',!err,err);
const before=CKP.cur.v; ckpCycle(); T_('cycle A → B → C → A',ckpVar('hurkus')==='A'&&before==='C');
camMode=0; startWalk(); ['t129','t625'].forEach(function(id){ const H=HELI.list.find(function(h){ return h.id===id; }); if(!H){ T_('heli '+id,false); return; } heliBoard(H); HELI.fp=true; state='walk';
  ['A','B','C'].forEach(function(v){ ckpSetVar(id,v); let e2=null; try{ walkCam(1/30); ckpMFD(); }catch(e){ e2=e.stack; } T_(id+' '+v+' runs',!e2&&CKP.cur&&CKP.cur.v===v,e2); }); HELI.fp=false; });
/* VR gone */
SETTINGS.uavView='vr'; T_('VR setting falls back to sensor',uavView()==='sensor'); T_('no stereo code left',typeof uavVR==='undefined'&&typeof uavOriStart==='undefined');
SETTINGS.ckpVar=sv;
console.log('v275: pass '+ok+' fail '+bad);
