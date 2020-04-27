import scripts from '../src/upgrade-scripts/scripts';
import InMemoryDocumentStore from '../src/InMemoryDocumentStore';
import EphemeralFileStore from '../src/EphemeralFileStore';
import CauldronApi from '../src/CauldronApi';
import { utils } from 'ern-core';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('cauldron upgrade scripts', () => {
  beforeEach(() => {
    sandbox.stub(utils, 'isGitBranch').resolves(true);
  });

  afterEach(() => {
    sandbox.restore();
  });

  function createCauldronApi(cauldronDocument: any) {
    return new CauldronApi(
      new InMemoryDocumentStore(cauldronDocument),
      new EphemeralFileStore(),
    );
  }

  it('should correctly upgrade Cauldron structure [0.0.0 => 1.0.0]', async () => {
    const script = scripts.find(s => s.from === '0.0.0' && s.to === '1.0.0');
    const fixture = JSON.parse(
      fs
        .readFileSync(path.join(__dirname, 'fixtures/cauldron-0.0.0.json'))
        .toString(),
    );
    const cauldronApi = createCauldronApi(fixture);
    await script!.upgrade(cauldronApi);
    const expectedCauldronDoc = JSON.parse(
      fs
        .readFileSync(path.join(__dirname, 'fixtures/cauldron-1.0.0.json'))
        .toString(),
    );
    const cauldronDoc = await cauldronApi.getCauldron();
    expect(cauldronDoc).eql(expectedCauldronDoc);
  });

  it('should correctly upgrade Cauldron structure [1.0.0 => 2.0.0]', async () => {
    const script = scripts.find(s => s.from === '1.0.0' && s.to === '2.0.0');
    const fixture = JSON.parse(
      fs
        .readFileSync(path.join(__dirname, 'fixtures/cauldron-1.0.0.json'))
        .toString(),
    );
    const cauldronApi = createCauldronApi(fixture);
    await script!.upgrade(cauldronApi);
    const expectedCauldronDoc = JSON.parse(
      fs
        .readFileSync(path.join(__dirname, 'fixtures/cauldron-2.0.0.json'))
        .toString(),
    );
    const cauldronDoc = await cauldronApi.getCauldron();
    expect(cauldronDoc).eql(expectedCauldronDoc);
  });

  it('should correctly upgrade Cauldron structure [2.0.0 => 3.0.0]', async () => {
    const script = scripts.find(s => s.from === '2.0.0' && s.to === '3.0.0');
    const fixture = JSON.parse(
      fs
        .readFileSync(path.join(__dirname, 'fixtures/cauldron-2.0.0.json'))
        .toString(),
    );
    const cauldronApi = createCauldronApi(fixture);
    await script!.upgrade(cauldronApi);
    const expectedCauldronDoc = JSON.parse(
      fs
        .readFileSync(path.join(__dirname, 'fixtures/cauldron-3.0.0.json'))
        .toString(),
    );
    const cauldronDoc = await cauldronApi.getCauldron();
    expect(cauldronDoc).eql(expectedCauldronDoc);
  });
});
