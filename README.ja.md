# 視差と揺れ / Parallax & Sway

顔の位置に合わせた運動視差と、スマホの動きによる揺れものを試す静的Webアプリ。[English](README.md)

[公開デモを開く](https://liaru-lab.github.io/web-parallax/) · [ソースリポジトリ](https://github.com/liaru-lab/web-parallax)

初期表示はコードから作るDeskbotとスタジオ背景です。第三者のキャラクターモデルは同梱しません。手元のGLB／glTF、MMDのPMX／PMDを端末内で読み込み、立ち位置・大きさ・向き・背景画像・照明を変更できます。MMDではVMDと表情、glTFではモデル内のアニメーションと表情を利用できます。UIは日英切り替え対応。

## 仕組み

画面を3D空間をのぞく窓として固定し、Webカメラから推定した頭の位置に合わせて、非対称な透視投影を作ります。頭を動かすと奥行きごとの動きや物の重なりが変わる、1人向けの運動視差です。注視点を測る視線追跡や、左右の目に別々の画像を届ける方式ではありません。

![同じ観察者が位置AからBへ動く場合の投影。図中の表記は英語](docs/diagrams/window-projection.svg)

スマホの加速度は視点とは別に、揺れものボーンの簡易ばねへ入力します。モデルのモーションと表情を評価した後、その揺れを重ねます。

[Technical explanation（英語・既定）](docs/how-it-works.md) · [同内容の日本語版](docs/how-it-works.ja.md) · [参考文献と実装との関係](docs/references.md) · [BibTeX](docs/references.bib)

```sh
npm ci
npm run dev
```

http://localhost:5173/ を開きます。別端末のカメラ・センサーを使う場合はHTTPSが必要です。Node.js 22.12以上、推奨は24。インストール時にMediaPipeのWASMと、Googleから取得する顔追跡用モデルを配置し、モデルのSHA-256を検査します。映像と選択ファイルをアップロードする機能はありません。

```sh
npm test
npm run build
npm run check:release
npm run release
```

`release/source/`はGitHubへ置くためのソース一式、`release/site/`は静的サイト一式です。tar.gz版も生成します。**公開・push・デプロイは行いません。** Pagesのワークフローも手動実行だけにしてあります。

個人用の旧素材と作業記録は`.local/`へ退避し、公開用には入りません。`public/`に未確認の素材があるとビルドは失敗します。新しく同梱する素材は、利用条件と出典を確認し、manifest・noticesを更新してください。

- [技術解説と概念図](docs/how-it-works.ja.md)
- [使い方](docs/demo.md)
- [対応形式・背景・照明](docs/models.md)
- [校正とプライバシー](docs/calibration.md)
- [ライセンス確認](docs/license-audit.md)
- [参考文献](docs/references.md)
- [GitHub Pagesへの公開・更新](docs/release.md)

プロジェクト自身のコード・手続き生成形状は[MIT](LICENSE)。ライブラリ、顔追跡モデル、DiSKさんのCC0モーションは各ライセンスを保持します。利用者が選ぶモデル・背景・モーションの条件は別です。ローカルで読む方式でも、動画の公開や商用利用等の制限がなくなるわけではありません。
