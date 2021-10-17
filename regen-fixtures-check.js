const chalk = require('chalk');

var execSync = require('child_process').execSync;

var stdout = execSync(
  'git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD',
);

const yellow = (str) => console.log(chalk.yellow(str));
const green = (str) => console.log(chalk.green(str));

for (const platform of ['android', 'ios']) {
  const containerGenModule = `ern-container-gen-${platform}`;
  if (stdout && stdout.includes(containerGenModule)) {
    yellow('!===========================================================!');
    yellow(`Changes detected in ${containerGenModule}.`);
    yellow('If the changes are impacting Container generated content,');
    yellow(`dont forget to regenerate ${platform} Container fixture.`);
    yellow(`In doubt ? Just regenerate the fixture :)`);
    green(`$ yarn regen-fixtures`);
    yellow('!===========================================================!');
  }
}
