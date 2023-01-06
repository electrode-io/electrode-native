#if swift(>=4.0)
@objcMembers public class TestEventObjectParamAPI: NSObject {
    static let kEventTestEventObjectParam = "com.complex.ern.api.event.testEventObjectParam"

    public lazy var events: TestEventObjectParamAPIEvents = {
        TestEventObjectParamEvents()
    }()

    public lazy var requests: TestEventObjectParamAPIRequests = {
        TestEventObjectParamRequests()
    }()
}

@objcMembers public class TestEventObjectParamAPIEvents: NSObject {
    public func addTestEventObjectParamEventListener(eventListener _: @escaping ElectrodeBridgeEventListener) -> UUID? {
        assertionFailure("should override")
        return UUID()
    }

    public func removeTestEventObjectParamEventListener(uuid _: UUID) -> ElectrodeBridgeEventListener? {
        assertionFailure("should override")
        return nil
    }

    public func emitEventTestEventObjectParam(testEventObjectParamData _: TestEventObjectParamData) {
        assertionFailure("should override")
    }
}

@objcMembers public class TestEventObjectParamAPIRequests: NSObject {
}

#else

public class TestEventObjectParamAPI: NSObject {
    static let kEventTestEventObjectParam = "com.complex.ern.api.event.testEventObjectParam"

    public lazy var events: TestEventObjectParamAPIEvents = {
        TestEventObjectParamEvents()
    }()

    public lazy var requests: TestEventObjectParamAPIRequests = {
        TestEventObjectParamRequests()
    }()
}

public class TestEventObjectParamAPIEvents: NSObject {
    public func addTestEventObjectParamEventListener(eventListener _: @escaping ElectrodeBridgeEventListener) -> UUID? {
        assertionFailure("should override")
        return UUID()
    }

    public func removeTestEventObjectParamEventListener(uuid _: UUID) -> ElectrodeBridgeEventListener? {
        assertionFailure("should override")
        return nil
    }

    public func emitEventTestEventObjectParam(testEventObjectParamData _: TestEventObjectParamData) {
        assertionFailure("should override")
    }
}

public class TestEventObjectParamAPIRequests: NSObject {
}
#endif
