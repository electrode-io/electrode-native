import { Rule } from './Rule';
import IgnoreToken from './IgnoreToken';
import Pattern from '../../java/Pattern';

/**
 * A special case rule which matches files only if they're located
 * in the same directory as the .swagger-codegen-ignore file.
 */
export class RootedFileRule extends Rule {
  public definedFilename;
  public definedExtension;

  constructor(syntax, definition) {
    super(syntax, definition);
    this.definedFilename = null;
    this.definedExtension = null;
    const separatorIndex = definition.lastIndexOf('.');
    this.definedFilename = this.getFilenamePart(definition, separatorIndex);
    this.definedExtension = this.getExtensionPart(definition, separatorIndex);
  }

  public getFilenamePart(input, stopIndex) {
    return input.substring(
      input.charAt(0) === '/' ? 1 : 0,
      stopIndex > 0 ? stopIndex : input.length,
    );
  }

  public getExtensionPart(input, stopIndex) {
    return input.substring(
      stopIndex > 0 ? stopIndex + 1 : input.length,
      input.length,
    );
  }

  public matches(relativePath) {
    const isSingleFile = relativePath.lastIndexOf('/') <= 0;
    if (isSingleFile) {
      const separatorIndex = relativePath.lastIndexOf('.');
      const filename = this.getFilenamePart(relativePath, separatorIndex);
      const extension = this.getExtensionPart(relativePath, separatorIndex);
      const extensionMatches =
        this.definedExtension === extension ||
        this.definedExtension === IgnoreToken.MATCH_ANY.getPattern();
      if (
        extensionMatches &&
        this.definedFilename.indexOf(IgnoreToken.MATCH_ANY.getPattern()) !== -1
      ) {
        const regex = Pattern.compile(
          /* replaceAll */ /* replaceAll */ this.definedFilename
            .replace(new RegExp(Pattern.quote('.'), 'g'), '\\\\Q.\\\\E')
            .replace(new RegExp(Pattern.quote('*'), 'g'), '.*?'),
        );
        return regex.matcher(filename).find();
      }
      return extensionMatches && this.definedFilename === filename;
    }
    return false;
  }
}
