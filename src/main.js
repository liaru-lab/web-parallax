import * as THREE from 'three';
import { createScene } from './scene.js';
import { clamp, faceOffset, faceSample, screenVector, createCalibration, validCalibration, calibratedEye } from './math.js';
import { drawTrackingPreview } from './tracking-preview.js';
import { initI18n } from './i18n.js';

initI18n();

const $ = id => document.getElementById(id);
const viewport = $('viewport');
const assetBase = new URL(import.meta.env.BASE_URL, document.baseURI);
const target = new THREE.Vector3(0, 0, 5.5);
const eye = target.clone();
const desired = target.clone();
const gravity = new THREE.Vector3(0, -9.81, 0);
const acceleration = new THREE.Vector3();
let view;
try {
  view = createScene($('scene'), viewport);
} catch (error) {
  $('fatal').hidden = false;
  $('fatal').textContent = '3D表示を開始できません。WebGL2に対応するChromeやSafariで開いてください。';
  console.error(error);
  throw error;
}

let stream = null;
let cameraRequested = false;
let cameraSession = 0;
let landmarker = null;
let reference = null;
let latestFace = null;
let lastFaceTime = 0;
let lastInference = 0;
let lastVideoTime = -1;
let inferenceMs = 0;
let parallax = true;
let sensorsRequested = false;
let sensorGeneration = 0;
let sensorTime = 0;
let strength = 1;
let sway = 1;
let lastFrame = performance.now();
let frames = 0;
let measurementTime = lastFrame;
let pointerDown = false;
const calibrationKey = 'web-parallax-calibration-v1';
let calibration = null;
try {
  const saved = JSON.parse(localStorage.getItem(calibrationKey));
  if (validCalibration(saved)) calibration = saved;
} catch { /* Storage may be disabled; calibration still works for this session. */ }
let needsReference = Boolean(calibration && (calibration.viewportWidth !== $('scene').clientWidth || calibration.viewportHeight !== $('scene').clientHeight));
let lastMeasuredEye = null;
let centerOffset = { x: 0, y: 0 };
let capture = null;
let calibrationFailure = '';
let calibrationSaved = true;

function neutralDistance() { return calibration ? calibration.distanceCm * calibration.unitsPerCm : 5.5; }
function neutralTarget() { target.set(0, 0, neutralDistance()); }
function applyScreenScale() {
  view.setScreenScale(calibration ? calibration.unitsPerCm / calibration.pixelsPerCm : null);
  neutralTarget();
  eye.copy(target);
  $('eye-unit').textContent = calibration ? '視点（cm・推定）' : '視点（仮想単位）';
}
if (calibration) {
  $('ruler-scale').value = calibration.pixelsPerCm;
  $('calibration-distance').value = calibration.distanceCm;
  $('calibration-ipd').value = calibration.ipdMm;
  $('depth').checked = true;
  applyScreenScale();
}

function status(id, message, error = false) {
  $(id).textContent = message;
  $(id).dataset.error = String(error);
}
function previewVisibility() {
  $('camera-preview').hidden = !stream || !$('preview').checked;
}
function trackingPreview(landmarks, sample, matrix) {
  for (const id of ['tracking-preview', 'calibration-preview']) drawTrackingPreview($(id), landmarks, sample, matrix);
}
trackingPreview();
function updateFaceTarget() {
  if (!reference || !latestFace) return;
  if (calibration) {
    if (Math.abs(latestFace.aspect - calibration.aspect) > 0.01) { needsReference = true; neutralTarget(); return; }
    if (needsReference) return;
    const measured = calibratedEye(latestFace, calibration);
    if (!measured) return;
    lastMeasuredEye = measured;
    target.set((measured.x - centerOffset.x) * calibration.unitsPerCm,
      (measured.y - centerOffset.y) * calibration.unitsPerCm,
      ($('depth').checked ? measured.z : calibration.distanceCm) * calibration.unitsPerCm);
    return;
  }
  const offset = faceOffset(latestFace, reference, view.aspect, $('depth').checked);
  target.set(offset.x, offset.y, offset.z);
}
function center() {
  if (latestFace && performance.now() - lastFaceTime < 700) {
    if (calibration) {
      const measured = calibratedEye(latestFace, calibration);
      if (measured) centerOffset = { x: measured.x, y: measured.y };
    } else reference = { ...latestFace };
  }
  neutralTarget();
  updateFaceTarget();
}

