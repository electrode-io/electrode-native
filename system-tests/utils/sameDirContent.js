const fs = require('fs')
const dircompare = require('dir-compare')
const jsdiff = require('diff')
const path = require('path')
require('colors')

//
// Given two directories paths (pathA and pathB) and an array of file names
// to be ignored, this function will return true if the content of the two
// directories is similar (same files and same content for each file -minus
// the files to be ignore-). It will return false otherwise and log all
// differences to the console.
module.exports = function (pathA, pathB, filesToIgnoreContentDiff = []) {
    let result = true
    const directoriesDiff = dircompare.compareSync(pathA, pathB, {compareContent: true})
    for (const diff of directoriesDiff.diffSet) {
      if (diff.state === 'distinct') {
        if (!filesToIgnoreContentDiff.includes(diff.name1)) {
          console.log('A difference in content was found !')
          console.log(JSON.stringify(diff))
          let diffLine = jsdiff.diffLines(
            fs.readFileSync(path.join(diff.path1, diff.name1)).toString(),
            fs.readFileSync(path.join(diff.path2, diff.name2)).toString())
          diffLine.forEach(part => {
            let color = part.added ? 'green'
              : part.removed ? 'red' : 'grey'
            process.stderr.write(part.value[color])
          })
          result = false
        }
      }
    }
    return result
  }