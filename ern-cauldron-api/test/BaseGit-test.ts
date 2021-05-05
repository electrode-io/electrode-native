import * as core from 'ern-core';
import { rejects } from 'assert';
import BaseGit from '../src/BaseGit';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import { assert, expect } from 'chai';
import git from 'simple-git/promise';

const sandbox = sinon.createSandbox();

describe('BaseGit', () => {
  let gitCliStub: any;
  let gitStub: any;
  let cauldronPath: string;

  beforeEach(() => {
    gitStub = sandbox.stub(git());
    gitCliStub = sandbox.stub(core, 'gitCli').returns(gitStub);
    cauldronPath = path.join(core.createTmpDir(), 'cauldron');
  });

  afterEach(() => {
    sandbox.restore();
  });

  function baseGitCtor({
    branch = 'master',
    repository = 'https://github.com/org/repo.git',
  }: {
    branch?: string;
    repository?: string;
  } = {}) {
    return new BaseGit({
      branch,
      cauldronPath,
      gitClient: gitCliStub,
      repository: repository === '' ? undefined : repository,
    });
  }

  describe('constructor', () => {
    it('should create the local repository directory if it does not exist', () => {
      baseGitCtor();
      assert(fs.existsSync(cauldronPath));
    });

    it('should use master branch by default', () => {
      const baseGit = baseGitCtor();
      expect(baseGit.branch).eql('master');
    });

    it('should use the provided branch if any', () => {
      const baseGit = baseGitCtor({ branch: 'development' });
      expect(baseGit.branch).eql('development');
    });

    it('should work if not provided with a remote repository [local cauldron]', () => {
      const baseGit = baseGitCtor({ repository: '' });
      expect(baseGit.repository).undefined;
    });

    it('should create a git client', () => {
      baseGitCtor();
      sandbox.assert.calledWith(gitCliStub, cauldronPath);
    });
  });

  describe('push', () => {
    it('should do a git push if the instance is a remote cauldron', async () => {
      const baseGit = baseGitCtor();
      await baseGit.push();
      sandbox.assert.calledWith(gitStub.push, 'upstream', 'master');
    });

    it('should not do a git push if the instance is a local cauldron', async () => {
      const baseGit = baseGitCtor({ repository: '' });
      await baseGit.push();
      sandbox.assert.notCalled(gitStub.push);
    });
  });

  describe('sync', () => {
    it('should create the local git repository if it does not exist [local cauldron]', async () => {
      const baseGit = baseGitCtor({ repository: '' });
      await baseGit.sync();
      sandbox.assert.called(gitStub.init);
    });

    it('should create the local git repository if it does not exist [remote cauldron]', async () => {
      const baseGit = baseGitCtor();
      await baseGit.sync();
      sandbox.assert.called(gitStub.init);
    });

    it('should set the remote url [remote cauldron]', async () => {
      const baseGit = baseGitCtor();
      await baseGit.sync();
      sandbox.assert.calledWith(gitStub.raw, [
        'remote',
        'set-url',
        'upstream',
        'https://github.com/org/repo.git',
      ]);
    });

    it('should do a git push if the remote repository is empty [remote cauldron initial sync]', async () => {
      const baseGit = baseGitCtor();
      await baseGit.sync();
      sandbox.assert.called(gitStub.push);
    });

    it('should not do any git operation if there is a pending transaction [remote cauldron]', async () => {
      const baseGit = baseGitCtor();
      await baseGit.beginTransaction();
      sandbox.reset();
      await baseGit.sync();
      sandbox.assert.notCalled(gitStub.raw);
      sandbox.assert.notCalled(gitStub.init);
      sandbox.assert.notCalled(gitStub.push);
    });

    it('should not do any git operation if a sync has already been done [remote cauldron. sync already performed]', async () => {
      const baseGit = baseGitCtor();
      await baseGit.sync();
      sandbox.reset();
      await baseGit.sync();
      sandbox.assert.notCalled(gitStub.raw);
      sandbox.assert.notCalled(gitStub.init);
      sandbox.assert.notCalled(gitStub.push);
    });
  });

  describe('beginTransaction', () => {
    it('should throw if a transaction is already pending', async () => {
      const baseGit = baseGitCtor();
      await baseGit.beginTransaction();
      assert(rejects(baseGit.beginTransaction()));
    });
  });

  describe('discardTransaction', () => {
    it('should throw if there is no pending transaction', async () => {
      const baseGit = baseGitCtor();
      assert(rejects(baseGit.discardTransaction()));
    });

    it('should do a git reset --hard', async () => {
      const baseGit = baseGitCtor();
      await baseGit.beginTransaction();
      await baseGit.discardTransaction();
      sandbox.assert.calledWith(gitStub.reset, ['--hard']);
    });
  });

  describe('commitTransaction', () => {
    it('should throw if there is no pending transaction', async () => {
      const baseGit = baseGitCtor();
      assert(rejects(baseGit.commitTransaction('commit-message')));
    });

    it('should do a git commit', async () => {
      const baseGit = baseGitCtor();
      await baseGit.beginTransaction();
      await baseGit.commitTransaction('commit-message');
      sandbox.assert.calledWith(gitStub.commit, 'commit-message');
    });
  });
});
