import fs from "fs-extra";

export async function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (error, res) => {
      if (error) {
        reject(error)
        return
      }
      resolve(res)
    })
  })
}

export async function writeFile(path, output) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, output, (error, res) => {
      if (error) {
        reject(error)
        return
      }
      resolve(res)
    })
  })
}

export async function forceDeleteDir(path) {
  if(fs.existsSync(path)) {
    fs.removeSync(path, function(err, stats){
        if(err) {
          console.error('Unable to delete, ' +  path + ': ' + err);
        }
    });
  }
}

export async function createDirIfDoesNotExist(path) {
  if(!fs.existsSync(path)) {
    fs.mkdir(path, function(err, stats) {
      if(err) {
        console.error('Unable to create, ' +  path + ': ' + err);
      }
    });
  }
}
