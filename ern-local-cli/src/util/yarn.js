import {
  exec,
  execSync
} from 'child_process'

// Yarn add a given dependency
export async function yarnAdd (dependency, { dev } = {}) {
  return new Promise((resolve, reject) => {
    let yarnCmd = `yarn add ${dependency.scope ? `@${dependency.scope}/` : ``}`
    yarnCmd += `${dependency.name}@${dependency.version} --exact`
    yarnCmd += dev ? '--dev' : ''
    exec(yarnCmd,
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

export function isYarnInstalled () {
  try {
    execSync('yarn --version')
    return true
  } catch (e) {
    return false
  }
}
