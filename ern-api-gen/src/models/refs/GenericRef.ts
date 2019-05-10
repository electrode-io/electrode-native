import RefFormat from './RefFormat'
/**
 * A class the encapsulates logic that is common to RefModel, RefParameter, and RefProperty.
 */
export default class GenericRef {
  public static computeSimpleRef = (ref, format, type) => {
    if (format === RefFormat.INTERNAL) {
      return ref.substring(type.getInternalPrefix().length)
    }
    return ref
  }

  public static computeRefFormat = ref => {
    if (ref.startsWith('http:') || ref.startsWith('https:')) {
      return RefFormat.URL
    } else if (ref.startsWith('#/')) {
      return RefFormat.INTERNAL
    } else if (ref.startsWith('.') || ref.startsWith('/')) {
      return RefFormat.RELATIVE
    }

    return RefFormat.INTERNAL
  }

  public ref
  public format
  public type
  public simpleRef

  constructor(type, ref) {
    if (type != null && typeof ref === 'string') {
      this.format = GenericRef.computeRefFormat(ref)
      this.type = type
      if (this.format === RefFormat.INTERNAL && !ref.startsWith('#/')) {
        this.ref = type.getInternalPrefix() + ref
      } else {
        this.ref = ref
      }
      this.simpleRef = GenericRef.computeSimpleRef(this.ref, this.format, type)
    }
  }

  public getFormat() {
    return this.format
  }

  public getType() {
    return this.type
  }

  public getRef() {
    return this.ref
  }

  public getSimpleRef() {
    return this.simpleRef
  }
}
