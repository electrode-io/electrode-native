#if swift(>=4.0)
@objcMembers public class WalmartItemAPI: NSObject  {

    static let kRequestAddItem = "com.TestApi.ern.api.request.addItem";

    static let kRequestFindItems = "com.TestApi.ern.api.request.findItems";
    static let kEventItemAdded = "com.TestApi.ern.api.event.itemAdded";


    public lazy var events: WalmartItemAPIEvents = {
        return WalmartItemEvents()
    }()


    public lazy var requests: WalmartItemAPIRequests = {
        return WalmartItemRequests()
    }()
}

@objcMembers public class WalmartItemAPIEvents: NSObject {
    public func addItemAddedEventListener(eventListener: @escaping ElectrodeBridgeEventListener) {
        assertionFailure("should override")
    }

    public func emitEventItemAdded(itemId: String) {
        assertionFailure("should override")

    }
}

@objcMembers public class WalmartItemAPIRequests: NSObject {
    public func registerAddItemRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) {
        assertionFailure("should override")
    }

    public func registerFindItemsRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) {
        assertionFailure("should override")
    }

    public func addItem(item: Item, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

    public func findItems(limit: Int, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

}
#else
public class WalmartItemAPI: NSObject  {

    static let kRequestAddItem = "com.TestApi.ern.api.request.addItem";

    static let kRequestFindItems = "com.TestApi.ern.api.request.findItems";
    static let kEventItemAdded = "com.TestApi.ern.api.event.itemAdded";


    public lazy var events: WalmartItemAPIEvents = {
        return WalmartItemEvents()
    }()


    public lazy var requests: WalmartItemAPIRequests = {
        return WalmartItemRequests()
    }()
}

public class WalmartItemAPIEvents: NSObject {
    public func addItemAddedEventListener(eventListener: @escaping ElectrodeBridgeEventListener) {
        assertionFailure("should override")
    }

    public func emitEventItemAdded(itemId: String) {
        assertionFailure("should override")

    }
}

public class WalmartItemAPIRequests: NSObject {
    public func registerAddItemRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) {
        assertionFailure("should override")
    }

    public func registerFindItemsRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) {
        assertionFailure("should override")
    }

    public func addItem(item: Item, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

    public func findItems(limit: Int, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

}

#endif
