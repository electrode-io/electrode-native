import { expect } from 'chai';
import { yarn } from '../src/clients';
import { isPackagePublished } from '../src/isPackagePublished';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import * as fixtures from './fixtures/common';

const npmPackageExists = JSON.parse(
  fs
    .readFileSync(path.join(__dirname, 'fixtures', 'npmPkgExistsResponse.json'))
    .toString(),
);
const npmPackageDoesNotExists = '';

let yarnInfoStub;
const sandbox = sinon.createSandbox();

describe('isPackagePublished', () => {
  beforeEach(() => {
    yarnInfoStub = sandbox.stub(yarn, 'info');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return true if npm package exists', async () => {
    yarnInfoStub.resolves(npmPackageExists);
    const result = await isPackagePublished(fixtures.pkgNamePublished);
    expect(result).to.be.true;
  });

  it('should return false if npm package does not exists', async () => {
    yarnInfoStub.rejects(new Error('Received invalid response from npm.'));
    const result = await isPackagePublished(fixtures.pkgNameUnpublished);
    expect(result).to.be.false;
  });
});
