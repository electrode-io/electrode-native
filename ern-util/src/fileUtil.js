// @flow

import fs from 'fs'

/**
 * ==============================================================================
 * Async wrappers around node fs
 * ==============================================================================
 */
export async function readFile (
  filename: string,
  encoding: string = 'utf8') {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, encoding, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}
export async function readJSON (filename: string) {
  return readFile(filename).then(JSON.parse)
}
export async function writeJSON (
  filename: string,
  json: string) {
  return writeFile(filename, JSON.stringify(json, null, 2))
}
export async function writeFile (
  filename: string,
  data: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}
