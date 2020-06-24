import { FileRule } from './FileRule';
import FileSystems from '../../java/FileSystems';
import StringBuilder from '../../java/StringBuilder';

export class DirectoryRule extends FileRule {
  public directoryMatcher;
  public contentsMatcher;

  constructor(syntax, definition) {
    super(syntax, definition);
    const pattern = this.getPattern();
    const sb = StringBuilder('glob:', pattern);
    if (!pattern.endsWith('/')) {
      sb.append('/');
    }
    this.directoryMatcher = FileSystems.getDefault().getPathMatcher(
      sb.toString(),
    );
    this.contentsMatcher = FileSystems.getDefault().getPathMatcher(
      sb.append('**').toString(),
    );
  }

  public matches(relativePath) {
    return (
      this.contentsMatcher.matches(relativePath) ||
      this.directoryMatcher.matches(relativePath)
    );
  }
}
