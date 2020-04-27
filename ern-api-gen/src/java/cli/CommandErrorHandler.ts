import { CliError } from './CliError';

export class CommandErrorHandler {
  public values;
  public opts;
  public cmd;

  constructor(values, opts, cmd) {
    this.values = values;
    this.opts = opts;
    this.cmd = cmd;
  }

  public handle(message) {
    if (this.opts.commandUsage && this.opts && this.cmd) {
      const help = new this.opts.commandUsage(this.values, this.opts, this.cmd);
      const helpMesg = help.run();
      throw new CliError(`${message}\n${helpMesg}`);
    }
    throw new CliError(message);
  }
}
