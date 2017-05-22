import ModelImpl from '../src/models/ModelImpl'
import RefModel from '../src/models/RefModel'
import ArrayModel from '../src/models/ArrayModel'
import ComposedModel from '../src/models/ComposedModel'
import {expect} from 'chai'
import RefFormat from '../src/models/refs/RefFormat'
describe('models', function () {
  it('should ModelImpl', () => {
    const m = new ModelImpl().description('test model').type('object').property('key', {type: 'string'})
    expect(m).to.be.instanceOf(ModelImpl)
    const str = m.getProperties().get('key')

    expect(str.type).to.eql('string')

    expect(m.clone()).to.be.instanceOf(ModelImpl)
  })
  it('should ArrayModel', () => {
    const m = new ArrayModel().description('test model').items({type: 'integer'}).minItems(1).maxItems(3)
    expect(m).to.be.instanceOf(ArrayModel)
    expect(m.getItems().type).to.be.eql('integer')
    const mc = m.clone()
    expect(mc).to.be.instanceOf(ArrayModel)
    expect(mc.getItems().type).to.be.eql('integer')
  })
  it('should RefModel', () => {
    const m = new RefModel().asDefault('Pet')
    m.setExternalDocs('what')
    expect(m.getVendorExtensions()).to.be.null
    expect(m).to.be.instanceOf(RefModel)
    expect(m.getSimpleRef()).to.eql('Pet')
    expect(m.getRefFormat()).to.eql(RefFormat.INTERNAL)
    m.setTitle('a title')
    expect(m.getTitle()).to.eql('a title')
    const ref = m.getReference()
    expect(ref).to.eql('#/definitions/Pet')

    m.setExample('exmaple')
    expect(m.getExample()).to.eql('exmaple')
    expect(m.getExternalDocs()).to.eql('what')
    expect(m.clone()).to.be.instanceOf(RefModel)
    m.setDescription('test description')
    expect(m.getDescription()).to.eql('test description')
  })
  it('should ComposedModel', () => {
    const c = new ComposedModel().child(new ModelImpl().type('object')).parent(new ModelImpl())
  })
})
