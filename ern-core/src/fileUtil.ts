import fs from 'fs'
import shell from './shell'

/**
 * Recursively apply file mode for a given path
 * @param fileMode
 * @param path
 */
export function chmodr(fileMode: string, filePath: string) {
  shell.chmod('-R', fileMode, filePath)
}

/**
 * Check if a given file is executable
 * @param filePath Path to the file to check
 */
export async function isExecutable(filePath: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    fs.access(filePath, fs.constants.X_OK, err => {
      err ? resolve(false) : resolve(true)
    })
  })
}
