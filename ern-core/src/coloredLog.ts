import kax from './kax';

export enum LogLevel {
  Trace = 0,
  Debug = 1,
  Info = 2,
  Warn = 3,
  Error = 4,
  Off = 5,
}

export default class ColoredLog {
  private pLevel: LogLevel;
  private loggers: any = {};

  constructor(level: LogLevel = LogLevel.Info) {
    this.setLogLevel(level);
  }

  public setLogLevel(level: LogLevel) {
    this.pLevel = level;
    this.loggers = {
      debug:
        level <= LogLevel.Debug
          ? (msg: string) => kax.raw(msg)
          : () => this.noop(),
      error:
        level <= LogLevel.Warn
          ? (msg: string) => kax.error(msg)
          : () => this.noop(),
      info:
        level <= LogLevel.Info
          ? (msg: string) => kax.info(msg)
          : () => this.noop(),
      raw:
        level < LogLevel.Off
          ? (msg: string) => kax.raw(msg)
          : () => this.noop(),
      trace:
        level <= LogLevel.Trace
          ? (msg: string) => kax.raw(msg)
          : () => this.noop(),
      warn:
        level <= LogLevel.Warn
          ? (msg: string) => kax.warn(msg)
          : () => this.noop(),
    };
  }

  get level(): LogLevel {
    return this.pLevel;
  }

  public raw(msg: string) {
    this.loggers.raw(msg);
  }

  public trace(msg: string) {
    this.loggers.trace(msg);
  }

  public debug(msg: string) {
    this.loggers.debug(msg);
  }

  public info(msg: string) {
    this.loggers.info(msg);
  }

  public warn(msg: string) {
    this.loggers.warn(msg);
  }

  public error(msg: string) {
    this.loggers.error(msg);
  }

  private noop() {
    // noop
  }
}
