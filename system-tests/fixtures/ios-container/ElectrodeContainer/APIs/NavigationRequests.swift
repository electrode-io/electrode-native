#if swift(>=4.0)
@objcMembers public class NavigationRequests: NavigationAPIRequests {

    public override func registerNavigateRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: NavigationAPI.kRequestNavigate,
    reqClass: NavigateData.self, 
    respClass: Bool.self,
    requestCompletionHandler: handler)
        return requestHandlerProcessor.execute()
    }


    public override func unregisterNavigateRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        return ElectrodeBridgeHolder.unregisterRequestHandler(with: uuid)
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
#else
public class NavigationRequests: NavigationAPIRequests {

    public override func registerNavigateRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: NavigationAPI.kRequestNavigate,
    reqClass: NavigateData.self, 
    respClass: Bool.self,
    requestCompletionHandler: handler)
        return requestHandlerProcessor.execute()
    }

    //------------------------------------------------------------------------------------------------------------------------------------



    public override func unregisterNavigateRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
      return ElectrodeBridgeHolder.unregisterRequestHandler(with: uuid)
    }

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
#endif
