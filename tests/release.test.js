import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPublicAssets } from '../scripts/check-public-assets.mjs';

test('release guard rejects stray character files and modified reviewed assets', () => {
  const directory=mkdtempSync(join(tmpdir(),'parallax-release-'));
  try {
    const publicDirectory=join(directory,'public');
    cpSync('public',publicDirectory,{recursive:true});
    assert.equal(checkPublicAssets(publicDirectory),8);
    mkdirSync(join(publicDirectory,'models'));
    writeFileSync(join(publicDirectory,'models','unlicensed.pmx'),'PMX test');
    assert.throws(()=>checkPublicAssets(publicDirectory),/Unreviewed public file/);
    rmSync(join(publicDirectory,'models'),{recursive:true});
    appendFileSync(join(publicDirectory,'motions','disk','Breath_1800F.vmd'),'modified');
    assert.throws(()=>checkPublicAssets(publicDirectory),/checksum mismatch/);
  } finally { rmSync(directory,{recursive:true,force:true}); }
});
