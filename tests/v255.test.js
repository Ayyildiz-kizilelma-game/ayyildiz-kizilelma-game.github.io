let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.55: new address — the old address passes the save along in the link; taken only when there is no save here */
const txt=JSON.stringify({v:1,t:1,d:{'ayy-profiles':'[{"callsign":"Şimşek 7"}]'}});
const b=btoa(unescape(encodeURIComponent(txt))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
T_('decode',depoB64(b)===txt);
T_('functions',typeof depoImportLink==='function');
console.log('v255: pass '+ok+' fail '+bad);
