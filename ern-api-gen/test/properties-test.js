import { expect, assert } from 'chai'
import factory from '../src/models/factory'
import * as propTypes from '../src/models/properties'

function isClass(clz, compare) {
  assert(clz instanceof propTypes[compare], `an instance of ${compare}`)
}

describe('properties', function() {
  it('StringProperty', function() {
    const strp = factory({
      type: 'string',
    })
    expect(strp instanceof propTypes.StringProperty).to.be.true
    expect(strp.getType()).to.eql('string')
  })
  it('DateProperty', function() {
    const strp = factory({
      type: 'string',
      format: 'date',
    })
    expect(strp instanceof propTypes.DateProperty).to.be.true
    expect(strp.getFormat()).to.eql('date')
  })

  it('ObjectProperty', function() {
    const strp = factory({
      type: 'object',
      properties: {
        num1: {
          type: 'number',
          description: 'is a number',
        },
        date1: {
          type: 'string',
          format: 'date',
        },
        obj1: {
          type: 'object',
          properties: {
            prop1: {
              type: 'string',
            },
          },
        },
      },
      required: ['obj1'],
    })

    isClass(strp, 'ObjectProperty')
    isClass(strp.getProperties().get('num1'), 'NumberProperty')
    isClass(
      strp
        .getProperties()
        .get('obj1')
        .getProperties()
        .get('prop1'),
      'StringProperty'
    )
  })
  it('ArrayProperty', function() {
    const strp = factory({
      properties: {
        offset: {
          type: 'integer',
          format: 'int32',
          description: 'Position in pagination.',
        },
        limit: {
          type: 'integer',
          format: 'int32',
          description: 'Number of items to retrieve (100 max).',
        },
        count: {
          type: 'integer',
          format: 'int32',
          description: 'Total number of items available.',
        },
        history: {
          type: 'array',
          items: {
            $ref: '#/definitions/Activity',
          },
        },
      },
    })

    isClass(strp, 'ObjectProperty')
    const history = strp.getProperties().get('history')
    isClass(history, 'ArrayProperty')
    const items = history.getItems()
    isClass(items, 'RefProperty')
    expect(items.get$ref()).to.eql('#/definitions/Activity')
  })
})
