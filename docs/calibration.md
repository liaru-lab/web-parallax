# Calibration and privacy / 校正とプライバシー

## Quick calibration

1. Open “Calibrate screen and distance”. Match the displayed reference line to **3 cm on a physical ruler**.
2. Measure from the screen surface to the midpoint between your eyes (20–150 cm), and enter it.
3. If you know your binocular pupil distance (PD), enter it (45–80 mm). Otherwise 63 mm is a provisional default, not a measurement of your eyes.
4. Look straight at the camera, center your eyes on the 3D view and hold still while the app samples 12 frames.

The camera should be close to the screen, pointing roughly perpendicular to it. Face turns, reflections, occlusion and movement can reduce accuracy. Turn back toward the camera if distance is held. This is an entertainment approximation, not a measuring instrument.

Fullscreen preserves pixels/cm and compensates for movement of the window center. After rotating the device or changing camera capture aspect, take a new reference. Browser zoom, a different camera or a different physical display also require recalibration. Preferences are origin-specific: localhost and a hosted URL have separate storage.

## How it works

The iris centers (MediaPipe landmarks 468 and 473) define an eye midpoint and span. Head rotation is used to compensate projected shortening. At measured reference distance D0 and known/provisional pupil separation I, the camera focal ratio is estimated as `f = span0 * D0 / I`. Current depth is `D = f * I / span`. The reference ray is included during back-projection so simply approaching an off-center camera does not create false lateral movement.

A ruler supplies CSS pixels/cm. The screen window, eye position and scene projection are then expressed in a consistent virtual scale. Camera intrinsics, distortion and camera-to-screen extrinsics are not fully calibrated. The app applies exponential smoothing and rejects missing/non-finite measurements and excessive head turns.

## Data handling

- The app has no upload endpoint, accounts, analytics, or server-side inference. Camera video is hidden and processed locally. The preview draws generic shapes, not pixels from the camera.
- Local model/image/VMD files stay in page memory. Referenced model resources resolve only to selected or embedded data, with external HTTP requests blocked. Reload to discard selected files.
- Only calibration numbers and the chosen UI language are written to localStorage. No face image or face mesh is persisted.
- MediaPipe Tasks Vision is pinned to 0.10.21. The previously used 1.2.0 bundle contained a Google logging endpoint; the pinned bundle contains no such URL. The site also restricts connections to its own origin, Blob and data resources using CSP. Runtime network checks are part of release verification.
- HTTPS is required for camera/sensor permissions on a hosted site. Stopping inputs, hiding the page or leaving it stops camera tracks and sensor listeners. The host can still observe ordinary HTTP requests for the page, scripts, WASM and model binaries.

## 日本語

定規で画面の3cmと目までの距離を合わせ、正面で静止して基準を取ります。目の間隔は眼鏡の両眼PDなどが分かる場合だけ入力し、不明なら63mmの仮値で試せます。単眼カメラによる近似なので、顔の向き・照明・眼鏡・設置位置によって誤差が出ます。

映像や選択ファイルを送る機能はありません。保存するのは校正値と表示言語だけです。ページや顔追跡用バイナリのダウンロードは通常のサイト通信として発生します。端末を回転した場合やカメラ条件を変更した場合は基準を取り直してください。
