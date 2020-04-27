import { copyRnConfigAssets } from '../src/copyRnConfigAssets';
import { createTmpDir } from 'ern-core';
import { assert } from 'chai';
import fs from 'fs';
import path from 'path';

describe('copyRnConfigAssets', () => {
  it('should copy dependencies assets to output directory [android]', async () => {
    const compositePath = path.join(
      __dirname,
      'fixtures',
      'CompositeWithRnConfigs',
    );
    const outDir = createTmpDir();
    await copyRnConfigAssets({ compositePath, outDir, platform: 'android' });
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/lib/src/main/assets/fonts/fakefont1.ttf`),
      ),
    );
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/lib/src/main/assets/fonts/fakefont2.ttf`),
      ),
    );
  });

  it('should copy dependencies assets to output directory [ios]', async () => {
    const compositePath = path.join(
      __dirname,
      'fixtures',
      'CompositeWithRnConfigs',
    );
    const outDir = createTmpDir();
    await copyRnConfigAssets({ compositePath, outDir, platform: 'ios' });
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/ElectrodeContainer/Resources/fakefont1.ttf`),
      ),
    );
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/ElectrodeContainer/Resources/fakefont2.ttf`),
      ),
    );
  });

  it('should copy project assets to output directory [android]', async () => {
    const compositePath = path.join(
      __dirname,
      'fixtures',
      'CompositeWithRnConfigs',
    );
    const outDir = createTmpDir();
    await copyRnConfigAssets({ compositePath, outDir, platform: 'android' });
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/lib/src/main/assets/fonts/fakefont3.ttf`),
      ),
    );
  });

  it('should copy project assets to output directory [ios]', async () => {
    const compositePath = path.join(
      __dirname,
      'fixtures',
      'CompositeWithRnConfigs',
    );
    const outDir = createTmpDir();
    await copyRnConfigAssets({ compositePath, outDir, platform: 'ios' });
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/ElectrodeContainer/Resources/fakefont3.ttf`),
      ),
    );
  });
});
