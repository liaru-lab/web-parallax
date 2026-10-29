import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function checkPublicAssets(directory = 'public') {
  const root = resolve(directory);
  const manifest = JSON.parse(readFileSync(resolve(root,'asset-manifest.json')));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.artifacts)) throw new Error('Invalid asset manifest');
  const reviewed = new Map();
  for (const entry of manifest.artifacts) {
    const allowed = /^mediapipe\/(vision_wasm_(nosimd_)?internal\.(js|wasm)|face_landmarker\.task)$/.test(entry.file)
      || /^motions\/disk\/(Breath_1800F\.vmd|Eyedart_1800F\.vmd|readme\.txt)$/.test(entry.file);
    if (!allowed || !['Apache-2.0','CC0-1.0'].includes(entry.license) || !/^[a-f\d]{64}$/.test(entry.sha256)) throw new Error(`Unreviewed asset: ${entry.file}`);
    if (reviewed.has(entry.file)) throw new Error(`Duplicate manifest path: ${entry.file}`);
    reviewed.set(entry.file,entry);
  }
  const expected = new Set([...reviewed.keys(),'asset-manifest.json','credits.html',
    ...['three-MIT','three-stdlib-MIT','mmd-parser-MIT','fflate-MIT','potpack-ISC','MediaPipe-Apache-2.0','CC0-1.0'].map(name=>`licenses/${name}.txt`)]);
  function walk(path) {
    for (const name of readdirSync(path)) {
      const full = resolve(path,name);
      const stat = lstatSync(full);
      if (stat.isSymbolicLink()) throw new Error(`Symlink cannot be published: ${full}`);
      if (stat.isDirectory()) walk(full);
      else {
        const key = relative(root,full).replaceAll('\\','/');
        if (!expected.delete(key)) throw new Error(`Unreviewed public file: ${key}. Keep private assets in .local/.`);
        const entry = reviewed.get(key);
        if (entry && createHash('sha256').update(readFileSync(full)).digest('hex') !== entry.sha256) throw new Error(`Asset checksum mismatch: ${key}`);
        if (key.startsWith('licenses/') && readFileSync(full,'utf8').length < 200) throw new Error(`Empty/truncated license notice: ${key}`);
      }
    }
  }
  walk(root);
  if (expected.size) throw new Error(`Missing release assets: ${[...expected].join(', ')}`);
  if (!reviewed.has('mediapipe/face_landmarker.task')) throw new Error('Face model is missing from manifest');
  if (readFileSync('node_modules/@mediapipe/tasks-vision/vision_bundle.mjs','utf8').includes('odml.pa.googleapis.com')) throw new Error('Review SDK telemetry before distributing this MediaPipe version');
  return reviewed.size;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(`Public assets checked: ${checkPublicAssets()} reviewed files.`);
