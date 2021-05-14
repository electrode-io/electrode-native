import * as fs from 'fs';
import https from 'https';
import got, { Agents } from 'got';
import FormData from 'form-data';
import { createProxyAgentFromErnConfig } from './createProxyAgent';
import { getGotCommonOpts } from './getGotCommonOpts';
export class BundleStoreSdk {
  constructor(public readonly host: string) {}

  public async createStore({ store }: { store: string }): Promise<string> {
    try {
      const res = await got
        .post(`http://${this.host}/stores/${store}`, {
          ...getGotCommonOpts(),
        })
        .json();
      return (res as any).accessKey;
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async getStoreByAccessKey({
    accessKey,
  }: {
    accessKey: string;
  }): Promise<{ id: string }> {
    try {
      const res = await got
        .get(`http://${this.host}/stores`, {
          ...getGotCommonOpts(),
          searchParams: {
            query: `accessKey=${accessKey}`,
          },
        })
        .json();
      return (res as any).id;
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async deleteStoreByAccessKey({ accessKey }: { accessKey: string }) {
    try {
      const storeId = await this.getStoreByAccessKey({ accessKey });
      await got.delete(`http://${this.host}/stores/${storeId}`, {
        ...getGotCommonOpts(),
        headers: {
          'ERN-BUNDLE-STORE-ACCESS-KEY': accessKey,
        },
      });
      return storeId;
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async uploadBundle({
    accessKey,
    bundlePath,
    platform,
    sourceMapPath,
    store,
  }: {
    accessKey: string;
    bundlePath: string;
    platform: string;
    sourceMapPath: string;
    store: string;
  }): Promise<string> {
    try {
      const bundleFileRs = fs.createReadStream(bundlePath);
      const sourceMapFileRs = fs.createReadStream(sourceMapPath);
      const form = new FormData();
      form.append('bundle', bundleFileRs);
      form.append('sourcemap', sourceMapFileRs);
      const res = await got.post(
        `http://${this.host}/bundles/${store}/${platform}`,
        {
          ...getGotCommonOpts(),
          body: form,
          headers: {
            'ERN-BUNDLE-STORE-ACCESS-KEY': accessKey,
          },
        },
      );
      return JSON.parse(res.body).id;
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async uploadAssets(zipPath: string) {
    try {
      const zippedAssetsFileRs = fs.createReadStream(zipPath);
      const form = new FormData();
      form.append('assets', zippedAssetsFileRs);
      await got.post(`http://${this.host}/assets`, {
        ...getGotCommonOpts(),
        body: form,
      });
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async assetsDelta(assets: string[]): Promise<string[]> {
    try {
      const res = await got.post(`http://${this.host}/assets/delta`, {
        ...getGotCommonOpts(),
        json: { assets },
      }).json;
      return (res as any) as string[];
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }
}
