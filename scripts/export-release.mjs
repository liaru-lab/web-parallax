import { cpSync, mkdirSync, readdirSync, lstatSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { checkRelease } from './check-release.mjs';

checkRelease();
const output=resolve('release');
mkdirSync(output,{recursive:true});
for (const name of ['source','site']) { rmSync(resolve(output,name),{recursive:true,force:true}); mkdirSync(resolve(output,name)); }
const entries=['src','scripts','tests','docs','public','.github','.gitignore','.env.example',
  'index.html','package.json','package-lock.json','vite.config.js','LICENSE','THIRD_PARTY_NOTICES.md','README.md','README.ja.md'];
const root=process.cwd();
for (const name of entries) cpSync(resolve(name),resolve(output,'source',name),{recursive:true,filter:source=>{
  if (lstatSync(source).isSymbolicLink()) throw new Error(`Cannot export symlink: ${source}`);
  const key=relative(root,source).replaceAll('\\','/');
  if (lstatSync(source).isFile() && /\.(pmx|pmd|glb|gltf|vrm|vmd)$/i.test(key) && !key.startsWith('public/motions/disk/')) throw new Error(`Unreviewed source asset: ${key}`);
  return key!=='public/mediapipe' && !key.startsWith('public/mediapipe/');
}});
cpSync('dist',resolve(output,'site'),{recursive:true});
for (const name of ['source','site']) execFileSync('tar',['-czf',resolve(output,`web-parallax-${name}.tar.gz`),'-C',resolve(output,name),'.'],{env:{...process.env,COPYFILE_DISABLE:'1'}});
const sums={};
for (const name of readdirSync(output).filter(name=>name.endsWith('.tar.gz'))) sums[name]=createHash('sha256').update(readFileSync(resolve(output,name))).digest('hex');
writeFileSync(resolve(output,'SHA256SUMS.json'),JSON.stringify(sums,null,2)+'\n');
console.log('Prepared release/source, release/site and tar.gz archives. Nothing was published.');
