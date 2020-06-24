const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const inquirer = require('inquirer');
const run = require('./utils/run');
const cauldronRepoBeforeRun = require('./utils/getCurrentCauldron')();

const runAll = process.argv.includes('--all');
const interactiveSelection =
  process.argv.includes('-i') || process.argv.includes('--interactive');

const pathToSystemTests = path.join(__dirname, 'tests');
const testsSourceFiles = fs.readdirSync(pathToSystemTests);

if (runAll) {
  console.log(
    '--all is deprecated and has no effect\n' +
      'Use -i/--interactive for interactive selection, or pass the names of ' +
      'individual tests to run.',
  );
}

try {
  if (interactiveSelection) {
    inquirer
      .prompt([
        {
          type: 'checkbox',
          name: 'userSelectedTests',
          message: 'Choose one or more tests to run',
          choices: testsSourceFiles,
        },
      ])
      .then((answers) => {
        runTests(answers.userSelectedTests);
      });
  } else if (process.argv.length > 2 && !runAll) {
    runTests(process.argv.slice(2));
  } else {
    runTests(testsSourceFiles);
  }
} finally {
  if (cauldronRepoBeforeRun) {
    run('cauldron repo use ${cauldronRepoBeforeRun}');
  }
}

function runTests(files) {
  for (const file of files) {
    runTest(file);
  }
}

function runTest(testSourceFile) {
  // No Cauldron should be active when starting a test suite
  run('cauldron repo clear');
  // Trace log level should be set to trace to ensure that `ora`
  // gets disabled as it can lead to issues on CI env
  run('platform config set logLevel trace');
  // Disable banner before running a test suite
  // to reduce log verbosity
  run('platform config set showBanner false');
  const workingDirPath = tmp.dirSync({ unsafeCleanup: true }).name;
  process.chdir(workingDirPath);
  console.log(`Running ${testSourceFile} tests`);
  require(path.join(pathToSystemTests, testSourceFile));
}
