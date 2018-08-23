#if swift(>=4.0)
@objcMembers public class NavigationAPI: NSObject  {

    static let kRequestNavigate = "com.ernnavigation.ern.api.request.navigate";


    public lazy var requests: NavigationAPIRequests = {
        return NavigationRequests()
    }()
}


@objcMembers public class NavigationAPIRequests: NSObject {
    public func registerNavigateRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        assertionFailure("should override")
        return UUID()
    }


    public func unregisterNavigateRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }


    public func navigate(navigateData: NavigateData, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

}
#else
public class NavigationAPI: NSObject  {

    static let kRequestNavigate = "com.ernnavigation.ern.api.request.navigate";


    public lazy var requests: NavigationAPIRequests = {
        return NavigationRequests()
    }()
}


public class NavigationAPIRequests: NSObject {
    public func registerNavigateRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        assertionFailure("should override")
        return UUID()
    }


    public func unregisterNavigateRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }


    public func navigate(navigateData: NavigateData, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

}

#endif
