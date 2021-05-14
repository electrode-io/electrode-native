import { Agents } from 'got';
import https from 'https';
import { createProxyAgentFromErnConfig } from './createProxyAgent';

export function getGotCommonOpts() {
  const ernAgent = createProxyAgentFromErnConfig('bundleStoreProxy');
  const agent: Agents = {};
  if (ernAgent?.isHttpsAgent) {
    agent.https = ernAgent.agent as https.Agent;
  } else {
    agent.http = ernAgent?.agent;
  }
  return { agent };
}
