// Source messages stay in Japanese; native controls and asset names keep their own labels.
const pairs = `視差と揺れ	Parallax & Sway
Webカメラと端末センサーの実験	Webcam and motion sensor experiment
言語	Language
使い方 ↗	Help ↗
クレジット ↗	Credits ↗
3D実験	3D experiment
3D表示。マウス・指・矢印キーで視点を移動	3D view. Move the viewpoint with a pointer, touch or arrow keys
3Dモデルと立体物	3D model and objects
全画面	Fullscreen
戻す	Return
マウス・指で視点を移動	Move with pointer or touch
画面の枠を窓として、奥を覗く。	Move your head to look through the window.
顔の位置・向き・目と口の動きを示す模式図	Schematic of head position, orientation, eyes and mouth
顔を探しています	Looking for a face
表示の上でマウスを動かすか、指でドラッグしてください。	Move the pointer over the view, or drag with a finger.
飾りを揺らす	Nudge accessories
モデルを読み込んでいます	Loading model
Deskbot · このデモの手続き生成モデル	Deskbot · procedural model made for this demo
操作パネル	Controls
モデル	Model
モデルと素材を選ぶ	Choose model and resources
またはモデルのフォルダーを選ぶ	Or choose a model folder
GLBは1ファイル。MMD・glTFはモデルとテクスチャ等を一緒に選びます。ZIPは展開してから選んでください。	GLB can be a single file. For MMD or glTF, include textures and buffers. Unzip archives first.
ファイルは端末内で読み込みます。作品の公開には各素材の利用条件が適用されます。	Files stay on your device. Each asset's terms still apply when sharing your work.
デモモデルに戻す	Restore demo model
視点	Viewpoint
カメラで追従	Track with camera
カメラは停止中	Camera stopped
顔の位置で視点が変わります。映像は端末内で処理し、画面には模式図だけを表示します。	Your head position moves the viewpoint. Video is processed locally; only a schematic is shown.
画面と距離を校正	Calibrate screen and distance
未校正：距離は固定です	Not calibrated: distance is fixed
中央に合わせる	Recenter
視差の強さ	Parallax strength
揺れもの	Sway
端末センサーを使う	Enable device sensors
スマホの傾き・動きで飾りが揺れます	Tilt or move the phone to sway accessories
髪やリボン、衣装の紐が重力と慣性に反応します。PCでは「飾りを揺らす」で試せます。	Named hair, ribbon and antenna bones respond to gravity and inertia. On a computer, try “Nudge accessories”.
揺れの強さ	Sway strength
モデルの立ち位置	Model placement
左右	Left / right
中央	Center
左	Left
右	Right
前後	Back / forward
手前	Near
奥	Far
画面より手前	In front of the screen
中央付近	Middle
大きさ	Scale
向き	Rotation
立ち位置を戻す	Reset placement
背景・照明	Background & lighting
背景画像を選ぶ	Choose background image
スタジオ背景	Studio background
背景を戻す	Reset background
主光源	Key light
環境光	Ambient light
光の方向	Light direction
モデル自身にも影を落とす	Model self-shadows
表情・動き	Expressions & animation
表情	Expression
自動・モーションに合わせる	Auto / follow animation
通常（固定）	Neutral (fixed)
まばたき・小さな待機動作	Automatic blink and idle movement
モデル内のアニメーション	Embedded animation
なし	None
VMDモーションを読み込む	Load VMD animation
モデル内の表情と簡単な待機動作	Model expressions and simple idle movement
一時停止	Pause
再開	Resume
モーションを解除	Clear animation
サンプルの呼吸・視線	Sample breathing and eye movement
待機モーション：	Sample motion:
配布モーションの候補と使い方 ↗	Model and animation guide ↗
表示と計測	Display & measurements
奥行きの補助線	Depth guides
顔の追跡の模式図	Head tracking schematic
前後移動も反映	Track forward / backward movement
「画面と距離を校正」で距離を合わせられます。校正後は視差の強さ1.0が実寸の基準です。	Use calibration to match the real screen and distance. A parallax strength of 1.0 then uses physical scale.
視点（仮想単位）	Eye position (virtual units)
視点（cm・推定）	Eye position (cm, estimated)
描画	Rendering
顔の推論	Face inference
停止中	Stopped
通常の画面で運動視差を試すデモです。	Motion parallax on an ordinary display.
見る人は1人を想定しています。	Designed for one viewer.
画面と距離の校正	Screen and distance calibration
校正を閉じる	Close calibration
1. 画面の線を、定規の3cmに合わせる	1. Match this line to 3 cm on a ruler
定規で測る基準線	Reference line measured with a ruler
線の長さ	Line length
調整してください	Adjust the line
2. 画面から目までの距離を測る	2. Measure from the screen to your eyes
画面の表面から両目まで	Screen surface to the midpoint of your eyes
目の間隔が分かる場合	If you know your pupil distance
左右の黒目の中心どうし	Distance between pupil centers
不明なら仮の63mmで試せます。眼鏡のPD（両眼分）が分かれば入力してください。主に左右・上下移動の縮尺に影響します。	If unknown, try 63 mm. Enter your binocular PD if available. It mainly affects lateral and vertical movement scale.
両目の中間を3D表示部分の中心と同じ高さ・左右位置に合わせ、画面に正対してください。測った距離で静止して基準を取ります。	Face the screen, with your eyes centered on the 3D view. Stay still at the measured distance while sampling.
顔の追跡の模式図。実際の映像は表示しません	Head tracking schematic. Actual video is not displayed
カメラを開始	Start camera
カメラを開始して、正面を向いてください。	Start the camera and face it directly.
校正を解除	Clear calibration
この距離で基準を取る	Use this distance as reference
数値だけをこのブラウザに保存します。画面の位置・大きさやカメラを変えたら、基準を取り直してください。カメラが画面付近にある前提の簡易校正です。	Only numeric calibration is saved in this browser. Recalibrate after changing the camera, screen orientation or zoom. This approximation assumes the camera is near the screen.
3D表示を開始できません。WebGL2に対応するChromeやSafariで開いてください。	Cannot start 3D rendering. Use a browser with WebGL2 support.
カメラにはHTTPSまたはlocalhostが必要です	Camera access requires HTTPS or localhost
カメラを停止	Stop camera
カメラの許可を待っています	Waiting for camera permission
カメラとの接続が切れました	Camera disconnected
顔のモデルを準備しています	Preparing face tracking
顔の位置で視点を移動	Head position controls the viewpoint
頭を前後・左右にゆっくり動かし、推定距離と見え方を確認してください。	Slowly move your head sideways and forward / backward to check the estimated distance and perspective.
「画面と距離を校正」で基準を取るか、そのまま頭を左右に動かして試せます。	Calibrate for physical scale, or simply move your head sideways to try tracking.
カメラが許可されていません。マウス・指でも試せます。	Camera permission was denied. Pointer and touch still work.
カメラが見つかりません。マウス・指でも試せます。	No camera found. Pointer and touch still work.
カメラを開けません。他のアプリの使用状況を確認してください。	Cannot open the camera. Check whether another app is using it.
カメラを開始できませんでした。再度お試しください。	Could not start the camera. Please try again.
← 短く ／ 長く →	← Shorter / longer →
正面を向き、測った距離で「この距離で基準を取る」を押してください。	Face the camera at the measured distance, then capture the reference.
カメラを開始してください。	Start the camera first.
顔を探しています。	Looking for a face.
両目をはっきりカメラに映してください。	Make sure both eyes are clearly visible.
顔を正面に向けてください。	Face the camera directly.
約1秒、そのまま静止してください。	Hold still for about one second.
未校正：前後は相対推定です	Not calibrated: depth is relative
表示・カメラの条件が変わりました。基準を取り直してください。	Screen or camera conditions changed. Capture a new reference.
距離を保持中：顔を正面に戻してください。	Holding distance: face the camera again.
顔を見失ったか向きが変わりました。正面で取り直してください。	Face lost or turned. Face the camera and try again.
計測中に顔が動きました。静止して取り直してください。	Movement detected during sampling. Hold still and try again.
校正しました。頭を前後・左右にゆっくり動かして試してください。	Calibrated. Slowly move your head sideways and forward / backward.
センサー入力中：端末をゆっくり傾けてください	Sensors active: slowly tilt the device
端末センサーは停止中	Device sensors stopped
センサーにはHTTPSが必要です	Sensors require HTTPS
この端末はセンサーに未対応です。「飾りを揺らす」で試せます。	Motion sensors are unavailable. Try “Nudge accessories”.
センサーを停止	Stop sensors
センサーが許可されていません	Sensor permission was denied
センサーの入力を待っています	Waiting for sensor data
入力が届きません。スマホのHTTPSページでお試しください。	No sensor data. Try this HTTPS page on a phone.
センサーを開始できませんでした	Could not start the sensors
モーションを読み込んでいます	Loading animation
モーションを読み込めませんでした	Could not load the animation
配布の待機モーションを読み込んでいます	Loading sample motion
DiSK：呼吸・視線 · 60秒ループ	DiSK: breathing and eyes · 60-second loop
配布の待機モーションを読み込めませんでした	Could not load the sample motion
ページが非表示になったためカメラを停止しました	Camera stopped because the page became hidden
ローカルファイル · 利用条件は配布元を確認してください	Local file · check the asset author's terms
組み合わせた表情	Expression presets
モデルに入っている表情	Model morphs
モデルを読み込めませんでした	Could not load the model
顔に追従しています	Tracking your face
追従中	Tracking
顔を見失いました。取り直してください。	Face lost. Capture the reference again.
顔の追跡でエラーが発生しました。再開できます。	Face tracking failed. You can restart it.
顔を探しています。顔をカメラに向けてください。	Looking for a face. Face the camera.
ほほえみ	Gentle smile
笑顔	Smile
驚き	Surprise
20MB以下のVMDファイルを選んでください。	Select a VMD file up to 20 MB
VMDはMMDモデル用です。glTFではモデル内のアニメーションを選んでください。	VMD requires an MMD model. Use embedded animations for glTF.
対応する人物用モーションがありません。	No matching character animation in this VMD
モデル内に表示できる形状がありません。	This model has no visible geometry
PNG・JPEG・WebP・GIF・BMPを20MB以下で選んでください。	Select a PNG, JPEG, WebP, GIF or BMP image up to 20 MB
画像は3000万画素以下にしてください。	Image is too large (30 megapixels maximum)
ファイルは1000個・合計250MBまでです。	Select up to 1,000 files, 250 MB in total
モデルはPMX・PMD・GLB・glTFのうち1個と、その素材を選んでください。	Select exactly one PMX, PMD, GLB or glTF model and its textures`.split('\n').map(line => line.split('\t'));
const english = new Map(pairs);
const japanese = new Map(pairs.map(([ja,en]) => [en,ja]));

