import { createProxyAgentFromErnConfig } from './createProxyAgent';
import log from './log';
import kax from './kax';
import { reactNative } from '@bugsnag/source-maps';

export async function bugsnagUpload({
  apiKey,
  minifiedFile,
  minifiedUrl,
  platform,
  projectRoot,
  sourceMap,
  uploadNodeModules,
  uploadSources,
}: {
  apiKey: string;
  minifiedFile: string;
  minifiedUrl: string;
  platform?: 'ios' | 'android';
  projectRoot: string;
  sourceMap: string;
  uploadNodeModules?: boolean;
  uploadSources: boolean;
}) {
  const proxyAgent = createProxyAgentFromErnConfig('bugsnagProxy', {
    https: true,
  });
  const codeBundleId = process.env.ERN_BUGSNAG_CODE_BUNDLE_ID;
  const bugsnagOptions = {
    apiKey,
    bundle: minifiedFile,
    codeBundleId,
    dev: false,
    platform: platform || ('android' as const),
    projectRoot,
    requestOpts: proxyAgent ? { agent: proxyAgent.agent } : undefined,
    sourceMap,
  };
  log.trace(
    `[bugsnagUpload] options: ${JSON.stringify(bugsnagOptions, null, 2)}`,
  );
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  await kax
    .task(`Uploading source map to Bugsnag (codeBundleId: ${codeBundleId})`)
    .run(reactNative.uploadOne(bugsnagOptions));
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
}
