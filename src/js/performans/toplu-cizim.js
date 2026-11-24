/* ------------------------------------------------------------------ batched drawing (V2.65, three.js r187 BatchedMesh)
   The merge system (optimizasyon-2, MRG) turns the static world into cells: one merged mesh per cell and material, about
   140 draw calls in flight. Since V2.65 the cells that share a material (and attributes, shadow flags, draw order) go
   into one BatchedMesh: one draw call per material instead of one per cell (multi-draw when the GPU has it).
   • The cells stay the unit: MRG's size cull (mrgShow) still decides which cell is drawn; here that becomes
     setVisibleAt(), and the batch culls every visible cell against the camera (and the shadow camera) by itself.
   • When MRG breaks a cell up (something in it moved), its instance leaves the batch; a cell rebuilt afterwards is
     drawn on its own as before.
   • Transparent cells stay separate (their draw order matters). ?toplu=0 in the address turns batching off (A/B test). */
const MBT={on:true, batches:[], n:0, cells:0, calls0:0, err:null, mat:new THREE.Matrix4()};
try{ if(/[?&]toplu=0\b/.test(location.search)) MBT.on=false; }catch(e){}
function mbtKey(m){ const g=m.geometry, a=g.attributes, mt=m.material;
  return [mt.uuid, Object.keys(a).sort().map(function(k){ return k+a[k].itemSize+(a[k].normalized?'n':''); }).join(''), g.index?'i':'-', m.castShadow?1:0, m.receiveShadow?1:0, m.renderOrder].join('|'); }
function mbtBuild(){ if(!MBT.on||!THREE.BatchedMesh||MBT.batches.length) return 0; const groups=new Map();
  MRG.cells.forEach(function(c){ (c.meshes||[c.mesh]).forEach(function(m){ if(!m||!m.parent||m.material.transparent||Array.isArray(m.material)) return;
    const k=mbtKey(m); let L=groups.get(k); if(!L){ L=[]; groups.set(k,L); } L.push(m); }); });
  groups.forEach(function(L){ if(L.length<2) return;
    let nv=0, ni=0; L.forEach(function(m){ const g=m.geometry; nv+=g.attributes.position.count; ni+=g.index?g.index.count:0; });
    let b; try{ b=new THREE.BatchedMesh(L.length+8,nv,ni||undefined,L[0].material); }catch(e){ MBT.err=e.message; return; }
    b.castShadow=L[0].castShadow; b.receiveShadow=L[0].receiveShadow; b.renderOrder=L[0].renderOrder; b.matrixAutoUpdate=false; b.updateMatrix();
    b.userData.noMerge=true; b.userData.noCull=true; b.userData.batch=true; b.userData.rs=L[0].userData.rs; b.userData.cs=L[0].userData.cs;
    L.forEach(function(m){ try{ const gid=b.addGeometry(m.geometry), id=b.addInstance(gid); m.updateMatrixWorld(); b.setMatrixAt(id,m.matrixWorld);
        m.userData.mbt={b:b, id:id, gid:gid, vis:true}; scene.remove(m); MBT.n++;
        /* the batch keeps its own copy; the cell mesh only stands for the cell now (MRG removes it when it breaks up) */
        const old=m.geometry; m.geometry=MBT.empty||(MBT.empty=new THREE.BufferGeometry()); old.dispose(); }catch(e){ MBT.err=e.message; } });
    scene.add(b); MBT.batches.push(b); });
  MBT.cells=MBT.n; console.log('[AyYildiz] toplu çizim: '+MBT.n+' hücre → '+MBT.batches.length+' çizim'+(MBT.err?' (hata: '+MBT.err+')':''));
  return MBT.batches.length; }
/* MRG's cull hides a cell by switching layer 0 off on its mesh: carry that over to the batch */
function mbtSync(cells){ if(!MBT.batches.length) return; const cl=camera.layers;
  for(let i=0;i<cells.length;i++){ const L=cells[i].meshes||[cells[i].mesh]; for(let j=0;j<L.length;j++){ const t=L[j].userData.mbt; if(!t) continue;
    const v=L[j].layers.test(cl); if(v!==t.vis){ t.vis=v; t.b.setVisibleAt(t.id,v); } } } }
mrgRun=HOOK.wrap('mrgRun','performans/toplu-cizim#mbtBuild',function(next){ return function(){ const r=next.apply(this,arguments); try{ mbtBuild(); }catch(e){ MBT.err=e.message; console.warn('toplu çizim',e); } return r; }; },mrgRun);
mrgShow=HOOK.wrap('mrgShow','performans/toplu-cizim#mbtSync',function(next){ return function(cells){ const r=next.apply(this,arguments); try{ mbtSync(cells); }catch(e){} return r; }; },mrgShow);
mrgUnmerge=HOOK.wrap('mrgUnmerge','performans/toplu-cizim#mbtOut',function(next){ return function(cell){ if(cell&&MRG.cells.has(cell.key)) (cell.meshes||[cell.mesh]).forEach(function(m){ const t=m&&m.userData.mbt; if(!t) return;
    try{ t.b.deleteInstance(t.id); }catch(e){} m.userData.mbt=null; MBT.n--; scene.add(m); });   /* back in the scene so MRG removes it the usual way */
  return next.apply(this,arguments); }; },mrgUnmerge);
