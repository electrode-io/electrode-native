import { assert, expect } from 'chai';
import { AppVersionDescriptor, yarn } from 'ern-core';
import * as cauldron from 'ern-cauldron-api';
import {
  afterTest,
  beforeTest,
  doesThrow,
  fixtures as utilFixtures,
} from 'ern-util-dev';
import * as container from '../src/container';
import * as composite from '../src/composite';
import * as pipeline from '../src/runContainerPipelineForDescriptor';
import { GeneratedComposite } from 'ern-composite-gen';
import sinon from 'sinon';
import path from 'path';
import { syncCauldronContainer } from '../src/syncCauldronContainer';
import { parseJsonFromStringOrFile } from '../src/parseJsonFromStringOrFile';
import { getDefaultExtraConfigurationOfPublisherFromCauldron } from '../src/getDefaultExtraConfigurationOfPublisherFromCauldron';

// Fixtures
const basicCauldronFixture = utilFixtures.defaultCauldron;
const emptyCauldronFixture = utilFixtures.emptyCauldron;
const npmPackageExists = require('./fixtures/npmPkgExistsResponse.json');
const npmPackageDoesNotExists = '';
const sandbox = sinon.createSandbox();
const topLevelContainerVersion = '1.2.3';

let cauldronHelperStub;
let yarnInfoStub;
let processExitStub;

