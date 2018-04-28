import SwaggerCodegen from '../src/SwaggerCodegen'
import { expect } from 'chai'
import ernUtilDev from 'ern-util-dev'

function execTest(out, resolve = console.log, reject = console.error) {
  return async function() {
    try {
      const parts = this.test.title.split(' ')
      if (out) parts.push(...out.split(' '))
      const ret = await SwaggerCodegen.main(parts)
      resolve && resolve(ret || '')
    } catch (e) {
      reject && reject(e)
    }
  }
}
describe('SwaggerCodegen', function() {
  const { runBefore, runAfter, cwd } = ernUtilDev(__dirname)
  before(runBefore)
  after(runAfter)
  it('should parse empty', execTest())
  it('langs', execTest())
  it('-h', execTest())
  it('config-help -l Android', execTest())
  it('config-help -l Swift', execTest())
  it('config-help -l javascript', execTest())

  it(
    'generate -l android -h  -i ./test/fixtures/petstore.json',
    execTest(`-o ${cwd('petstore')}`)
  )
  it(
    'generate -l android -i ./test/fixtures/uber.json',
    execTest(`-o ${cwd('uber')}`)
  )
  it('meta -n Test', execTest(`-o ${cwd('meta')}`))
  it('generate -l android -h', execTest())
})
