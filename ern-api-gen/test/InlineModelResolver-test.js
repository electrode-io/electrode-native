import InlineModelResolver from '../src/InlineModelResolver'
import Swagger from '../src/java/Swagger'
import path from 'path'
import {assert} from 'chai'
describe('InlineModelResolver', function () {
  it('should flatten', async function () {
    const definition = path.join(__dirname, 'fixtures', 'uber.json')
    const swagger = await Swagger.create({definition})
    const imr = new InlineModelResolver()
    imr.flatten(swagger)
    const defs = swagger.getDefinitions()
    try {
      JSON.stringify(defs, null, 2)
      assert(true, `Was stringable`)
    } catch (e) {
      assert(false, `stringify should not throw`)
    }
  })
})
