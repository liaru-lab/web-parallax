import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { frameCorners } from 'three/addons/utils/CameraUtils.js';
import { faceOffset, faceSample, screenVector, stepSpring, createCalibration, calibratedEye, validCalibration } from '../src/math.js';

test('screen-plane points stay fixed while the observer moves; deeper points have parallax', () => {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  const corners = [new THREE.Vector3(-4, -2.7, 0), new THREE.Vector3(4, -2.7, 0), new THREE.Vector3(-4, 2.7, 0)];
  function project(x, z) {
    camera.position.set(x, 0.4, 5.5);
    frameCorners(camera, ...corners);
    camera.updateMatrixWorld();
    return new THREE.Vector3(0.8, 0.3, z).project(camera);
  }
  assert.ok(project(-1, 0).distanceTo(project(1, 0)) < 1e-6);
  assert.ok(Math.abs(project(-1, -3).x - project(1, -3).x) > 0.1);
});

test('face tracking rejects missing landmarks, has a neutral center, and maps camera mirroring', () => {
  assert.equal(faceSample([]), null);
  const landmarks = [];
  landmarks[33] = { x: 0.3, y: 0.4 };
  landmarks[263] = { x: 0.5, y: 0.4 };
  const sample = faceSample(landmarks);
  assert.deepEqual(faceOffset(sample, sample, 4 / 3), { x: -0, y: -0, z: 5.5 });
  assert.ok(faceOffset({ ...sample, x: 0.3 }, sample, 4 / 3).x > 0);
  assert.ok(faceOffset({ ...sample, y: 0.3 }, sample, 4 / 3).y > 0);
  assert.ok(faceOffset({ ...sample, span: sample.span * 2 }, sample, 4 / 3, true).z < 5.5);
});

test('screen rotation and spring response remain bounded and settle after an impulse', () => {
  const rotated = screenVector(1, 2, 90);
  assert.ok(Math.abs(rotated[0] - 2) < 1e-9);
  assert.ok(Math.abs(rotated[1] + 1) < 1e-9);
  const spring = { angle: 0, velocity: 4 };
  stepSpring(spring, 0, 1 / 60);
  assert.ok(spring.angle > 0);
  for (let i = 0; i < 600; i++) stepSpring(spring, 0, 1 / 60);
  assert.ok(Math.abs(spring.angle) < 0.001);
  for (let i = 0; i < 100; i++) stepSpring(spring, 100, 1);
  assert.ok(Number.isFinite(spring.angle) && Math.abs(spring.angle) <= 0.7);
});

// Independent pinhole-camera fixture: camera 2cm right / 8cm above the screen center.
function observedFace(x, y, z, yawDegrees = 0, rollDegrees = 0, aspect = 4 / 3) {
  const focal = 1.2;
  const yaw = yawDegrees * Math.PI / 180;
  const roll = rollDegrees * Math.PI / 180;
  const xCenter = 0.5 + focal * (2 - x) / z;
  const yCenter = 0.5 + focal * aspect * (8 - y) / z;
  const halfSpan = focal * 6.3 * Math.cos(yaw) / z / 2;
  const landmarks = [];
  landmarks[468] = { x: xCenter - halfSpan * Math.cos(roll), y: yCenter - halfSpan * Math.sin(roll) * aspect };
  landmarks[473] = { x: xCenter + halfSpan * Math.cos(roll), y: yCenter + halfSpan * Math.sin(roll) * aspect };
  const matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, yaw, roll, 'ZYX'));
  return faceSample(landmarks, aspect, { data: matrix.elements });
}

test('calibration recovers centimetres and does not invent lateral movement while approaching an off-center camera', () => {
  const calibration = createCalibration(observedFace(0, 0, 50), 50, 63, 40, 600);
  assert.ok(validCalibration(calibration));
  assert.ok(Math.abs(calibration.focalRatio - 1.2) < 1e-9);
  for (const point of [[0, 0, 50], [0, 0, 25], [10, 4, 50], [-8, -3, 80]]) {
    const measured = calibratedEye(observedFace(...point), calibration);
    for (const [i, axis] of ['x', 'y', 'z'].entries()) assert.ok(Math.abs(measured[axis] - point[i]) < 1e-8);
  }
  assert.equal(calibration.unitsPerCm, 5.4 / 15);
});

test('yaw and roll do not become false depth, while large turns and a changed capture aspect require another reference', () => {
  const calibration = createCalibration(observedFace(0, 0, 50), 50, 63, 40, 600);
  for (const [yaw, roll] of [[25, 0], [0, 20], [20, 15]]) {
    assert.ok(Math.abs(calibratedEye(observedFace(0, 0, 50, yaw, roll), calibration).z - 50) < 1e-8);
  }
  assert.equal(calibratedEye(observedFace(0, 0, 50, 45), calibration), null);
  assert.equal(calibratedEye(observedFace(0, 0, 50, 0, 0, 0.75), calibration), null);
  assert.equal(createCalibration(observedFace(0, 0, 50, 20), 50, 63, 40, 600), null);
});

test('invalid measurements and corrupted saved calibration cannot enter projection', () => {
  const sample = observedFace(0, 0, 50);
  assert.equal(createCalibration(sample, 0, 63, 40, 600), null);
  assert.equal(createCalibration(sample, 50, NaN, 40, 600), null);
  assert.equal(createCalibration({ ...sample, irisSpan: null }, 50, 63, 40, 600), null);
  assert.equal(validCalibration({ version: 1 }), false);
  assert.equal(calibratedEye(sample, null), null);
});
