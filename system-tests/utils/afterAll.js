const chalk = require('chalk')
const shell = require('shelljs')
const f = require('../fixtures/constants')
const info = chalk.bold.blue

//
// Clean up the system test environment
module.exports = function () {
  console.log('===========================================================================')
  console.log(info('Cleaning up test env'))
  console.log(info(`Removing GitHub repository (${f.cauldronName})`))
  shell.exec(`curl -u ${f.gitUserName}:${f.gitPassword} -X DELETE https://api.github.com/repos/${f.gitUserName}/${f.gitHubCauldronRepositoryName}`)
  console.log(info('Deactivating current Cauldron'))
  shell.exec('ern cauldron repo clear')
  console.log(info('Removing Cauldron alias'))
  shell.exec(`ern cauldron repo remove ${f.cauldronName}`)
  console.log('===========================================================================')
}