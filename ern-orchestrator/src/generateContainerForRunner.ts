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
    dependenciesObjs = [],
    miniAppsPaths = [],
    jsApiImplsPaths = [],
    outDir,
  }: {
    napDescriptor?: NativeApplicationDescriptor
    dependenciesObjs: PackagePath[]
    miniAppsPaths: PackagePath[]
    jsApiImplsPaths: PackagePath[]
    outDir: string
  }
) {
  if (napDescriptor) {
    await runCauldronContainerGen(napDescriptor, {
      outDir,
    })
  } else {
    await runLocalContainerGen(miniAppsPaths, jsApiImplsPaths, platform, {
      extraNativeDependencies: dependenciesObjs,
      outDir,
    })
  }
}
