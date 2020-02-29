import { kax, log, PackagePath, shell, yarn } from 'ern-core'

export async function installPackagesWithoutYarnLock({
  cwd,
  jsPackages,
}: {
  cwd: string
  jsPackages: PackagePath[]
}) {
  // No yarn.lock path was provided, just add miniapps one by one
  log.debug('[generateComposite] no yarn lock provided')
  shell.pushd(cwd)
  try {
    await yarn.init()
    const nbJsPackages = jsPackages.length
    for (let i = 0; i < nbJsPackages; i++) {
      await kax
        .task(`[${i + 1}/${nbJsPackages}] Adding ${jsPackages[i]}`)
        .run(yarn.add(jsPackages[i]))
    }
  } finally {
    shell.popd()
  }
}
