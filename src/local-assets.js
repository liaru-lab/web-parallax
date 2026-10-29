import { LoadingManager } from 'three';

export function localPath(value) {
  let path;
  try { path = decodeURIComponent(value); } catch { throw new Error('Invalid file path'); }
  path = path.replace(/^local:\/\//, '').replaceAll('\\', '/').normalize('NFC');
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) throw new Error('External model resources are not allowed');
  const parts = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!parts.length) throw new Error('Resource path leaves the selected folder');
      parts.pop();
    } else parts.push(part);
  }
  return parts.join('/').toLowerCase();
}

export function createLocalResources(files) {
  if (!files.length || files.length > 1000 || files.reduce((sum, file) => sum + file.size, 0) > 250 * 1024 * 1024) {
    throw new Error('Select up to 1,000 files, 250 MB in total');
  }
  const entries = new Map();
  for (const file of files) {
    const key = localPath(file.webkitRelativePath || file.name);
    if (entries.has(key)) throw new Error(`Duplicate file path: ${file.name}`);
    entries.set(key, file);
  }
  const models = [...entries].filter(([path]) => /\.(pmx|pmd|glb|gltf)$/.test(path));
  if (models.length !== 1) throw new Error('Select exactly one PMX, PMD, GLB or glTF model and its textures');
  const [path, file] = models[0];
  const urls = new Map();
  const manager = new LoadingManager();
  manager.setURLModifier(url => {
    // glTF creates Blob URLs for images stored in GLB buffer views; these never use the network.
    if (url.startsWith('blob:')) return url;
    if (/^data:(image\/(png|jpeg|webp|gif|bmp)|application\/(octet-stream|gltf-buffer));base64,/i.test(url)) return url;
    const key = localPath(url);
    let asset = entries.get(key);
    if (!asset) {
      const matches = [...entries].filter(([name]) => name.split('/').pop() === key.split('/').pop());
      if (matches.length === 1) asset = matches[0][1];
    }
    if (!asset) throw new Error(`Missing resource: ${key}. Select the model folder or include its textures.`);
    if (!urls.has(asset)) urls.set(asset, URL.createObjectURL(asset));
    return urls.get(asset);
  });
  return { manager, url: `local:///${path}`, file, format: path.split('.').pop(),
    dispose() { for (const url of urls.values()) URL.revokeObjectURL(url); urls.clear(); } };
}

export function disposeModel(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
    object.skeleton?.dispose();
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) { texture.source?.data?.close?.(); texture.dispose(); }
}

export async function loadLocalModel(files) {
  const resources = createLocalResources(Array.from(files));
  const { manager, format, url } = resources;
  let root;
  let animations = [];
  let failed = false;
  try {
    if (['glb','gltf'].includes(format)) {
      // GLTFLoader can recover from a failed texture by dropping it. Reject missing/remote
      // resources before parsing so an incomplete model cannot silently replace the old one.
      let json;
      if (format === 'gltf') json = JSON.parse(await resources.file.text());
      else {
        const header = new DataView(await resources.file.slice(0,20).arrayBuffer());
        if (header.byteLength < 20 || header.getUint32(0,true) !== 0x46546c67 || header.getUint32(4,true) !== 2
          || header.getUint32(16,true) !== 0x4e4f534a) throw new Error('Invalid GLB header');
        const length = header.getUint32(12,true);
        if (length > 20*1024*1024 || length+20 > resources.file.size) throw new Error('Invalid or oversized glTF JSON chunk');
        json = JSON.parse(await resources.file.slice(20,20+length).text());
      }
      for (const entry of [...(json.buffers || []),...(json.images || [])]) if (entry.uri) {
        if (/^(https?:|file:|blob:|\/\/)/i.test(entry.uri)) throw new Error('External model resources are not allowed');
        manager.resolveURL(new URL(entry.uri,url).href);
      }
    }
    const loader = ['pmx', 'pmd'].includes(format)
      ? new (await import('three-stdlib')).MMDLoader(manager)
      : new (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader(manager);
    const { TGALoader } = await import('three/addons/loaders/TGALoader.js');
    manager.addHandler(/\.tga$/i, new TGALoader(manager));
    await new Promise((resolve, reject) => {
      manager.onLoad = () => resolve();
      manager.onError = name => reject(new Error(`Cannot load resource: ${name}`));
      loader.load(url, result => {
        root = result.scene || result;
        animations = result.animations || [];
        if (failed) disposeModel(root);
      }, undefined, reject);
    });
    if (!root) throw new Error('No scene in this model');
    return { root, animations, mmd: ['pmx', 'pmd'].includes(format), name: resources.file.name };
  } catch (error) {
    failed = true;
    if (root) disposeModel(root);
    throw error;
  } finally { resources.dispose(); }
}
