#if swift(>=4.0)
@objcMembers public class SystemTestsAPI: NSObject {
    static let kRequestTestArrayOfStrings = "com.complex.ern.api.request.testArrayOfStrings"
    static let kRequestTestMultiArgs = "com.complex.ern.api.request.testMultiArgs"

    public lazy var requests: SystemTestsAPIRequests = {
        SystemTestsRequests()
    }()
}


@objcMembers public class SystemTestsAPIRequests: NSObject {
    public func registerTestArrayOfStringsRequestHandler(handler _: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID? {
        assertionFailure("should override")
        return UUID()
    }

    public func registerTestMultiArgsRequestHandler(handler _: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID? {
        assertionFailure("should override")
        return UUID()
    }

    public func unregisterTestArrayOfStringsRequestHandler(uuid _: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }

    public func unregisterTestMultiArgsRequestHandler(uuid _: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }

    public func testArrayOfStrings(key _: [String], responseCompletionHandler _: @escaping ([ErnObject]?, ElectrodeFailureMessage?) -> Void) {
        assertionFailure("should override")
    }

    public func testMultiArgs(testMultiArgsData _: TestMultiArgsData, responseCompletionHandler _: @escaping (String?, ElectrodeFailureMessage?) -> Void) {
        assertionFailure("should override")
    }
}

#else

public class SystemTestsAPI: NSObject {
    static let kRequestTestArrayOfStrings = "com.complex.ern.api.request.testArrayOfStrings"
    static let kRequestTestMultiArgs = "com.complex.ern.api.request.testMultiArgs"

    public lazy var requests: SystemTestsAPIRequests = {
        SystemTestsRequests()
    }()
}


public class SystemTestsAPIRequests: NSObject {
    public func registerTestArrayOfStringsRequestHandler(handler _: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID? {
        assertionFailure("should override")
        return UUID()
    }

    public func registerTestMultiArgsRequestHandler(handler _: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID? {
        assertionFailure("should override")
        return UUID()
    }

    public func unregisterTestArrayOfStringsRequestHandler(uuid _: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }

    public func unregisterTestMultiArgsRequestHandler(uuid _: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }

    public func testArrayOfStrings(key _: [String], responseCompletionHandler _: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

    public func testMultiArgs(testMultiArgsData _: TestMultiArgsData, responseCompletionHandler _: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }
}
#endif
