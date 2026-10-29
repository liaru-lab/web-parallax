import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localPath, createLocalResources } from '../src/local-assets.js';
import { translateMessage } from '../src/i18n.js';
import { createDemoModel } from '../src/demo-model.js';
import { createModelAnimation } from '../src/model-animation.js';
import { AnimationClip, VectorKeyframeTrack } from 'three';

test('local bundles resolve nested Japanese/Windows paths and never fetch outside the selection', () => {
  const model = new File(['model'],'model.pmx');
  Object.defineProperty(model,'webkitRelativePath',{value:'モデル/model.pmx'});
  const image = new File(['image'],'顔.png');
  Object.defineProperty(image,'webkitRelativePath',{value:'モデル/tex/顔.png'});
  const bundle = createLocalResources([model,image]);
  assert.equal(localPath('local:///モデル/tex/../tex/顔.png'),'モデル/tex/顔.png');
  assert.match(bundle.manager.resolveURL('local:///モデル/tex\\顔.png'),/^blob:/);
  assert.match(bundle.manager.resolveURL('local:///モデル/tex/%E9%A1%94.png'),/^blob:/);
  assert.throws(()=>bundle.manager.resolveURL('https://example.com/顔.png'),/External/);
  assert.throws(()=>bundle.manager.resolveURL('file:///etc/passwd'),/External/);
  assert.throws(()=>localPath('../../private.png'),/leaves/);
  assert.throws(()=>bundle.manager.resolveURL('local:///missing.png'),/Missing/);
  assert.throws(()=>bundle.manager.resolveURL('data:image/svg+xml;base64,PHN2Zz4='),/External/);
  bundle.dispose();
});

test('model selection rejects ambiguous roots, duplicate filenames and oversized bundles', () => {
  assert.throws(()=>createLocalResources([new File(['a'],'a.glb'),new File(['b'],'b.pmx')]),/exactly one/);
  assert.throws(()=>createLocalResources([new File(['a'],'same.glb'),new File(['b'],'SAME.GLB')]),/Duplicate/);
  assert.throws(()=>createLocalResources([{name:'a.glb',size:251*1024*1024}]),/250 MB/);
});

test('dynamic UI translations preserve asset filenames and calibration numbers', () => {
  assert.equal(translateMessage('私のモデル.pmx · 24か所の揺れもの','en'),'私のモデル.pmx · 24 sway bones');
  assert.equal(translateMessage('推定距離 約42 cm','en'),'Estimated distance ~42 cm');
  assert.equal(translateMessage('校正値を保存済み・基準 50 cm（このタブのみ）','en'),'Calibration saved · reference 50 cm (this tab only)');
  assert.equal(translateMessage('asset name','en'),'asset name');
});

test('the procedural model has a working blink and glTF animation pause/reset restores its pose', () => {
  const {root} = createDemoModel();
  const head = root.getObjectByName('頭');
  const y = head.position.y;
  const clip = new AnimationClip('bob',1,[new VectorKeyframeTrack(`${head.uuid}.position`,[0,1],[0,y,0,0,y+1,0])]);
  const animation = createModelAnimation(root,{mmd:false,clips:[clip]});
  animation.update(2.8); animation.update(0.05);
  const eyes=[]; root.traverse(object=>{if(object.morphTargetDictionary)eyes.push(object);});
  assert.equal(eyes.length,2);
  assert.ok(eyes.every(eye=>eye.morphTargetInfluences[0]>0.4));
  animation.setClip(0); animation.update(0.25);
  assert.ok(head.position.y>y+0.2);
  const pausedY=head.position.y; animation.togglePause(); animation.update(0.25);
  assert.equal(head.position.y,pausedY);
  animation.clearMotion(); assert.equal(head.position.y,y);
  animation.dispose();
});
