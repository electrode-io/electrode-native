
public class NavigationRequests: NavigationAPIRequests {

    public override func registerNavigateRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) {
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: NavigationAPI.kRequestNavigate,
    reqClass: NavigateData.self, 
    respClass: Bool.self,
    requestCompletionHandler: handler)
        requestHandlerProcessor.execute()
    }

    //------------------------------------------------------------------------------------------------------------------------------------


    public override func navigate(navigateData: NavigateData, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<NavigateData, Bool, Any>(
            requestName: NavigationAPI.kRequestNavigate,
            requestPayload: navigateData,
            respClass: Bool.self,
            responseItemType: nil,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }
}