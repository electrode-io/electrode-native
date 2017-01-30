import _ from 'lodash';
import inquirer from 'inquirer';
import { nativeCompatCheck } from '../../../util/compatibility.js'
import explodeNativeAppSelector from '../../../util/explodeNapSelector.js';
import MiniApp from '../../../util/miniapp.js';
import { getNativeAppCompatibilityReport } from '../../../util/compatibility.js';

exports.command = 'miniapp [fullNapSelector]'
exports.desc = 'Publish mini app to given native app'

exports.builder = function(yargs) {
  return yargs
    .option('fullNapSelector', {
      alias: 's',
      describe: 'Full native application selector'
    })
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force publish'
    })
}

exports.handler = async function (argv) {
  // todo : move logic away from this command source !
  if (!argv.fullNapSelector) {
    const compatibilityReport = await getNativeAppCompatibilityReport();
    const compatibleVersionsChoices = _.map(compatibilityReport, entry => {
      if (entry.compatibility.compatible.length > 0) {
        const value = `${entry.appName}:${entry.appPlatform}:${entry.appVersion}`;
        const name = entry.isReleased ? `${value} [OTA]` : `${value} [IN-APP]`;
        return { name, value }
      }
    });

    inquirer.prompt({
      type: 'checkbox',
      name: 'fullNapSelectors',
      message: 'Select one or more compatible native application version(s)',
      choices: compatibleVersionsChoices
    }).then(answer => {
      for (const fullNapSelector of answer.fullNapSelectors) {
       MiniApp.fromCurrentPath().addToNativeAppInCauldron(
          ...explodeNativeAppSelector(fullNapSelector), argv.force)
      }
    })
  } else {
      return MiniApp.fromCurrentPath().addToNativeAppInCauldron(
        ...explodeNativeAppSelector(argv.fullNapSelector), argv.force);
  }
}
