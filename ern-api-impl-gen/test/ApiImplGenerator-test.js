// Following test breaks because react-native-electrode-bridge is not downloaded before hand
// cp: no such file or directory: node_modules/react-native-electrode-bridge/ios/ElectrodeReactNativeBridge/*
// Error while generating api impl hull for ios: {"errno":-2,"code":"ENOENT","syscall":"open","path":"/Users/blemair/Code/ern-platform/ern-api-impl-gen/tmp/react-native-movie-api-impl/ios/ElectrodeApiImpl/ElectrodeReactNativeBridge/ElectrodeBridgeMessage.m"}

/* import { generateApiImpl } from '../src/index'
import {
  shell 
}from 'ern-util'
import fs from 'fs'
import { assert } from 'chai'

import {
  DependencyPath
} from 'ern-util'
import {
  Platform
} from 'ern-core'

global.log = require('console-log-level')({
  prefix: `ApiImplGen Test: `,
  level: 'trace'
})

const TEST_API_NAME = 'react-native-movie-api'
const TMP_OUT_DIRECTORY = `${shell.pwd()}/tmp`
const TMP_ANDROID_DIRECTORY = `${TMP_OUT_DIRECTORY}/${TEST_API_NAME}-impl/android`

const WORKING_DIRECTORY = `${Platform.rootDirectory}/api-impl-gen`
const PLUGIN_DIRECTORY = `${WORKING_DIRECTORY}/plugins`
const platformPath = `${Platform.currentPlatformVersionPath}`

describe('run ApiImpl generator command', () => {
  it('should create android impl project directories', (done) => {
    generateApiImpl({
      apiDependencyPath: DependencyPath.fromString(TEST_API_NAME),
      outputDirectory: TMP_OUT_DIRECTORY,
      nativeOnly: true,
      forceGenerate: true,
      reactNativeVersion: '0.42.0',
      paths: {
        apiImplHull: `${platformPath}/ern-api-impl-gen/hull`,
        pluginsDownloadDirectory: PLUGIN_DIRECTORY,
        workingDirectory: WORKING_DIRECTORY,
        outDirectory: ''
      }
    }).then(() => {
      assert.isTrue(fs.existsSync(TMP_OUT_DIRECTORY))
      assert.isTrue(fs.existsSync(TMP_ANDROID_DIRECTORY))
      shell.rm('-R', TMP_OUT_DIRECTORY)
      done()
    })
  }).timeout(20000)
})
*/
