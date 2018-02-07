// @flow


export default class SystemTestsRequests {
    constructor(bridge) {
     this._bridge = bridge;
    }

        /**
         * Registers a handler for a particular api.  This allows javascript to handle a request from native.
         * @param The handler function, taking a single parameter being the data of the request and returning a Promise. Implementer of the handler should either resolve the promise with an object being the response data (if any) or reject the promise with an Error
         */
    registerTestArrayOfStringsRequestHandler( handler : Function): Promise<any> {
        this._bridge.registerRequestHandler("com.ComplexApi.ern.api.request.testArrayOfStrings", handler);
    }
        /**
         * Registers a handler for a particular api.  This allows javascript to handle a request from native.
         * @param The handler function, taking a single parameter being the data of the request and returning a Promise. Implementer of the handler should either resolve the promise with an object being the response data (if any) or reject the promise with an Error
         */
    registerTestMultiArgsRequestHandler( handler : Function): Promise<any> {
        this._bridge.registerRequestHandler("com.ComplexApi.ern.api.request.testMultiArgs", handler);
    }

    //------------------------------------------------------------------------------------------------------------------------------------


    /**
      * @param  key keys to get setting
      * @param integer timeout in milliseconds
      * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<module:com.ComplexApi.ern.model/ErnObject> }
      */

     testArrayOfStrings(key: any,timeout: number): Promise<any> {
                return this._bridge.sendRequest("com.ComplexApi.ern.api.request.testArrayOfStrings", { data:key, timeout });

    }

    /**
      * This is a test for multiple arguments.
      * @param  key1 first argument
      * @param  key2 second argument
      * @param integer timeout in milliseconds
      * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link String }
      */

     testMultiArgs(key1: string, key2: number,timeout: number): Promise<any> {
     const data =  {}
        // verify the required parameter 'key1' is set
        if (key1  == null) {
        throw "Missing the required parameter 'key1' when calling 'SystemTestsApi#testMultiArgs'";
        }
        // verify the required parameter 'key2' is set
        if (key2  == null) {
        throw "Missing the required parameter 'key2' when calling 'SystemTestsApi#testMultiArgs'";
        }
           data['key1'] = key1;
           data['key2'] = key2;
        return this._bridge.sendRequest("com.ComplexApi.ern.api.request.testMultiArgs", { data, timeout })
    }
}
