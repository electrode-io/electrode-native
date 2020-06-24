import { createProxyAgentFromErnConfig } from './createProxyAgent';
import log from './log';
import kax from './kax';
import * as bugsnag from 'bugsnag-sourcemaps';

export async function bugsnagUpload({
  apiKey,
  minifiedFile,
  minifiedUrl,
  projectRoot,
  sourceMap,
  uploadNodeModules,
  uploadSources,
}: {
  apiKey: string;
  minifiedFile: string;
  minifiedUrl: string;
  projectRoot: string;
  sourceMap: string;
  uploadNodeModules?: boolean;
  uploadSources: boolean;
}) {
  const agent = createProxyAgentFromErnConfig('bugsnagProxy', { https: true });
  const codeBundleId = process.env.ERN_BUGSNAG_CODE_BUNDLE_ID;
  const bugsnagOptions = {
    addWildcardPrefix: true,
    agent,
    apiKey,
    codeBundleId,
    minifiedFile,
    minifiedUrl,
    projectRoot,
    sourceMap,
    uploadNodeModules,
    uploadSources,
  };
  log.trace(
    `[bugsnagUpload] options: ${JSON.stringify(bugsnagOptions, null, 2)}`,
  );
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  await kax
    .task(`Uploading source map to Bugsnag (codeBundleId: ${codeBundleId})`)
    .run(bugsnag.upload(bugsnagOptions));
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
}
