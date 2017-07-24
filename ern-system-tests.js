const shell = require('shelljs')
const chalk = require('chalk')
const tmp = require('tmp')
const path = require('path')
const workingDirectoryPath = tmp.dirSync({ unsafeCleanup: true }).name
const info = chalk.bold.blue

const gitHubPesonalToken = `32207e94b79acaeb8bc7e82bcd0cd0c29ac0437f`
const gitUserName = `ernplatformtest`
const gitPassword = `ernplatformtest12345`
const gitHubCauldronRepositoryName = `cauldron-${getRandomInt(0, 100000)}`
const cauldronName = `cauldron-automation`
const miniAppName = `miniapp${getRandomInt(0, 100000)}`
const nativeApplicationName = `walmart-test-${getRandomInt(0, 100000)}`
const nativeApplicationVersion = '1.0.0'
const androidNativeApplicationDescriptor = `${nativeApplicationName}:android:${nativeApplicationVersion}`
const iosNativeApplicationDescriptor = `${nativeApplicationName}:ios:${nativeApplicationVersion}`

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

function run (command) {
  console.log('===========================================================================')
  console.log(`${chalk.bold.red(`Running`)} ${chalk.bold.blue(`${command}`)}`)
  shell.exec(command)
  console.log('===========================================================================')
}

console.log(info(`Entering temporary working directory : ${workingDirectoryPath}`))
process.chdir(`${workingDirectoryPath}`)

console.log(info(`Creating GitHub repository (${gitHubCauldronRepositoryName})`))
run(`curl -u ernplatformtest:${gitHubPesonalToken} -d '{"name": "${gitHubCauldronRepositoryName}"}' https://api.github.com/user/repos`)

//
// Cauldron repository
run(`ern cauldron repository remove ${cauldronName}`)
run(`ern cauldron repository add ${cauldronName} https://${gitUserName}:${gitPassword}@github.com/${gitUserName}/${gitHubCauldronRepositoryName}.git --current=false`)
run(`ern cauldron repository use ${cauldronName}`)
run(`ern cauldron repository current`)
run(`ern cauldron repository list`)

//
// Miniapp commands
run(`ern create-miniapp ${miniAppName}`)
const miniAppPath = path.join(process.cwd(), miniAppName)
console.log(info(`Entering ${miniAppPath}`))
process.chdir(`${miniAppPath}`)
run(`ern add @walmart/react-native-electrode-bridge`)
run(`ern add react-native-code-push`)

//
// Cauldron access commands
run(`ern cauldron add nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapp -d ${androidNativeApplicationDescriptor} --ignoreNpmPublish`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapp -d ${iosNativeApplicationDescriptor} --ignoreNpmPublish`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add dependency ${androidNativeApplicationDescriptor} react-native-stack-tracer@0.1.1`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron del dependency ${androidNativeApplicationDescriptor} react-native-stack-tracer`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)

//
// Container generation commands
// Two following commands will fail cause MiniApp is not published to NPM, but it'll test
// nap selector based command usage.
run(`ern create-container -n ${androidNativeApplicationDescriptor} -v 1.0.0`)
run(`ern create-container -n ${iosNativeApplicationDescriptor} -v 1.0.0`)

// Container gen should be successful for the two following commands
run(`ern create-container -m file:${miniAppPath} -p android -v 1.0.0`)
run(`ern create-container -m file:${miniAppPath} -p ios -v 1.0.0`)

//
// Platform commands
run(`ern platform current`)
run(`ern platform ls`)
run(`ern platform plugins list`)
run(`ern platform plugins search react-native`)

console.log(info(`Removing GitHub repository (${gitHubCauldronRepositoryName})`))
run(`curl -u ernplatformtest:${gitHubPesonalToken} -X DELETE https://api.github.com/repos/${gitUserName}/${gitHubCauldronRepositoryName}`)
