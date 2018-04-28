import ExampleGenerator from '../src/examples/ExampleGenerator'
import factory from '../src/models/factory'
import { expect } from 'chai'
import Xml from '../src/models/Xml'
import ModelImpl from '../src/models/ModelImpl'
import { StringProperty } from '../src/models/properties'
import { newHashMap } from '../src/java/javaUtil'
describe('XmlExampleGenerator', function() {
  it('should recursiveModelsTest', function() {
    const _JSON = 'application/json'
    const XML = 'application/xml'

    const nodeType = 'Node'
    const ref = factory({
      $ref: nodeType,
    })
    const node = new ModelImpl()
      .name(nodeType)
      .property('name', new StringProperty())
      .property('parent', ref)
      .property(
        'children',
        factory({
          type: 'array',
          items: ref,
        })
      )
      .property(
        'wrappedChildren',
        factory({
          type: 'array',
          items: ref,
          xml: new Xml().wrapped(true),
        })
      )
    const pairType = 'Pair'
    const pair = new ModelImpl().name(pairType)
    for (const [key, value] of newHashMap(
      ['first', 'First'],
      ['second', 'Second']
    )) {
      let property = factory({
        $ref: nodeType,
      })
      property.setXml(new Xml().name(value))
      pair.property(key, property)
    }
    let types = new Set()
    let expectedTypes = [_JSON, XML]
    let eg = new ExampleGenerator(
      newHashMap([nodeType, node], [pairType, pair])
    )

    const gen = JSON.parse(
      eg.generate(
        null,
        expectedTypes,
        factory({
          $ref: pairType,
        })
      )
    )
    for (const { contentType, example } of gen) {
      if (XML === contentType) {
        types.add(XML)
        expect(example).to.eql(
          '<Pair>\n  <Node>\n    <name>string</name>\n    <wrappedChildren>\n    </wrappedChildren>\n  </Node>\n  <Node>\n    <name>string</name>\n    <wrappedChildren>\n    </wrappedChildren>\n  </Node>\n</Pair>'
        )
      } else if (_JSON === contentType) {
        types.add(_JSON)
        expect(JSON.parse(example)).to.eql({
          first: {
            name: 'aeiou',
            parent: '',
            children: [''],
            wrappedChildren: [''],
          },
          second: '',
        })
      }
    }
    expect(types.size).to.eql(expectedTypes.length)
  })
  it('should xml', function() {
    const xml = new Xml()
    xml
      .namespace('test')
      .prefix('prefix')
      .attribute(true)
  })
})
