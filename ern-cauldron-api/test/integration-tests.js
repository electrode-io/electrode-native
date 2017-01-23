process.env.NODE_ENV = 'test';

import fs from 'fs';
import chai from 'chai';
import chaiHttp from 'chai-http';
import rmdir from 'rmdir';
import path from 'path'
import start, {CauldronHelper, getCauldron, setCauldron} from '../src/api.js';
const expect = chai.expect
const serverUri = 'http://localhost:3000';
const testDir = path.join.bind(path, process.cwd(), 'test', '.cauldron-test');

let cauldronHelper;

chai.use(chaiHttp);
function writeTmp(done) {
    fs.writeFile('./tmpfile', "abcd".repeat(20000), {flags: 'w'}, done);
}
function delFile(source) {
    try {
        if (fs.existsSync(source)) {
            fs.unlinkSync(source)
        }
    } catch (e) {
    }
}
function copyFile(source, target, done) {
    const rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done && done(err);
        done = null;
    });
    const wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done && done(err);
        done = null;
    });

    wr.on("close", function (ex) {
        done && done();
    });
    rd.pipe(wr);
}

describe('IntegrationTests', () => {
    let dbFilePath = testDir('db.json');
    before((done) => {
        rmdir(testDir(), () => {
            fs.mkdirSync(testDir());

            copyFile(testDir('..', 'testdb.json'), testDir('db.json'), (e) => {
                if (e) return done(e);
                start({
                    nativeBinariesStorePath: testDir('binaries'),
                    sourceMapsStorePath: testDir('sourcemaps'),
                    dbFilePath
                }, (err, server) => {
                    if (err) return done(err);
                    return done();
                });
            });
        });
    });

    beforeEach((done) => {
        delFile('./tmpfile')
        let cauldron = JSON.parse(fs.readFileSync(dbFilePath));
        cauldronHelper = new CauldronHelper(cauldron);
        setCauldron(cauldron);
        done();
    });

    describe('POST /nativeapps', () => {
        it('should create a native app', (done) => {

            chai.request(serverUri).post('/nativeapps')
                .send({name: "Sams"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.empty;
                    expect(getCauldron().nativeApps).with.length(2);
                    done();
                });
        });

        it('should fail if app name is not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps')
                .send({})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(getCauldron().nativeApps).with.length(1);
                    done();
                });
        });

        it('should not do anything if app name already exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps')
                .send({name: "walmart"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(getCauldron().nativeApps).with.length(1);
                    done();
                });
        });
    });

    describe('GET /nativeapps', () => {
        it('should retrieve all native apps', (done) => {
            chai.request(serverUri)
                .get('/nativeapps')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array').with.length(1);
                    expect(res.body[0]).to.be.a('object').with.property('name').eql('walmart');
                    expect(res.body[0]).with.property('platforms').to.be.a('array');
                    done();
                });
        });
    });

    describe('DELETE /nativeapps', () => {
        it('should remove all native apps', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.empty;
                    expect(getCauldron().nativeApps).with.length(0);
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}', () => {
        it('should retrieve the native app', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('object').with.property('name').eql('walmart');
                    expect(res.body).with.property('platforms').to.be.a('array');
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('DELETE /nativeapps/{app}', () => {
        it('should remove the native app', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.empty;
                    expect(getCauldron().nativeApps).with.length(0);
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/foo')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('POST /nativeapps/{app}/platforms', () => {
        it('should create a native app platform', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms')
                .send({name: "ios"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(cauldronHelper.getPlatform("walmart", "ios")).not.undefined;
                    done();
                });
        });

        it('should not do anything if native app platform already exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms')
                .send({name: "android"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(cauldronHelper.getPlatform("walmart", "android")).not.undefined;
                    done();
                });
        });

        it('should fail to create a native app platform that is not android or ios', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms')
                .send({name: "foo"})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(cauldronHelper.getPlatform("walmart", "foo")).undefined;
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms', () => {
        it('should retrieve all platforms associated the native app', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array').with.length(1);
                    expect(res.body[0]).to.be.a('object').with.property('name').eql('android');
                    expect(res.body[0]).with.property('versions').to.be.a('array');
                    done();
                });
        });

        it('should fail if app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo/platforms')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}', () => {
        it('should retrieve the native app platform', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('object').with.property('name').eql('android');
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo/platforms/android')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app platform does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('DELETE /nativeapps/{app}/platforms/{platform}', () => {
        it('should remove the native app platform', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/android')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.empty;
                    expect(cauldronHelper.getPlatform("walmart", "android")).undefined;
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/foo/platforms/android')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app platform does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/foo')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('PATCH /nativeapps/{app}/platforms/{platform}/versions', () => {
        it('should fail with 404 the version does not exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.9')
                .send({})
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should correctly patch the isReleased flag if specified', (done) => {
            chai.request(serverUri)
                .patch('/nativeapps/walmart/platforms/android/versions/4.1')
                .send({isReleased: true})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(cauldronHelper.getVersion("walmart", "android", "4.1").isReleased).to.be.true;
                    done();
                });
        });

        it('should not patch the isReleased flag if unspecified', (done) => {
            chai.request(serverUri)
                .patch('/nativeapps/walmart/platforms/android/versions/4.1')
                .send({})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(cauldronHelper.getVersion("walmart", "android", "4.1").isReleased).to.be.true;
                    done();
                });
        });
    });

    describe('POST /nativeapps/{app}/platforms/{platform}/versions', () => {
        it('should create a native app version for a given platform', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions')
                .send({name: "4.3", ernPlatformVersion: "1"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(cauldronHelper.getVersion("walmart", "android", "4.3")).not.undefined;
                    done();
                });
        });

        it('should set the isReleased flag to false if not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions')
                .send({name: "4.3", ernPlatformVersion: "1"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(cauldronHelper.getVersion("walmart", "android", "4.3").isReleased).to.be.false;
                    done();
                });
        });

        it('should correctly set the isReleased flag if specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions')
                .send({name: "4.3", ernPlatformVersion: "1", isReleased: true})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(cauldronHelper.getVersion("walmart", "android", "4.3").isReleased).to.be.true;
                    done();
                });
        });

        it('should not do anything if the version already exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions')
                .send({name: "4.1", ernPlatformVersion: "1"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(cauldronHelper.getPlatform("walmart", "android")).not.undefined;
                    done();
                });
        });

        it('should fail if the version name is not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions')
                .send({ernPlatformVersion: "1"})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(getCauldron().nativeApps).with.length(1);
                    done();
                });
        });

        it('should fail if the container version is not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions')
                .send({name: "4.3"})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(getCauldron().nativeApps).with.length(1);
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}/versions', () => {
        it('should retrieve all native app versions associated to a platform', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array').with.length(2);
                    expect(res.body[0]).to.be.a('object')
                    expect(res.body[0]).with.property('name').to.be.a('string');
                    expect(res.body[0]).with.property('isReleased').to.be.a('boolean');
                    expect(res.body[0]).with.property('nativeDeps').to.be.a('array');
                    expect(res.body[0]).with.property('reactNativeApps').to.be.a('array');
                    done();
                });
        });

        it('should fail if app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo/platforms/android/versions')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if platform does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}/versions/{version}', () => {
        it('should retrieve the native app version', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('object');
                    expect(res.body).with.property('name').eql('4.1');
                    expect(res.body).with.property('isReleased').true;
                    expect(res.body).with.property('binary').to.be.a('string');
                    expect(res.body).with.property('nativeDeps').to.be.a('array');
                    expect(res.body).with.property('reactNativeApps').to.be.a('array');
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo/platforms/android/versions/4.1')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app platform does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.1')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app version does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.8')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('DELETE /nativeapps/{app}/platforms/{platform}/versions/{version}', () => {
        it('should remove the native app version associated to a platform', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/android/versions/4.1')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.empty;
                    expect(cauldronHelper.getVersion("walmart", "android", "4.1")).undefined;
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/foo/platforms/android/versions/4.1')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app platform does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/foo/versions/4.1')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app version does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/foo/versions/4.8')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('POST /nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps', () => {
        it('should add a native app dependency to a given native app platform and version', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps')
                .send({name: "react-native-maps", version: "0.31.2"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let nativeDep = cauldronHelper.getNativeDependency(version, "react-native-maps");
                    expect(nativeDep).not.undefined;
                    done();
                });
        });

        it('should not do anything if the native app dependency already exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps')
                .send({name: "react-native", version: "0.33.0"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let nativeDep = cauldronHelper.getNativeDependency(version, "react-native");
                    expect(nativeDep).to.be.a('object').with.property('version').eql('0.32.0');
                    done();
                });
        });

        it('should fail if the native app dependency name is not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps')
                .send({version: "0.31.2"})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    expect(version.nativeDeps).with.length(2);
                    done();
                });
        });

        it('should fail if the native app dependency version is not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps')
                .send({name: "react-native-maps"})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    expect(version.nativeDeps).with.length(2);
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/foo/platforms/android/versions/4.1/nativedeps')
                .send({name: "react-native-maps", version: "0.31.2"})
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app platform does not exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/foo/versions/4.1/nativedeps')
                .send({name: "react-native-maps", version: "0.31.2"})
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app version does not exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/foo/versions/4.8/nativedeps')
                .send({name: "react-native-maps", version: "0.31.2"})
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps', () => {
        it('should retrieve all native dependencies associated with a native app version', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array').with.length(2);
                    expect(res.body[0]).to.be.a('object')
                    expect(res.body[0]).with.property('name').to.be.a('string');
                    expect(res.body[0]).with.property('version').to.be.a('string');
                    done();
                });
        });

        it('should fail if app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo/platforms/android/versions/4.1/nativedeps')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if platform does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.1/nativedeps')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if native app version does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.8/nativedeps')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('PATCH /nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}', () => {
        it('should fail with 404 if the nativedep does not exists', (done) => {
            chai.request(serverUri)
                .patch('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps/invalid-dep')
                .send({version: "0.34.0"})
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should update the native dependency version if specified', (done) => {
            chai.request(serverUri)
                .patch('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps/react-native')
                .send({version: "0.34.0"})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let nativeDep = cauldronHelper.getNativeDependency(version, "react-native");
                    expect(nativeDep).not.undefined;
                    expect(nativeDep.version).eql('0.34.0');
                    done();
                });
        });

        it('should not do anything if the native dependency version if unspecified', (done) => {
            chai.request(serverUri)
                .patch('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps/react-native')
                .send({})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let nativeDep = cauldronHelper.getNativeDependency(version, "react-native");
                    expect(nativeDep).not.undefined;
                    expect(nativeDep.version).eql('0.32.0');
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}', () => {
        it('should retrieve the native dependency', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps/react-native')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('object');
                    expect(res.body).with.property('name').eql('react-native');
                    expect(res.body).with.property('version').eql('0.32.0');
                    done();
                });
        });

        it('should fail if app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo/platforms/android/versions/4.1/nativedeps/react-native')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if platform does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.1/nativedeps/react-native')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if native app version does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.8/nativedeps/react-native')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if native dependency does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps/foo')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('DELETE /nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}', () => {
        it('should remove the native app version associated to a platform', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps/react-native')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.empty;
                    const version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    expect(version.nativeDeps).with.length(1);
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/foo/platforms/android/versions/4.1/nativedeps/react-native')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app platform does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/foo/versions/4.1/nativedeps/react-native')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app version does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/foo/versions/4.8/nativedeps/react-native')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app dependency does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/android/versions/4.1/nativedeps/foo')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('POST /nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps', () => {
        it('should add a react native app to a given native app platform and version', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps')
                .send({name: "react-native-checkout", version: "1.0.0", isInBinary: true})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let nappVersion = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let rnApp = cauldronHelper.getReactNativeApp(nappVersion, "react-native-checkout");
                    expect(rnApp).to.be.a('array').with.length(1);
                    done();
                });
        });

        it('should not do anything if the react native app already exists with the same version', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps')
                .send({name: "react-native-cart", version: "1.0.1", isInBinary: false})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let nappVersion = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let rnApp = cauldronHelper.getReactNativeApp(nappVersion, "react-native-cart");
                    expect(rnApp).to.be.a('array').with.length(2);
                    done();
                });
        });

        it('should add the react native app if the react native app version not yet exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps')
                .send({name: "react-native-cart", version: "1.0.3", isInBinary: false})
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let rnApp = cauldronHelper.getReactNativeApp(version, "react-native-cart");
                    expect(rnApp).to.be.a('array').with.length(2);
                    done();
                });
        });

        it('should fail if the react native app name is not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps')
                .send({version: "1.0.3", isInBinary: false})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let rnApp = cauldronHelper.getReactNativeApp(version, "react-native-cart");
                    expect(rnApp).to.be.a('array').with.length(2);
                    done();
                });
        });

        it('should fail if the react native app version is not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps')
                .send({name: "react-native-cart", isInBinary: false})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let rnApp = cauldronHelper.getReactNativeApp(version, "react-native-cart");
                    expect(rnApp).to.be.a('array').with.length(2);
                    done();
                });
        });

        it('should fail if the react native app isInBinary is not specified', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps')
                .send({name: "react-native-cart", version: "1.0.3"})
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let rnApp = cauldronHelper.getReactNativeApp(version, "react-native-cart");
                    expect(rnApp).to.be.a('array').with.length(2);
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/foo/platforms/android/versions/4.1/reactnativeapps')
                .send({name: "react-native-cart", version: "1.0.3", isInBinary: false})
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app platform does not exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/foo/versions/4.1/reactnativeapps')
                .send({name: "react-native-cart", version: "1.0.3", isInBinary: false})
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app version does not exists', (done) => {
            chai.request(serverUri)
                .post('/nativeapps/walmart/platforms/foo/versions/4.8/reactnativeapps')
                .send({name: "react-native-cart", version: "1.0.3", isInBinary: false})
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps', () => {
        it('should retrieve all react native apps associated with a native app version', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array').with.length(2);
                    done();
                });
        });

        it('should fail if app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo/platforms/android/versions/4.1/reactnativeapps')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if platform does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.1/reactnativeapps')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if native app version does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.8/reactnativeapps')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps/{reactnativeapp}', () => {
        it('should retrieve the react native app', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps/react-native-cart')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array').with.length(2);
                    done();
                });
        });

        it('should fail if app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/foo/platforms/android/versions/4.1/reactnativeapps/react-native-cart')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if platform does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.1/reactnativeapps/react-native-cart')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if native app version does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/foo/versions/4.8/reactnativeapps/react-native-cart')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if react native app does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps/foo')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('DELETE /nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps/{reactnativeapp}', () => {
        it('should remove the react native app', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps/react-native-cart')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.empty;
                    let version = cauldronHelper.getVersion("walmart", "android", "4.1");
                    let rnApp = cauldronHelper.getReactNativeApp(version, "react-native-cart");
                    expect(rnApp).to.be.a('array').with.length(0);
                    done();
                });
        });

        it('should fail if the native app does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/foo/platforms/android/versions/4.1/reactnativeapps/react-native-cart')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app platform does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/foo/versions/4.1/reactnativeapps/react-native-cart')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the native app version does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/foo/versions/4.8/reactnativeapps/react-native-cart')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });

        it('should fail if the react native app does not exists', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps/foo')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('POST /nativeapps/{app}/platforms/{platform}/versions/{version}/binary', () => {
        it('should successfully upload an android binary', (done) => {
            writeTmp(() => {
                chai.request(serverUri)
                    .post('/nativeapps/walmart/platforms/android/versions/4.1/binary')
                    .set('Content-Type', 'application/octet-stream')
                    .send(fs.readFileSync('./tmpfile'))
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        let nappVersion = cauldronHelper.getVersion("walmart", "android", "4.1");
                        expect(nappVersion.binary).to.be.a('string').eql('5c594be4bf2d6d63ac92be8d28915e7632aa7563');
                        done();
                    });
            });
        });
        it('should successfully upload an ios binary', (done) => {
            writeTmp(() => {
                // Create platform/version beforehand
                chai.request(serverUri)
                    .post('/nativeapps/walmart/platforms')
                    .send({name: "ios", versions: [{name: "5.0", ernPlatformVersion: "1"}]})
                    .end((err, res) => {
                        chai.request(serverUri)
                            .post('/nativeapps/walmart/platforms/ios/versions/5.0/binary')
                            .set('Content-Type', 'application/octet-stream')
                            .send(fs.readFileSync('./tmpfile'))
                            .end((err, res) => {
                                expect(res).to.have.status(200);
                                let nappVersion = cauldronHelper.getVersion("walmart", "ios", "5.0");
                                expect(nappVersion.binary).to.be.a('string').eql('5c594be4bf2d6d63ac92be8d28915e7632aa7563');
                                done();
                            });
                    });
            });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}/versions/{version}/binary', () => {
        it('should successfully retrieve a binary', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1/binary')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    done();
                });
        });
    });

    describe('GET /nativeapps/{app}/platforms/{platform}/versions/{version}/binary/hash', () => {
        it('should successfully retrieve the binary hash', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.1/binary/hash')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('object');
                    expect(res.body.hash).eql('cf23df2207d99a74fbe169e3eba035e633b65d94');
                    done();
                });
        });

        it('should fail if binary does not exists', (done) => {
            chai.request(serverUri)
                .get('/nativeapps/walmart/platforms/android/versions/4.2/binary/hash')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });

    describe('DELETE /nativeapps/{app}/platforms/{platform}/versions/{version}/binary', () => {
        it('should successfully remove a binary', (done) => {
            chai.request(serverUri)
                .delete('/nativeapps/walmart/platforms/android/versions/4.1/binary')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    done();
                });
        });
    });

    describe('POST /reactnativeapps/{app}/versions/{version}/sourcemap', () => {

        it('should successfully upload a source map', (done) => {
            writeTmp(() => {
                // Create platform/version beforehand
                chai.request(serverUri)
                    .post('/reactnativeapps/react-native-cart/versions/1.2.3/sourcemap')
                    .set('Content-Type', 'application/octet-stream')
                    .send(fs.readFileSync('./tmpfile'))
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        done();
                    });
            });
        });
    });

    describe('GET /reactnativeapps/{app}/versions/{version}/sourcemap', () => {
        it('should successfully retrieve a sourcemap', (done) => {
            chai.request(serverUri)
                .get('/reactnativeapps/react-native-cart/versions/1.2.3/sourcemap')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    done();
                });
        });

        it('should fail if sourcemap does not exists', (done) => {
            chai.request(serverUri)
                .get('/reactnativeapps/react-native-cart/versions/1.2.4/sourcemap')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    done();
                });
        });
    });
});
