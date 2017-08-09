import {apply} from '../java/beanUtils'

export default class Xml {
  constructor (obj) {
    obj && apply(this, obj)
  }

  name (name) {
    this.setName(name)
    return this
  }

  namespace (namespace) {
    this.setNamespace(namespace)
    return this
  }

  prefix (prefix) {
    this.setPrefix(prefix)
    return this
  }

  attribute (attribute) {
    this.setAttribute(attribute)
    return this
  }

  wrapped (wrapped) {
    this.setWrapped(wrapped)
    return this
  }

  getName () {
    return this.__name
  }

  setName (name) {
    this.__name = name
  }

  getNamespace () {
    return this.__namespace
  }

  setNamespace (namespace) {
    this.__namespace = namespace
  }

  getPrefix () {
    return this.__prefix
  }

  setPrefix (prefix) {
    this.__prefix = prefix
  }

  getAttribute () {
    return this.__attribute
  }

  setAttribute (attribute) {
    this.__attribute = attribute
  }

  getWrapped () {
    return this.__wrapped
  }

  setWrapped (wrapped) {
    this.__wrapped = wrapped
  }
}
