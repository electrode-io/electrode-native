import * as core from 'ern-core'
import path from 'path'
import sinon from 'sinon'
import { clearReactPackagerCache } from '../src/clearReactPackagerCache'

const sandbox = sinon.createSandbox()

describe('clearReactPackagerCache', () => {
  let processEnvTmpDirBackup
  let shellStub

  beforeEach(() => {
    processEnvTmpDirBackup = process.env.TMPDIR
    shellStub = sandbox.stub(core.shell)
  })

  afterEach(() => {
    process.env.TMPDIR = processEnvTmpDirBackup
    sandbox.restore()
  })

  it('should not do anything if process.env.TMPDIR is not defined', () => {
    delete process.env.TMPDIR
    clearReactPackagerCache()
    sandbox.assert.notCalled(shellStub.rm)
  })

  it('should delete process.env.TMPDIR directory if it is set', () => {
    process.env.TMPDIR = '/path/to/packager/cache'
    clearReactPackagerCache()
    sandbox.assert.calledWith(
      shellStub.rm,
      '-rf',
      path.join(process.env.TMPDIR!, 'react-*')
    )
  })
})