export function translateMessage(source, language) {
  const text = source.trim();
  let translated = language === 'en' ? english.get(text) : japanese.get(text);
  if (!translated && language === 'en') {
    const patterns = [
      [/^視差 (ON|OFF)$/, (_,state) => `Parallax ${state}`],
      [/^計測中 (\d+) \/ 12$/, (_,count) => `Sampling ${count} / 12`],
      [/^顔を待っています・基準 (.+) cm$/, (_,n) => `Waiting for face · reference ${n} cm`],
      [/^推定距離 約(.+) cm$/, (_,n) => `Estimated distance ~${n} cm`],
      [/^校正値を保存済み・基準 (.+) cm$/, (_,n) => `Calibration saved · reference ${n} cm`],
      [/^(.+) · (\d+)か所の揺れもの$/, (_,name,n) => `${name} · ${n} sway bones`],
      [/^(.+) · ([\d.]+)秒・ループ再生$/, (_,name,n) => `${name} · ${n}s · looping`],
      [/^([\d.]+) ms \/ 回$/, (_,n) => `${n} ms / frame`],
    ];
    for (const [pattern,render] of patterns) {
      if (pattern.test(text)) { translated = text.replace(pattern,render); break; }
    }
    if (text.endsWith('（このタブのみ）')) translated = translateMessage(text.replace('（このタブのみ）',''),language)+' (this tab only)';
  }
  return translated ? source.replace(text,translated) : source;
}

