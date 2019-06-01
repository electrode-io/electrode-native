import {
  PackagePath,
  NativePlatform,
  kax,
  AppVersionDescriptor,
} from 'ern-core'
import { runLocalContainerGen, runCauldronContainerGen } from './container'
import { runLocalCompositeGen, runCauldronCompositeGen } from './composite'

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
    napDescriptor?: AppVersionDescriptor
    dependencies?: PackagePath[]
    miniApps?: PackagePath[]
    jsApiImpls?: PackagePath[]
    outDir: string
    extra?: any
  }
) {
  if (napDescriptor) {
    const composite = await kax.task('Generating Composite from Cauldron').run(
      runCauldronCompositeGen(napDescriptor, {
        baseComposite,
      })
    )

    await kax.task('Generating Container from Cauldron').run(
      runCauldronContainerGen(napDescriptor, composite, {
        outDir,
      })
    )
  } else {
    const composite = await kax.task('Generating Composite locally').run(
      runLocalCompositeGen(miniApps, {
        baseComposite,
        jsApiImpls,
      })
    )

    await kax.task('Generating Container locally').run(
      runLocalContainerGen(platform, composite, {
        extra: extra || {},
        extraNativeDependencies: dependencies || [],
        outDir,
      })
    )
  }
}
