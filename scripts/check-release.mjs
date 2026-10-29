import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPublicAssets } from './check-public-assets.mjs';

export function checkRelease(directory = 'dist') {
  checkPublicAssets();
  const root = resolve(directory);
  const manifest = JSON.parse(readFileSync(resolve(root,'asset-manifest.json')));
  const motions = new Set(manifest.artifacts.filter(item=>item.license==='CC0-1.0').map(item=>item.file));
  const allowed = new Set(['assets','docs','licenses','mediapipe','motions','index.html','credits.html','asset-manifest.json','LICENSE','THIRD_PARTY_NOTICES.md']);
  for (const name of readdirSync(root)) if (!allowed.has(name)) throw new Error(`Unexpected site entry: ${name}`);
  for (const name of ['index.html','credits.html','LICENSE','THIRD_PARTY_NOTICES.md','docs/license-audit.md']) {
    if (!existsSync(resolve(root,name))) throw new Error(`Missing release notice: ${name}`);
  }
  let count=0;
  function walk(path) {
    for (const name of readdirSync(path)) {
      const full=resolve(path,name); const stat=lstatSync(full);
      if (stat.isSymbolicLink()) throw new Error(`Release contains symlink: ${full}`);
      if (stat.isDirectory()) { walk(full); continue; }
      const key=relative(root,full).replaceAll('\\','/');
      if (/\.(pmx|pmd|glb|gltf|vrm|vmd|zip)$/i.test(key) && !motions.has(key)) throw new Error(`Unreviewed model/motion: ${key}`);
      if (/\.(html|js|css|md|json|txt)$/i.test(key)) {
        const text=readFileSync(full,'utf8');
        if (/tail[a-f\d]{6}\.ts\.net|192\.168\.\d+\.\d+/.test(text)) throw new Error(`Private host reference in ${key}`);
      }
      count++;
    }
  }
  walk(root);
  return count;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(`Release checked: ${checkRelease()} site files; no unreviewed model assets.`);
