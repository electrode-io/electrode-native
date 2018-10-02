import { cauldronFileUriScheme, getActiveCauldron } from 'ern-cauldron-api'
import { fileUtils } from 'ern-core'
import fs from 'fs'

/**
 *
 * Parse json from a string or a file and return the
 * resulting JavaScript object
 * @param s A json string or a local file path to a json file.
 * Can also be a reference to a file stored in cauldron, using
 * the cauldron:// file scheme.
 */
export async function parseJsonFromStringOrFile(s: string): Promise<any> {
  let result
  try {
    if (s.startsWith(cauldronFileUriScheme)) {
      const cauldron = await getActiveCauldron()
      const file = await cauldron.getFile({
        cauldronFilePath: s,
      })
      result = JSON.parse(file.toString())
    } else if (fs.existsSync(s)) {
      result = await fileUtils.readJSON(s)
    } else {
      result = JSON.parse(s)
    }
  } catch (e) {
    throw new Error('[parseJsonFromStringOrFile] Invalid JSON or file')
  }
  return result
}
