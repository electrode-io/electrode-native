import * as fs from 'fs'
import superagent from 'superagent'

export class BundleStoreSdk {
  constructor(public readonly host: string) {}

  public async createStore({ store }: { store: string }): Promise<string> {
    try {
      const res = await superagent
        .post(`http://${this.host}/stores/${store}`)
        .set('accept', 'json')
      return res.body.accessKey
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }

  public async getStoreByAccessKey({
    accessKey,
  }: {
    accessKey: string
  }): Promise<{ id: string }> {
    try {
      const res = await superagent
        .get(`http://${this.host}/stores`)
        .query(`accessKey=${accessKey}`)
      return res.body.id
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }

  public async deleteStoreByAccessKey({ accessKey }: { accessKey: string }) {
    try {
      const storeId = await this.getStoreByAccessKey({ accessKey })
      const res = await superagent
        .delete(`http://${this.host}/stores/${storeId}`)
        .set('ERN-BUNDLE-STORE-ACCESS-KEY', accessKey)
      return storeId
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }

  public async uploadBundle({
    accessKey,
    bundlePath,
    platform,
    sourceMapPath,
    store,
  }: {
    accessKey: string
    bundlePath: string
    platform: string
    sourceMapPath: string
    store: string
  }): Promise<string> {
    try {
      const bundleFile = fs.createReadStream(bundlePath)
      const sourceMapFile = fs.createReadStream(sourceMapPath)
      const res = await superagent
        .post(`http://${this.host}/bundles/${store}/${platform}`)
        .set('ERN-BUNDLE-STORE-ACCESS-KEY', accessKey)
        .attach('bundle', bundleFile)
        .attach('sourcemap', sourceMapFile)
      return res.body.id
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }

  public async uploadAssets(zipPath: string) {
    try {
      const zippedAssetsFile = fs.createReadStream(zipPath)
      await superagent
        .post(`http://${this.host}/assets`)
        .attach('assets', zippedAssetsFile)
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }

  public async assetsDelta(assets: string[]): Promise<string[]> {
    try {
      const res = await superagent
        .post(`http://${this.host}/assets/delta`)
        .send({ assets })
        .set('Accept', 'application/json')
      return res.body
    } catch (err) {
      throw new Error(err.response ? err.response.text : err.message)
    }
  }
}
