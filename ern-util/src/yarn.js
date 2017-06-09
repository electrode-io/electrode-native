// @flow

import {
  exec,
  execSync
} from 'child_process'
import tmp from 'tmp'
import shell from 'shelljs'

// Yarn add a given dependency
export async function yarnAdd (dependency: string | Object, {dev} : {dev:boolean} = {}) {
  // Special handling with yarn add when the dependency is a local file path
  // In that case, for some reason it copies the node_modules folder of this path, which
  // is not a wanted behavior, especially for react-native bundling as it will create
  // haste module naming collisions
  // As a temporaray work-around, we copy the whole package directory to a temporary one
  // and remove node_modules from there and use this new path instead when yarn adding
  // Issue has been opened here https://github.com/yarnpkg/yarn/issues/1334
  // (still open as of this comment writing)
  // [Note: We tried another lighter workaround being to just remove the node_modules
  // directory contained within this package after yarn add is executed. Howver subsequent
  // yarn add of a different dependency just reintroduce the error on previous package
  // this is really weird]
  if ((typeof (dependency) === 'string') && (dependency.startsWith('file:'))) {
    const tmpDirPath = tmp.dirSync({unsafeCleanup: true}).name
    shell.cp('-R', `${/file:(.+)/.exec(dependency)[1]}/*`, tmpDirPath)
    shell.rm('-rf', `${tmpDirPath}/node_modules`)
    dependency = `file:${tmpDirPath}`
  }

  return _yarnAdd(dependency, {dev})
}

async function _yarnAdd (dependency: string | Object, {dev} : {dev:boolean} = {}) {
  return new Promise((resolve, reject) => {
    let _package =
      typeof (dependency) === 'string'
      ? dependency
      : `${dependency.scope ? `@${dependency.scope}/` : ``}${dependency.name}${dependency.version ? `@${dependency.version}` : ``}`
    exec(`yarn add ${_package} --ignore-engines --exact ${dev ? '--dev' : ''}`,
      (err, stdout, stderr) => {
        if (err) {
          log.error(err)
          reject(err)
        } else {
          resolve(stdout)
        }
      })
  })
}

export async function yarnInstall () {
  return new Promise((resolve, reject) => {
    exec(`yarn install`,
            (err, stdout, stderr) => {
              if (err) {
                log.error(err)
                reject(err)
              } else {
                resolve(stdout)
              }
            })
  })
}

export async function yarnInfo (dependency: string, {
  field,
  json
} : {
  field?: string,
  json?: boolean
} = {}) {
  return new Promise((resolve, reject) => {
    let _package =
      typeof (dependency) === 'string'
      ? dependency
      : `${dependency.scope ? `@${dependency.scope}/` : ``}${dependency.name}${dependency.version ? `@${dependency.version}` : ``}`
    exec(`yarn info ${_package} ${field || ''} ${json ? '--json' : ''}`,
      (err, stdout, stderr) => {
        if (err) {
          log.error(err)
          reject(err)
        } else {
          if (json) {
            resolve(JSON.parse(stdout))
          } else {
            resolve(stdout)
          }
        }
      })
  })
}

export function isYarnInstalled () : boolean {
  try {
    execSync('yarn --version')
    return true
  } catch (e) {
    return false
  }
}

export default ({
  isYarnInstalled,
  yarnInstall,
  yarnAdd,
  yarnInfo
})
