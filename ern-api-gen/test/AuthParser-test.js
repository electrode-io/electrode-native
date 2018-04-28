import AuthParser from '../src/auth/AuthParser'
import { expect } from 'chai'
import auth from '../src/models/auth'
import OAuth2Definition from '../src/models/auth/OAuth2Definition'
import ApiKeyAuthDefinition from '../src/models/auth/ApiKeyAuthDefinition'
import BasicAuthDefinition from '../src/models/auth/BasicAuthDefinition'

describe('AuthParser', function() {
  it('should #parse', function() {
    const ret = AuthParser.parse('user:stuff')
    expect(ret).to.exist
    expect(ret[0]).to.exist
    const auth = ret[0]
    expect(auth.getValue()).to.eql('stuff')
    expect(auth.getType()).to.eql('header')
    expect(auth.getKeyName()).to.eql('user')
  })
  it('should #reconstruct', function() {
    const ret = AuthParser.parse('user:stuff')
    expect(AuthParser.reconstruct(ret)).to.eql('user:stuff')
  })
  it('should #oauth2', function() {
    const oauth = auth({
      type: 'oauth2',
      tokenUrl: 'tokenUrl',
      flow: 'flow',
      scopes: ['user:scope1', 'user:scope2'],
    })
    expect(oauth).to.be.instanceOf(OAuth2Definition)
    expect(JSON.stringify(oauth)).to.exist
  })
  it('should make oauth2 ', function() {
    const impl = new OAuth2Definition().implicit('whatever')
    const password = new OAuth2Definition().password('url')
    const application = new OAuth2Definition().application('app')
    const accessCode = new OAuth2Definition().accessCode('url', '123')
    accessCode.addScope('whatever', 'itis')
  })
  it('should #apiKey', function() {
    const a = auth({
      type: 'apiKey',
    })
    expect(a).to.be.instanceof(ApiKeyAuthDefinition)
    expect(JSON.stringify(a)).to.exist
  })
  it('should new apiKey', function() {
    const a = new ApiKeyAuthDefinition().name('what').in('HEADER')
    expect(a).to.be.instanceof(ApiKeyAuthDefinition)
    expect(a.toJSON()).to.eql({
      name: 'what',
      in: 'header',
      type: 'apiKey',
    })
  })
  it('should #basic', function() {
    const a = auth({
      type: 'basic',
    })
    expect(a).to.be.instanceof(BasicAuthDefinition)
    expect(JSON.stringify(a)).to.exist
  })
})
