/* three.js r187 for Ay Yıldız as one classic script: window.THREE, like the old r128 three.min.js.
   Compatibility layer so the game looks and behaves as it did on r128 (V2.64, docs/KARAR-THREEJS.md):
   • colour management off: colours and textures are used as given, output is not converted (r128: LinearEncoding);
   • lights: r128 multiplied every light by π ("legacy lights"); r155+ does not. The renderer's render() multiplies the
     lights of the game by π just for the draw (THREE.LEGACY_LIGHTS), so every intensity in the game keeps its meaning;
   • point lights keep a soft cut-off instead of the physical inverse-square fall-off (decay 0);
   • names removed since r128: WebGLMultisampleRenderTarget (now a render target with samples), LinearEncoding /
     sRGBEncoding and texture.encoding, renderer.outputEncoding, capabilities.isWebGL2. */
import * as T from 'three';
const THREE = Object.assign({}, T);
THREE.ColorManagement.enabled = false;
const LEG = new Set();
function legacy(Base, fix) {
  return class extends Base {
    constructor(...a) { super(...a); if (fix) fix(this, a); LEG.add(this); }
    dispose() { LEG.delete(this); if (super.dispose) super.dispose(); }
  };
}
THREE.DirectionalLight = legacy(T.DirectionalLight);
THREE.HemisphereLight = legacy(T.HemisphereLight);
THREE.AmbientLight = legacy(T.AmbientLight);
THREE.SpotLight = legacy(T.SpotLight, (l) => { l.decay = 0; });
THREE.PointLight = legacy(T.PointLight, (l) => { l.decay = 0; });
THREE.LEGACY_LIGHTS = LEG;
class WebGLRenderer extends T.WebGLRenderer {
  constructor(o) {
    super(o);
    this.outputColorSpace = T.LinearSRGBColorSpace;
    this.capabilities.isWebGL2 = true;
    // WebGLRenderer sets render() on the instance in its constructor, so wrap that one
    const base = this.render;
    this.render = function (scene, camera) {
      const k = Math.PI;
      for (const l of LEG) l.intensity *= k;
      try { return base.call(this, scene, camera); } finally { for (const l of LEG) l.intensity /= k; }
    };
  }
  get outputEncoding() { return this.outputColorSpace === T.SRGBColorSpace ? 3001 : 3000; }
  set outputEncoding(v) { this.outputColorSpace = v === 3001 ? T.SRGBColorSpace : T.LinearSRGBColorSpace; }
}
THREE.WebGLRenderer = WebGLRenderer;
THREE.WebGLMultisampleRenderTarget = class extends T.WebGLRenderTarget {
  constructor(w, h, o) { super(w, h, Object.assign({ samples: 4 }, o)); }
};
THREE.LinearEncoding = 3000;
THREE.sRGBEncoding = 3001;
Object.defineProperty(T.Texture.prototype, 'encoding', {
  get() { return this.colorSpace === T.SRGBColorSpace ? 3001 : 3000; },
  set(v) { this.colorSpace = v === 3001 ? T.SRGBColorSpace : T.NoColorSpace; },
  configurable: true,
});
// r128 took no diffuse light from a plain cube environment map (only reflections); r187 turns it into a PMREM map and
// adds sky irradiance, which washed out every metal/standard material of the game. Keep reflections, drop that part.
{
  const k = 'lights_fragment_maps', line = 'iblIrradiance += getIBLIrradiance( geometryNormal );';
  if (T.ShaderChunk[k].indexOf(line) < 0) throw new Error('three.js: ' + k + ' değişmiş');
  T.ShaderChunk[k] = T.ShaderChunk[k].replace(line, '/* r128: no diffuse IBL */');
}
// r150+ draws double-sided transparent objects twice (back faces, then front); r128 drew them once. Keep one pass.
// (an accessor, because Material's constructor assigns forceSinglePass = false on every new material)
Object.defineProperty(T.Material.prototype, 'forceSinglePass', { get() { return true; }, set(v) {}, configurable: true });
// r128 culled an InstancedMesh with its geometry's bounding sphere, which the game sets per chunk (and browser-check
// verifies); r187 computes a sphere around all instances by itself. Use the geometry's sphere again, read every frame.
Object.defineProperty(T.InstancedMesh.prototype, 'boundingSphere', {
  get() { const g = this.geometry; if (!g) return null; if (g.boundingSphere === null) g.computeBoundingSphere(); return g.boundingSphere; },
  set(v) {}, configurable: true,
});
// ...and never rebuild it from the instances (that would overwrite the game's sphere through the accessor above)
T.InstancedMesh.prototype.computeBoundingSphere = function () { const g = this.geometry; if (g && g.boundingSphere === null) g.computeBoundingSphere(); };
// r128 created every InstancedMesh with frustumCulled = false (its geometry sphere did not cover the instances); the
// game's culling (performans/optimizasyon-1 instPrep, ayiklama chunks) starts from that and gives each one real bounds
THREE.InstancedMesh = class extends T.InstancedMesh { constructor(...a) { super(...a); this.frustumCulled = false; } };
THREE.REVISION_R128_UYUMLU = true;
window.THREE = THREE;
