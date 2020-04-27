import camelCase from 'lodash/camelCase';
import pad from 'lodash/padEnd';

const PREFIX = /^-+?/;
const SORT_OPTS = (b, a) => {
  if (a.required && !b.required) {
    return 1;
  }
  if (b.required && !a.required) {
    return -1;
  }
  let ret = a.name[0]
    .replace(PREFIX, '')
    .localeCompare(b.name[0].replace(PREFIX, ''));
  if (ret === 0 && a.name.length > 1) {
    if (b.name.length < 2) {
      return 1;
    }
    ret = a.name[1]
      .repalce(PREFIX, '')
      .localeCompare(b.name[1].replace(PREFIX, ''));
  }
  return ret;
};

export class CommandUsage {
  public values;
  public meta;
  public cmd;

  constructor(values, meta, cmd) {
    this.values = values;
    this.cmd = cmd;
    this.meta = meta;
  }

  public run() {
    const Usage = this.cmd.Usage;
    const name = Usage.name;
    const options = Usage.options;
    const description = Usage.description;
    const { values } = this;
    let str = `Command ${name} has the following options:\n${description}`;
    for (const opt of options.sort(SORT_OPTS)) {
      const property = opt.property || camelCase(values[opt.title]);
      const value = values[property] || opt.title;
      const short = opt.name.length > 1 ? opt.name[0] : '';
      const long = opt.name.length > 1 ? opt.name[1] : opt.name[0];
      str = `${str}
\t${pad(opt.required ? '* ' : '', 2)}${pad(short, 5)} ${pad(long, 25)} ${pad(
        opt.hasArg ? `[${value}]` : '',
        20,
      )}\v${opt.description}`;
    }
    return str;
  }
}
