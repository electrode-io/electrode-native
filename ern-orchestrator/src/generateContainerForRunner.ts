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
    extra,
  }: {
    napDescriptor?: NativeApplicationDescriptor
    dependencies?: PackagePath[]
    miniApps?: PackagePath[]
    jsApiImpls?: PackagePath[]
    outDir: string
    extra?: any
  }
) {
  if (napDescriptor) {
    await runCauldronContainerGen(napDescriptor, {
      outDir,
    })
  } else {
    await runLocalContainerGen(miniApps, jsApiImpls, platform, {
      extra,
      extraNativeDependencies: dependencies,
      outDir,
    })
  }
}
