let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.76: closed cockpits — every layout has a floor/wall tub, a seat and (except the door gunner) the pilot's legs */
['kaan','hurjet','hurkus','t129','t625'].forEach(function(k){ ['A','B','C'].forEach(function(v){ let S2=null; try{ S2=ckpBuild(k,v); }catch(e){ T_('build '+k+v,false,e.stack); return; }
  let tub=0, n=0; S2.g.traverse(function(o){ n++; if(o.userData&&o.userData.tub) tub++; });
  if(S2.door){ T_('door cabin closed '+k+v,n>20); return; }
  T_('tub '+k+v,tub>=1); T_('more parts than V2.75 '+k+v,n>60,n); }); });
T_('slab helper',typeof ckpSlab==='function'&&typeof ckpTub==='function'&&typeof ckpLegs==='function');
console.log('v276: pass '+ok+' fail '+bad);
