# License and distribution audit / ライセンスと配布範囲

確認日：2026-10-29。対象はこのリポジトリの公開用ソースと静的サイト。権利者の一次資料・同梱規約・実ファイルを確認した記録です。利用者が後から選ぶ素材まで一括して許諾するものではありません。

## 結論

公開用の初期シーンは、プロジェクト自身のコードで作るDeskbot・床・背景・立体物に変更しました。第三者のキャラクターモデルや生成背景画像は同梱しません。モデルをGitから除外するだけでなく、`public/`への未確認ファイルの追加をビルド時に拒否します。

| 対象 | 根拠 | 公開用での扱い |
| --- | --- | --- |
| 宮舞モカ Synthesizer V衣装 MMDモデル | [AHS公式配布元](https://www.ah-soft.com/moca/)のZIPに付属する利用ガイドライン。元データ・改造物・部分流用を含むデータの再配布／転載を禁止 | モデル・テクスチャ・付属規約を公開ディレクトリから撤去。自動ダウンロードスクリプト、旧モデル入りスクリーンショットも配布対象外 |
| DiSK「アイダート＆呼吸モーション v1.1」 | [公式配布ページ](https://bowlroll.net/file/231043)から取得したZIPのREADMEに日英のCC0 1.0宣言。実際に同梱するREADMEは`public/motions/disk/readme.txt` | VMD2個と元READMEのみ同梱。作者・出典・[CC0 legal code](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en)へのリンクを保持。取得元ZIPとのバイト単位の一致も確認。プレビュー動画は含めない |
| 以前の中庭画像 | この実験用に生成した画像 | 今回の配布では権利整理の対象を減らすため同梱しない。背景はコード生成。利用者が画像をローカルに選べる |
| Deskbot、床、背景、補助形状、アプリのコード・文書 | このプロジェクトで作成したソース | `LICENSE`にMITを用意。第三者素材には適用しない |
| Three.js 0.186.1、three-stdlib 2.36.1、MMDParser | インストールしたパッケージのLICENSEと[MMDParserの原著者LICENSE](https://github.com/takahirox/mmd-parser/blob/master/LICENSE) | MIT本文と著作権表記をサイトとソースに同梱 |
| fflate / potpack | インストールしたパッケージのLICENSE | MIT / ISCの本文と著作権表記を同梱 |
| MediaPipe Tasks Vision 0.10.21とWASM | npmパッケージのApache-2.0表記と[公式ソースのLICENSE](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE) | ランタイムは元ファイルをコピー、JavaScriptはバンドル化。Apache-2.0本文と帰属を同梱 |
| Face Landmarker float16 v1 | [公式ガイド](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)が示す3つのモデルカード。各カードにApache-2.0表記 | 原本のチェックサムを固定し、Apache-2.0本文・出典・モデルカードを記録 |
| 論文・研究デモ・Sonyの製品紹介 | [参考文献](references.md) | 説明・リンクによる参照のみ。論文本文、図版、製品画像、デモ素材は転載しない |

モデルのZIP付属規約と、キャラクターを使った画像・動画の公開条件は区別しています。[AHSのキャラクター利用ガイドライン](https://www.ah-soft.com/guideline/)があることだけを根拠に、モデルファイルの再配布が許されるとは解釈していません。

利用者が取得したモデルを端末内で読む方式でも、そのモデルの使用アプリの制限、改変、商用利用、動画・画像の公開、クレジット等の条件は消えません。動画を共有する場合はモデル・モーション・背景それぞれの条件を確認してください。クレジットを書くだけで再配布禁止が解除されるわけではありません。

## Face Landmarkerの根拠とファイル同定

- [BlazeFace Short Range model card](https://storage.googleapis.com/mediapipe-assets/MediaPipe%20BlazeFace%20Model%20Card%20%28Short%20Range%29.pdf)：Apache License 2.0。
- [FaceMesh V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf)：Apache License 2.0。
- [Blendshape V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf)：Apache License 2.0。
- ダウンロード元は[version 1の固定URL](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task)。`latest`は使用しない。
- SHA-256：`64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`。インストール時に検査し、違えば失敗させる。
- 同梱素材ごとのパス・SHA-256・ライセンス・出典は[`public/asset-manifest.json`](../public/asset-manifest.json)。サイト上では[`asset-manifest.json`](../asset-manifest.json)。

## 公開データへの混入防止

以前の個人用素材と記録は、Git管理外の`.local/`に保存してあります。このフォルダーはサイトにも配布用ソースにもコピーしません。`public/models/`を除外する.gitignoreだけではViteのコピーを防げなかったため、実ファイルの移動と検査を併用しています。

`npm run build`は許可された公開ファイル一覧と素材のSHA-256を検査します。新しいモデル・画像等を`public/`へ置いた場合はビルドを失敗させます。公開用ソースの出力も、指定したソース・文書・ライセンス・確認済み素材のみをコピーします。

この確認を将来追加する素材に自動適用して「確認済み」とはしません。配布物・依存バージョンを変更した場合は、その出典と利用条件の確認、manifest・noticesの更新が必要です。

## English summary

The release includes no third-party character model, character texture, old character screenshot or generated courtyard image. Its default scene is original procedural geometry. Third-party code licenses and notices are retained. The two optional DiSK motion files have an explicit CC0 declaration in their original README. Google's three model cards identify Apache-2.0 for the Face Landmarker components, and the downloaded bundle is pinned by SHA-256.

Selecting a local file does not waive its author's terms, including restrictions on software, modification, commercial use or sharing rendered images/video. This audit records the sources and scope checked; it is not a rights certification for arbitrary user assets.
