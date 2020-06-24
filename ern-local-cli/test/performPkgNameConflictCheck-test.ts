import { expect } from 'chai';
import { yarn } from 'ern-core';
import sinon from 'sinon';
import inquirer from 'inquirer';
import { performPkgNameConflictCheck } from '../src/lib/performPkgNameConflictCheck';
import * as fixtures from './fixtures/common';

describe('performPkgNameConflictCheck', () => {
  const sandbox = sinon.createSandbox();
  const npmPackageExists = require('./fixtures/npmPkgExistsResponse.json');

  let yarnInfoStub: any;
  let inquirerPromptStub: any;

  beforeEach(() => {
    yarnInfoStub = sandbox.stub(yarn, 'info');
    inquirerPromptStub = sandbox.stub(inquirer, 'prompt');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('if package does not exists in npm return true', async () => {
    yarnInfoStub.rejects(new Error('Received invalid response from npm.'));
    const result = await performPkgNameConflictCheck(
      fixtures.npmPkgNameDoesNotExists,
    );
    expect(result).to.be.true;
  });

  it('if package exists in npm and user confirms exit execution return false ', async () => {
    yarnInfoStub.resolves(npmPackageExists);
    inquirerPromptStub.resolves({ continueIfPkgNameExists: false });
    const result = await performPkgNameConflictCheck(fixtures.npmPkgNameExists);
    expect(result).to.be.false;
  });

  it('if package exists in npm and user confirms continue execution return true', async () => {
    yarnInfoStub.resolves(npmPackageExists);
    inquirerPromptStub.resolves({ continueIfPkgNameExists: true });
    const result = await performPkgNameConflictCheck(fixtures.npmPkgNameExists);
    expect(result).to.be.true;
  });
});
