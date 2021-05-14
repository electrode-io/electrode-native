import config from './config';
import http from 'http';
import tunnel from 'tunnel';
import url from 'url';

export function createProxyAgentFromUrl(
  proxyUrl: url.URL,
  { https }: { https?: boolean } = {},
): { agent: http.Agent; isHttpsAgent: boolean } {
  const supportedProtocols = ['http:', 'https:'];
  const protocol = proxyUrl.protocol;
  if (!supportedProtocols.includes(protocol)) {
    throw new Error(
      `Only http and https protocols are supported (protocol: ${protocol})`,
    );
  }
  if (!proxyUrl.port) {
    throw new Error(`port is missing from proxy url ${proxyUrl.toString()}`);
  }
  const proxy = {
    host: proxyUrl.hostname,
    port: parseInt(proxyUrl.port, 10),
  };

  if (https) {
    return protocol === 'http:'
      ? { agent: tunnel.httpsOverHttp({ proxy }), isHttpsAgent: false }
      : { agent: tunnel.httpsOverHttps({ proxy }), isHttpsAgent: true };
  } else {
    return protocol === 'http:'
      ? { agent: tunnel.httpOverHttp({ proxy }), isHttpsAgent: false }
      : { agent: tunnel.httpOverHttps({ proxy }), isHttpsAgent: true };
  }
}

export function createProxyAgentFromErnConfig(
  configKey: string,
  { https }: { https?: boolean } = {},
): { agent: http.Agent; isHttpsAgent: boolean } | undefined {
  const proxyUrl = config.get(configKey);
  if (proxyUrl) {
    return createProxyAgentFromUrl(new url.URL(proxyUrl), { https });
  } else if (process.env.http_proxy) {
    return createProxyAgentFromUrl(new url.URL(process.env.http_proxy), {
      https,
    });
  } else if (process.env.https_proxy) {
    return createProxyAgentFromUrl(new url.URL(process.env.https_proxy), {
      https,
    });
  }
}
