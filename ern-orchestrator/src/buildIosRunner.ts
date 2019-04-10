import { log } from 'ern-core'
import { spawn } from 'child_process'

export async function buildIosRunner(pathToIosRunner: string, udid: string) {
  return new Promise((resolve, reject) => {
    const xcodebuildProc = spawn(
      'xcodebuild',
      [
        `-scheme`,
        'ErnRunner',
        'build',
        `-destination`,
        `id=${udid}`,
        `SYMROOT=${pathToIosRunner}/build`,
      ],
      { cwd: pathToIosRunner }
    )

    xcodebuildProc.stdout.on('data', data => {
      log.debug(data.toString())
    })
    xcodebuildProc.stderr.on('data', data => {
      log.debug(data.toString())
    })
    xcodebuildProc.on('close', code => {
      code === 0
        ? resolve()
        : reject(
            new Error(`iOS Runner build failed [xcbuild exit code ${code}].
To troubleshoot this build failure, we recommend building the Runner iOS project from XCode.
You can open the Runner project in XCode manually or by running 'open ios/ErnRunner.xcodeproj'.
Building the Runner from XCode will provide more meaningful error reporting that can be of help 
to pinpoint the cause of the build failure.`)
          )
    })
  })
}
