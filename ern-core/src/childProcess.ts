import { exec, spawn, ChildProcess } from 'child_process'
import log from './log'

interface ExecOpts {
  cwd?: string
  env?: any
  encoding?: string
  shell?: string
  timeout?: number
  maxBuffer?: number
  killSignal?: string
  uid?: number
  gid?: number
}

export function promisifyChildProcess(child: ChildProcess): Promise<void> {
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

export async function execp(
  command: string,
  options?: ExecOpts
): Promise<string> {
  log.trace(`execp => command: ${command} options: ${JSON.stringify(options)}`)
  return new Promise<string>((resolve, reject) => {
    const cp = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout.toString())
      }
    })
    if (cp.stdout) {
      cp.stdout.on('data', data => log.trace(data.toString()))
    }
    if (cp.stderr) {
      cp.stderr.on('data', data => log.debug(data.toString()))
    }
  })
}

export async function spawnp(
  command: string,
  args: string[] = [],
  options: any = {}
) {
  log.trace(
    `spawnp => command: ${command} args: ${JSON.stringify(
      args
    )} options: ${JSON.stringify(options)}`
  )
  const cp = spawn(command, args, options)
  cp.stdout.on('data', data => log.trace(data.toString()))
  cp.stderr.on('data', data => log.debug(data.toString()))
  return promisifyChildProcess(cp)
}
