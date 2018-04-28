import fs from 'fs'
import shell from './shell'

/**
 * ==============================================================================
 * Async wrappers around node fs
 * ==============================================================================
 */
export async function readFile(
  filename: string,
  encoding: string = 'utf8'
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filename, encoding, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
export async function readJSON(filename: string) {
  return readFile(filename).then(JSON.parse)
}
export async function writeJSON(filename: string, json: string) {
  return writeFile(filename, JSON.stringify(json, null, 2))
}
export async function writeFile(filename: string, data: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Recursively apply file mode for a given path
 * @param fileMode
 * @param path
 */
export function chmodr(fileMode: string, path: string) {
  shell.chmod('-R', fileMode, path)
}
