import fs from 'fs'
import path from 'path'
import shell from './shell'

/**
 * Asynchronously reads a file and return its content
 * @param filePath Path to the file
 * @param encoding The encoding of the file (default : 'utf8')
 */
export async function readFile(
  filePath: string,
  encoding: string = 'utf8'
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filePath, encoding, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

/**
 * Asynchronously writes a file with a given content
 * @param filePath Path to the file
 * @param content Content of the file
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filePath, content, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Asynchronously reads a JSON file and returns it as a JavaScript Object
 * @param filePath Path to the JSON file
 */
export async function readJSON(filePath: string): Promise<any> {
  return readFile(filePath).then(JSON.parse)
}

/**
 * Synchronously reads a JSON file and returns it as a JavaScript Object
 * @param filePath Path to the JSON file
 */
export function readJSONSync(filePath: string): any {
  const fileContent: string = fs.readFileSync(filePath).toString()
  return JSON.parse(fileContent)
}

/**
 * Asynchronously writes a given JavaScript Object to a JSON file
 * and returns the path to the JSON file
 * @param filePath Path to the JSON file
 * @param obj The object to store as JSON
 */
export async function writeJSON(filePath: string, obj: any): Promise<string> {
  await writeFile(filePath, JSON.stringify(obj, null, 2))
  return filePath
}

/**
 * Synchronously writes a given JavaScript Object to a JSON file
 * and returns the path to the JSON file
 * @param filePath Path to the JSON file
 * @param obj The object to store as JSON
 */
export function writeJSONSync(filePath: string, obj: any): string {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2))
  return filePath
}

/**
 * Recursively apply file mode for a given path
 * @param fileMode
 * @param path
 */
export function chmodr(fileMode: string, filePath: string) {
  shell.chmod('-R', fileMode, filePath)
}
