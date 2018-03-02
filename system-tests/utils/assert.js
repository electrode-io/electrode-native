const chalk = require('chalk')
const shell = require('shelljs')
const afterAll = require('./afterAll')

//
// Assert given expression evaluates to true. If not exit
module.exports = function (expression, message) {
  if (!expression) {
    console.log(`${chalk.bold.red(`Assertion failed: ${message}`)}`)
    afterAll()
    shell.exit(1)
  }
}