describe('utils.js', () => {
  // Before each test
  beforeEach(() => {
    beforeTest();
    cauldronHelperStub = sandbox.createStubInstance(cauldron.CauldronHelper);
    cauldronHelperStub.getContainerVersion.resolves('1.0.0');
    cauldronHelperStub.getTopLevelContainerVersion.resolves(
      topLevelContainerVersion,
    );
    cauldronHelperStub.getDescriptor.resolves({});
    cauldronHelperStub.getVersionsNames.resolves([
      '1.2.3',
      '1.2.4',
      '2.0.0',
      '3.0',
    ]);
    cauldronHelperStub.getFile.resolves('{"key":"value"}');

    // yarn stub
    yarnInfoStub = sandbox.stub(yarn, 'info');

    // Other stubs
    const compositeStub = sandbox.createStubInstance(GeneratedComposite);
    compositeStub.getResolvedNativeDependencies.resolves({ resolved: [] });
    sandbox.stub(composite, 'runCauldronCompositeGen').resolves(compositeStub);
    sandbox.stub(container, 'runCauldronContainerGen');
    sandbox.stub(pipeline, 'runContainerPipelineForDescriptor').resolves(true);
    processExitStub = sandbox.stub(process, 'exit');

    sandbox.stub(cauldron, 'getActiveCauldron').resolves(cauldronHelperStub);
  });

  afterEach(() => {
    afterTest();
    sandbox.restore();
  });

  describe('syncCauldronContainer', () => {
    beforeEach(() => {
      cauldronHelperStub.getContainerMiniApps.resolves([]);
    });

    const napDescriptor = AppVersionDescriptor.fromString(
      'testapp:android:1.0.0',
    );

    it('should update container version with provided one', async () => {
      await syncCauldronContainer(
        () => Promise.resolve(true),
        napDescriptor,
        'commit message',
        { containerVersion: '1.0.0' },
      );
      sinon.assert.calledWith(
        cauldronHelperStub.updateContainerVersion,
        napDescriptor,
        '1.0.0',
      );
    });

    it('should bump existing container version if not provided one', async () => {
      await syncCauldronContainer(
        () => Promise.resolve(true),
        napDescriptor,
        '',
      );
      sinon.assert.calledWith(
        cauldronHelperStub.updateContainerVersion,
        napDescriptor,
        '1.2.4',
      );
    });

    it('should call beginTransaction and commitTransaction', async () => {
      await syncCauldronContainer(
        () => Promise.resolve(true),
        napDescriptor,
        '',
      );
      sinon.assert.calledOnce(cauldronHelperStub.beginTransaction);
      sinon.assert.calledOnce(cauldronHelperStub.commitTransaction);
    });

    it('should call state update function during the transaction', async () => {
      const stateUpdateFunc = sinon.stub().resolves(true);
      await syncCauldronContainer(
        stateUpdateFunc,
        napDescriptor,
        'commit message',
      );
      sinon.assert.callOrder(
        cauldronHelperStub.beginTransaction,
        stateUpdateFunc,
        cauldronHelperStub.commitTransaction,
      );
    });

    it('should discard transaction if an error happens during the transaction', async () => {
      const stateUpdateFunc = sinon.stub().rejects(new Error('boum'));
      try {
        await syncCauldronContainer(
          stateUpdateFunc,
          napDescriptor,
          'commit message',
        );
      } catch (e) {}
      sinon.assert.calledOnce(cauldronHelperStub.discardTransaction);
      sinon.assert.notCalled(cauldronHelperStub.commitTransaction);
    });

    it('should rethrow error that is thrown during a transaction', async () => {
      const stateUpdateFunc = sinon.stub().rejects(new Error('boum'));
      let hasRethrowError = false;
      try {
        await syncCauldronContainer(
          stateUpdateFunc,
          napDescriptor,
          'commit message',
        );
      } catch (e) {
        if (e.message === 'boum') {
          hasRethrowError = true;
        }
      }
      expect(hasRethrowError).to.be.true;
    });
  });

  describe('getDefaultExtraConfigurationOfPublisherFromCauldron', () => {
    it('should return the correct default configuration for a maven publisher [1]', () => {
      const conf = getDefaultExtraConfigurationOfPublisherFromCauldron({
        publisherFromCauldron: {
          name: 'maven',
          mavenPassword: 'password',
          mavenUser: 'user',
        },
        napDescriptor: AppVersionDescriptor.fromString('testapp:android:1.0.0'),
      });
      expect(conf).eql({
        artifactId: 'testapp-ern-container',
        groupId: 'com.walmartlabs.ern',
        mavenPassword: 'password',
        mavenUser: 'user',
      });
    });

    it('should return the correct default configuration for a maven publisher [2]', () => {
      const conf = getDefaultExtraConfigurationOfPublisherFromCauldron({
        publisherFromCauldron: {
          name: 'maven',
        },
        napDescriptor: AppVersionDescriptor.fromString('testapp:android:1.0.0'),
      });
      expect(conf).eql({
        artifactId: 'testapp-ern-container',
        groupId: 'com.walmartlabs.ern',
        mavenUser: undefined,
        mavenPassword: undefined,
      });
    });

    it('should return the correct default configuration for a maven publisher [3]', () => {
      const conf = getDefaultExtraConfigurationOfPublisherFromCauldron({
        publisherFromCauldron: {
          name: 'maven@^1.0.0',
          mavenPassword: 'password',
          mavenUser: 'user',
        },
        napDescriptor: AppVersionDescriptor.fromString('testapp:android:1.0.0'),
      });
      expect(conf).eql({
        artifactId: 'testapp-ern-container',
        groupId: 'com.walmartlabs.ern',
        mavenPassword: 'password',
        mavenUser: 'user',
      });
    });

    it('should return the correct default configuration for a jcenter publisher [1]', () => {
      const conf = getDefaultExtraConfigurationOfPublisherFromCauldron({
        publisherFromCauldron: {
          name: 'jcenter',
        },
        napDescriptor: AppVersionDescriptor.fromString('testapp:android:1.0.0'),
      });
      expect(conf).eql({
        artifactId: 'testapp-ern-container',
        groupId: 'com.walmartlabs.ern',
      });
    });

    it('should return the correct default configuration for a jcenter publisher [2]', () => {
      const conf = getDefaultExtraConfigurationOfPublisherFromCauldron({
        publisherFromCauldron: {
          name: 'jcenter',
        },
        napDescriptor: AppVersionDescriptor.fromString('testapp:android:1.0.0'),
      });
      expect(conf).eql({
        artifactId: 'testapp-ern-container',
        groupId: 'com.walmartlabs.ern',
      });
    });
  });

  describe('parseJsonFromStringOrFile', () => {
    it('should throw if the passed string is not valid json', async () => {
      assert(await doesThrow(parseJsonFromStringOrFile, null, 'invalidjson'));
    });

    it('should return parsed json if string is a patch to a cauldron file', async () => {
      expect(await parseJsonFromStringOrFile('cauldron://dummyfile')).eql({
        key: 'value',
      });
    });

    it('should return parsed json if value is a json file', async () => {
      expect(
        await parseJsonFromStringOrFile(
          path.resolve(__dirname, 'fixtures/dummy.json'),
        ),
      ).eql({
        key: 'value',
      });
    });

    it('should return parsed json if value is a json string', async () => {
      expect(await parseJsonFromStringOrFile('{"key": "value"}')).eql({
        key: 'value',
      });
    });
  });
});
