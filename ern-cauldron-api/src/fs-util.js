import _mkdirp from 'mkdirp'
import fs from 'fs'

export function writeJSON (filename, json = {}) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(json, null, 2), (e, o) => e ? reject(e) : resolve(o))
  })
}
export function mkdirp (path) {
  return new Promise((resolve, reject) => {
    _mkdirp(path, function (e, o) {
      e ? reject(e) : resolve(o)
    })
  })
}
export function writeFile (filename, options, data) {
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

export function ensureDir (f) {
  return new Promise((resolve, reject) => {
    _mkdirp(f, function (e, o) {
      if (e) return reject(e)
      resolve(true)
    })
  })
}
export function readJSON (f) {
  return new Promise((resolve, reject) => {
    fs.readFile(f, function (e, o) {
      if (e) return reject(e)
      try {
        resolve(JSON.parse(o))
      } catch (er) {
        reject(er)
      }
    })
  })
}
