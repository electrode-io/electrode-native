// @flow

import {
  exec,
  spawn
} from 'child_process'
import type {
  ChildProcess
} from 'child_process'

type ExecOpts = {
  cwd?: string;
  env?: Object;
  encoding?: string;
  shell?: string;
  timeout?: number;
  maxBuffer?: number;
  killSignal?: string;
  uid?: number;
  gid?: number;
}

type SpawnOpts = {
  cwd?: string;
  env?: Object;
  argv0?: string;
  stdio?: string | Array<any>;
  detached?: boolean;
  uid?: number;
  gid?: number;
  shell?: boolean | string;
}

export function promisifyChildProcess (child: ChildProcess) {
  return new Promise((resolve, reject) => {
    child.addListener('error', err => reject(err))
    child.addListener('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`ChildProcess exited with code ${code}`))
      }
    })
  })
}

export async function execp (command: string, options?: ExecOpts) : Promise<string | Buffer> {
  log.trace(`execp => command: ${command} options: ${JSON.stringify(options)}`)
  return new Promise((resolve, reject) => {
    const cp = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout)
      }
    })
    cp.stdout.on('data', data => log.trace(data))
    cp.stderr.on('data', data => log.debug(data))
  })
}

export async function spawnp (command: string, args?: string[], options?: SpawnOpts) {
  log.trace(`spawnp => command: ${command} args: ${JSON.stringify(args)} options: ${JSON.stringify(options)}`)
  const cp = spawn(command, args, options)
  cp.stdout.on('data', data => log.trace(data))
  cp.stderr.on('data', data => log.debug(data))
  return promisifyChildProcess(cp)
}
