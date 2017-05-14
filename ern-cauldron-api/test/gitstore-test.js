import GitStore from  '../src/gitstore';
import {expect} from 'chai';
import {makeAndDeleteDir} from './support';

describe('GitStore', function () {
  this.timeout(50000);
  it('should initialize', function () {
    var gs = new GitStore();
  });
  
  it('should sync no repository', makeAndDeleteDir(async (path) => {
    console.log('path', path);
    var gs = new GitStore(path);
    await gs.getCauldron();
  }));
  it('should sync with repository', makeAndDeleteDir(async (path) => {
    console.log('path', path);
    var gs = new GitStore(path, 'git@gecgithub01.walmart.com:Electrode-Mobile-Platform/cauldron-test-repo.git');
    console.log('init');
    await gs.getCauldron();
    console.log('began')
  }));
  it('should sync with repository with changes', makeAndDeleteDir(async (path) => {
    console.log('path', path);
    const gs = new GitStore(path, 'git@gecgithub01.walmart.com:Electrode-Mobile-Platform/cauldron-test-repo.git');
    await gs.getCauldron();
    gs.cauldron.stuff = true;
    await gs.commit('Added stuff');
    expect(gs.cauldron.stuff).to.be.true;
    await gs.getCauldron();
    expect(gs.cauldron.stuff).to.be.true;
    const gs2 = new GitStore(path, 'git@gecgithub01.walmart.com:Electrode-Mobile-Platform/cauldron-test-repo.git');
    await gs2.getCauldron();
    expect(gs2.cauldron.stuff).to.be.true;
    gs2.cauldron.stuff = false;
    
    await gs2.commit();
    
    await gs.getCauldron();
    expect(gs.cauldron.stuff).to.be.false;
    expect(gs2.cauldron.stuff).to.be.false;
    
  }));
  
  
});