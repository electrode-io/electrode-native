import { getContainerPlatform } from '../src/getContainerPlatform'
import { expect } from 'chai'
import { createTmpDir } from 'ern-core'
import * as infer from '../src/inferContainerPlatform'
import fs from 'fs'
import path from 'path'
import sinon from 'sinon'

const sandbox = sinon.createSandbox()

describe('getContainerPlatform', () => {
  let inferContainerPlatformStub: any

  const containerFixturePath = path.join(
    __dirname,
    'fixtures',
    'ContainerWithMetadata'
  )

  beforeEach(() => {
    inferContainerPlatformStub = sandbox
      .stub(infer, 'inferContainerPlatform')
      .returns('ios')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should get the platform from the container platform metadata field if it exists (ern >= 0.19.0)', async () => {
    const result = getContainerPlatform(containerFixturePath)
    expect(result).eql('android')
  })

  it('should fall back to infering the container platform if the metadata file does not exist (ern < 0.17) [call infer]', async () => {
    const containerPath = createTmpDir()
    getContainerPlatform(containerPath)
    sandbox.assert.calledWith(inferContainerPlatformStub, containerPath)
  })

  it('should fall back to infering the container platform if the metadata file does not exist (ern < 0.17) [return inffered]', async () => {
    const containerPath = createTmpDir()
    const result = getContainerPlatform(containerPath)
    expect(result).eql('ios')
  })

  it('should fall back to infering the container platform if the platform field is missing from container metadata file (0.17 <= ern < 0.19) [call infer]', async () => {
    const containerPath = createTmpDir()
    const containerMetadata = JSON.parse(
      fs
        .readFileSync(
          path.join(containerFixturePath, 'container-metadata.json')
        )
        .toString()
    )
    delete containerMetadata.platform
    fs.writeFileSync(
      path.join(containerPath, 'container-metadata.json'),
      JSON.stringify(containerMetadata)
    )
    getContainerPlatform(containerPath)
    sandbox.assert.calledWith(inferContainerPlatformStub, containerPath)
  })

  it('should fall back to infering the container platform if the platform field is missing from container metadata file (0.17 <= ern < 0.19) [return inffered]', async () => {
    const containerPath = createTmpDir()
    const containerMetadata = JSON.parse(
      fs
        .readFileSync(
          path.join(containerFixturePath, 'container-metadata.json')
        )
        .toString()
    )
    delete containerMetadata.platform
    fs.writeFileSync(
      path.join(containerPath, 'container-metadata.json'),
      JSON.stringify(containerMetadata)
    )
    const result = getContainerPlatform(containerPath)
    expect(result).eql('ios')
  })
})
