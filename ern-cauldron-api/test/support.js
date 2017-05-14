import fs from 'fs';
import chai, {expect} from 'chai';
import path from 'path';
import rmdir from 'rmdir';
import _rimraf from 'rimraf';


const testDir = path.join.bind(path, process.cwd(), 'test', '.cauldron-test');
let _server;

export function rimraf(path) {
  return new Promise((resolve, reject) => {
    _rimraf(path, function (e, o) {
      if (e) return reject(e);
      resolve();
    })
  });
}
export function mkdtemp() {
  return new Promise((resolve, reject) => {
    fs.mkdtemp('/tmp/cauldron-test-', (err, folder) => {
      if (err) return reject(err);
      resolve(folder);
    });
  });
  
}
export function makeAndDeleteDir(cb) {
  return function () {
    return async function () {
      const path = await mkdtemp();
      try {
        await cb(path);
      } catch (e) {
        throw e;
      } finally {
        await rimraf(path);
      }
    }
  }
}
