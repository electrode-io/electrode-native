import {expect} from 'chai'

function eql(value, describe){
  return function(result){
    expect(result, describe).to.eql(value);
  }
}
describe('util', function(){
  before(function(){

  });

  after(function(done){
    done();
  });

  beforeEach(function(done){
      done();
  });

  it('dummy test', function() {
    return Promise.resolve(true).then(eql(true, 'when true is true'));
  });

  describe("#someFunc-dummy", function(){
    it("should return true when true", function(){

    });
    it("should return false when false", function(){

    });

  })
})
