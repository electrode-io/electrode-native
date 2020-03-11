import { JsonFileErnConfig } from './JsonFileErnConfig'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

const ERN_ROOT_PATH = process.env.ERN_HOME || path.join(os.homedir(), '.ern')
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_ROOT_PATH, '.ernrc')
export const ERN_RC_LOCAL_FILE_PATH = resolveLocalErnRc()

const ernRcFilePath = ERN_RC_LOCAL_FILE_PATH
  ? ERN_RC_LOCAL_FILE_PATH
  : ERN_RC_GLOBAL_FILE_PATH

export function resolveLocalErnRc(dir?: string) {
  let directory = dir || process.cwd()
  let prevDirectory
  while (directory !== prevDirectory) {
    prevDirectory = directory
    const pathToErnRc = path.join(directory, '.ernrc')
    if (fs.existsSync(pathToErnRc)) {
      return pathToErnRc
    }
    directory = path.dirname(directory)
  }
}

export * from './ErnConfig'
export * from './InMemErnConfig'
export * from './JsonFileErnConfig'

export default new JsonFileErnConfig(ernRcFilePath)