function stopCamera(message = 'カメラは停止中') {
  cameraSession++;
  cameraRequested = false;
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  $('camera-video').srcObject = null;
  trackingPreview();
  reference = latestFace = null;
  lastMeasuredEye = null;
  capture = null;
  lastVideoTime = -1;
  neutralTarget();
  $('camera').textContent = 'カメラで追従';
  $('input-label').textContent = 'マウス・指で視点を移動';
  $('instruction').textContent = '表示の上でマウスを動かすか、指でドラッグしてください。';
  $('face-reading').textContent = '停止中';
  status('camera-status', message);
  previewVisibility();
  updateCalibrationUI();
}

async function startCamera() {
  if (cameraRequested) return stopCamera();
  if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    status('camera-status', 'カメラにはHTTPSまたはlocalhostが必要です', true);
    return;
  }
  cameraRequested = true;
  const session = ++cameraSession;
  $('camera').textContent = 'カメラを停止';
  status('camera-status', 'カメラの許可を待っています');
  updateCalibrationUI();
  try {
    const nextStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
      facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 },
    } });
    if (session !== cameraSession) { nextStream.getTracks().forEach(track => track.stop()); return; }
    stream = nextStream;
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      if (session === cameraSession) stopCamera('カメラとの接続が切れました');
    });
    $('camera-video').srcObject = stream;
    await $('camera-video').play();
    status('camera-status', '顔のモデルを準備しています');
    if (!landmarker) {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(new URL('mediapipe', assetBase).href);
      const options = { baseOptions: { modelAssetPath: new URL('mediapipe/face_landmarker.task', assetBase).href, delegate: 'GPU' }, runningMode: 'VIDEO', numFaces: 1, outputFacialTransformationMatrixes: true };
      try { landmarker = await FaceLandmarker.createFromOptions(fileset, options); }
      catch { options.baseOptions.delegate = 'CPU'; landmarker = await FaceLandmarker.createFromOptions(fileset, options); }
    }
    if (session !== cameraSession) return;
    $('input-label').textContent = '顔の位置で視点を移動';
    $('instruction').textContent = calibration ? '頭を前後・左右にゆっくり動かし、推定距離と見え方を確認してください。'
      : '「画面と距離を校正」で基準を取るか、そのまま頭を左右に動かして試せます。';
    status('camera-status', '顔を探しています');
    lastFaceTime = 0;
    previewVisibility();
    updateCalibrationUI();
  } catch (error) {
    if (session !== cameraSession) return;
    stopCamera();
    const messages = {
      NotAllowedError: 'カメラが許可されていません。マウス・指でも試せます。',
      NotFoundError: 'カメラが見つかりません。マウス・指でも試せます。',
      NotReadableError: 'カメラを開けません。他のアプリの使用状況を確認してください。',
    };
    status('camera-status', messages[error.name] || 'カメラを開始できませんでした。再度お試しください。', true);
    updateCalibrationUI();
    console.error(error);
  }
}

function pointer(event) {
  if (event.target.closest('button') || cameraRequested || (event.pointerType !== 'mouse' && !pointerDown)) return;
  const rect = viewport.getBoundingClientRect();
  target.set(clamp(((event.clientX - rect.left) / rect.width - 0.5) * 4, -2, 2),
    clamp((0.5 - (event.clientY - rect.top) / rect.height) * 2.5, -1.25, 1.25), neutralDistance());
}
viewport.addEventListener('pointerdown', event => {
  if (event.target.closest('button')) return;
  pointerDown = true;
  viewport.setPointerCapture(event.pointerId);
  viewport.focus({ preventScroll: true });
  pointer(event);
});
viewport.addEventListener('pointermove', pointer);
viewport.addEventListener('pointerup', () => { pointerDown = false; });
viewport.addEventListener('pointercancel', () => { pointerDown = false; });
viewport.addEventListener('pointerleave', () => { if (!cameraRequested && !pointerDown) neutralTarget(); });
viewport.addEventListener('keydown', event => {
  if (cameraRequested) return;
  const directions = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 0.2], ArrowDown: [0, -0.2] };
  if (directions[event.key]) {
    event.preventDefault();
    target.x = clamp(target.x + directions[event.key][0], -2.4, 2.4);
    target.y = clamp(target.y + directions[event.key][1], -1.6, 1.6);
  }
  if (event.key === 'Home') center();
});

