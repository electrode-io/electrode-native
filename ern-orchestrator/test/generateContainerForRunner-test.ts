import sinon from 'sinon'
import { NativeApplicationDescriptor, PackagePath } from 'ern-core'
import { generateContainerForRunner } from '../src/generateContainerForRunner'
import * as container from '../src/container'

const sandbox = sinon.createSandbox()

describe('generateContainerForRunner', () => {
  let containerStub

  beforeEach(() => {
    containerStub = sandbox.stub(container)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should call runCauldronContainerGen with proper arguments if a descriptor is provided', async () => {
    const descriptor = NativeApplicationDescriptor.fromString(
      'test:android:1.0.0'
    )
    const outDir = '/Users/foo/test'
    await generateContainerForRunner('android', {
      napDescriptor: descriptor,
      outDir,
    })
    sinon.assert.calledWith(containerStub.runCauldronContainerGen, descriptor, {
      outDir,
    })
  })

  it('should call runLocalContainerGen with proper arguments if no descriptor is provided', async () => {
    const outDir = '/Users/foo/test'
    const miniApps = [PackagePath.fromString('a@1.0.0')]
    const jsApiImpls = [PackagePath.fromString('b@1.0.0')]
    const dependencies = [PackagePath.fromString('c@1.0.0')]
    await generateContainerForRunner('android', {
      dependencies,
      jsApiImpls,
      miniApps,
      outDir,
    })
    sinon.assert.calledWith(
      containerStub.runLocalContainerGen,
      miniApps,
      jsApiImpls,
      'android',
      {
        extra: {},
        extraNativeDependencies: dependencies,
        outDir,
      }
    )
  })

  it('should call runLocalContainerGen with extra arguments if no descriptor is provided', async () => {
    const outDir = '/Users/foo/test'
    const miniApps = [PackagePath.fromString('a@1.0.0')]
    const jsApiImpls = [PackagePath.fromString('b@1.0.0')]
    const dependencies = [PackagePath.fromString('c@1.0.0')]
    const extra = { androidConfig: { compileSdkVersion: '28' } }
    await generateContainerForRunner('android', {
      dependencies,
      extra,
      jsApiImpls,
      miniApps,
      outDir,
    })
    sinon.assert.calledWith(
      containerStub.runLocalContainerGen,
      miniApps,
      jsApiImpls,
      'android',
      {
        extra,
        extraNativeDependencies: dependencies,
        outDir,
      }
    )
  })
})
