import { resolveLocalErnRc } from './resolveLocalErnRc'
import { JsonFileErnConfig } from './JsonFileErnConfig'
import path from 'path'
import os from 'os'

export const ERN_ROOT_PATH =
  process.env.ERN_HOME || path.join(os.homedir(), '.ern')
export const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_ROOT_PATH, '.ernrc')
export const ERN_RC_LOCAL_FILE_PATH = resolveLocalErnRc()

export const ernRcFilePath = ERN_RC_LOCAL_FILE_PATH
  ? ERN_RC_LOCAL_FILE_PATH
  : ERN_RC_GLOBAL_FILE_PATH

export * from './resolveLocalErnRc'
export * from './ErnConfig'
export * from './InMemErnConfig'
export * from './JsonFileErnConfig'

export default new JsonFileErnConfig(ernRcFilePath)
