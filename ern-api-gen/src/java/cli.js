import pad from 'lodash/padEnd';
import camelCase from 'lodash/camelCase';
const SORT_CMDS = (a, b) => a.Usage.name.localeCompare(b.Usage.name);
const SORT_OPTS = (b, a) => {
    if (a.required && !b.required) {
        return 1;
    }
    if (b.required && !a.required) {
        return -1;
    }
    let ret = a.name[0].replace(PREFIX, '').localeCompare(b.name[0].replace(PREFIX, ''));
    if (ret == 0 && a.name.length > 1) {
        if (b.name.length < 2)return 1;
        ret = a.name[1].repalce(PREFIX, '').localeCompare(b.name[1].replace(PREFIX, ''));
    }
    return ret;
};

const PREFIX = /^-+?/;
export class Command {
    constructor({name, description}, options = []) {
        this.name = name;
        this.description = description;
        this.options = options;
    }
}
export class CommandUsage {
    constructor(values, meta, cmd) {
        this.values = values;
        this.cmd = cmd;
        this.meta = meta;
    }

    run() {
        const Usage = this.cmd.Usage;
        const name = Usage.name;
        const options = Usage.options;
        const description = Usage.description;
        const {values} = this;
        let str = `Command ${name} has the following options:\n${description}`;
        for (const opt of options.sort(SORT_OPTS)) {
            const property = opt.property || camelCase(values[opt.title]);
            const value = (values[property] || opt.title);
            const short = opt.name.length > 1 ? opt.name[0] : '';
            const long = opt.name.length > 1 ? opt.name[1] : opt.name[0];
            str = `${str}
\t${pad(opt.required ? '* ' : '', 2)}${pad(short, 5)} ${pad(long, 25)} ${pad(opt.hasArg ? `[${value}]` : '', 20)}\v${opt.description}`
        }
        return str;
    }
}

export class Help {
    static Usage = new Command({name: "help", description: "This helpful message."}, []);

    constructor(values, opts) {
        this.values = values;
        this.opts = opts;
    }

    run() {
        const {name, description, commands = []} = this.opts;
        console.log(`${name}\n${description}`);
        for (const cmd of commands.sort(SORT_CMDS)) {
            console.log(`\t${pad(cmd.Usage.name, 20)} - ${cmd.Usage.description}`);
        }
    }
}
class CliError extends Error {
    constructor(message, cmd, opt) {
        super(message);
        this.cmd = cmd;
        this.opt = opt;
    }
}
class CommandErrorHandler {
    constructor(values, opts, cmd) {
        this.values = values;
        this.opts = opts;
        this.cmd = cmd;
    }

    handle(message) {
        if (this.opts.commandUsage && this.opts && this.cmd) {
            const help = new this.opts.commandUsage(this.values, this.opts, this.cmd);
            const helpMesg = help.run();
            throw new CliError(`${message}\n${helpMesg}`);
        }
        throw new CliError(message);
    }
}
export class Cli {
    static builder(name) {
        const opts = {name, commandHelp: Help, commandUsage: CommandUsage, commandErrorHandler: CommandErrorHandler};
        const w = {
            withDescription(description){
                opts.description = description;
                return w;
            },
            withDefaultCommand(command){
                opts.defaultCommand = command;
                return w;
            },
            withCommands(...commands){
                opts.commands = commands;
                return w;
            },
            withCommandsHelp(commandHelp){
                opts.commandHelp = commandHelp;
                return w;
            },
            withCommandUsage(commandUsage){
                opts.commandUsage = commandUsage;
                return w;
            },
            withCommandErrorHandler(errorHandler){
                opts.commandErrorHandler = errorHandler;
                return w;
            },
            build(){
                return {
                    parse(args = []){
                        const isHelp = args.indexOf('-h') > -1 || args.indexOf('--help') > -1;

                        const values = {};
                        let Command = opts.defaultCommand;
                        for (const c of opts.commands) {
                            if (c.Usage.name === args[0]) {
                                Command = c;
                                break;
                            }
                        }
                        if (!Command) {
                            new opts.commandErrorHandler(values, opts, Command).handle(args.length ? `Unknown Command  ${args[0]}` : 'No Command given');
                        }
                        if (isHelp && Command == opts.defaultCommand) {
                            return new opts.commandHelp(values, opts).run();
                        }
                        for (const opt of Command.Usage.options) {
                            let value;
                            let current;
                            NAMES: for (const name of opt.name) {
                                for (let i = 0, l = args.length; i < l; i++) {
                                    if (args[i] === name) {
                                        value = args[++i];
                                        current = opt;
                                        break NAMES;
                                    }
                                    const eqStr = `${name}=`;
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
                                        return new opts.commandErrorHandler(values, opts, Command).handle(`${_check.name} requires a value`);

                                    }
                                    values[property] = value;
                                } else {
                                    values[property] = true;
                                }
                            } else {
                                if (opt.required) {
                                    return new opts.commandErrorHandler(values, opts, Command).handle(`${args[0]} requires a option for ${opt.description}`);
                                }
                            }
                        }
                        if (isHelp) {
                            return new opts.commandUsage(values, opts, Command).run();
                        }

                        return new Command(values, opts).run();
                    }
                }
            }
        };

        return w;
    }
}