function setExpanded(expanded) {
  viewport.classList.toggle('expanded', expanded);
  document.body.classList.toggle('scene-only', expanded);
  $('fullscreen').textContent = expanded ? '戻す' : '全画面';
  $('fullscreen').setAttribute('aria-pressed', String(expanded));
}
$('fullscreen').addEventListener('click', async () => {
  if (document.fullscreenElement === viewport) await document.exitFullscreen();
  else if (viewport.classList.contains('expanded')) setExpanded(false);
  else {
    try {
      if (!document.fullscreenEnabled) throw new Error('Use viewport expansion');
      await viewport.requestFullscreen({ navigationUI: 'hide' });
    } catch { setExpanded(true); } // iPhoneなど、API非対応時はブラウザ内いっぱいに広げる。
  }
});
document.addEventListener('fullscreenchange', () => setExpanded(document.fullscreenElement === viewport));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !document.fullscreenElement) setExpanded(false);
});

function updateRuler() {
  $('ruler').style.width = `${+$('ruler-scale').value * 3}px`;
  $('ruler-value').value = '← 短く ／ 長く →';
}
function updateCalibrationUI(now = performance.now()) {
  $('calibration-camera').textContent = cameraRequested ? 'カメラを停止' : 'カメラを開始';
  const fresh = latestFace && now - lastFaceTime < 500;
  const frontal = fresh && latestFace.irisSpan && latestFace.hasPose && latestFace.facing >= Math.cos(12 * Math.PI / 180);
  $('calibration-capture').disabled = !frontal || Boolean(capture);
  $('calibration-capture').textContent = capture ? `計測中 ${capture.samples.length} / 12` : 'この距離で基準を取る';
  let message = '正面を向き、測った距離で「この距離で基準を取る」を押してください。';
  if (!stream) message = cameraRequested ? $('camera-status').textContent : 'カメラを開始してください。';
  else if (!fresh) message = '顔を探しています。';
  else if (!latestFace.irisSpan || !latestFace.hasPose) message = '両目をはっきりカメラに映してください。';
  else if (!frontal) message = '顔を正面に向けてください。';
  else if (capture) message = '約1秒、そのまま静止してください。';
  status('calibration-status', calibrationFailure || message, Boolean(calibrationFailure));
  if (!calibration) $('calibration-summary').textContent = $('depth').checked ? '未校正：前後は相対推定です' : '未校正：距離は固定です';
  else if (needsReference) $('calibration-summary').textContent = '表示・カメラの条件が変わりました。基準を取り直してください。';
  else if (stream && !fresh) $('calibration-summary').textContent = `顔を待っています・基準 ${calibration.distanceCm} cm`;
  else if (stream && fresh && !calibratedEye(latestFace, calibration)) $('calibration-summary').textContent = '距離を保持中：顔を正面に戻してください。';
  else $('calibration-summary').textContent = lastMeasuredEye && stream
    ? `推定距離 約${Math.round(lastMeasuredEye.z)} cm` : `校正値を保存済み・基準 ${calibration.distanceCm} cm`;
  if (calibration && !calibrationSaved) $('calibration-summary').textContent += '（このタブのみ）';
}
function collectCalibrationSample() {
  if (!capture) return;
  if (!latestFace?.irisSpan || !latestFace.hasPose || latestFace.facing < Math.cos(12 * Math.PI / 180)) {
    capture = null;
    calibrationFailure = '顔を見失ったか向きが変わりました。正面で取り直してください。';
    return;
  }
  capture.samples.push({ ...latestFace });
  if (capture.samples.length < 12) return;
  const samples = capture.samples;
  const median = key => samples.map(s => s[key]).sort((a, b) => a - b)[Math.floor(samples.length / 2)];
  const sample = { ...latestFace, x: median('x'), y: median('y'), irisSpan: median('irisSpan') };
  const spanVariation = Math.max(...samples.map(s => s.irisSpan)) / Math.min(...samples.map(s => s.irisSpan));
  const positionVariation = Math.max(...samples.map(s => Math.hypot(s.x - sample.x, s.y - sample.y)));
  const next = createCalibration(sample, capture.distanceCm, capture.ipdMm, capture.pixelsPerCm, $('scene').clientHeight);
  capture = null;
  if (!next || spanVariation > 1.1 || positionVariation > 0.025) {
    calibrationFailure = '計測中に顔が動きました。静止して取り直してください。';
    return;
  }
  calibration = { ...next, viewportWidth: $('scene').clientWidth, viewportHeight: $('scene').clientHeight };
  needsReference = false;
  centerOffset = { x: 0, y: 0 };
  strength = 1;
  $('strength').value = '1';
  $('strength-value').value = '1.0';
  $('depth').checked = true;
  reference = sample;
  try { localStorage.setItem(calibrationKey, JSON.stringify(calibration)); calibrationSaved = true; }
  catch { calibrationSaved = false; }
  applyScreenScale();
  updateFaceTarget();
  $('instruction').textContent = '校正しました。頭を前後・左右にゆっくり動かして試してください。';
  $('calibration-dialog').close();
}
$('calibrate').addEventListener('click', () => {
  calibrationFailure = '';
  $('calibration-dialog').showModal();
  $('ruler-scale').max = String(Math.min(100, Math.floor($('calibration-form').clientWidth / 3)));
  updateRuler();
  updateCalibrationUI();
});
$('calibration-close').addEventListener('click', () => $('calibration-dialog').close());
$('calibration-dialog').addEventListener('close', () => { capture = null; });
$('calibration-camera').addEventListener('click', () => { calibrationFailure = ''; startCamera(); });
$('calibration-form').addEventListener('input', () => { capture = null; calibrationFailure = ''; updateRuler(); updateCalibrationUI(); });
$('calibration-form').addEventListener('submit', event => {
  event.preventDefault();
  if ($('calibration-capture').disabled) return;
  calibrationFailure = '';
  capture = { samples: [], distanceCm: +$('calibration-distance').value,
    ipdMm: +$('calibration-ipd').value, pixelsPerCm: +$('ruler-scale').value };
  updateCalibrationUI();
});
$('calibration-reset').addEventListener('click', () => {
  calibration = null;
  needsReference = false;
  capture = null;
  centerOffset = { x: 0, y: 0 };
  lastMeasuredEye = null;
  calibrationFailure = '';
  try { localStorage.removeItem(calibrationKey); } catch { /* No persisted state to clear. */ }
  $('depth').checked = false;
  if (latestFace) reference = { ...latestFace };
  applyScreenScale();
  updateCalibrationUI();
});
let previousSceneRect = $('scene').getBoundingClientRect();
new ResizeObserver(() => {
  const rect = $('scene').getBoundingClientRect();
  if (calibration) {
    // Fullscreen changes the window's center, not the calibrated physical pixel size.
    centerOffset.x += (rect.left + rect.width / 2 - previousSceneRect.left - previousSceneRect.width / 2) / calibration.pixelsPerCm;
    centerOffset.y -= (rect.top + rect.height / 2 - previousSceneRect.top - previousSceneRect.height / 2) / calibration.pixelsPerCm;
    updateFaceTarget();
  }
  previousSceneRect = rect;
  updateCalibrationUI();
}).observe($('scene'));
screen.orientation?.addEventListener('change', () => {
  if (calibration) { needsReference = true; neutralTarget(); updateCalibrationUI(); }
});
updateCalibrationUI();

