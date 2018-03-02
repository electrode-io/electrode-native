const chalk = require('chalk')
const shell = require('shelljs')
const info = chalk.bold.blue

//
// Clean up the system test environment
module.exports = function () {
  console.log('===========================================================================')
  console.log(info('Cleaning up test env'))
  console.log(info(`Removing GitHub repository (${gitHubCauldronRepositoryName})`))
  shell.exec(`curl -u ${gitUserName}:${gitPassword} -X DELETE https://api.github.com/repos/${gitUserName}/${gitHubCauldronRepositoryName}`)
  console.log(info('Deactivating current Cauldron'))
  shell.exec('ern cauldron repo clear')
  console.log(info('Removing Cauldron alias'))
  shell.exec(`ern cauldron repo remove ${cauldronName}`)
  console.log('===========================================================================')
  }