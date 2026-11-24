let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.65: batched drawing of merged cells and the asynchronous shader warm-up — the parts that run without a GPU */
T_('batching on by default',MBT.on===true);
T_('wrapped MRG functions',typeof mrgRun==='function'&&typeof mrgShow==='function'&&typeof mrgUnmerge==='function');
const mat=new THREE.MeshLambertMaterial({color:0x808080}), g1=new THREE.BoxGeometry(1,1,1), g2=new THREE.BoxGeometry(2,2,2);
const a=new THREE.Mesh(g1,mat), b=new THREE.Mesh(g2,mat); a.castShadow=b.castShadow=true;
T_('same material and attributes → same batch',mbtKey(a)===mbtKey(b),mbtKey(a));
const c=new THREE.Mesh(g1,mat); c.castShadow=false; T_('shadow flag splits batches',mbtKey(a)!==mbtKey(c));
const d=new THREE.Mesh(g1,new THREE.MeshLambertMaterial({color:0x808080})); T_('another material → another batch',mbtKey(a)!==mbtKey(d));
T_('no BatchedMesh → nothing built, no error',typeof THREE.BatchedMesh!=='undefined'||mbtBuild()===0);
T_('warm-up step skips while a group compiles',(function(){ const p=WARM.pend, dn=WARM.done; WARM.done=false; WARM.pend=Promise.resolve(); const n=warmStep(8); WARM.pend=p; WARM.done=dn; return n===0; })());
console.log('v265: pass '+ok+' fail '+bad);
