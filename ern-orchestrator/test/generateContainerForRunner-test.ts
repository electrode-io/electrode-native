import sinon from 'sinon'
import { PackagePath } from 'ern-core'
import { generateContainerForRunner } from '../src/generateContainerForRunner'
import * as container from '../src/container'
import * as composite from '../src/composite'
import { AppVersionDescriptor } from 'ern-core'

const sandbox = sinon.createSandbox()

describe('generateContainerForRunner', () => {
  let containerStub
  let compositeStub

  beforeEach(() => {
    containerStub = sandbox.stub(container)
    compositeStub = sandbox.stub(composite)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should call runCauldronContainerGen with proper arguments if a descriptor is provided', async () => {
    const descriptor = AppVersionDescriptor.fromString('test:android:1.0.0')
    const outDir = '/Users/foo/test'
    await generateContainerForRunner('android', {
      napDescriptor: descriptor,
      outDir,
    })
    sinon.assert.calledWith(
      containerStub.runCauldronContainerGen,
      descriptor,
      undefined,
      {
        jsMainModuleName: undefined,
        outDir,
      }
    )
  })

  it('should call runLocalContainerGen with proper arguments if no descriptor is provided', async () => {
    const outDir = '/Users/foo/test'
    const miniApps = [PackagePath.fromString('a@1.0.0')]
    const dependencies = [PackagePath.fromString('c@1.0.0')]
    await generateContainerForRunner('android', {
      miniApps,
      outDir,
    })
    sinon.assert.calledWith(
      containerStub.runLocalContainerGen,
      'android',
      undefined,
      {
        extra: {},
        jsMainModuleName: undefined,
        outDir,
      }
    )
  })

  it('should call runLocalContainerGen with extra arguments if no descriptor is provided', async () => {
    const outDir = '/Users/foo/test'
    const miniApps = [PackagePath.fromString('a@1.0.0')]
    const dependencies = [PackagePath.fromString('c@1.0.0')]
    const extra = { androidConfig: { compileSdkVersion: '28' } }
    await generateContainerForRunner('android', {
      extra,
      miniApps,
      outDir,
    })
    sinon.assert.calledWith(
      containerStub.runLocalContainerGen,
      'android',
      undefined,
      {
        extra,
        jsMainModuleName: undefined,
        outDir,
      }
    )
  })
})
