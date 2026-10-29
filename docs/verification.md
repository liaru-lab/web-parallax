# Verification / 確認結果

2026-10-29. The source repository and GitHub Pages demo are public. Deployment checks are recorded below.

## Passed

- `npm test`: **15 tests passed**. Projection/calibration, malformed measurements, sensor spring response, expression reset/blink, local resource paths and network rejection, glTF clip pause/reset, zero-morph material compatibility, and release asset guards.
- `npm run build` and `npm run check:release`: passed. Reviewed binary assets match their SHA-256 manifest. No third-party character model is present in the site.
- Exported source was checked independently with a fresh `npm ci`, all 15 tests, build and release audit. Its build produced the same application asset filenames/hashes as the workspace build.
- Chrome tested the production build at **`/parallax-demo/`**, including MediaPipe assets, sample VMD, docs, credits and license files. This exercises project-subdirectory hosting rather than only the site root.
- GLB: original generated robot fixture, embedded animation selection, pause/resume/reset and morphs.
- glTF: external local `.bin` and Japanese texture/folder names. An HTTP image reference is rejected before loading and causes **zero requests** to that host.
- PMD: original generated one-bone triangle fixture. Empty morph arrays are removed before rendering; no shader errors in the normal or shadow pass.
- PMX: local personal model selected from a folder, texture loading, 86 expression choices including presets, optional CC0 VMD playback. This personal fixture is not included in the site, source distribution or public screenshots.
- Invalid GLB / rejected resource references preserve the old model and keep its existing animation controllable.
- Background image, key/ambient intensity, light direction, reset and model placement/scale/rotation were checked in the browser. The procedural demo and changed background/lighting were visually inspected.
- Japanese/English switch, numeric statuses and calibration dialog. No Japanese UI text remained in English mode, excluding intentionally preserved asset names and native browser controls.
- Camera inference with a test video, calibration to a numeric 50 cm reference, fullscreen entry/return preserving calibration, and zero visible video elements. **No third-party HTTP requests** were observed during the static site's camera/tracker test. This is a synthetic reference check, not an accuracy measurement on a person's real eye distance.
- `check:fullscreen` passed against production: native fullscreen, unsupported-API fallback, Escape and Return restoration, tracking overlay hidden.
- English UI at 390 × 844 CSS pixels: no horizontal overflow; visually checked. Desktop Japanese and English views were also inspected.

The fixture generator `node tests/make-fixtures.mjs` creates original GLB, glTF and PMD files under `/tmp/` by default. Restricted characters are never distributable fixtures. Private visual QA images are kept outside the release folders.

## Technical documentation

- English is the default in README and the [technical explanation](how-it-works.md), with reciprocal links to the [equivalent Japanese explanation](how-it-works.ja.md).
- Relative Markdown links and image paths in both READMEs, both explanations and the bibliography resolve in the source tree. The shared English SVG parses as XML, was visually inspected in Chrome at its native size, and has no text outside its view box. Both language versions use the same English flow diagram.
- Paper titles, authors and DOIs were checked against publisher DOI metadata and author publication pages. Research papers, technical demonstrations, product inspiration and the iris article are identified separately. The differing pagination in the mobile HCP author's listing is noted; BibTeX follows DOI metadata.
- The diagrams are original project illustrations, not figures copied from the cited publications. Documentation, diagrams and BibTeX are included in both source and static-site exports.

## Device check and remaining limits

fold8 (SM-F971B / Android 17 / Chrome 156) was reached through wireless ADB/CDP and loaded the new demo UI over the existing private HTTPS host. A CDP attempt to set an absolute Android file path was rejected by Android's file permissions. The normal Android picker must grant access through its own selection flow; wireless ADB disconnected before that last picker flow could be completed. Do not treat this as a completed native-picker test on fold8. The local file API and actual model parsers were exercised in desktop Chrome as described above.

ZIP / FBX / OBJ / VRM-specific behavior, glTF compression decoders, MMD rigid-body collision physics, retargeting arbitrary skeletons and long-session mobile thermal/memory behavior are outside this release. Very large or unusual assets may need export/rig adjustments. MMDLoader emits old material-property warnings with current Three.js; these are distinct from shader errors and the supported rendering/morph/motion paths were checked.

User-supplied asset rights are outside the bundled-asset audit.

## GitHub Pages deployment

- [Initial deployment](https://github.com/liaru-lab/web-parallax/actions/runs/40876699806) succeeded from commit `6ecc633506ebda1525b1ec4e216d2dc7a95d40ec`, including `npm ci`, all 15 tests, build, asset audit and deployment.
- All **37 files** at the [HTTPS demo](https://liaru-lab.github.io/web-parallax/) returned successfully and matched the reviewed local production build by SHA-256. This includes application assets, MediaPipe WASM/weights, sample motions, documentation, diagram, bibliography and licenses.
- Firefox loaded the live site and rendered Deskbot. Entering render-only fullscreen and returning with Escape restored the controls. These are hosting/rendering checks; the earlier local camera checks above do not constitute a new real-camera test against the public origin.
- GitHub `main` was compared with the 54-file reviewed source export, including the two binary CC0 motion files. Personal assets, `.local/`, `.cert/`, environment files and device connection settings were excluded.
- Pages uses GitHub Actions with enforced HTTPS. The workflow remains manual-only; a source push does not itself deploy an update.

## 日本語

切り出したソースからの再インストール、テスト15件、ビルド、配布物の検査まで成功しました。公開用の静的ビルドをサブディレクトリ配下で開き、モデル形式・テクスチャ・モーション・日英UI・背景と照明・顔追跡・校正・全画面を確認しています。

技術解説は英語を既定とし、同内容の日本語版と相互リンクしました。独自の英語概念図をChromeで目視確認し、リンク先・図の文字切れ・日英のフロー図の一致を検査しています。論文の著者・DOI等を一次資料で確認し、デモ・製品紹介との違いも記載しました。

GitHub Actionsでテスト15件・ビルド・配布物検査・Pagesへの初回デプロイが成功しました。公開URLの37ファイルが検査済みビルドと一致し、FirefoxでDeskbotの描画と全画面への切り替え・復帰を確認しています。ソース54ファイルも照合し、個人用素材や接続設定は含まれていません。

fold8では新UIの取得まで確認しましたが、Androidの通常ファイルピッカー経由での最終確認はADB接続断のため残っています。実カメラでの距離精度や、すべての端末・特殊なモデルを保証する検査ではありません。今回の公開URLでは、実カメラを使う追加試験は行っていません。
