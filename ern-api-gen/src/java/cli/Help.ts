import pad from 'lodash/padEnd'
import { Command } from './Command'
import { log } from 'ern-core'

const SORT_CMDS = (a, b) => a.Usage.name.localeCompare(b.Usage.name)

export class Help {
  public static Usage = new Command(
    { name: 'help', description: 'This helpful message.' },
    []
  )

  public values
  public opts

  constructor(values, opts) {
    this.values = values
    this.opts = opts
  }

  public run() {
    const { name, description, commands = [] } = this.opts
    log.info(`${name}\n${description}`)
    for (const cmd of commands.sort(SORT_CMDS)) {
      log.info(`\t${pad(cmd.Usage.name, 20)} - ${cmd.Usage.description}`)
    }
  }
}
