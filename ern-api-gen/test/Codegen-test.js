import CodegenModelTypes from '../src/CodegenModelType'
import {expect} from 'chai'
import CodegenModelFactory from '../src/CodegenModelFactory'
describe('Codegen', function () {
  describe('toString', function () {
    for (const name of Object.keys(CodegenModelTypes)) { it(`should ${name}.toString()`, () => expect((new (CodegenModelTypes[name].getDefaultImplementation())()).toString()).to.exist) }
  })
  describe('CodegenModelFactory', function () {
    it('should setTypeMapping', function () {
      const DefProp = CodegenModelTypes.PROPERTY.getDefaultImplementation()

      class NewProp extends DefProp {

            }
      CodegenModelFactory.setTypeMapping(CodegenModelTypes.PROPERTY, NewProp)

      const result = CodegenModelFactory.newInstance(CodegenModelTypes.PROPERTY)
      expect(result).to.be.instanceof(NewProp)
      CodegenModelFactory.typeMapping.remove(CodegenModelTypes.PROPERTY)
    })
    it('should fail setTypeMapping', function () {
      class NewProp {

            }
      try {
        CodegenModelFactory.setTypeMapping(CodegenModelTypes.PROPERTY, NewProp)
      } catch (e) {
        expect(e).to.exist
        return
      }
      expect(false).to.be.true
    })
  })
})
