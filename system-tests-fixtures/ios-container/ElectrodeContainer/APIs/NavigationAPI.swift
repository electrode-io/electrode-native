public class NavigationAPI: NSObject  {

    static let kRequestNavigate = "com.ernnavigation.ern.api.request.navigate";


    public lazy var requests: NavigationAPIRequests = {
        return NavigationRequests()
    }()
}


public class NavigationAPIRequests: NSObject {
    public func registerNavigateRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) {
        assertionFailure("should override")
    }

    public func navigate(navigateData: NavigateData, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

}

