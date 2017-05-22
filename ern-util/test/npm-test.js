import {
  IMPLEMENTATION
} from '../src/exec'
import {
  npm
} from '../src/npm'
import chai from 'chai'
import dirtyChai from 'dirty-chai'

const expect = chai.expect
chai.use(dirtyChai)

const {exec} = IMPLEMENTATION

describe('npm', function () {
  afterEach(() => {
    IMPLEMENTATION.exec = exec
  })
  it('should npm', async() => {
    IMPLEMENTATION.exec = function (cmd, args, done) {
      expect(cmd).to.eql('npm install -i whatever')

      done()
    }
    await npm('install', ['-i', 'whatever'])
  })
  it('should fail', async() => {
    IMPLEMENTATION.exec = function (cmd, args, done) {
      expect(cmd).to.eql('npm install -i whatever')

      done(1, null, `an error`)
    }
    try {
      await npm('install', ['-i', 'whatever'])
    } catch (e) {
      expect(e).to.exist()
      return
    }
    expect(false).to.be.true()
  })
})
