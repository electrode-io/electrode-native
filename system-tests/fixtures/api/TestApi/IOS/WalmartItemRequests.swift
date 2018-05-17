#if swift(>=4.0)
@objcMembers public class WalmartItemRequests: WalmartItemAPIRequests {

    public override func registerAddItemRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: WalmartItemAPI.kRequestAddItem,
    reqClass: Item.self, 
    respClass: Bool.self,
    requestCompletionHandler: handler)
        return requestHandlerProcessor.execute()
    }

    public override func registerFindItemsRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: WalmartItemAPI.kRequestFindItems,
    reqClass: Int.self, 
    respClass: [Item].self,
    requestCompletionHandler: handler)
        return requestHandlerProcessor.execute()
    }


    public override func unregisterAddItemRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        return ElectrodeBridgeHolder.unregisterRequestHandler(with: uuid)
    }

    public override func unregisterFindItemsRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        return ElectrodeBridgeHolder.unregisterRequestHandler(with: uuid)
    }

    //------------------------------------------------------------------------------------------------------------------------------------


    public override func addItem(item: Item, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<Item, Bool, Any>(
            requestName: WalmartItemAPI.kRequestAddItem,
            requestPayload: item,
            respClass: Bool.self,
            responseItemType: nil,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }

    public override func findItems(limit: Int, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<Int, [Item], Any>(
            requestName: WalmartItemAPI.kRequestFindItems,
            requestPayload: limit,
            respClass: [Item].self,
            responseItemType: Item.self,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }
}
#else
public class WalmartItemRequests: WalmartItemAPIRequests {

    public override func registerAddItemRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: WalmartItemAPI.kRequestAddItem,
    reqClass: Item.self, 
    respClass: Bool.self,
    requestCompletionHandler: handler)
        return requestHandlerProcessor.execute()
    }

    public override func registerFindItemsRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: WalmartItemAPI.kRequestFindItems,
    reqClass: Int.self, 
    respClass: [Item].self,
    requestCompletionHandler: handler)
        return requestHandlerProcessor.execute()
    }

    //------------------------------------------------------------------------------------------------------------------------------------



    public override func unregisterAddItemRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
      return ElectrodeBridgeHolder.unregisterRequestHandler(with: uuid)
    }

    public override func unregisterFindItemsRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
      return ElectrodeBridgeHolder.unregisterRequestHandler(with: uuid)
    }

    public override func addItem(item: Item, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<Item, Bool, Any>(
            requestName: WalmartItemAPI.kRequestAddItem,
            requestPayload: item,
            respClass: Bool.self,
            responseItemType: nil,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }


    public override func unregisterAddItemRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
      return ElectrodeBridgeHolder.unregisterRequestHandler(with: uuid)
    }

    public override func unregisterFindItemsRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
      return ElectrodeBridgeHolder.unregisterRequestHandler(with: uuid)
    }

    public override func findItems(limit: Int, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<Int, [Item], Any>(
            requestName: WalmartItemAPI.kRequestFindItems,
            requestPayload: limit,
            respClass: [Item].self,
            responseItemType: Item.self,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }
}
#endif
