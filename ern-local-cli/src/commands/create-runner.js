// @flow

import {
  generateAndroidRunnerProject,
  generateIosRunnerProject
} from 'ern-runner-gen'
import {
  Platform
} from 'ern-core'
import {
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor,
  spin
} from 'ern-util'
import path from 'path'
import {
  runLocalContainerGen,
  runCauldronContainerGen
} from '../lib/publication'
import utils from '../lib/utils'
import _ from 'lodash'
import shell from 'shelljs'

exports.command = 'create-runner <mainMiniAppName> <platforms..>'
exports.desc = 'Create a Runner application project'

exports.builder = function (yargs: any) {
  return yargs
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'A list of one or more miniapps'
    })
    .option('dependencies', {
      type: 'array',
      alias: 'deps',
      describe: 'A list of one or more extra native dependencies to include in this container'
    })
    .option('descriptor', {
      type: 'string',
      alias: 'd',
      describe: 'Full native application descriptor'
    })
    .epilog(utils.epilog(exports))
}

const commandCwd = process.cwd()

exports.handler = async function ({
  platforms,
  miniapps,
  dependencies = [],
  descriptor,
  mainMiniAppName
} : {
  platforms: Array<string>,
  miniapps?: Array<string>,
  dependencies: Array<string>,
  descriptor?: string,
  mainMiniAppName: string
}) {
  let napDescriptor: ?NativeApplicationDescriptor

  try {
    // ==============================================
    // VALIDATION
    // ==============================================
    await utils.logErrorAndExitIfNotSatisfied({
      noGitOrFilesystemPath: {
        obj: dependencies,
        extraErrorMessage: 'You cannot provide dependencies using git or file schme for this command. Only the form miniapp@version is allowed.'
      }
    })

    if (!miniapps && !descriptor) {
      return log.error(`You need to either provide a list of MiniApps or a Native Application Descriptor to this command`)
    }
    if ((dependencies.length > 0) && descriptor) {
      return log.error(`You can only provide extra native dependencies when generating a non Cauldron based container`)
    }

    if (descriptor) {
      await utils.logErrorAndExitIfNotSatisfied({
        isCompleteNapDescriptorString: { descriptor },
        napDescriptorExistInCauldron: {
          descriptor,
          extraErrorMessage: 'You cannot create a runner for a non existing native application version.'
        }
      })

      napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    }

    let dependenciesObjs = []
    let miniAppsPaths = []
    if (miniapps) {
      dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))
      miniAppsPaths = _.map(miniapps, m => DependencyPath.fromString(m))
    }

    // ==============================================
    // COMMAND LOGIC
    // ==============================================
    for (const platform of platforms) {
      switch (platform) {
        case 'android': {
          await generateContainer(platform, { napDescriptor, dependenciesObjs, miniAppsPaths })
          const pathToAndroidRunner = path.join(commandCwd, platform)
          shell.mkdir('-p', pathToAndroidRunner)
          await spin('Generating Android Runner project',
            generateAndroidRunnerProject(
              Platform.currentPlatformVersionPath,
              pathToAndroidRunner,
              mainMiniAppName,
              false))
          break
        }
        case 'ios': {
          await generateContainer(platform, { napDescriptor, dependenciesObjs, miniAppsPaths })
          const pathToIosRunner = path.join(commandCwd, platform)
          shell.mkdir('-p', pathToIosRunner)
          await spin('Generating iOS Runner project',
            generateIosRunnerProject(
              Platform.currentPlatformVersionPath,
              pathToIosRunner,
              path.join(Platform.rootDirectory, 'containergen'),
              mainMiniAppName,
              false))
          break
        }
        default: {
          log.warn(`Skipping unsupported platform type : ${platform}`)
        }
      }
      log.info(`Generation complete`)
    }
  } catch (e) {
    log.error(`${e.message}`)
  }
}

async function generateContainer (
  platform: 'android' | 'ios', {
    napDescriptor,
    dependenciesObjs = [],
    miniAppsPaths = []
  } : {
    napDescriptor?: NativeApplicationDescriptor,
    dependenciesObjs: Array<Dependency>,
    miniAppsPaths: Array<DependencyPath>
  } = {}) {
  if (napDescriptor) {
    await spin(`Generating runner Container based on ${napDescriptor.toString()}`,
    runCauldronContainerGen(
      napDescriptor,
      '1.0.0', {
        publish: false,
        containerName: 'runner'
      }))
  } else {
    await spin(`Gennerating runner Container with MiniApps`,
    runLocalContainerGen(
      miniAppsPaths,
      platform, {
        containerVersion: '1.0.0',
        nativeAppName: 'runner',
        extraNativeDependencies: dependenciesObjs
      }
    ))
  }
}
