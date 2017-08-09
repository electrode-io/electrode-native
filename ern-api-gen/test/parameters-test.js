import parameters, {RefParameter, BodyParameter} from '../src/models/parameters'
import {ObjectProperty} from '../src/models/properties'
import {expect} from 'chai'
import RefFormat from '../src/models/refs/RefFormat'
import ModelImpl from '../src/models/ModelImpl'

describe('parameters', function () {
  it('should RefParameter', function () {
    const r = parameters({$ref: '#!/definitions/Whatever'})
    expect(r).to.be.instanceOf(RefParameter)

    const rp = new RefParameter().asDefault('#/definitions/Whatever')
    expect(rp.getRefFormat()).to.eql(RefFormat.INTERNAL)
    expect(rp.getSimpleRef()).to.eql('#/definitions/Whatever')
  })
  it('should BodyParameter', function () {
    const r = parameters({in: 'body', schema: {properties: {name: {type: 'string'}}}})
    expect(r).to.be.instanceOf(BodyParameter)
    expect(r.getSchema()).to.be.instanceof(ModelImpl)
    const cr = r.copy()
    expect(cr).to.be.instanceof(BodyParameter)
    expect(cr.getSchema()).to.be.instanceof(ModelImpl)
    expect(cr !== r).to.be.true

    cr.setVendorExtension('-xstuff', 'true')
    expect(cr.getVendorExtensions().get('-xstuff')).to.eql('true')
  })
})
