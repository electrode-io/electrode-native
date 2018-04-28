import { newHashMap } from './java/javaUtil'

export default class CodegenModelFactory {
  static typeMapping = newHashMap()

  /**
   * Configure a different implementation class.
   *
   * @param type           the type that shall be replaced
   * @param implementation the implementation class must extend the default class and must provide a public no-arg constructor
   */
  static setTypeMapping = function(type, implementation) {
    if (
      !(implementation.prototype instanceof type.getDefaultImplementation())
    ) {
      throw new Error(implementation + " doesn't extend " + type)
    }

    CodegenModelFactory.typeMapping.put(type, implementation)
  }
  static newInstance = function(type) {
    const classType =
      CodegenModelFactory.typeMapping.get(type) ||
      type.getDefaultImplementation()
    return new classType()
  }
}
