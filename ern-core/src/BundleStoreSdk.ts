import * as fs from 'fs';
import got from 'got';
import FormData from 'form-data';
import { createProxyAgentFromErnConfig } from './createProxyAgent';

export class BundleStoreSdk {
  public readonly gotCommonOpts = {
    agent: createProxyAgentFromErnConfig('bundleStoreProxy'),
  };

  constructor(public readonly host: string) {}

  public async createStore({ store }: { store: string }): Promise<string> {
    try {
      const res = await got.post(`http://${this.host}/stores/${store}`, {
        ...this.gotCommonOpts,
        json: true,
      });
      return res.body.accessKey;
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
      const res = await got.get(`http://${this.host}/stores`, {
        ...this.gotCommonOpts,
        json: true,
        query: `accessKey=${accessKey}`,
      });
      return res.body.id;
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async deleteStoreByAccessKey({ accessKey }: { accessKey: string }) {
    try {
      const storeId = await this.getStoreByAccessKey({ accessKey });
      await got.delete(`http://${this.host}/stores/${storeId}`, {
        ...this.gotCommonOpts,
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
          ...this.gotCommonOpts,
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
        ...this.gotCommonOpts,
        body: form,
      });
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async assetsDelta(assets: string[]): Promise<string[]> {
    try {
      const res = await got.post(`http://${this.host}/assets/delta`, {
        ...this.gotCommonOpts,
        body: { assets },
        json: true,
      });
      return res.body;
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }
}
