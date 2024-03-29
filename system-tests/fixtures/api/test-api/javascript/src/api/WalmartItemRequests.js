// @flow

export default class WalmartItemRequests {
  _bridge: Object;

  constructor(bridge: Object) {
    this._bridge = bridge;
  }

  /**
   * Registers a handler for a particular api. This allows JavaScript to handle a request from native.
   * @param handler The handler function, taking a single parameter being the data of the request and returning a Promise. Implementer of the handler should either resolve the promise with an object being the response data (if any) or reject the promise with an Error
   */
  registerAddItemRequestHandler(handler: Function) {
    this._bridge.registerRequestHandler(
      'com.test.ern.api.request.addItem',
      handler,
    );
  }

  /**
   * Registers a handler for a particular api. This allows JavaScript to handle a request from native.
   * @param handler The handler function, taking a single parameter being the data of the request and returning a Promise. Implementer of the handler should either resolve the promise with an object being the response data (if any) or reject the promise with an Error
   */
  registerFindItemsRequestHandler(handler: Function) {
    this._bridge.registerRequestHandler(
      'com.test.ern.api.request.findItems',
      handler,
    );
  }

  /**
   * Creates a Item in the store.
   * @param  item Item to add
   * @param timeout timeout in milliseconds
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Boolean }
   */
  addItem(item: any, timeout: number): Promise<any> {
    return this._bridge.sendRequest('com.test.ern.api.request.addItem', {
      data: item,
      timeout,
    });
  }

  /**
   * Returns all items from the system that the user has access to
   * @param {Object} opts Optional parameters
   * @param opts.limit maximum number of results to return
   * @param timeout timeout in milliseconds
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<module:com.test.ern.model/Item> }
   */
  findItems(opts: any, timeout: number): Promise<any> {
    return this._bridge.sendRequest('com.test.ern.api.request.findItems', {
      data: opts,
      timeout,
    });
  }
}
