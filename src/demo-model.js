import * as THREE from 'three';

// Original geometry made by this project. No downloaded character or texture.
export function createDemoModel() {
  const root = new THREE.Group();
  const ivory = new THREE.MeshStandardMaterial({ color: 0xe8e2ce, roughness: 0.72 });
  const green = new THREE.MeshStandardMaterial({ color: 0x567d70, roughness: 0.62 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x273e3e, roughness: 0.5 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xdeb670, roughness: 0.5 });
  function part(parent, geometry, material, position, scale = [1,1,1]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position); mesh.scale.set(...scale); parent.add(mesh); return mesh;
  }
  const body = new THREE.Bone(); body.name = '上半身2'; body.position.y = 2.2; root.add(body);
  part(body, new THREE.CapsuleGeometry(0.68, 0.95, 8, 24), green, [0,0,0], [1,1,0.7]);
  part(body, new THREE.SphereGeometry(0.2, 20, 12), gold, [0,0.15,0.48], [1,1,0.25]);
  const head = new THREE.Bone(); head.name = '頭'; head.position.y = 1.36; body.add(head);
  part(head, new THREE.SphereGeometry(0.85, 32, 24), ivory, [0,0,0], [1.1,0.9,0.76]);
  for (const x of [-0.32,0.32]) {
    const geometry = new THREE.SphereGeometry(0.11, 16, 12);
    const closed = geometry.attributes.position.clone();
    for (let i=0;i<closed.count;i++) closed.setY(i, closed.getY(i)*0.08);
    closed.name = 'blink'; geometry.morphAttributes.position = [closed];
    part(head, geometry, dark, [x,0.05,0.59], [1,1.4,0.5]);
  }
  part(head, new THREE.TorusGeometry(0.15,0.025,8,24,Math.PI), dark, [0,-0.2,0.63]).rotation.z = Math.PI;
  const antenna = new THREE.Bone(); antenna.name = 'antenna'; antenna.position.y = 0.65; head.add(antenna);
  part(antenna, new THREE.CylinderGeometry(0.035,0.035,0.38), dark, [0,0.19,0]);
  part(antenna, new THREE.SphereGeometry(0.13,16,12), gold, [0,0.44,0]);
  for (const sign of [-1,1]) {
    const arm = new THREE.Bone(); arm.name = sign<0 ? '左肩P' : '右肩P'; arm.position.set(sign*0.72,0.22,0); body.add(arm);
    part(arm, new THREE.CapsuleGeometry(0.19,0.68,6,16), ivory, [sign*0.16,-0.5,0]);
    part(root, new THREE.CapsuleGeometry(0.23,0.65,6,16), dark, [sign*0.36,0.75,0]);
    part(root, new THREE.SphereGeometry(0.28,20,12), ivory, [sign*0.36,0.2,0.12], [1,0.65,1.4]);
  }
  return { root, animations: [], mmd: false, name: 'Deskbot' };
}
