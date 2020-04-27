import StringBuilder from './java/StringBuilder';

export default class SupportingFile {
  public templateFile;
  public folder;
  public destinationFilename;

  constructor(templateFile, folder, destinationFilename) {
    if (arguments.length === 2) {
      destinationFilename = folder;
      folder = '';
    }
    this.templateFile = templateFile;
    this.folder = folder;
    this.destinationFilename = destinationFilename;
  }

  public toString() {
    const builder = StringBuilder('SupportingFile:\n');
    builder
      .append('\ttemplateFile: ')
      .append(this.templateFile)
      .append('\n');
    builder
      .append('\tfolder: ')
      .append(this.folder)
      .append('\n');
    builder
      .append('\tdestinationFilename: ')
      .append(this.destinationFilename)
      .append('\n');
    return builder.toString();
  }
}
