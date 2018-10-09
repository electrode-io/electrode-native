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
            new Error(`XCode xcbuild command failed with exit code ${code}`)
          )
    })
  })
}
