# References and implementation notes

The display uses **head-coupled perspective / motion parallax**, not stereoscopic separation of the viewer's two eyes. Prior work is acknowledged below; no figures, screenshots, product imagery or demo assets from these sources are included.

[Technical explanation](how-it-works.md) · [日本語の技術解説](how-it-works.ja.md) · [BibTeX bibliography](references.bib)

## Research and inspiration

| ID | Source type | Connection to this app |
| --- | --- | --- |
| R1 | Research paper | Historical head-coupled display concept; the original also uses stereo |
| R2 | Research paper | Camera-based head-coupled perspective on mobile devices |
| R3 | Technical demonstration | An accessible demonstration of viewpoint-dependent rendering |
| R4 | Product documentation | Initial inspiration; no product optics or assets are used |
| R5 | Technical article | Context for iris landmarks/depth; the app's calibration method differs |

### R1. Fish Tank Virtual Reality

Colin Ware, Kevin Arthur, Kellogg S. Booth. **Fish Tank Virtual Reality**. CHI '93 / INTERCHI, 1993, pp. 37–42. [DOI: 10.1145/169059.169066](https://doi.org/10.1145/169059.169066), [coauthor's publication listing](https://www.cs.ubc.ca/~ksbooth/publications/acm-pubs.shtml).

We cite the head-coupled desktop perspective concept. The original discusses a head-coupled **stereo** display; this app renders one image and does not implement the complete system or reproduce its experiments.

### R2. Mobile head-coupled perspective

Jérémie Francone, Laurence Nigay. **Using the User's Point of View for Interaction on Mobile Devices**. Proceedings of the 23rd Conference on l'Interaction Homme-Machine, 2011. [DOI: 10.1145/2044354.2044360](https://doi.org/10.1145/2044354.2044360), [authors' publication page](https://iihm.imag.fr/en/publication/FN11a/), [authors' mobile HCP demo](https://iihm.imag.fr/en/demo/hcpmobile/).

This is directly relevant prior work on mobile, camera-based head tracking and off-axis perspective. The app is an independent implementation using current browser APIs; it is not a port of the authors' app or experimental validation of their results. The BibTeX entry follows DOI metadata for pagination (1–8); the authors' listing gives a different page range.

### R3. Head tracking demonstration

Johnny Chung Lee. **Head Tracking for Desktop VR Displays Using the Wiimote**. [Microsoft Applied Sciences](https://www.microsoft.com/applied-sciences/projects/vr-displays-using-the-wiimote).

A technical demonstration, not cited as a peer-reviewed paper. It shows viewpoint-dependent rendering with infrared tracking. This app uses a webcam and MediaPipe instead; no demo assets or source code were copied.

### R4. Spatial display inspiration

Sony. **Spatial Reality Display ELF-MN1 features**. [Official product description](https://www.sony.jp/spatial-reality-display/products/ELF-MN1/feature_1/).

The initial inspiration. The app uses an ordinary display and does not recreate micro-optical lens hardware or binocular light separation. No Sony images or assets are bundled.

### R5. MediaPipe Iris

Andrey Vakunov, Dmitry Lagun. **MediaPipe Iris: Real-time Iris Tracking & Depth Estimation**. Google Research, 2020-08-06. [Technical article](https://research.google/blog/mediapipe-iris-real-time-iris-tracking-depth-estimation/).

Context for iris landmarks and monocular depth. The article estimates depth from iris diameter and camera geometry. This app uses the separation of iris centers plus a measured personal reference distance and provisional/known pupil separation. Its reported accuracy numbers are not accuracy measurements for this app. The app calls Face Landmarker, not a separate implementation of the article's full pipeline.

## APIs actually used

- [Three.js CameraUtils.frameCorners](https://threejs.org/docs/pages/module-CameraUtils.html): off-axis frustum through three corners of the displayed window.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html): glTF 2.0 scenes, clips and morphs.
- [three-stdlib](https://github.com/pmndrs/three-stdlib): MMDLoader / MMDAnimationHelper, including MMDParser by Takahiro.
- [MediaPipe Face Landmarker for Web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js): 478 landmarks and the facial transform. Iris-center separation is corrected for head orientation before estimating distance.
- [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent) and [requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static): acceleration/gravity input and platform permission handling.
- [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API): render-only fullscreen with a CSS fallback.
- [Vite static deployment](https://vite.dev/guide/static-deploy) and [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site): static build preparation and subdirectory hosting.

## Scope of the implementation

The projection, reference-distance calibration, spring response and generic face schematic are project code. Frustum construction calls CameraUtils; model parsing and animation use the libraries listed above. There is no paper-code port or copied paper illustration.

Inference is sampled separately from rendering on the main thread. The filter is exponential smoothing; the 1€ filter was considered in the initial research but is **not implemented**. Motion sensors drive sway only, not a second copy of the tracked camera movement. Springs have no collisions or rigid-body physics.

## 日本語

技術解説は[英語版](how-it-works.md)を既定とし、[同内容の日本語版](how-it-works.ja.md)も用意しています。R1・R2は論文、R3は技術デモ、R4は製品紹介、R5は技術記事として区別しています。著者・年・出典・この実装との関係を上に記し、再利用できる書誌情報を[references.bib](references.bib)に収録しました。


先行研究としてFish Tank VR、Francone・NigayのモバイルHCP、Johnny Leeのデモを参照しました。Sonyの紹介は発想のきっかけです。これらの図版・動画・製品画像は同梱していません。実際の投影・解析に使うライブラリの帰属とライセンス本文はアプリ内のクレジット（ソースでは`public/credits.html`）と[third-party notices](../THIRD_PARTY_NOTICES.md)に記載しています。
