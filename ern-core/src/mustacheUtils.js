// @flow

import Mustache from 'mustache'
import fs from 'fs'

// =============================================================================
// Mustache related utilities
// =============================================================================

// Mustache render using a template file
// filename: Path to the template file
// view: Mustache view to apply to the template
// returns: Rendered string output
export async function mustacheRenderUsingTemplateFile (
  filename: string,
  view: any) {
  return readFile(filename, 'utf8')
      .then(template => Mustache.render(template, view))
}

// Mustache render to an output file using a template file
// templateFilename: Path to the template file
// view: Mustache view to apply to the template
// outputFile: Path to the output file
export async function mustacheRenderToOutputFileUsingTemplateFile (
  templateFilename: string,
  view: any,
  outputFile: string) {
  return mustacheRenderUsingTemplateFile(templateFilename, view).then(output => {
    return writeFile(outputFile, output)
  })
}

// =============================================================================
// Async wrappers
// =============================================================================

async function readFile (
  filename: string,
  enc: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, enc, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

async function writeFile (
  filename: string,
  data: any) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}
