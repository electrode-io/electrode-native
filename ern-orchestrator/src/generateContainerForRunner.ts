import {
  PackagePath,
  NativeApplicationDescriptor,
  NativePlatform,
} from 'ern-core'
import { runLocalContainerGen, runCauldronContainerGen } from './container'

export async function generateContainerForRunner(
  platform: NativePlatform,
  {
    baseComposite,
    napDescriptor,
    dependencies = [],
    miniApps = [],
    jsApiImpls = [],
    outDir,
    extra,
  }: {
    baseComposite?: PackagePath
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
      baseComposite,
      outDir,
    })
  } else {
    await runLocalContainerGen(miniApps, jsApiImpls, platform, {
      baseComposite,
      extra: extra || {},
      extraNativeDependencies: dependencies,
      outDir,
    })
  }
}
