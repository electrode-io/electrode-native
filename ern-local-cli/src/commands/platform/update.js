import {platform} from '@walmart/ern-util'
import child_process from 'child_process'
const execSync = child_process.execSync

exports.command = 'update'
exports.desc = 'Update currently activated platform version'

exports.builder = {}

exports.handler = function (argv) {
  const platformVersionPath = platform.currentPlatformVersionPath
  const platformVersion = platform.currentVersion

  if (platformVersion === '1000') {
    return console.log('Development version (v1000) cannot be updated through this command')
  }

  process.chdir(platformVersionPath)
  execSync(`git reset --hard`)
  execSync(`git pull origin v${platformVersion}`)
  execSync(`npm run rebuild`)

  console.log('Update complete')
};