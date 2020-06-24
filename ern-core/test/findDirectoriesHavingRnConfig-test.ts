import { expect } from 'chai';
import { findDirectoriesHavingRnConfig } from '../src/findDirectoriesHavingRnConfig';
import path from 'path';

describe('findDirectoriesHavingRnConfig', () => {
  const fixtureDir = path.join(__dirname, 'fixtures', 'RnConfigs');
  it('should find all directories that have a react-native.config.js file', async () => {
    const directories = await findDirectoriesHavingRnConfig(fixtureDir);
    expect(directories).to.deep.equal([
      path.join(fixtureDir, 'dirA/dirB'),
      path.join(fixtureDir, 'dirD'),
    ]);
  });
});
