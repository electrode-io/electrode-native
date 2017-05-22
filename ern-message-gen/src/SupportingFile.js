import StringBuilder from './java/StringBuilder'
const middle = (templateFile, folder, destinationFilename) => destinationFilename ? [templateFile, folder, destinationFilename] : [templateFile, '', folder]

export default class SupportingFile {
  constructor (templateFile, folder, destinationFilename) {
    if (arguments.length == 2) {
      destinationFilename = folder
      folder = ''
    }
    this.templateFile = templateFile
    this.folder = folder
    this.destinationFilename = destinationFilename
  }

  toString () {
    let builder = new StringBuilder('SupportingFile:\n')
    builder.append('\ttemplateFile: ').append(this.templateFile).append('\n')
    builder.append('\tfolder: ').append(this.folder).append('\n')
    builder.append('\tdestinationFilename: ').append(this.destinationFilename).append('\n')
    return builder.toString()
  }
}
