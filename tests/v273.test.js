let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.73: clickable cockpit */
const all=CKB_DEF.L.concat(CKB_DEF.R);
T_('six controls',all.length===6&&all.every(function(b){ return b.x>=0&&b.y>=0&&b.x+b.w<=256&&b.y+b.h<=384; }));
['L','R'].forEach(function(s){ const L=CKB_DEF[s]; for(let i=1;i<L.length;i++) T_('no overlap '+s+i,L[i].y>=L[i-1].y+L[i-1].h); });
state='play'; S.crashed=false; S.onGround=false;
const g0=S.gear; ckbDo('gear'); T_('gear lever',S.gear!==g0); ckbDo('gear');
T_('armed by default',CKB.arm===true);
ckbDo('arm'); T_('SAFE',CKB.arm===false);
const nb=bullets.filter(function(b){ return b.on; }).length; fire(); T_('gun blocked when SAFE',bullets.filter(function(b){ return b.on; }).length===nb);
T_('stores blocked when SAFE',fireWeapon()===false);
try{ resetFlight('air'); }catch(e){} T_('re-armed on a new flight',CKB.arm===true);
const r0=CKB.rng; ckbDo('map'); T_('map range steps',CKB.rng!==r0&&CKB_RNG.indexOf(CKB.rng)>=0); ckbDo('map'); ckbDo('map'); T_('map range wraps',CKB.rng===r0);
const v0=WX.vis; ckbDo('vis'); T_('view cycles',WX.vis!==v0); while(WX.vis!==v0) ckbDo('vis');
const f0=flaresLeft; ckbDo('flare'); T_('flare',flaresLeft<=f0);
T_('pressed control flashes',CKB.press==='flare'&&CKB.pressT>performance.now());
console.log('v273: pass '+ok+' fail '+bad);
