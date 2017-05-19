import spin from '../src/spin'
import chai from 'chai'
import dirtyChai from 'dirty-chai'

const expect = chai.expect
chai.use(dirtyChai)

describe('spin', function () {
  it('should spin', async() => {
    const res = await spin('hello', Promise.resolve(true))
    expect(res).to.be.true()
  })
  it('should fail', async() => {
    try {
      await spin('hello', Promise.reject(new Error('whatever')))
      expect(true).to.be.false()
    } catch (e) {
      expect(e).to.exist()
      return
    }
    expect(false).to.be.true()
  })
})
