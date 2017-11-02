// @flow

import fs from 'fs'

export function writeJSON (
  filename: string,
  json: Object = {}) : Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(json, null, 2), e => e ? reject(e) : resolve())
  })
}

export function writeFile (
  filename: string,
  data: any,
  options: any) : Promise<void> {
  if (!data) {
    data = options
    options = {}
  }
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, e => e ? reject(e) : resolve())
  })
}

export function readJSON (f: string) : Promise<Object> {
  return new Promise((resolve, reject) => {
    fs.readFile(f, function (e, o) {
      if (e) return reject(e)
      try {
        resolve(JSON.parse(o.toString()))
      } catch (er) {
        reject(er)
      }
    })
  })
}
