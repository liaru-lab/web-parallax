import { clamp } from './math.js';

// Draw a generic symbol, never camera pixels or a face-shaped landmark mesh.
export function drawTrackingPreview(canvas, landmarks, sample, matrix) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#24392f';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = sample ? '#aed8bf' : '#607e6b';
  ctx.lineWidth = 2;
  const cx = w / 2 + (sample ? (0.5 - sample.x) * w * 0.6 : 0);
  const cy = h * 0.46 + (sample ? (sample.y - 0.5) * h * 0.4 : 0);
  const data = matrix?.data;
  const yaw = data ? clamp(data[8] / Math.hypot(data[8], data[10]), -1, 1) : 0;
  const roll = data ? Math.atan2(data[1], data[0]) : 0;
  const radius = Math.min(w, h) * 0.22;
  const distance = (a, b) => Math.hypot(landmarks[a].x - landmarks[b].x,
    (landmarks[a].y - landmarks[b].y) / sample.aspect);
  const eyeOpen = sample && landmarks?.[159] && landmarks?.[145] && landmarks?.[133]
    ? clamp(distance(159, 145) / Math.max(0.001, distance(33, 133)) / 0.28, 0.05, 1) : 0.7;
  const mouthOpen = sample && landmarks?.[13] && landmarks?.[14] && landmarks?.[61] && landmarks?.[291]
    ? clamp(distance(13, 14) / Math.max(0.001, distance(61, 291)), 0, 0.6) : 0;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-roll);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * (0.9 - Math.abs(yaw) * 0.18), radius, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (const x of [-0.32, 0.32]) {
    ctx.beginPath();
    ctx.ellipse(radius * (x - yaw * 0.18), -radius * 0.15, radius * 0.09, radius * 0.12 * eyeOpen, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-yaw * radius * 0.3, 0);
  ctx.lineTo(-yaw * radius * 0.3 + radius * 0.07, radius * 0.15);
  ctx.moveTo(-radius * 0.18, radius * 0.42);
  ctx.quadraticCurveTo(0, radius * (0.42 + mouthOpen), radius * 0.18, radius * 0.42);
  ctx.moveTo(-radius * 0.24, radius * 1.2);
  ctx.lineTo(-radius * 0.85, radius * 1.4);
  ctx.moveTo(radius * 0.24, radius * 1.2);
  ctx.lineTo(radius * 0.85, radius * 1.4);
  ctx.stroke();
  ctx.restore();
}