function onMotion(event) {
  const raw = event.accelerationIncludingGravity;
  if (![raw?.x, raw?.y, raw?.z].every(Number.isFinite)) return;
  const angle = screen.orientation?.angle ?? window.orientation ?? 0;
  const [gx, gy] = screenVector(raw.x, raw.y, angle);
  const linear = event.acceleration;
  const hasLinear = [linear?.x, linear?.y, linear?.z].every(Number.isFinite);
  const [ax, ay] = hasLinear ? screenVector(linear.x, linear.y, angle) : [0, 0];
  // ponytail: low-pass gravity fallback when linear acceleration is unavailable; no inertial positioning.
  const estimated = new THREE.Vector3(gx - ax, gy - ay, raw.z - (hasLinear ? linear.z : 0));
  const smoothing = sensorTime ? 0.12 : 1;
  gravity.lerp(estimated.clampLength(0, 15), smoothing);
  acceleration.set(hasLinear ? ax : gx - gravity.x, hasLinear ? ay : gy - gravity.y,
    hasLinear ? linear.z : raw.z - gravity.z).clampLength(0, 30);
  sensorTime = performance.now();
  status('sensor-status', 'センサー入力中：端末をゆっくり傾けてください');
}
function stopSensors(message = '端末センサーは停止中') {
  sensorGeneration++;
  sensorsRequested = false;
  window.removeEventListener('devicemotion', onMotion);
  gravity.set(0, -9.81, 0);
  acceleration.set(0, 0, 0);
  sensorTime = 0;
  $('sensors').textContent = '端末センサーを使う';
  status('sensor-status', message);
}
async function startSensors() {
  if (sensorsRequested) return stopSensors();
  if (!isSecureContext) return status('sensor-status', 'センサーにはHTTPSが必要です', true);
  if (!window.DeviceMotionEvent) return status('sensor-status', 'この端末はセンサーに未対応です。「飾りを揺らす」で試せます。', true);
  sensorsRequested = true;
  const generation = ++sensorGeneration;
  $('sensors').textContent = 'センサーを停止';
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const permission = await DeviceMotionEvent.requestPermission();
      if (generation !== sensorGeneration) return;
      if (permission !== 'granted') { stopSensors(); return status('sensor-status', 'センサーが許可されていません', true); }
    }
    window.addEventListener('devicemotion', onMotion);
    status('sensor-status', 'センサーの入力を待っています');
    window.setTimeout(() => {
      if (generation === sensorGeneration && !sensorTime) {
        status('sensor-status', '入力が届きません。スマホのHTTPSページでお試しください。', true);
      }
    }, 3000);
  } catch (error) {
    stopSensors();
    status('sensor-status', 'センサーを開始できませんでした', true);
    console.error(error);
  }
}

