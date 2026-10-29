import { AnimationMixer, Euler, Quaternion } from 'three';

export const expressionPresets = {
  soft: { label: 'ほほえみ', weights: { 'にやり': 0.3, 'にこり': 0.4 } },
  smile: { label: '笑顔', weights: { 'にっこり': 0.55, '笑い': 0.85, 'にこり': 0.5 } },
  surprise: { label: '驚き', weights: { 'びっくり': 0.7, 'あ': 0.2 } },
};

export function createModelAnimation(mesh, { mmd = true, clips = [] } = {}) {
  const meshes = [];
  if (mesh.traverse) mesh.traverse(object => { if (object.morphTargetDictionary) meshes.push(object); });
  else meshes.push(mesh); // Also allows the small node:test mesh fixture.
  const channels = meshes.flatMap(object => Object.entries(object.morphTargetDictionary || {}).map(([name,index]) => ({
    name, index, influences: object.morphTargetInfluences,
    current: object.morphTargetInfluences[index] || 0, target: 0,
  })));
  const names = [...new Set(channels.map(channel => channel.name))];
  const bones = mesh.skeleton?.bones || [];
  if (!bones.length) mesh.traverse?.(object => { if (object.isBone) bones.push(object); });
  const rest = bones.map(bone => ({ bone, position: bone.position.clone(), rotation: bone.quaternion.clone() }));
  const idleBones = rest.filter(({ bone }) => ['頭', '上半身2', '左肩P', '右肩P'].includes(bone.name));
  let helper = null;
  const mixer = !mmd ? new AnimationMixer(mesh) : null;
  let activeClip = -1;
  let mode = 'auto';
  let idle = true;
  let paused = false;
  let motionHasMorphs = false;
  let elapsed = 0;
  let nextBlink = 2.8;
  let blinkStart = -10;
  const rotation = new Quaternion();
  const angles = new Euler();
  const blinkName = ['まばたき','blink','Blink','eyesClosed','Fcl_EYE_Close'].find(name => names.includes(name));
  function clearMotion() {
    if (helper) helper.remove(mesh);
    helper = null;
    mixer?.stopAllAction();
    activeClip = -1;
    for (const pose of rest) { pose.bone.position.copy(pose.position); pose.bone.quaternion.copy(pose.rotation); }
    for (const channel of channels) channel.influences[channel.index] = channel.current = channel.target = 0;
    mode = 'auto'; motionHasMorphs = false; paused = false;
  }
  function setExpression(value) {
    mode = value;
    const weights = value.startsWith('morph:') ? { [value.slice(6)]: 1 } : expressionPresets[value]?.weights || {};
    for (const channel of channels) {
      channel.current = channel.influences[channel.index]; channel.target = weights[channel.name] || 0;
      if (value === 'auto') channel.influences[channel.index] = channel.current = 0;
    }
  }
  async function playClip(clip) {
    const { MMDAnimationHelper } = await import('three-stdlib');
    if (!clip.tracks.length || !Number.isFinite(clip.duration) || clip.duration <= 0) throw new Error('No matching character animation in this VMD');
    clearMotion();
    motionHasMorphs = clip.tracks.some(track => track.name.includes('morphTargetInfluences'));
    helper = new MMDAnimationHelper({ pmxAnimation: true });
    helper.add(mesh, { animation: clip, physics: false });
    return clip.duration;
  }
  function setClip(index) {
    clearMotion();
    if (!mixer || index < 0 || !clips[index]) return;
    activeClip = index;
    motionHasMorphs = clips[index].tracks.some(track => track.name.includes('morphTargetInfluences'));
    mixer.clipAction(clips[index]).reset().play();
  }
  return {
    get hasMotion() { return helper !== null || activeClip >= 0; },
    get expressions() { return names; },
    get presets() { return Object.entries(expressionPresets).filter(([,preset]) => Object.keys(preset.weights).every(name => names.includes(name))); },
    setIdle(value) { idle = value; }, setExpression, setClip,
    async loadMotion(file) {
      if (!mmd) throw new Error('VMD requires an MMD model. Use embedded animations for glTF.');
      if (!/\.vmd$/i.test(file.name) || file.size > 20 * 1024 * 1024) throw new Error('Select a VMD file up to 20 MB');
      const { MMDLoader } = await import('three-stdlib');
      const url = URL.createObjectURL(file);
      let clip;
      try { clip = await new Promise((resolve, reject) => new MMDLoader().loadAnimation(url, mesh, resolve, undefined, reject)); }
      finally { URL.revokeObjectURL(url); }
      return playClip(clip);
    },
    async loadBundledMotion() {
      if (!mmd) throw new Error('VMD requires an MMD model. Use embedded animations for glTF.');
      const { MMDLoader } = await import('three-stdlib');
      const base = import.meta.env?.BASE_URL || '/';
      const clip = await new Promise((resolve, reject) => new MMDLoader().loadAnimation([
        `${base}motions/disk/Breath_1800F.vmd`, `${base}motions/disk/Eyedart_1800F.vmd`,
      ], mesh, resolve, undefined, reject));
      for (const pose of rest.filter(p => ['左腕', '右腕'].includes(p.bone.name))) {
        const track = clip.tracks.find(t => t.name === `.bones[${pose.bone.name}].quaternion`);
        if (track) for (let i = 0; i < track.values.length; i += 4) rotation.fromArray(track.values, i).premultiply(pose.rotation).toArray(track.values, i);
      }
      return playClip(clip);
    },
    clearMotion,
    dispose() { clearMotion(); mixer?.uncacheRoot(mesh); },
    togglePause() { paused = !paused; return paused; },
    update(dt) {
      elapsed += dt;
      if (helper) helper.update(paused ? 0 : dt);
      else if (activeClip >= 0) mixer.update(paused ? 0 : dt);
      else {
        for (const pose of idleBones) {
          pose.bone.position.copy(pose.position); pose.bone.quaternion.copy(pose.rotation);
          if (!idle) continue;
          if (pose.bone.name === '頭') angles.set(Math.sin(elapsed * 0.7) * 0.008, Math.sin(elapsed * 0.4) * 0.018, 0);
          else angles.set(Math.sin(elapsed * 1.8) * 0.008, 0, Math.sin(elapsed * 0.7) * 0.005);
          pose.bone.quaternion.multiply(rotation.setFromEuler(angles));
          if (pose.bone.name.includes('肩P')) pose.bone.position.y += Math.sin(elapsed * 1.8) * 0.035;
        }
      }
      if (mode === 'auto' && motionHasMorphs && (helper || activeClip >= 0)) return;
      const blend = 1 - Math.exp(-dt * 16);
      for (const channel of channels) {
        channel.current += (channel.target - channel.current) * blend;
        channel.influences[channel.index] = channel.current < 0.0001 ? 0 : channel.current;
      }
      if (!idle || !['auto', 'soft'].includes(mode) || !blinkName) return;
      if (elapsed >= nextBlink) { blinkStart = elapsed; nextBlink = elapsed + 3.5 + Math.random() * 2; }
      const phase = (elapsed - blinkStart) / 0.2;
      if (phase >= 0 && phase < 1) for (const channel of channels) {
        if (channel.name === blinkName) channel.influences[channel.index] = Math.sin(phase * Math.PI) ** 2;
      }
    },
  };
}
