import * as fileUtils from './fileUtil'
import fs from 'fs-extra'
import path from 'path'

const PACKAGE_JSON_FILENAME = 'package.json'

/**
 * Asynchronously reads a package.json file from a given directory
 * and returns the parsed object
 * @param p Path to the directory containing the package.json file
 */
export const readPackageJson = async (p: string): Promise<any> =>
  fs.readJson(getPathToPackageJson(p))

/**
 * Synchronously reads a package.json file from a given directory
 * and returns the parsed object
 * @param p Path to the directory containing the package.json file
 */
export const readPackageJsonSync = (p: string): any =>
  fs.readJsonSync(getPathToPackageJson(p))

/**
 * Asynchronously writes a package.json file to a given directory and
 * returns the full path to the file
 * @param p Path to the directory where to store the package.json file
 * @param content Content of package.json as an object
 */
export const writePackageJson = (p: string, content: any): Promise<void> =>
  fs.writeJson(getPathToPackageJson(p), content, { spaces: 2 })

/**
 * Synchronously writes a package.json file to a given directory and
 * returns the full path to the file
 * @param p Path to the directory where to store the package.json file
 * @param content Content of package.json as an object
 */
export const writePackageJsonSync = (p: string, content: any): void =>
  fs.writeJsonSync(getPathToPackageJson(p), content, { spaces: 2 })

/**
 * Given a directory holding a package.json file, return the full path
 * to the package.json file
 * @param p Path to the directory containing the package.json
 */
export function getPathToPackageJson(p: string) {
  if (!fs.statSync(p).isDirectory) {
    throw new Error(`${p} is not a directory`)
  }
  return path.join(p, PACKAGE_JSON_FILENAME)
}
