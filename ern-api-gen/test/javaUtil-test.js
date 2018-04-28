import { HashMap, newHashMap, newHashSet } from '../src/java/javaUtil'
import { expect } from 'chai'
import BooleanHelper from '../src/java/BooleanHelper'

describe('javaUtil', function() {
  describe('BooleanHelper', function() {
    it('should parseBoolean', function() {
      expect(BooleanHelper.parseBoolean('true')).to.be.true
      expect(BooleanHelper.parseBoolean('True')).to.be.true
      expect(BooleanHelper.parseBoolean('TRUE')).to.be.true
      expect(BooleanHelper.parseBoolean(true)).to.be.true
      expect(BooleanHelper.parseBoolean(1)).to.be.true
      expect(BooleanHelper.parseBoolean(0)).to.be.false
      expect(BooleanHelper.parseBoolean(false)).to.be.false
      expect(BooleanHelper.parseBoolean('FALSE')).to.be.false
    })
  })
  describe('HashMap', function() {
    it('should create an iterator of entrySet', () => {
      const itr = newHashMap(['a', 1], ['b', 2], ['c', 3])
        .entrySet()
        .iterator()
      let n = itr.next()
      expect(n.getKey()).to.eql('a')
      expect(n.getValue()).to.eql(1)
      expect(itr.hasNext()).to.be.true

      n = itr.next()
      expect(n.getKey()).to.eql('b')
      expect(n.getValue()).to.eql(2)
      expect(itr.hasNext()).to.be.true

      n = itr.next()
      expect(n.getKey()).to.eql('c')
      expect(n.getValue()).to.eql(3)

      expect(itr.hasNext()).to.be.false
    })
    it('should putAll/containsValue/get', function() {
      const p1 = newHashMap(['a', 1], ['b', 2])
      const p2 = newHashMap(['b', 4], ['c', 3])
      p1.putAll(p2)
      expect(p1.size).to.eql(3)
      expect(p1.get('a')).to.eql(1)
      expect(p1.get('b')).to.eql(4)
      expect(p1.get('c')).to.eql(3)
      expect(p1.containsValue(1)).to.be.true
    })
    it('should keySet', function() {
      const ks = newHashMap(['a', 1], ['b', 2]).keySet()
      expect(ks.size).to.eql(2)
      expect(ks.contains('a')).to.be.true
      expect(ks.contains('b')).to.be.true
      expect(ks.contains('c')).to.be.false
    })
  })
  describe('HashSet', function() {
    it('should add/addAll', function() {
      const h = newHashSet('a')
      expect(h.add('a')).to.be.false
      expect(h.add('b')).to.be.true
      expect(h.addAll(newHashSet('a', 'b'))).to.be.false
      expect(h.addAll(['c', 'd'])).to.be.true
    })
  })
})
