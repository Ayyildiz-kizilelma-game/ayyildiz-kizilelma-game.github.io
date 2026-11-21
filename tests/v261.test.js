let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.61: store — products, packs unlock paints, bundles contain products, unowned paints are blocked */
T_('store list',Array.isArray(STORE)&&STORE.length>=5);
const packs=PSCHEMES.filter(function(P){ return P.p; });
T_('9 pack paints',packs.length===9,packs.length);
T_('every pack paint names a product',packs.every(function(P){ return STORE.some(function(s){ return s.id===P.p; }); }));
T_('pack paints have no rank lock',packs.every(function(P){ return P.r===0; }));
T_('ids unique',new Set(PSCHEMES.map(function(P){ return P.id; })).size===PSCHEMES.length);
entSet([]);
T_('guest owns nothing',!entOwns('paket_kis')&&!entOwns('reklamsiz'));
const id=Object.keys(AIRCRAFT)[0];
paintSet(id,'kis_kar'); T_('unowned pack paint not applied',PAINT[id]!=='kis_kar');
entSet([{product:'destekci',source:'yonetici'}]);
T_('bundle gives contents',entOwns('reklamsiz')&&entOwns('paket_kis')&&entOwns('paket_deniz')&&!entOwns('paket_tarih'));
T_('supporter',entIsSupporter());
paintSet(id,'kis_kar'); T_('owned pack paint applied',PAINT[id]==='kis_kar',PAINT[id]);
entSet([]); T_('losing the pack resets the paint',PAINT[id]!=='kis_kar');
T_('cache saved',JSON.parse(stGet('ayy-ent')).own!==undefined);
T_('store opener',typeof magOpen==='function'&&typeof NAV_D.store==='object');
console.log('v261: pass '+ok+' fail '+bad);
