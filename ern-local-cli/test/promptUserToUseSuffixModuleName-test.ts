import { expect } from 'chai';
import sinon from 'sinon';
import inquirer from 'inquirer';
import { ModuleTypes } from 'ern-core';
import * as fixtures from './fixtures/common';
import { promptUserToUseSuggestedModuleName } from '../src/lib/promptUserToUseSuggestedModuleName';

describe('promptUserToUseSuffixModuleName', () => {
  const sandbox = sinon.createSandbox();

  let inquirerPromptStub: any;

  beforeEach(() => {
    inquirerPromptStub = sandbox.stub(inquirer, 'prompt');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('return suggested miniapp name if user confirms true', async () => {
    inquirerPromptStub.resolves({ acceptSuggestion: true });
    const result = await promptUserToUseSuggestedModuleName(
      fixtures.npmPkgName,
      ModuleTypes.MINIAPP,
    );
    expect(result).to.be.equal(`${fixtures.npmPkgName}-miniapp`);
  });

  it('return suggested api name if user confirms true', async () => {
    inquirerPromptStub.resolves({ acceptSuggestion: true });
    const result = await promptUserToUseSuggestedModuleName(
      fixtures.npmPkgName,
      ModuleTypes.API,
    );
    expect(result).to.be.equal(`${fixtures.npmPkgName}-api`);
  });

  it('return suggested (js) api-impl name if user confirms true', async () => {
    inquirerPromptStub.resolves({ acceptSuggestion: true });
    const result = await promptUserToUseSuggestedModuleName(
      fixtures.npmPkgName,
      ModuleTypes.JS_API_IMPL,
    );
    expect(result).to.be.equal(`${fixtures.npmPkgName}-api-impl-js`);
  });

  it('return suggested (native) api-impl name if user confirms true', async () => {
    inquirerPromptStub.resolves({ acceptSuggestion: true });
    const result = await promptUserToUseSuggestedModuleName(
      fixtures.npmPkgName,
      ModuleTypes.NATIVE_API_IMPL,
    );
    expect(result).to.be.equal(`${fixtures.npmPkgName}-api-impl-native`);
  });

  it('return original mini-app name if user selects false', async () => {
    inquirerPromptStub.resolves({ acceptSuggestion: false });
    const result = await promptUserToUseSuggestedModuleName(
      fixtures.npmPkgName,
      ModuleTypes.MINIAPP,
    );
    expect(result).to.be.equal(fixtures.npmPkgName);
  });

  it('return original api name if user selects false', async () => {
    inquirerPromptStub.resolves({ acceptSuggestion: false });
    const result = await promptUserToUseSuggestedModuleName(
      fixtures.npmPkgName,
      ModuleTypes.API,
    );
    expect(result).to.be.equal(fixtures.npmPkgName);
  });

  it('return original (js) api-impl name if user selects false', async () => {
    inquirerPromptStub.resolves({ acceptSuggestion: false });
    const result = await promptUserToUseSuggestedModuleName(
      fixtures.npmPkgName,
      ModuleTypes.JS_API_IMPL,
    );
    expect(result).to.be.equal(fixtures.npmPkgName);
  });

  it('return original (native) api-impl name if user selects false', async () => {
    inquirerPromptStub.resolves({ acceptSuggestion: false });
    const result = await promptUserToUseSuggestedModuleName(
      fixtures.npmPkgName,
      ModuleTypes.NATIVE_API_IMPL,
    );
    expect(result).to.be.equal(fixtures.npmPkgName);
  });

  it('return original (native) api-impl name if user selects false', async () => {
    try {
      await promptUserToUseSuggestedModuleName(
        fixtures.npmPkgName,
        fixtures.moduleTypeNotSupported,
      );
    } catch (e) {
      expect(e.message).to.include('Unsupported module type :');
    }
  });
});
