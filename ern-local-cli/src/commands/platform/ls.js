import chalk from 'chalk';
import platform from '../../util/platform.js';
import tagOneLine from '../../util/tagOneLine.js'

exports.command = 'ls'
exports.desc = 'List platform versions'

exports.builder = {}

exports.handler = function (argv) {
  console.log(tagOneLine`
    ${chalk.green('[CURRENT]')}
    ${chalk.yellow('[INSTALLED]')}
    ${chalk.gray('[NOT INSTALLED]')}`);
  for (const version of platform.versions) {
    if (platform.isPlatformVersionInstalled(version)) {
      if (platform.currentVersion === version) {
        console.log(chalk.green(`-> v${version}`));
      } else {
        console.log(chalk.yellow(`v${version}`))
      }
    } else {
      console.log(chalk.gray(`v${version}`));
    }
  }
}
