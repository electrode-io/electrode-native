// @flow

export default class SystemTestsRequests {
  _bridge: Object;

  constructor(bridge: Object) {
    this._bridge = bridge;
  }

  /**
   * Registers a handler for a particular api. This allows JavaScript to handle a request from native.
   * @param handler The handler function, taking a single parameter being the data of the request and returning a Promise. Implementer of the handler should either resolve the promise with an object being the response data (if any) or reject the promise with an Error
   */
  registerTestArrayOfStringsRequestHandler(handler: Function) {
    this._bridge.registerRequestHandler(
      'com.complex.ern.api.request.testArrayOfStrings',
      handler,
    );
  }

  /**
   * Registers a handler for a particular api. This allows JavaScript to handle a request from native.
   * @param handler The handler function, taking a single parameter being the data of the request and returning a Promise. Implementer of the handler should either resolve the promise with an object being the response data (if any) or reject the promise with an Error
   */
  registerTestMultiArgsRequestHandler(handler: Function) {
    this._bridge.registerRequestHandler(
      'com.complex.ern.api.request.testMultiArgs',
      handler,
    );
  }

  /**
   * @param  key keys to get setting
   * @param timeout timeout in milliseconds
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<module:com.complex.ern.model/ErnObject> }
   */
  testArrayOfStrings(key: any, timeout: number): Promise<any> {
    return this._bridge.sendRequest('com.complex.ern.api.request.testArrayOfStrings', {
      data: key,
      timeout,
    });
  }

  /**
   * This is a test for multiple arguments.
   * @param  key1 first argument
   * @param  key2 second argument
   * @param timeout timeout in milliseconds
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link String }
   */
  testMultiArgs(key1: string, key2: number, timeout: number): Promise<any> {
    const data = {};
    // verify the required parameter 'key1' is set
    if (key1 == null) {
      throw "Missing the required parameter 'key1' when calling 'SystemTestsApi#testMultiArgs'";
    }
    // verify the required parameter 'key2' is set
    if (key2 == null) {
      throw "Missing the required parameter 'key2' when calling 'SystemTestsApi#testMultiArgs'";
    }
    data.key1 = key1;
    data.key2 = key2;
    return this._bridge.sendRequest('com.complex.ern.api.request.testMultiArgs', {
      data,
      timeout,
    });
  }
}
