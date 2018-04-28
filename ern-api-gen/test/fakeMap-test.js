import { expect } from 'chai'
import newHashMap from '../src/java/fakeMap'

describe('fakeMap', function() {
  it('should create a new map', function() {
    const keys = [],
      values = []
    const stuff = newHashMap(['a', 1], ['b', 2], ['c', 3])
    for (const [key, value] of stuff) {
      keys.push(key)
      values.push(value)
    }
    expect(keys).to.eql(['a', 'b', 'c'])

    expect(stuff.keySet().toArray()).to.eql(['a', 'b', 'c'])
    expect(stuff.size).to.eql(3)
  })

  it('should create put key value', function() {
    const map = newHashMap(['a', 1])
    map.put('a', 2)
    map.put('b', 1)
    expect(map.size).to.eql(2)
  })
  it('should create get key value', function() {
    const map = newHashMap(['a', 1])
    map.put('a', 2)
    map.put('b', 3)
    expect(map.size).to.eql(2)

    expect(map.get('a')).to.eql(2)
    expect(map.get('b')).to.eql(3)
  })
})
