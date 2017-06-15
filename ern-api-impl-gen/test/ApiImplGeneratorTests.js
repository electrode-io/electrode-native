import { generateApiImpl } from '../src/index'
import shell from 'shelljs'
import fs from 'fs'
import { assert } from 'chai'

global.log = require('console-log-level')({
  prefix: `ApiImplGen Test: `,
  level: 'trace'
})

const TEST_API_NAME = 'react-native-movie-api'
const TMP_OUT_FOLDER = `${shell.pwd()}/tmp`
const TMP_ANDROID_FOLDER = `${TMP_OUT_FOLDER}/${TEST_API_NAME}-impl/android`

describe('run ApiImpl generator command', () => {
  it('should create android impl project directories', (done) => {
    generateApiImpl({
      api: TEST_API_NAME,
      outputFolder: TMP_OUT_FOLDER,
      nativeOnly: true,
      forceGenerate: true
    }).then(() => {
      assert.isTrue(fs.existsSync(TMP_OUT_FOLDER))
      assert.isTrue(fs.existsSync(TMP_ANDROID_FOLDER))
      shell.rm('-R', TMP_OUT_FOLDER)
      done()
    })
  }).timeout(20000)
})
