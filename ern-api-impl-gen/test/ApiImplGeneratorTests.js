import { generateApiImpl } from '../src/index'
import shell from 'shelljs'
import fs from 'fs'
import { assert } from 'chai'

import {
  DependencyPath,
  Platform
} from 'ern-util'

global.log = require('console-log-level')({
  prefix: `ApiImplGen Test: `,
  level: 'trace'
})

const TEST_API_NAME = 'react-native-movie-api'
const TMP_OUT_FOLDER = `${shell.pwd()}/tmp`
const TMP_ANDROID_FOLDER = `${TMP_OUT_FOLDER}/${TEST_API_NAME}-impl/android`

const WORKING_FOLDER = `${Platform.rootDirectory}/api-impl-gen`
const PLUGIN_FOLDER = `${WORKING_FOLDER}/plugins`
const platformPath = `${Platform.currentPlatformVersionPath}`

describe('run ApiImpl generator command', () => {
  it('should create android impl project directories', (done) => {
    generateApiImpl({
      apiDependencyPath: DependencyPath.fromString(TEST_API_NAME),
      outputFolder: TMP_OUT_FOLDER,
      nativeOnly: true,
      forceGenerate: true,
      reactNativeVersion: '0.42.0',
      paths: {
        apiImplHull: `${platformPath}/ern-api-impl-gen/hull`,
        reactNativeAarsPath: `${Platform.manifestDirectory}/react-native_aars`,
        pluginsConfigPath: Platform.pluginsConfigurationDirectory,
        pluginsDownloadFolder: PLUGIN_FOLDER,
        workingFolder: WORKING_FOLDER,
        outFolder: ''
      }
    }).then(() => {
      assert.isTrue(fs.existsSync(TMP_OUT_FOLDER))
      assert.isTrue(fs.existsSync(TMP_ANDROID_FOLDER))
      shell.rm('-R', TMP_OUT_FOLDER)
      done()
    })
  }).timeout(20000)
})
