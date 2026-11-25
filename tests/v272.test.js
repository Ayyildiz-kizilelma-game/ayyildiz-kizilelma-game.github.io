let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.72: realistic flight model */
const sv={fm:SETTINGS.fm, st:state, id:selectedId};
function run(id,spd,stick,sec){ selectedId=id; setAircraft(id); resetFlight('air'); S.pos.y=3000; S.speed=spd; S.q.setFromAxisAngle(UP,0); S.throttle=0.8; S.onGround=false; S.crashed=false; FM.spd=-1;
  let maxG=0, st=false; for(let i=0;i<sec*60;i++){ TOUCH.pitch=stick; update(1/60); maxG=Math.max(maxG,S.g); st=st||FM.stall; }
  TOUCH.pitch=0; return {y:S.pos.y, v:S.speed, g:maxG, stall:st}; }
state='play'; SETTINGS.fm='real';
T_('lift curve',Math.abs(fmCL(FM_AS)-1)<1e-9&&fmCL(FM_AS*2)<1&&fmCL(-FM_AS)===-1);
let r=run('kaan',200,0,6); T_('stick free holds height',Math.abs(r.y-3000)<60,r.y);
r=run('kaan',250,1,4); T_('full pull ≈ 9 G',r.g>7.5&&r.g<9.6,r.g); T_('hard turn bleeds speed',r.v<245,r.v);
r=run('tb2',50,1,4); T_('UAV G limit',r.g<4.2,r.g); T_('UAV limiter: no stall',!r.stall);
r=run('hurkus',45,1,6); T_('Hürkuş can stall',r.stall);
r=run('kaan',200,-0.3,4); T_('dive gains speed',r.v>205&&r.y<3000,r.v+' '+r.y);
T_('auto level off in realistic mode',!stabOn());
SETTINGS.fm='arcade'; r=run('kaan',200,0,3); T_('arcade unchanged: level',Math.abs(r.y-3000)<1,r.y);
T_('auto level back in arcade',stabOn()===(SETTINGS.stab!==false));
SETTINGS.fm=sv.fm; state=sv.st; selectedId=sv.id; setAircraft(sv.id); FM.gEn=0;
console.log('v272: pass '+ok+' fail '+bad);
