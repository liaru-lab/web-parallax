export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function screenVector(x, y, angle = 0) {
  const radians = angle * Math.PI / 180;
  return [Math.cos(radians) * x + Math.sin(radians) * y,
    -Math.sin(radians) * x + Math.cos(radians) * y];
}

export function faceSample(landmarks, aspect = 4 / 3, matrix) {
  const hasIris = [landmarks?.[468]?.x, landmarks?.[468]?.y, landmarks?.[473]?.x, landmarks?.[473]?.y].every(Number.isFinite);
  const left = landmarks?.[hasIris ? 468 : 33];
  const right = landmarks?.[hasIris ? 473 : 263];
  if (![left?.x, left?.y, right?.x, right?.y].every(Number.isFinite)) return null;
  const span = Math.hypot(right.x - left.x, right.y - left.y);
  if (span < 0.015) return null;
  let facing = 1;
  let foreshortening = 1;
  const data = matrix?.data;
  const hasPose = data?.length === 16 && Array.from(data).every(Number.isFinite);
  if (hasPose) {
    facing = Math.abs(data[10]) / Math.hypot(data[8], data[9], data[10]);
    foreshortening = Math.hypot(data[0], data[1]) / Math.hypot(data[0], data[1], data[2]);
  }
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2, span,
    irisSpan: hasIris ? Math.hypot(right.x - left.x, (right.y - left.y) / aspect) / Math.max(0.5, foreshortening) : null,
    facing, hasPose, aspect };
}

export function validCalibration(value) {
  return value?.version === 1 && [value.pixelsPerCm, value.unitsPerCm, value.distanceCm,
    value.ipdMm, value.focalRatio, value.aspect, value.reference?.x, value.reference?.y].every(Number.isFinite)
    && value.pixelsPerCm >= 20 && value.pixelsPerCm <= 120 && value.unitsPerCm > 0 && value.unitsPerCm < 5
    && value.distanceCm >= 20 && value.distanceCm <= 150 && value.ipdMm >= 45 && value.ipdMm <= 80
    && value.focalRatio > 0.1 && value.focalRatio < 10 && value.aspect > 0.3 && value.aspect < 4
    && value.reference.x >= 0 && value.reference.x <= 1 && value.reference.y >= 0 && value.reference.y <= 1;
}

export function createCalibration(sample, distanceCm, ipdMm, pixelsPerCm, viewportHeightPx) {
  if (!sample?.irisSpan || !sample.hasPose || sample.facing < Math.cos(12 * Math.PI / 180)) return null;
  const value = { version: 1, distanceCm, ipdMm, pixelsPerCm,
    unitsPerCm: 5.4 / (viewportHeightPx / pixelsPerCm),
    focalRatio: sample.irisSpan * distanceCm / (ipdMm / 10), aspect: sample.aspect,
    reference: { x: sample.x, y: sample.y } };
  return validCalibration(value) ? value : null;
}

export function calibratedEye(sample, calibration) {
  if (!validCalibration(calibration) || !sample?.irisSpan || !sample.hasPose
    || sample.facing < Math.cos(35 * Math.PI / 180) || Math.abs(sample.aspect - calibration.aspect) > 0.01) return null;
  const z = calibration.focalRatio * (calibration.ipdMm / 10) / sample.irisSpan;
  if (!Number.isFinite(z) || z < 15 || z > 200) return null;
  // Camera and screen are assumed coplanar. The calibration pose defines eyes at the window center.
  // Keep the reference ray term: subtracting image centers alone creates XY drift during forward motion.
  return {
    x: ((calibration.reference.x - 0.5) * calibration.distanceCm - (sample.x - 0.5) * z) / calibration.focalRatio,
    y: ((calibration.reference.y - 0.5) * calibration.distanceCm - (sample.y - 0.5) * z) / (calibration.focalRatio * sample.aspect),
    z,
  };
}

export function faceOffset(sample, reference, aspect, depth = false) {
  const ratio = clamp(reference.span / sample.span, 0.7, 1.5);
  return {
    // Camera frames are not mirrored. A head moving to screen-right moves left in the image.
    x: clamp(-(sample.x - reference.x) / sample.span * 1.45 * aspect, -2.4, 2.4),
    y: clamp(-(sample.y - reference.y) / sample.span * 1.45, -1.6, 1.6),
    z: depth ? 5.5 * ratio : 5.5,
  };
}

export function stepSpring(spring, target, dt) {
  // ponytail: one damped angular spring per root; use a bone-chain solver if collisions matter.
  let remaining = clamp(dt, 0, 0.05);
  while (remaining > 0) {
    const step = Math.min(remaining, 1 / 120);
    spring.velocity += ((target - spring.angle) * 48 - spring.velocity * 7) * step;
    spring.angle += spring.velocity * step;
    if (Math.abs(spring.angle) > 0.7) {
      spring.angle = clamp(spring.angle, -0.7, 0.7);
      spring.velocity *= 0.3;
    }
    remaining -= step;
  }
  return spring.angle;
}
