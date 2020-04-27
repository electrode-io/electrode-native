import { Rule } from './Rule';
import FileSystems from '../../java/FileSystems';

export class FileRule extends Rule {
  public matcher;

  constructor(syntax, definition) {
    super(syntax, definition);
    this.matcher = FileSystems.getDefault().getPathMatcher(
      'glob:' + this.getPattern(),
    );
  }

  public matches(relativePath) {
    return this.matcher.matches(relativePath);
  }
}