$('camera').addEventListener('click', startCamera);
$('sensors').addEventListener('click', startSensors);
$('center').addEventListener('click', center);
$('nudge').addEventListener('click', () => view.nudge(sway));
$('parallax').addEventListener('click', () => {
  parallax = !parallax;
  $('parallax').textContent = `視差 ${parallax ? 'ON' : 'OFF'}`;
  $('parallax').setAttribute('aria-pressed', String(parallax));
});
$('strength').addEventListener('input', event => { strength = +event.target.value; $('strength-value').value = strength.toFixed(1); });
$('sway').addEventListener('input', event => { sway = +event.target.value; $('sway-value').value = sway.toFixed(1); });
$('grid').addEventListener('change', event => { view.guides.visible = event.target.checked; });
$('preview').addEventListener('change', previewVisibility);
$('depth').addEventListener('change', () => { updateFaceTarget(); updateCalibrationUI(); });
function updateModelPosition() {
  const x = +$('model-x').value;
  const z = +$('model-depth').value;
  view.setModelPosition(x, z);
  $('model-x-value').value = Math.abs(x) < 0.1 ? '中央' : x < 0 ? '左' : '右';
  $('model-depth-value').value = z > 0 ? '画面より手前' : z > -1 ? '手前' : z > -2.5 ? '中央付近' : '奥';
  $('model-x').setAttribute('aria-valuetext', $('model-x-value').value);
  $('model-depth').setAttribute('aria-valuetext', $('model-depth-value').value);
}
$('model-x').addEventListener('input', updateModelPosition);
$('model-depth').addEventListener('input', updateModelPosition);
function updateModelTransform() {
  view.setModelTransform(+$('model-scale').value, +$('model-yaw').value);
  $('model-scale-value').value = (+$('model-scale').value).toFixed(1);
  $('model-yaw-value').value = `${$('model-yaw').value}°`;
}
for (const id of ['model-scale','model-yaw']) $(id).addEventListener('input', updateModelTransform);
$('model-reset').addEventListener('click', () => {
  $('model-x').value = '0'; $('model-depth').value = '-0.8';
  $('model-scale').value = '1'; $('model-yaw').value = '0';
  updateModelPosition(); updateModelTransform();
});
function updateLighting() {
  for (const id of ['light-key','light-ambient']) $(id+'-value').value = (+$(id).value).toFixed(1);
  $('light-direction-value').value = `${$('light-direction').value}°`;
  view.setLighting(+$('light-key').value, +$('light-ambient').value, +$('light-direction').value, $('self-shadow').checked);
}
for (const id of ['light-key','light-ambient','light-direction','self-shadow']) $(id).addEventListener('input', updateLighting);
updateLighting();
$('background-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  event.target.disabled = $('background-reset').disabled = true;
  try { await view.setBackground(file); status('background-status', file.name); }
  catch (error) { status('background-status', error.message, true); }
  finally { event.target.disabled = $('background-reset').disabled = false; event.target.value = ''; }
});
$('background-reset').addEventListener('click', () => { view.resetBackground(); status('background-status','スタジオ背景'); });
$('animation-clip').addEventListener('change', event => {
  const index = +event.target.value; view.setClip(index);
  $('motion-pause').disabled = $('motion-clear').disabled = index < 0;
  $('motion-pause').textContent = '一時停止'; $('expression').value = 'auto';
  status('motion-status', index < 0 ? 'モデル内の表情と簡単な待機動作' : event.target.selectedOptions[0].textContent);
});
$('expression').addEventListener('change', event => view.setExpression(event.target.value));
$('idle').addEventListener('change', event => view.setIdle(event.target.checked));
$('motion-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  event.target.disabled = $('motion-default').disabled = true;
  status('motion-status', 'モーションを読み込んでいます');
  try {
    const duration = await view.loadMotion(file);
    $('expression').value = 'auto'; $('animation-clip').value = '-1';
    $('motion-pause').disabled = $('motion-clear').disabled = false;
    $('motion-pause').textContent = '一時停止';
    status('motion-status', `${file.name} · ${duration.toFixed(1)}秒・ループ再生`);
  } catch (error) { status('motion-status', error.message || 'モーションを読み込めませんでした', true); }
  finally { event.target.disabled = $('motion-default').disabled = false; event.target.value = ''; }
});
$('motion-pause').addEventListener('click', () => { $('motion-pause').textContent = view.toggleMotionPause() ? '再開' : '一時停止'; });
$('motion-clear').addEventListener('click', () => {
  view.clearMotion(); $('animation-clip').value = '-1';
  $('expression').value = 'auto';
  $('motion-pause').disabled = $('motion-clear').disabled = true;
  status('motion-status', 'モデル内の表情と簡単な待機動作');
});
$('motion-default').addEventListener('click', async () => {
  $('motion-file').disabled = $('motion-default').disabled = true;
  status('motion-status', '配布の待機モーションを読み込んでいます');
  try {
    await view.loadBundledMotion();
    $('expression').value = 'auto';
    $('motion-pause').textContent = '一時停止';
    $('motion-pause').disabled = $('motion-clear').disabled = false;
    status('motion-status', 'DiSK：呼吸・視線 · 60秒ループ');
  } catch (error) { status('motion-status', '配布の待機モーションを読み込めませんでした', true); }
  finally { $('motion-file').disabled = $('motion-default').disabled = false; }
});
window.addEventListener('pagehide', () => { stopCamera(); stopSensors(); landmarker?.close(); landmarker = null; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { stopCamera('ページが非表示になったためカメラを停止しました'); stopSensors(); }
});

