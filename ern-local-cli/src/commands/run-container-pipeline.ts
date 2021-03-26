import { log, NativePlatform, PackagePath, Platform, kax } from 'ern-core';
import {
  parseJsonFromStringOrFile,
  runContainerPipeline,
} from 'ern-orchestrator';
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../lib';
import { Argv } from 'yargs';
import untildify from 'untildify';

export const command = 'run-container-pipeline';
export const desc = 'Run a Container pipeline';

export const builder = (argv: Argv) => {
  return argv
    .option('containerPath', {
      describe: 'Local path to the Container to run through the pipeline',
      type: 'string',
    })
    .coerce('containerPath', (p) => untildify(p))
    .option('pipeline', {
      demandOption: true,
      describe: 'Path to pipeline (local or cauldron)',
      type: 'string',
    })
    .coerce('pipeline', (p) => untildify(p))
    .option('platform', {
      choices: ['android', 'ios'],
      demandOption: true,
      describe: 'The native platform of the Container',
      type: 'string',
    })
    .option('version', {
      alias: 'v',
      default: '1.0.0',
      describe: 'Container version to use for publication',
      type: 'string',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  containerPath,
  pipeline,
  platform,
  version,
}: {
  containerPath?: string;
  pipeline: string;
  platform: NativePlatform;
  version: string;
}) => {
  containerPath =
    containerPath || Platform.getContainerGenOutDirectory(platform);

  await logErrorAndExitIfNotSatisfied({
    isContainerPath: {
      extraErrorMessage: `Make sure that ${containerPath} is the root of a Container project`,
      p: containerPath!,
    },
  });

  let pipelineObj: any;
  try {
    pipelineObj = await parseJsonFromStringOrFile(pipeline);
  } catch (e) {
    throw new Error('(--pipeline option): Invalid input');
  }

  if (!pipelineObj?.containerGenerator?.pipeline) {
    throw new Error(`Invalid pipeline configuration.
Make sure that the pipeline is an array set inside containerGenerator as illustrated below.
{
  "containerGenerator": {
    "pipeline": [
    ]
  }
}`);
  }

  await kax.task('Running Container pipeline').run(
    runContainerPipeline({
      containerPath,
      containerVersion: version,
      pipeline: pipelineObj.containerGenerator.pipeline,
      platform,
    }),
  );

  kax.task('Container pipeline successfully run').succeed();
};

export const handler = tryCatchWrap(commandHandler);
