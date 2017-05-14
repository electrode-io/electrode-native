import Filestore from '../src/filestore'
import {makeAndDeleteDir} from './support';
import {expect} from 'chai';

describe('filestore', function () {
  this.timeout(50000);
  it('should add a file', makeAndDeleteDir(async (path) => {
    const fs = new Filestore(path, 'git@gecgithub01.walmart.com:Electrode-Mobile-Platform/cauldron-test-repo.git', 'master', 'test');
    const sha = await fs.storeFile('whatever', Buffer.from('A string'));
    expect(sha).to.eql('a6e141486fb5e5d6d75f084eae3f379fd21e36c2');
  }));
});