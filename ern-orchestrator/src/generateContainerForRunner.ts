import {
  PackagePath,
  NativeApplicationDescriptor,
  NativePlatform,
} from 'ern-core'

import { runLocalContainerGen, runCauldronContainerGen } from './container'

export async function generateContainerForRunner(
  platform: NativePlatform,
  {
    napDescriptor,
    dependencies = [],
    miniApps = [],
    jsApiImpls = [],
    outDir,
  }: {
    napDescriptor?: NativeApplicationDescriptor
    dependencies?: PackagePath[]
    miniApps?: PackagePath[]
    jsApiImpls?: PackagePath[]
    outDir: string
  }
) {
  if (napDescriptor) {
    await runCauldronContainerGen(napDescriptor, {
      outDir,
    })
  } else {
    await runLocalContainerGen(miniApps, jsApiImpls, platform, {
      extraNativeDependencies: dependencies,
      outDir,
    })
  }
}
