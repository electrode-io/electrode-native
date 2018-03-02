
public class WalmartItemRequests: WalmartItemAPIRequests {

    public override func registerAddItemRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) {
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: WalmartItemAPI.kRequestAddItem,
    reqClass: Item.self, 
    respClass: Bool.self,
    requestCompletionHandler: handler)
        requestHandlerProcessor.execute()
    }

    public override func registerFindItemsRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) {
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: WalmartItemAPI.kRequestFindItems,
    reqClass: Int.self, 
    respClass: [Item].self,
    requestCompletionHandler: handler)
        requestHandlerProcessor.execute()
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