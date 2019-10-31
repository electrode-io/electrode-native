import { createTmpDir } from 'ern-core'
import { getContainerMetadata } from '../src/getContainerMetadata'
import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

describe('getContainerMetadata', () => {
  it('should return undefined if path does not contain a container metadata file', async () => {
    const dir = createTmpDir()
    const result = await getContainerMetadata(dir)
    expect(result).undefined
  })

  it('should return the container metadata object if path contains a container metadata file', async () => {
    const containerFixturePath = path.join(
      __dirname,
      'fixtures/ContainerWithMetadata'
    )
    const result = await getContainerMetadata(containerFixturePath)
    const expectedResult = JSON.parse(
      fs
        .readFileSync(
          path.join(containerFixturePath, 'container-metadata.json')
        )
        .toString()
    )
    expect(result).deep.equal(expectedResult)
  })
})
