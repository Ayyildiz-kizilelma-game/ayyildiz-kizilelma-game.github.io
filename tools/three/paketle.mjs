// three.js paketleme (V2.64): node paketle.mjs → ../../vendor/three-r187/
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
const OUT = path.resolve('../../vendor/three-r187');
fs.mkdirSync(OUT, { recursive: true });
const J = 'three/examples/jsm/';
// add-on groups loaded on demand (modeller/varliklar.js needLibs): file → { name attached to THREE: module path }
const GROUPS = {
  'efektler.js': { EffectComposer: 'postprocessing/EffectComposer.js', RenderPass: 'postprocessing/RenderPass.js', ShaderPass: 'postprocessing/ShaderPass.js',
    UnrealBloomPass: 'postprocessing/UnrealBloomPass.js', CopyShader: 'shaders/CopyShader.js', LuminosityHighPassShader: 'shaders/LuminosityHighPassShader.js', FXAAShader: 'shaders/FXAAShader.js' },
  'gltf.js': { GLTFLoader: 'loaders/GLTFLoader.js', DRACOLoader: 'loaders/DRACOLoader.js' },
  'gltf-disa.js': { GLTFExporter: 'exporters/GLTFExporter.js' },
  'fbx.js': { FBXLoader: 'loaders/FBXLoader.js', TGALoader: 'loaders/TGALoader.js', NURBSCurve: 'curves/NURBSCurve.js' },
  'obj.js': { OBJLoader: 'loaders/OBJLoader.js', MTLLoader: 'loaders/MTLLoader.js' },
  'stl.js': { STLLoader: 'loaders/STLLoader.js' },
  'collada.js': { ColladaLoader: 'loaders/ColladaLoader.js', TGALoader: 'loaders/TGALoader.js' },
};
const globalThree = { name: 'global-three', setup(b) {
  b.onResolve({ filter: /^three$/ }, () => ({ path: 'three', namespace: 'global-three' }));
  b.onLoad({ filter: /.*/, namespace: 'global-three' }, () => ({ contents: 'module.exports = window.THREE;', loader: 'js' }));
} };
const common = { define: { 'import.meta.url': '__ayyBetikAdresi' }, bundle: true, minify: true, format: 'iife', target: ['es2018'], legalComments: 'none', logLevel: 'warning' };
// import.meta.url (DRACOLoader's default decoder path) becomes the address of the add-on file itself
const banner = '/* three.js r187 (MIT, https://threejs.org) — Ay Yıldız paketi, tools/three/paketle.mjs */\nvar __ayyBetikAdresi=(typeof document!=="undefined"&&document.currentScript&&document.currentScript.src)||(typeof location!=="undefined"?location.href:"");';
await esbuild.build({ ...common, entryPoints: ['cekirdek.js'], outfile: path.join(OUT, 'three.min.js'), banner: { js: banner } });
for (const [file, names] of Object.entries(GROUPS)) {
  let src = Object.entries(names).map(([n, p], i) => `import * as m${i} from '${J}${p}'; window.THREE.${n} = m${i}.${n};`).join('\n');
  // r128 compatibility: the bloom pass worked in 8-bit buffers there, so only values up to 1 glowed. r187 uses half-float
  // buffers and bright specular highlights bloom far more; keep the bloom buffers 8-bit (the game's look, cheaper on phones)
  if (names.UnrealBloomPass) src += `
const B = window.THREE.UnrealBloomPass;
window.THREE.UnrealBloomPass = class extends B { constructor(...a) { super(...a);
  [this.renderTargetBright, ...this.renderTargetsHorizontal, ...this.renderTargetsVertical].forEach((rt) => { rt.texture.type = window.THREE.UnsignedByteType; }); } };`;
  await esbuild.build({ ...common, stdin: { contents: src, resolveDir: process.cwd() }, outfile: path.join(OUT, file), plugins: [globalThree], banner: { js: banner } });
}
// Draco decoder (Draco-compressed .glb models)
fs.mkdirSync(path.join(OUT, 'draco'), { recursive: true });
for (const f of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js'])
  fs.copyFileSync(`node_modules/three/examples/jsm/libs/draco/gltf/${f}`, path.join(OUT, 'draco', f));
fs.copyFileSync('node_modules/three/LICENSE', path.join(OUT, 'LICENSE'));
for (const f of fs.readdirSync(OUT)) { const s = fs.statSync(path.join(OUT, f)); if (s.isFile()) console.log(f.padEnd(22), (s.size / 1024).toFixed(0) + ' KB'); }
