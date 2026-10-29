import { cp, mkdir, readFile, writeFile, rename, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const destination = new URL('../public/mediapipe/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const name of await readdir(destination)) {
  if (/^vision_wasm_.*\.(js|wasm)$/.test(name)) await rm(new URL(name,destination));
}
const wasm = new URL('../node_modules/@mediapipe/tasks-vision/wasm/', import.meta.url);
await cp(wasm,destination,{recursive:true});
const model = new URL('face_landmarker.task',destination);
const modelSource = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const modelHash = '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff';
const sha256 = data => createHash('sha256').update(data).digest('hex');
let modelData;
try { modelData = await readFile(model); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  const response = await fetch(modelSource);
  if (!response.ok) throw new Error(`Face model download failed: ${response.status}`);
  modelData = new Uint8Array(await response.arrayBuffer());
  if (sha256(modelData) !== modelHash) throw new Error('Face model checksum does not match the reviewed version');
  await writeFile(new URL('face_landmarker.task.download',destination),modelData);
  await rename(new URL('face_landmarker.task.download',destination),model);
}
if (sha256(modelData) !== modelHash) throw new Error('Cached face model checksum mismatch');
const version = JSON.parse(await readFile(new URL('../node_modules/@mediapipe/tasks-vision/package.json',import.meta.url))).version;
const artifacts = [];
for (const file of await readdir(wasm)) {
  artifacts.push({file:`mediapipe/${file}`,license:'Apache-2.0',source:`npm:@mediapipe/tasks-vision@${version}`,sha256:sha256(await readFile(new URL(file,destination)))});
}
artifacts.push({file:'mediapipe/face_landmarker.task',license:'Apache-2.0',source:modelSource,sha256:modelHash});
for (const file of ['Breath_1800F.vmd','Eyedart_1800F.vmd','readme.txt']) {
  artifacts.push({file:`motions/disk/${file}`,license:'CC0-1.0',author:'DiSK',source:'https://bowlroll.net/file/231043',sha256:sha256(await readFile(new URL(`../public/motions/disk/${file}`,import.meta.url)))});
}
await writeFile(new URL('../public/asset-manifest.json',import.meta.url),JSON.stringify({schemaVersion:1,artifacts},null,2)+'\n');
console.log(`MediaPipe ${version} assets ready; reviewed model checksum verified.`);
