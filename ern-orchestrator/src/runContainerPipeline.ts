import { cauldronFileUriScheme, getActiveCauldron } from 'ern-cauldron-api'
import { kax, log, PackagePath } from 'ern-core'
import { isTransformer, transformContainer } from 'ern-container-transformer'
import { isPublisher, publishContainer } from 'ern-container-publisher'
import { parseJsonFromStringOrFile } from './parseJsonFromStringOrFile'

/**
 * Run a given Container pipeline
 */
export async function runContainerPipeline({
  containerPath,
  containerVersion,
  pipeline,
  platform,
}: {
  containerPath: string
  containerVersion: string
  pipeline: any[]
  platform: 'android' | 'ios'
}) {
  const cauldron = await getActiveCauldron()

  let curIdx = 0
  for (const pipelineElt of pipeline || []) {
    curIdx++
    const pipelineEltPackage = PackagePath.fromString(pipelineElt.name)
    let pipelineEltType
    if (isPublisher(pipelineEltPackage)) {
      pipelineEltType = 'publisher'
    } else if (isTransformer(pipelineEltPackage)) {
      pipelineEltType = 'transformer'
    } else {
      log.error(
        `[${curIdx}/${pipeline.length}] Skipping non transformer/publisher pipeline element ${pipelineElt.name}`
      )
      continue
    }

    if (pipelineElt.disabled) {
      log.info(
        `[${curIdx}/${pipeline.length}] Skipping ${pipelineElt.name} ${pipelineEltType} [disabled]`
      )
      continue
    }

    let extra = pipelineElt.extra
    if (
      extra &&
      typeof extra === 'string' &&
      extra.startsWith(cauldronFileUriScheme)
    ) {
      if (!(await cauldron.hasFile({ cauldronFilePath: extra }))) {
        throw new Error(`Cannot find extra config file ${extra} in Cauldron`)
      }
      const extraFile = await cauldron.getFile({ cauldronFilePath: extra })
      extra = parseJsonFromStringOrFile(extraFile.toString())
    }
    await kax
      .task(
        `[${curIdx}/${pipeline.length}] Running Container ${pipelineEltType} ${pipelineEltPackage.basePath}`
      )
      .run(
        isPublisher(pipelineEltPackage)
          ? publishContainer({
              containerPath,
              containerVersion,
              extra,
              inPlace: pipelineElt.inPlace,
              platform,
              publisher: PackagePath.fromString(pipelineElt.name),
              url: pipelineElt.url,
            })
          : transformContainer({
              containerPath,
              extra,
              platform,
              transformer: PackagePath.fromString(pipelineElt.name),
            })
      )
  }
}
