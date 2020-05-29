import AbstractModel from './AbstractModel'
import { DEFINITION } from './refs/RefType'
import GenericRef from './refs/GenericRef'

export default class RefModel extends AbstractModel {
  public description
  public properties
  public genericRef
  public example

  constructor(ref?: any) {
    super()
    if (typeof ref === 'string') {
      this.set$ref(ref)
    }
  }

  public asDefault(ref) {
    this.setReference(DEFINITION.getInternalPrefix() + ref)
    return this
  }

  public getTitle() {
    return this.title
  }

  public setTitle(title) {
    this.title = title
  }

  public getDescription() {
    return this.description
  }

  public setDescription(description) {
    this.description = description
  }

  public getProperties() {
    return this.properties
  }

  public setProperties(properties) {
    this.properties = properties
  }

  public getSimpleRef() {
    return this.genericRef.getSimpleRef()
  }

  public get$ref() {
    return this.genericRef.getRef()
  }

  public set$ref(ref) {
    this.genericRef = new GenericRef(DEFINITION, ref)
  }

  public getRefFormat() {
    return this.genericRef.getFormat()
  }

  public getExample() {
    return this.example
  }

  public setExample(example) {
    this.example = example
  }

  public getExternalDocs() {
    return this.externalDocs
  }

  public setExternalDocs(value) {
    this.externalDocs = value
  }

  public clone() {
    const res = new RefModel()
    res.description = this.description
    res.properties = this.properties
    res.genericRef = this.genericRef
    res.example = this.example
    res.vendorExtensions = this.vendorExtensions
    res.externalDocs = this.externalDocs
    res.title = this.title
    res.reference = this.reference
    return res
  }

  public getVendorExtensions(): any {
    return null
  }

  public getReference() {
    return this.genericRef.getRef()
  }

  public setReference(reference) {
    this.set$ref(reference)
  }
}
