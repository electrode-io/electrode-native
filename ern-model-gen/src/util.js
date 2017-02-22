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
    return new Promise((resove, reject) => {
        if (fs.existsSync(path)) {
            fs.removeSync(path, (err, stats) => {
                if (err) {
                    console.error('Unable to delete, ' + path + ': ' + err);
                    reject(err)
                    return
                }
            });
        }
        resove()
    })

}

export async function createDirIfDoesNotExist(path) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(path)) {
            fs.ensureDir(path, (err, res) => {
                if (err) {
                    console.error('Unable to create, ' + path + ': ' + err);
                    reject(err)
                    return
                }
                resolve(res)
            });
        }
    })

}
