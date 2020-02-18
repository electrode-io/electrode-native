import { execp } from './childProcess'
import log from './log'
import shell from './shell'

export async function gitApply({
  patchFile,
  rootDir,
}: {
  patchFile: string
  rootDir: string
}) {
  log.trace(`Applying ${patchFile} in ${rootDir}`)
  try {
    shell.pushd(rootDir)
    await execp(`git apply ${patchFile}`)
  } finally {
    shell.popd()
  }
}
