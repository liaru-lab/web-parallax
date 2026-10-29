import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Mesh, BufferGeometry, MeshToonMaterial, Texture, FrontSide, DoubleSide, SRGBColorSpace } from 'three';
import { prepareMmdMaterials, prepareModelMesh } from '../src/scene.js';

test('MMD texture alpha reaches the material and hidden pixels cannot occlude the face; PMX culling is preserved', () => {
  const map = new Texture();
  map.transparent = true;
  const face = new MeshToonMaterial({ map, side: FrontSide });
  const opaque = new MeshToonMaterial({ map: new Texture(), side: DoubleSide });
  prepareMmdMaterials([face, opaque]);
  assert.equal(face.transparent, true);
  assert.ok(face.alphaTest > 0);
  assert.equal(face.side, FrontSide);
  assert.equal(map.colorSpace, SRGBColorSpace);
  assert.equal(opaque.transparent, false);
  assert.equal(opaque.side, DoubleSide);
});

test('models without morphs do not enable an invalid zero-target shader', () => {
  const mesh = new Mesh(new BufferGeometry(),new MeshToonMaterial());
  mesh.geometry.morphAttributes.position=[];
  prepareModelMesh(mesh);
  assert.equal(mesh.geometry.morphAttributes.position,undefined);
  assert.equal(mesh.castShadow,true);
  assert.equal(mesh.receiveShadow,false);
});
