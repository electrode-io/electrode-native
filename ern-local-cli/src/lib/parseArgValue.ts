import { cauldronFileUriScheme } from 'ern-cauldron-api'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'
import fs from 'fs-extra'

/**
 * Parse a yargs arg value to return its real representation
 * Yargs as it is configured will only detect args as number or string
 * types.
 * This function will return the real typed value as follow :
 * - If value is of type 'number' return the value as such
 * - If value is the string 'true' or 'false' return the boolean representation
 * - If value is a string indicating a path to a file, return parseJsonFromStringOrFile result
 * - If value is a string indication a path to a file in cauldron, return parseJsonFromStringOrFile result
 * - Otherwise just try to parse the string as json and return the object, or if it fails just return the original value
 * @param v The value to parse
 */
export async function parseArgValue(v: number | string): Promise<any> {
  if (typeof v === 'number') {
    return v
  } else if (v.startsWith(cauldronFileUriScheme)) {
    return parseJsonFromStringOrFile(v)
  } else if (v === 'true') {
    return true
  } else if (v === 'false') {
    return false
  } else if (await fs.pathExists(v)) {
    return parseJsonFromStringOrFile(v)
  } else {
    try {
      return JSON.parse(v)
    } catch (e) {
      return v
    }
  }
}
