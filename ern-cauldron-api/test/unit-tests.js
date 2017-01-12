process.env.NODE_ENV = 'test';

import fs from 'fs';
import chai from 'chai';
const should = chai.should();
const expect = chai.expect;
import { server, CauldronHelper, getCauldron, setCauldron } from '../api.js';

describe('TestHelpers', () => {
  it('should throw an error if trying to call getCauldron in non test env', (done) => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'prod';
    getCauldron.should.Throw();
    process.env.NODE_ENV = oldEnv;
    done();
  });

  it('should throw an error if trying to call setCauldron in non test env', (done) => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'prod';
    setCauldron.should.Throw();
    process.env.NODE_ENV = oldEnv;
    done();
  });
});


let ch;

describe('CauldronHelper', () => {
  beforeEach((done) => {
   let cauldron = JSON.parse(fs.readFileSync('test/testdb.json'));
   ch = new CauldronHelper(cauldron);
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