let currentModel = null;
async function replaceModel(files) {
  for (const id of ['model-files','model-folder','model-demo','motion-file','motion-default','expression','animation-clip','motion-pause','motion-clear']) $(id).disabled = true;
  status('model-status', 'モデルを読み込んでいます');
  try {
    const result = await view.loadModel(files);
    currentModel = result;
    $('model-credit').textContent = files ? 'ローカルファイル · 利用条件は配布元を確認してください' : 'Deskbot · このデモの手続き生成モデル';
    $('expression').replaceChildren(new Option('自動・モーションに合わせる','auto'),new Option('通常（固定）','neutral'));
    const presets = document.createElement('optgroup'); presets.label = '組み合わせた表情';
    for (const [value,preset] of result.presets) presets.append(new Option(preset.label,value));
    if (presets.children.length) $('expression').append(presets);
    const original = document.createElement('optgroup'); original.label = 'モデルに入っている表情';
    for (const name of result.expressions) { const option = new Option(name,`morph:${name}`); option.dataset.noI18n = ''; original.append(option); }
    $('expression').append(original);
    $('animation-clip').replaceChildren(new Option('なし','-1'));
    for (const [index,name] of result.clips.entries()) {
      const option = new Option(name,String(index)); option.dataset.noI18n = ''; $('animation-clip').append(option);
    }
    if (result.clips.length) $('animation-clip').value = '0';
    $('motion-pause').textContent = '一時停止';
    status('motion-status', result.clips.length ? result.clips[0] : 'モデル内の表情と簡単な待機動作');
    status('model-status', `${result.name} · ${result.springs}か所の揺れもの`);
    view.setIdle($('idle').checked);
    updateModelPosition(); updateModelTransform();
  } catch (error) {
    status('model-status', error.message || 'モデルを読み込めませんでした', true);
  } finally {
    for (const id of ['model-files','model-folder','model-demo']) $(id).disabled = false;
    $('expression').disabled = !currentModel?.expressions.length;
    $('motion-file').disabled = $('motion-default').disabled = !currentModel?.mmd;
    $('animation-clip').disabled = !currentModel?.clips.length;
    $('motion-pause').disabled = $('motion-clear').disabled = !view.hasMotion;
    $('nudge').disabled = !currentModel?.springs;
  }
}
for (const id of ['model-files','model-folder']) $(id).addEventListener('change', async event => {
  const files = [...event.target.files]; if (!files.length) return;
  await replaceModel(files); event.target.value = '';
});
$('model-demo').addEventListener('click', () => replaceModel());
replaceModel();

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  const video = $('camera-video');
  if (stream && landmarker && video.readyState >= 2 && now - lastInference > 80 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    lastInference = now;
    const started = performance.now();
    try {
      const result = landmarker.detectForVideo(video, now);
      latestFace = faceSample(result.faceLandmarks[0], video.videoWidth / video.videoHeight, result.facialTransformationMatrixes?.[0]);
      trackingPreview(result.faceLandmarks[0], latestFace, result.facialTransformationMatrixes?.[0]);
      inferenceMs = performance.now() - started;
      if (latestFace) {
        if (!reference) reference = { ...latestFace };
        lastFaceTime = now;
        collectCalibrationSample();
        updateFaceTarget();
        status('camera-status', '顔に追従しています');
        $('face-label').textContent = '追従中';
      }
      else if (capture) { capture = null; calibrationFailure = '顔を見失いました。取り直してください。'; }
      updateCalibrationUI(now);
    } catch (error) {
      stopCamera('顔の追跡でエラーが発生しました。再開できます。');
      console.error(error);
    }
  }
  if (stream && now - lastFaceTime > 700) {
    neutralTarget();
    status('camera-status', '顔を探しています。顔をカメラに向けてください。');
    $('face-label').textContent = '顔を探しています';
  }
  if (sensorsRequested && sensorTime && now - sensorTime > 700) {
    acceleration.multiplyScalar(Math.exp(-dt * 8));
  }
  if (parallax) desired.set(target.x * strength, target.y * strength, target.z);
  else desired.set(0, 0, neutralDistance());
  eye.lerp(desired, 1 - Math.exp(-dt * 14));
  view.render(eye, gravity, acceleration, sway, dt);
  frames++;
  if (now - measurementTime > 500) {
    $('fps-reading').textContent = `${Math.round(frames * 1000 / (now - measurementTime))} fps`;
    $('eye-reading').textContent = [eye.x, eye.y, eye.z].map(n => (calibration ? n / calibration.unitsPerCm : n).toFixed(2)).join(' / ');
    $('face-reading').textContent = stream ? `${inferenceMs.toFixed(0)} ms / 回` : '停止中';
    frames = 0;
    measurementTime = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
