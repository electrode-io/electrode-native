import exec from './exec'

export function npm (cmd, args = [], options = {
  cwd: process.cwd()
}) {
  return new Promise((resolve, reject) => {
    exec(`npm ${cmd} ${args.join(' ')}`, options,
            (err, stdout, stderr) => {
              if (err) {
                log.error(stderr)
                return reject(err)
              }
              return resolve(stdout)
            })
  })
}
export default ({
  npm
})
