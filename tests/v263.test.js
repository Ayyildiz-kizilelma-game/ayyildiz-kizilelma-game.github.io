let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.63: in-app quick update — version compare and the choice between a quick update and a new APK */
T_('web: nothing to check',GUN.checked===true&&APP.native===false);
T_('version numbers',gunNum('V2.63')===263&&gunNum('2.70')===270&&gunNum('V10.01')===1001);
T_('newer',gunNewer({surum:'V2.63'},'V2.62')&&!gunNewer({surum:'V2.62'},'V2.62')&&!gunNewer({surum:'V2.61'},'V2.62'));
T_('two-digit minor',gunNewer({surum:'V2.70'},'V2.69'));
T_('quick update when the app is new enough',gunCanLive({zip:'x',enAzKod:263},263)&&gunCanLive({zip:'x',enAzKod:263},270));
T_('new APK when the app is too old',!gunCanLive({zip:'x',enAzKod:270},263));
T_('default address is the download page',/releases\/download\/android\/guncelleme\.json$/.test(GUN.adres));
console.log('v263: pass '+ok+' fail '+bad);
