// @flow

import fs from 'fs'

export function writeJSON (
  filename: string,
  json: Object = {}) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(json, null, 2), (e, o) => e ? reject(e) : resolve(o))
  })
}

export function writeFile (
  filename: string,
  data: any,
  options: any) {
  if (!data) {
    data = options
    options = {}
  }
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (e, o) => {
      e ? reject(e) : resolve(o)
    })
  })
}

export function readJSON (f: string) {
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
