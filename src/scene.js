import * as THREE from 'three';
import { frameCorners } from 'three/addons/utils/CameraUtils.js';
import { stepSpring, clamp } from './math.js';
import { createModelAnimation } from './model-animation.js';
import { createDemoModel } from './demo-model.js';
import { loadLocalModel, disposeModel } from './local-assets.js';

export function prepareMmdMaterials(materials) {
  for (const material of materials) {
    if (!material.map) continue;
    material.map.colorSpace = THREE.SRGBColorSpace;
    // MMDLoader writes its alpha detection onto Texture, which WebGL does not use as material opacity.
    material.transparent ||= material.map.transparent === true;
    // Discard hidden expression pixels before they can write depth or turn opaque in the shader.
    material.alphaTest = 1 / 255;
    // Keep the PMX culling flags chosen by MMDLoader.
  }
}

export function prepareModelMesh(mesh, receiveShadow = false) {
  // Older MMDLoader leaves empty morph arrays. Current Three.js would enable an
  // invalid zero-target shader for these (including the shadow depth pass).
  for (const [name,targets] of Object.entries(mesh.geometry.morphAttributes)) {
    if (!targets.length) delete mesh.geometry.morphAttributes[name];
  }
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
}

export function createScene(canvas, container) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x253331);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.08, 60);
  const room = new THREE.Group();
  const guides = new THREE.Group();
  room.add(guides);
  scene.add(room);
  const ambient = new THREE.HemisphereLight(0xfff9ed, 0x798a7d, 1.15);
  scene.add(ambient);
  const light = new THREE.DirectionalLight(0xfff3dd, 1.4);
  light.position.set(-4, 7, 5);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -6;
  light.shadow.camera.right = 6;
  light.shadow.camera.top = 7;
  light.shadow.camera.bottom = -4;
  light.shadow.normalBias = 0.02;
  scene.add(light);
  const fill = new THREE.DirectionalLight(0xbad8d3, 0.35);
  fill.position.set(4, 3, -2);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30, 60, 60), new THREE.MeshBasicMaterial({ color: 0xb8b4a5 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.25, -4);
  floor.receiveShadow = true;
  scene.add(floor);
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.ShadowMaterial({ opacity: 0.22 }));
  floorShadow.rotation.copy(floor.rotation);
  floorShadow.position.copy(floor.position).y += 0.005;
  floorShadow.receiveShadow = true;
  scene.add(floorShadow);
  const grid = new THREE.GridHelper(8, 16, 0x647e70, 0x81968a);
  grid.position.set(0, -2.24, -4);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  guides.add(grid);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xa6c0b0, transparent: true, opacity: 0.24 });
  for (const z of [-0.05, -1.5, -3, -4.5, -6]) {
    const points = [[-4,-2.25,z],[-4,2.7,z],[4,2.7,z],[4,-2.25,z]].map(p => new THREE.Vector3(...p));
    guides.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
  }
  for (const x of [-4, 4]) {
    guides.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 2.7, 0), new THREE.Vector3(x, 2.7, -6),
    ]), lineMaterial));
  }

  // Foreground objects make occlusion and relative depth easy to compare.
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), new THREE.MeshStandardMaterial({ color: 0xd1aa78, roughness: 0.8 }));
  cube.position.set(-2.35, -1.9, -0.4);
  cube.rotation.y = 0.3;
  cube.castShadow = true;
  room.add(cube);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 24), new THREE.MeshStandardMaterial({ color: 0xa26448, roughness: 0.65 }));
  sphere.position.set(2.5, -1.85, -2.8);
  sphere.castShadow = true;
  room.add(sphere);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.035, 12, 80), new THREE.MeshStandardMaterial({ color: 0xd1dac6, roughness: 0.8 }));
  ring.position.set(0, 0.1, -4.7);
  guides.add(ring);

  const modelRoot = new THREE.Group();
  modelRoot.position.set(0, -2.25, -0.8);
  scene.add(modelRoot);
  let springs = [];
  let animation = null;
  let halfWidth = 4;
  let unitsPerPixel = null;
  const bottomLeft = new THREE.Vector3();
  const bottomRight = new THREE.Vector3();
  const topLeft = new THREE.Vector3();
  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    const halfHeight = unitsPerPixel ? height * unitsPerPixel / 2 : 2.7;
    halfWidth = halfHeight * width / height;
    room.scale.x = halfWidth / 4;
    // Keep geometry circular/square while moving its position with the available width.
    cube.scale.x = sphere.scale.x = ring.scale.x = 4 / halfWidth;
    bottomLeft.set(-halfWidth, -halfHeight, 0);
    bottomRight.set(halfWidth, -halfHeight, 0);
    topLeft.set(-halfWidth, halfHeight, 0);
  }
  new ResizeObserver(resize).observe(container);
  resize();

  let receiveShadows = false;
  function installModel(asset) {
    const { root, mmd, animations, name } = asset;
    if (mmd) {
      prepareMmdMaterials(root.material);
      for (const [boneName, angle] of [['左腕', -0.55], ['右腕', 0.55]]) {
        const bone = root.skeleton.bones.find(b => b.name === boneName);
        if (bone) bone.rotation.z = angle;
      }
    }
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    if (bounds.isEmpty() || ![size.x,size.y,size.z].every(Number.isFinite) || size.length() < 0.00001) {
      disposeModel(root); throw new Error('This model has no visible geometry');
    }
    const normalized = new THREE.Group();
    const scale = 4.85 / Math.max(size.y, Math.max(size.x,size.z) * 0.4);
    const center = bounds.getCenter(new THREE.Vector3());
    normalized.scale.setScalar(scale);
    normalized.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    normalized.add(root);
    root.traverse(object => {
      if (object.isLight) object.visible = false;
      if (object.isMesh) prepareModelMesh(object,receiveShadows);
    });
    const nextAnimation = createModelAnimation(root, { mmd, clips: animations });
    if (animations.length) nextAnimation.setClip(0);
    animation?.dispose();
    for (const child of [...modelRoot.children]) { modelRoot.remove(child); disposeModel(child); }
    modelRoot.add(normalized);
    animation = nextAnimation;
    const bones = [];
    root.traverse(object => { if (object.isBone) bones.push(object); });
    const candidates = bones.filter(bone => /髪|リボン|ポシェット|紐|hair|ribbon|antenna/i.test(bone.name));
    const roots = candidates.filter(bone => !candidates.includes(bone.parent));
    springs = roots.map(bone => ({ bone, base: bone.quaternion.clone(),
      x: { angle: 0, velocity: 0 }, z: { angle: 0, velocity: 0 } }));
    return { name, mmd, springs: springs.length, expressions: animation.expressions,
      presets: animation.presets, clips: animations.map(clip => clip.name || 'Animation') };
  }

  const backdropMaterial = new THREE.MeshBasicMaterial({ color: 0xcdd9d1 });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(32,18), backdropMaterial);
  backdrop.position.set(0, -0.34, -8); scene.add(backdrop);
  const textureLoader = new THREE.TextureLoader();
  function resetBackground() {
    backdropMaterial.map?.dispose(); backdropMaterial.map = null;
    backdropMaterial.color.set(0xcdd9d1); backdropMaterial.needsUpdate = true;
  }
  async function setBackground(file) {
    if (!/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name) || file.size > 20*1024*1024) throw new Error('Select a PNG, JPEG, WebP, GIF or BMP image up to 20 MB');
    const url = URL.createObjectURL(file);
    let texture;
    try { texture = await textureLoader.loadAsync(url); }
    finally { URL.revokeObjectURL(url); }
    if (texture.image.width * texture.image.height > 30_000_000) { texture.dispose(); throw new Error('Image is too large (30 megapixels maximum)'); }
    texture.colorSpace = THREE.SRGBColorSpace;
    // Cover the backplate without stretching an arbitrary uploaded image onto the floor.
    const aspect = texture.image.width / texture.image.height;
    if (aspect > 32/18) { texture.repeat.x = (32/18)/aspect; texture.offset.x = (1-texture.repeat.x)/2; }
    else { texture.repeat.y = aspect/(32/18); texture.offset.y = (1-texture.repeat.y)/2; }
    backdropMaterial.map?.dispose(); backdropMaterial.map = texture;
    backdropMaterial.color.set(0xffffff); backdropMaterial.needsUpdate = true;
  }

  const rotation = new THREE.Euler();
  const offset = new THREE.Quaternion();
  return {
    loadModel: async files => installModel(files ? await loadLocalModel(files) : createDemoModel()),
    setBackground, resetBackground,
    setModelTransform(scale, yaw) { modelRoot.scale.setScalar(clamp(scale,0.25,2)); modelRoot.rotation.y = yaw * Math.PI / 180; },
    setLighting(key, sky, azimuth, shadows) {
      light.intensity = clamp(key,0,3); ambient.intensity = clamp(sky,0,3);
      const angle = azimuth * Math.PI / 180; light.position.set(Math.sin(angle)*7,7,Math.cos(angle)*7);
      receiveShadows = shadows; modelRoot.traverse(object => { if (object.isMesh) object.receiveShadow = shadows; });
    },
    guides,
    setModelPosition(x, z) { modelRoot.position.set(clamp(x, -2, 2), -2.25, clamp(z, -5, 2.5)); },
    setExpression(value) { animation?.setExpression(value); },
    get hasMotion() { return Boolean(animation?.hasMotion); },
    setIdle(value) { animation?.setIdle(value); },
    loadMotion(file) { return animation.loadMotion(file); },
    loadBundledMotion() { return animation.loadBundledMotion(); },
    setClip(index) { animation?.setClip(index); },
    clearMotion() { animation?.clearMotion(); },
    toggleMotionPause() { return animation?.togglePause(); },
    get aspect() { return canvas.clientWidth / canvas.clientHeight; },
    setScreenScale(value) { unitsPerPixel = value; resize(); },
    nudge(strength = 1) { for (const s of springs) { s.z.velocity += 3.4 * strength; s.x.velocity += 1.4 * strength; } },
    render(eye, gravity, acceleration, sway, dt) {
      for (const s of springs) s.bone.quaternion.copy(s.base);
      animation?.update(dt);
      for (const s of springs) {
        const zTarget = clamp((gravity.x / 9.81 - acceleration.x / 14) * 0.45 * sway, -0.6, 0.6);
        const xTarget = clamp((-gravity.z / 9.81 + acceleration.z / 14) * 0.35 * sway, -0.5, 0.5);
        rotation.set(stepSpring(s.x, xTarget, dt), 0, stepSpring(s.z, zTarget, dt));
        offset.setFromEuler(rotation);
        s.bone.quaternion.multiply(offset);
      }
      camera.position.copy(eye);
      frameCorners(camera, bottomLeft, bottomRight, topLeft);
      renderer.render(scene, camera);
    },
  };
}
