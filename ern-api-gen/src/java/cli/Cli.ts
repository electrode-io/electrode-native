import camelCase from 'lodash/camelCase';
import { CommandUsage } from './CommandUsage';
import { Help } from './Help';
import { CommandErrorHandler } from './CommandErrorHandler';

export class Cli {
  public static builder(name) {
    const opts: any = {
      commandErrorHandler: CommandErrorHandler,
      commandHelp: Help,
      commandUsage: CommandUsage,
      name,
    };
    const w = {
      withDescription(description) {
        opts.description = description;
        return w;
      },
      withDefaultCommand(command) {
        opts.defaultCommand = command;
        return w;
      },
      withCommands(...commands) {
        opts.commands = commands;
        return w;
      },
      withCommandsHelp(commandHelp) {
        opts.commandHelp = commandHelp;
        return w;
      },
      withCommandUsage(commandUsage) {
        opts.commandUsage = commandUsage;
        return w;
      },
      withCommandErrorHandler(errorHandler) {
        opts.commandErrorHandler = errorHandler;
        return w;
      },
      build() {
        return {
          parse(args: any = []) {
            const isHelp =
              args.indexOf('-h') > -1 || args.indexOf('--help') > -1;

            const values = {};
            let Command = opts.defaultCommand;
            for (const c of opts.commands) {
              if (c.Usage.name === args[0]) {
                Command = c;
                break;
              }
            }
            if (!Command) {
              new opts.commandErrorHandler(values, opts, Command).handle(
                args.length
                  ? `Unknown Command  ${args[0]}`
                  : 'No Command given',
              );
            }
            if (isHelp && Command === opts.defaultCommand) {
              return new opts.commandHelp(values, opts).run();
            }
            for (const opt of Command.Usage.options) {
              let value;
              let current;
              NAMES: for (const n of opt.name) {
                for (let i = 0, l = args.length; i < l; i++) {
                  if (args[i] === n) {
                    value = args[++i];
                    current = opt;
                    break NAMES;
                  }
                  const eqStr = `${n}=`;
                  if (args[i].startsWith(eqStr)) {
                    value = args[i].substring(eqStr.length);
                    current = opt;
                    break NAMES;
                  }
                }
              }
              if (current) {
                const property = opt.property || camelCase(opt.title);
                if (current.hasArg) {
                  if (value == null) {
                    return new opts.commandErrorHandler(
                      values,
                      opts,
                      Command,
                    ).handle(`${name} requires a value`);
                  }
                  values[property] = value;
                } else {
                  values[property] = true;
                }
              } else {
                if (opt.required) {
                  return new opts.commandErrorHandler(
                    values,
                    opts,
                    Command,
                  ).handle(
                    `${args[0]} requires a option for ${opt.description}`,
                  );
                }
              }
            }
            if (isHelp) {
              return new opts.commandUsage(values, opts, Command).run();
            }

            return new Command(values, opts).run();
          },
        };
      },
    };

    return w;
  }
}