export function initI18n() {
  const picker = document.getElementById('language');
  let language = navigator.language.startsWith('ja') ? 'ja' : 'en';
  try { const saved = localStorage.getItem('web-parallax-language'); if (['ja','en'].includes(saved)) language = saved; } catch { /* Storage is optional. */ }
  const sources = new WeakMap();
  const attributes = new WeakMap();
  const observer = new MutationObserver(render);
  function render() {
    observer.disconnect();
    document.documentElement.lang = language; picker.value = language;
    for (const root of [document.body,document.querySelector('title')]) {
      const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement.closest('[data-no-i18n],script,style,code,pre')) continue;
        const old = sources.get(node);
        const source = old?.last === node.nodeValue ? old.source : node.nodeValue;
        const last = translateMessage(source,language);
        if (node.nodeValue !== last) node.nodeValue = last;
        sources.set(node,{source,last});
      }
    }
    for (const element of document.querySelectorAll('[aria-label],[title],[label]')) {
      if (element.closest('[data-no-i18n]')) continue;
      let cache = attributes.get(element);
      if (!cache) { cache = {}; attributes.set(element,cache); }
      for (const name of ['aria-label','title','label']) {
        if (!element.hasAttribute(name)) continue;
        const value = element.getAttribute(name);
        const source = cache[name]?.last === value ? cache[name].source : value;
        const last = translateMessage(source,language);
        if (last !== value) element.setAttribute(name,last);
        cache[name] = {source,last};
      }
    }
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','label']});
  }
  picker.addEventListener('change', () => {
    language = picker.value;
    try { localStorage.setItem('web-parallax-language',language); } catch { /* Session-only language is fine. */ }
    render();
  });
  render();
}
