let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.66: the no-shadow variant is compiled ahead and the shadow switches come back as they were */
/* the test harness renderer is a stand-in that keeps no state: use a small one with real switches */
const R={shadowMap:{enabled:true}, info:{programs:[]}}, LT={castShadow:true}; WARM.varDone=false; WARM.pend=null;
if(!WARM.px) WARM.px=Object.create(scene); WARM.q=[new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial())]; scene.add(WARM.q[0]);
let seen=null; R.compileAsync=function(){ seen=[R.shadowMap.enabled,LT.castShadow]; return Promise.resolve(); };
const r=warmVariant(R,LT);
T_('variant compiled',r===true);
T_('compiled with shadows off',seen&&seen[0]===false&&seen[1]===false,JSON.stringify(seen));
T_('shadows back on after',R.shadowMap.enabled===true&&LT.castShadow===true);
T_('only once',warmVariant(R,LT)===false);
WARM.varDone=false; R.shadowMap.enabled=false; T_('nothing to do without shadows',warmVariant(R,LT)===false);
T_('play warm-up needs compileAsync',typeof warmPlayOk==='function');
WARM.pend=null; scene.remove(WARM.q[0]); WARM.q=[];
console.log('v266: pass '+ok+' fail '+bad);
