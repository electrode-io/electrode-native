
public class SystemTestsRequests: SystemTestsAPIRequests {

    public override func registerTestArrayOfStringsRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) {
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: SystemTestsAPI.kRequestTestArrayOfStrings,
    reqClass: Array<Any>.self, reqItemType: String.self,
    respClass: [ErnObject].self,
    requestCompletionHandler: handler)
        requestHandlerProcessor.execute()
    }

    public override func registerTestMultiArgsRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) {
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: SystemTestsAPI.kRequestTestMultiArgs,
    reqClass: TestMultiArgsData.self, 
    respClass: String.self,
    requestCompletionHandler: handler)
        requestHandlerProcessor.execute()
    }

    //------------------------------------------------------------------------------------------------------------------------------------


    public override func testArrayOfStrings(key: [String], responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<[String], [ErnObject], Any>(
            requestName: SystemTestsAPI.kRequestTestArrayOfStrings,
            requestPayload: key,
            respClass: [ErnObject].self,
            responseItemType: ErnObject.self,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }

    public override func testMultiArgs(testMultiArgsData: TestMultiArgsData, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<TestMultiArgsData, String, Any>(
            requestName: SystemTestsAPI.kRequestTestMultiArgs,
            requestPayload: testMultiArgsData,
            respClass: String.self,
            responseItemType: nil,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }
}