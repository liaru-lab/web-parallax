import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bone } from 'three';
import { createModelAnimation } from '../src/model-animation.js';
import { drawTrackingPreview } from '../src/tracking-preview.js';

test('selecting a morph clears the previous expression and blink does not stack over a selected eye expression', () => {
  const mesh = { skeleton: { bones: [new Bone()] }, morphTargetDictionary: { 'まばたき': 0, 'あ': 1, '笑い': 2 }, morphTargetInfluences: [0,0,0] };
  const animation = createModelAnimation(mesh);
  animation.setIdle(false);
  animation.setExpression('morph:あ');
  for (let i = 0; i < 60; i++) animation.update(1 / 60);
  assert.ok(mesh.morphTargetInfluences[1] > 0.99);
  animation.setIdle(true);
  animation.setExpression('morph:笑い');
  for (let i = 0; i < 240; i++) animation.update(1 / 60);
  assert.ok(mesh.morphTargetInfluences[2] > 0.99);
  assert.equal(mesh.morphTargetInfluences[0], 0);
  assert.equal(mesh.morphTargetInfluences[1], 0);
  animation.clearMotion();
  animation.setIdle(false);
  animation.update(1 / 60);
  assert.deepEqual(mesh.morphTargetInfluences, [0,0,0]);
});

test('tracking preview draws generic shapes without copying media pixels', () => {
  const calls = [];
  const ctx = new Proxy({}, { get: (_, method) => (...args) => {
    assert.notEqual(method, 'drawImage');
    assert.ok(args.every(value => typeof value !== 'number' || Number.isFinite(value)));
    calls.push(method);
  }, set: () => true });
  const canvas = { width: 240, height: 180, getContext: () => ctx };
  drawTrackingPreview(canvas);
  drawTrackingPreview(canvas, [], { x:0.4, y:0.5, aspect:4/3 });
  assert.ok(calls.includes('ellipse'));
});
