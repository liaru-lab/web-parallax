# Models, backgrounds and lighting / モデル・背景・照明

## Supported files

| Format | How to open | Animation |
| --- | --- | --- |
| `.glb` | Choose one self-contained file; recommended on phones | Embedded clips and morphs |
| `.gltf` | Choose the file and its `.bin` / image resources, or the folder | Embedded clips and morphs |
| `.pmx`, `.pmd` | Choose one model and all its textures, preferably its folder | Local `.vmd`, optional CC0 breathing/eye sample, morphs |

Unzip downloaded archives first. ZIP, FBX, OBJ and VRM-specific avatar behavior are not supported. A folder must contain exactly one model; for packs with several variants, select just one model and its resources instead. The folder picker depends on browser support; a self-contained GLB is the easiest option on mobile.

Files are read into browser memory and are not uploaded or saved by this app. Reloading restores the procedural demo. A model file cannot fetch HTTP resources: referenced resources must be among your selected files or embedded in the model. Missing files produce an error while the previous model remains visible.

Choose up to 1,000 files / 250 MB total. VMD: 20 MB. Background images: PNG, JPEG, WebP, GIF or BMP, 20 MB / 30 megapixels maximum. Large models may still exceed a phone's memory/GPU capacity; use small, optimized models.

## Controls

- Placement: left/right, near/far, scale and rotation. The model is normalized to the stage and scale changes keep its base at floor level. Reset restores the initial placement.
- Background: choose an image or return to the procedural studio. The image covers the distant backplate without distortion; it is cropped if its aspect ratio differs. It is not projected onto the floor. Check perspective and human scale yourself when choosing a photo.
- Lighting: key intensity, ambient intensity and key direction. Self-shadows default to off so hair does not darken a toon face. Floor shadows remain on.
- MMD: choose morphs or a VMD. Morph names are the model's original names. MMDAnimationHelper handles bones, IK and grants; rigid-body physics and full MMD effects/sphere-map behavior are not implemented.
- glTF: choose an embedded clip, pause or clear it. VMD retargeting to glTF is not implemented. Draco/Meshopt compression and KTX2 textures require decoders that are not bundled; export an uncompressed GLB for this demo. Loaded model lights are disabled so the app's lighting controls remain predictable.
- Sway: simple springs affect top-level named hair/ribbon/antenna bones. This is name-based and has no collision detection; arbitrary rigs are not guaranteed to have suitable bones. The demo robot's antenna provides a working example.

The optional breathing/eye VMDs are by [DiSK](https://bowlroll.net/file/231043), CC0 1.0. They use common MMD bone names but may need pose/scale adjustments on a different character. They are never automatically retargeted to unrelated rigs.

## 日本語

スマホでは、テクスチャも埋め込まれたGLBが最も手軽です。MMDはZIPを展開し、PMXまたはPMDを1個とテクスチャ一式を選択してください。フォルダー選択にも対応していますが、モデルが複数ある場合は1個に絞って選びます。

前後・左右・大きさ・向き、背景画像、光の強さと方向を変えられます。顔が暗くなる場合は「モデル自身にも影を落とす」をOFFにします。背景は遠くの板に表示する方式なので、選ぶ画像の視点や縮尺を合わせてください。

MMDではVMDと元の表情モーフ、glTFではモデル内のアニメーションとモーフを使用できます。任意の骨格へのモーション変換、MMDの剛体物理、VRM固有の機能、圧縮glTFの追加デコーダーは今回の範囲に含めていません。

素材の条件は[ライセンス確認](license-audit.md)と[クレジット](../credits.html)を参照してください。
