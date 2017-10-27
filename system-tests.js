const shell = require('shelljs')
const chalk = require('chalk')
const tmp = require('tmp')
const path = require('path')
const workingDirectoryPath = tmp.dirSync({ unsafeCleanup: true }).name
const info = chalk.bold.blue

const gitHubPesonalToken = `32207e94b79acaeb8bc7e82bcd0cd0c29ac0437f`
const gitUserName = `ernplatformtest`
const gitPassword = `ernplatformtest12345`
const gitHubCauldronRepositoryName = `cauldron-system-tests`
const cauldronName = `cauldron-automation`
const miniAppName = `MiniAppSystemTest`
const apiName = `TestApi`
const nativeApplicationName = `system-test-app`
const nativeApplicationVersion = '1.0.0'
const androidNativeApplicationDescriptor = `${nativeApplicationName}:android:${nativeApplicationVersion}`
const iosNativeApplicationDescriptor = `${nativeApplicationName}:ios:${nativeApplicationVersion}`
const movieListMiniAppVersion = '0.0.4'
const movieDetailsMiniAppVersion = '0.0.3'
const movieApi = 'react-native-ernmovie-api'

function run (command) {
  console.log('===========================================================================')
  console.log(`${chalk.bold.red(`Running`)} ${chalk.bold.blue(`${command}`)}`)
  if (shell.exec(command).code !== 0) {
    console.log(`${chalk.bold.red(`!!!TEST FAILED!!! `)} ${chalk.bold.blue(`${command}`)}`)
    shell.exit(1)
  }
  console.log('===========================================================================')
}

console.log(info(`Entering temporary working directory : ${workingDirectoryPath}`))
process.chdir(`${workingDirectoryPath}`)

console.log(info(`Creating GitHub repository (${gitHubCauldronRepositoryName})`))
run(`curl -u ernplatformtest:${gitHubPesonalToken} -d '{"name": "${gitHubCauldronRepositoryName}"}' https://api.github.com/user/repos`)

run(`ern --hide-banner`)
run(`ern --log-level debug`)

// Cauldron repo
run(`ern cauldron repo clear`)
run(`ern cauldron repo add ${cauldronName} https://${gitUserName}:${gitPassword}@github.com/${gitUserName}/${gitHubCauldronRepositoryName}.git --current=false`)
run(`ern cauldron repo use ${cauldronName}`)
run(`ern cauldron repo current`)
run(`ern cauldron repo list`)

// Miniapp commands
run(`ern create-miniapp ${miniAppName} --skipNpmCheck=true`)
const miniAppPath = path.join(process.cwd(), `${miniAppName}`)
console.log(info(`Entering ${miniAppPath}`))
process.chdir(miniAppPath)
run(`ern add react-native-electrode-bridge`)

// Cauldron access commands
run(`ern cauldron add nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps movielistminiapp@${movieListMiniAppVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps movielistminiapp@${movieListMiniAppVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps moviedetailsminiapp@${movieDetailsMiniAppVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps moviedetailsminiapp@${movieDetailsMiniAppVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)

// Already existing miniapp
run(`ern cauldron add miniapps moviedetailsminiapp@${movieDetailsMiniAppVersion} -d ${androidNativeApplicationDescriptor}`)
// Non published miniapp
run(`ern cauldron add miniapps ewkljrlwjerjlwjrl@0.0.3 -d ${androidNativeApplicationDescriptor}`)
// File system miniapp
run(`ern cauldron add miniapps file:${miniAppPath} -d ${androidNativeApplicationDescriptor}`)

// Container gen should be successful for the two following commands
run(`ern create-container --miniapps file:${miniAppPath} -p android -v 1.0.0`)
run(`ern create-container --miniapps file:${miniAppPath} -p ios -v 1.0.0`)

run(`ern create-container --miniapps file:${miniAppPath} movielistminiapp@${movieListMiniAppVersion} -p android -v 1.0.0`)
run(`ern create-container --miniapps file:${miniAppPath} movielistminiapp@${movieListMiniAppVersion} -p ios -v 1.0.0`)

run(`ern create-container --descriptor ${androidNativeApplicationDescriptor}`)
run(`ern create-container --descriptor ${iosNativeApplicationDescriptor}`)

run(`ern why ern react-native-ernmovie-api ${androidNativeApplicationDescriptor}`)

// Del dependency should fail because its still used by MovieListMiniApp
run(`ern cauldron del dependencies react-native-ernmovie-api -d ${androidNativeApplicationDescriptor}`)

// Del miniapp
run(`ern cauldron del miniapps moviedetailsminiapp-d ${androidNativeApplicationDescriptor}`)

// Del dependency should succeed
run(`ern cauldron del dependencies react-native-ernmovie-api -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)

process.chdir(workingDirectoryPath)

// api
run(`ern create-api ${apiName}`)
const apiPath = path.join(process.cwd(), `react-native-${apiName}-api`)
console.log(info(`Entering ${apiPath}`))
process.chdir(apiPath)
run(`ern regen-api --updatePlugin=true`)

// api-impl
run(`ern create-api-impl ${movieApi} --skipNpmCheck=true --nativeOnly=true --force=true`)
const apiImplPath = path.join(process.cwd(), `${movieApi}-impl`)
console.log(info(`Entering ${apiImplPath}`))
process.chdir(apiImplPath)
run(`ern regen-api-impl`)

// Platform commands
run(`ern platform current`)
run(`ern platform list`)
run(`ern platform plugins list`)
run(`ern platform plugins search react-native`)

console.log(info(`Removing GitHub repository (${gitHubCauldronRepositoryName})`))
run(`curl -u ernplatformtest:${gitHubPesonalToken} -X DELETE https://api.github.com/repos/${gitUserName}/${gitHubCauldronRepositoryName}`)

run(`ern cauldron repo clear`)
run(`ern cauldron repo remove ${cauldronName}`)
