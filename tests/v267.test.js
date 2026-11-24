let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.67: with reversed float depth in the effects buffer the depth split is not needed; otherwise it stays */
const sv={rev:DEV.revDepth, fd:FX.floatDepth, on:FX.on, comp:FX.composer, lg:DEV.logDepth, sp:SETTINGS.split};
DEV.logDepth=false; SETTINGS.split=true;
DEV.revDepth=true; FX.floatDepth=true; FX.on=true; FX.composer=FX.composer||{};
T_('no split with reversed float depth',splitWanted()===false);
FX.on=false; T_('split again with effects off',splitWanted()===true);
FX.on=true; DEV.revDepth=false; T_('split without reversed depth',splitWanted()===true);
DEV.revDepth=true; FX.floatDepth=false; T_('split without float depth buffer',splitWanted()===true);
DEV.logDepth=true; T_('never with log depth',splitWanted()===false);
DEV.logDepth=false; SETTINGS.split=false; FX.floatDepth=false; T_('setting off',splitWanted()===false);
T_('perf tips promise no version',String(ptTips).indexOf("de küçültülecek")<0);
DEV.revDepth=sv.rev; FX.floatDepth=sv.fd; FX.on=sv.on; FX.composer=sv.comp; DEV.logDepth=sv.lg; SETTINGS.split=sv.sp;
console.log('v267: pass '+ok+' fail '+bad);
