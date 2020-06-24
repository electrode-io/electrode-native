import { getBinaryStoreFromCauldron } from '../src/getBinaryStoreFromCauldron';
import { expect } from 'chai';
import { fixtures } from 'ern-util-dev';
import { createTmpDir, ErnBinaryStore, shell } from 'ern-core';
import * as cauldronApi from 'ern-cauldron-api';
import {
  CauldronApi,
  CauldronHelper,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api';
import sinon from 'sinon';
import path from 'path';

const sandbox = sinon.createSandbox();

const cauldronApiFixtureFileStorePath = path.join(
  __dirname,
  '../../ern-cauldron-api/test/fixtures/filestore',
);

function createCauldronApi(cauldronDocument) {
  const fileStoreTmpDir = createTmpDir();
  shell.cp(
    '-rf',
    path.join(cauldronApiFixtureFileStorePath, '**'),
    fileStoreTmpDir,
  );
  return new CauldronApi(
    new InMemoryDocumentStore(cauldronDocument),
    new EphemeralFileStore({ storePath: fileStoreTmpDir }),
  );
}

function createCauldronHelper(cauldronDocument) {
  return new CauldronHelper(createCauldronApi(cauldronDocument));
}

function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture));
}

describe('getBinaryStoreFromCauldron', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('should return a binary store instance', async () => {
    const fixture = cloneFixture(fixtures.defaultCauldron);
    const cauldronHelper = createCauldronHelper(fixture);
    sandbox.stub(cauldronApi, 'getActiveCauldron').resolves(cauldronHelper);
    const result = await getBinaryStoreFromCauldron();
    expect(result).instanceOf(ErnBinaryStore);
  });
});
