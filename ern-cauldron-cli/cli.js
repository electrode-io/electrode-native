import unirest from 'unirest';
import fs from 'fs';
import http from 'http';

export default class CauldronClient {
  constructor(url) {
    this._url = url;
  }

  get url() {
    return this._url;
  }

  addNativeApp(app) {
    return new Promise((resolve, reject) => {
      unirest.post(`${this.url}/nativeapps`)
      .send(app)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  getAllNativeApps() {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  getNativeApp(appName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  deleteNativeApp(appName) {
    return new Promise((resolve, reject) => {
      unirest.delete(`${this.url}/nativeapps/${appName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  addPlatform(appName, platform) {
    return new Promise((resolve, reject) => {
      unirest.post(`${this.url}/nativeapps/${appName}/platforms`)
      .send(platform)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  getAllPlatforms(appName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  getPlatform(appName, platformName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms/${platformName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  deletePlatform(appName, platformName ) {
    return new Promise((resolve, reject) => {
      unirest.delete(`${this.url}/nativeapps/${appName}/platforms/${platformName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  addNativeAppVersion(appName, platformName, version) {
    return new Promise((resolve, reject) => {
      unirest.post(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions`)
      .send(version)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  getAllNativeAppVersions(appName, platformName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  getNativeAppVersion(appName, platformName, versionName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  deleteNativeAppVersion(appName, platformName, versionName) {
    return new Promise((resolve, reject) => {
      unirest.delete(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  addNativeAppDependency(appName, platformName, versionName, nativeDep) {
    return new Promise((resolve, reject) => {
      unirest.post(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/nativedeps`)
      .send(nativeDep)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  getAllNativeAppDependencies(appName, platformName, versionName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/nativedeps`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  getNativeAppDependency(appName, platformName, versionName, dependencyName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/nativedeps/${dependencyName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  deleteNativeAppDependency(appName, platformName, versionName, dependencyName) {
    return new Promise((resolve, reject) => {
      unirest.delete(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/nativedeps/${dependencyName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  addReactNativeApp(appName, platformName, versionName, reactNativeApp) {
    return new Promise((resolve, reject) => {
      unirest.post(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/reactnativeapps`)
      .send(reactNativeApp)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  getAllReactNativeApps(appName, platformName, versionName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/reactnativeapps`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  getReactNativeApp(appName, platformName, versionName, reactNativeAppName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/reactnativeapps/${reactNativeAppName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  deleteReactNativeApp(appName, platformName, versionName, reactNativeAppName) {
    return new Promise((resolve, reject) => {
      unirest.delete(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/reactnativeapps/${reactNativeAppName}`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  addNativeAppBinary(appName, platformName, versionName, binaryPath) {
    return new Promise((resolve, reject) => {
      unirest.post(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/binary`)
      .headers({'Content-Type': 'application/octet-stream'})
      .send(fs.readFileSync(binaryPath))
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  getNativeAppBinary(appName, platformName, versionName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/binary`)
      .headers({'Accept': 'application/octet-stream'})
      .encoding('binary')
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  deleteNativeAppBinary(appName, platformName, versionName) {
    return new Promise((resolve, reject) => {
      unirest.delete(`${this.url}/nativeapps/${appName}/platforms/${platformName}/versions/${versionName}/binary`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  addReactNativeSourceMap(reactNativeAppName, versionName, sourceMap) {
    return new Promise((resolve, reject) => {
      unirest.post(`${this.url}/reactnativeapps/${reactNativeAppName}/versions/${versionName}/sourcemap`)
      .headers({'Content-Type': 'application/octet-stream'})
      .send(sourceMap)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }

  getReactNativeSourceMap(reactNativeAppName, versionName) {
    return new Promise((resolve, reject) => {
      unirest.get(`${this.url}/reactnativeapps/${reactNativeAppName}/versions/${versionName}/sourcemap`)
      .headers({'Accept': 'application/octet-stream'})
      .encoding('binary')
      .end(resp => {
        resp.error ? reject(resp.error) : resolve(resp.body);
      });
    });
  }

  deleteNativeAppBinary(reactNativeAppName, versionName) {
    return new Promise((resolve, reject) => {
      unirest.delete(`${this.url}/reactnativeapps/${reactNativeAppName}/versions/${versionName}/sourcemap`)
      .end(resp => {
        resp.error ? reject(resp.error) : resolve();
      });
    });
  }
};
