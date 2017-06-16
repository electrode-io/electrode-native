import { generateApiImpl } from '../src/index'
import shell from 'shelljs'
import fs from 'fs'
import { assert } from 'chai'

import {
  Platform
} from '@walmart/ern-util'

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

// Contains all interesting folders paths
const paths = {}

paths.platformPath = platformPath

// Where the container project hull is stored
paths.apiImplHull = `${platformPath}/ern-api-impl-gen/hull`

paths.reactNativeAarsPath = `${Platform.manifestDirectory}/react-native_aars`

// Where the container generation configuration of all plugins is stored
paths.pluginsConfigPath = Platform.pluginsConfigurationDirectory

// Where we download plugins
paths.pluginsDownloadFolder = PLUGIN_FOLDER

// Placeholder for all the downloads needed for generating an impl project.
paths.workingFolder = WORKING_FOLDER

paths.reactNativeVersion = '0.42.0'

describe('run ApiImpl generator command', () => {
  it('should create android impl project directories', (done) => {
    generateApiImpl({
      api: TEST_API_NAME,
      outputFolder: TMP_OUT_FOLDER,
      nativeOnly: true,
      forceGenerate: true,
      paths: paths
    }).then(() => {
      assert.isTrue(fs.existsSync(TMP_OUT_FOLDER))
      assert.isTrue(fs.existsSync(TMP_ANDROID_FOLDER))
      shell.rm('-R', TMP_OUT_FOLDER)
      done()
    })
  }).timeout(20000)
})
