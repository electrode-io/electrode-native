export class CliError extends Error {
  public cmd;
  public opt;

  constructor(message, cmd?: any, opt?: any) {
    super(message);
    this.cmd = cmd;
    this.opt = opt;
  }
}
