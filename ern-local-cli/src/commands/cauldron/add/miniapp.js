import inquirer from 'inquirer';
import { getNativeAppCompatibilityReport} from '../../../lib/compatibility';
import miniapp from '../../../lib/miniapp';

exports.command = 'miniapp [fullNapSelector]';
exports.desc = 'Publish mini app to given native app';

exports.builder = function (yargs) {
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
        const compatibleVersionsChoices = Object.keys(compatibilityReport).forEach(key => {
            const entry = compatibilityReport[key];
            if (entry.compatibility.incompatible.length === 0) {
                const value = `${entry.appName}:${entry.appPlatform}:${entry.appVersion}`;
                const name = entry.isReleased ? `${value} [OTA]` : `${value} [IN-APP]`;
                return {name, value}
            }
        }).filter(e => e !== undefined);

        if (compatibleVersionsChoices.length === 0) {
            return console.log("No compatible native application versions were found :(");
        }

        inquirer.prompt({
            type: 'checkbox',
            name: 'fullNapSelectors',
            message: 'Select one or more compatible native application version(s)',
            choices: compatibleVersionsChoices
        }).then(answer => {
            for (const fullNapSelector of answer.fullNapSelectors) {
                miniapp.fromCurrentPath().addToNativeAppInCauldron(
                    ...explodeNativeAppSelector(fullNapSelector), argv.force)
            }
        })
    } else {
        return miniapp.fromCurrentPath().addToNativeAppInCauldron(
            ...explodeNativeAppSelector(argv.fullNapSelector), argv.force);
    }
}
