process.env.NODE_ENV = 'test';

import chai from 'chai';
const should = chai.should();
const expect = chai.expect;
import Api from '../src/api';
import Db from '../src/db';
import path from 'path';

let ch;

describe('CauldronHelper', () => {
    beforeEach((done) => {
        ch = new Api(new Db(path.join(__dirname, 'testdb.json')), null, null);
        ch.begin();
        done();
    });

    describe('getPlatform', () => {
        it('should return undefined if native app name does not exists', (done) => {
            expect(ch.getPlatform("foo", "android")).to.be.undefined;
            done();
        });
    });

    describe('getVersion', () => {
        it('should return undefined if native app platform does not exists', (done) => {
            expect(ch.getVersion("walmart", "foo", "4.1")).to.be.undefined;
            done();
        });
    });
});
