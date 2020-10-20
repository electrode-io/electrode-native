#if swift(>=4.0)
@objcMembers public class SystemTestEventAPI: NSObject {
    static let kEventTestEvent = "com.complex.ern.api.event.testEvent"

    public lazy var events: SystemTestEventAPIEvents = {
        SystemTestEventEvents()
    }()

    public lazy var requests: SystemTestEventAPIRequests = {
        SystemTestEventRequests()
    }()
}

@objcMembers public class SystemTestEventAPIEvents: NSObject {
    public func addTestEventEventListener(eventListener _: @escaping ElectrodeBridgeEventListener) -> UUID? {
        assertionFailure("should override")
        return UUID()
    }

    public func removeTestEventEventListener(uuid _: UUID) -> ElectrodeBridgeEventListener? {
        assertionFailure("should override")
        return nil
    }

    public func emitEventTestEvent(buttonId _: String) {
        assertionFailure("should override")
    }
}

@objcMembers public class SystemTestEventAPIRequests: NSObject {
}

#else

public class SystemTestEventAPI: NSObject {
    static let kEventTestEvent = "com.complex.ern.api.event.testEvent"

    public lazy var events: SystemTestEventAPIEvents = {
        SystemTestEventEvents()
    }()

    public lazy var requests: SystemTestEventAPIRequests = {
        SystemTestEventRequests()
    }()
}

public class SystemTestEventAPIEvents: NSObject {
    public func addTestEventEventListener(eventListener _: @escaping ElectrodeBridgeEventListener) -> UUID? {
        assertionFailure("should override")
        return UUID()
    }

    public func removeTestEventEventListener(uuid _: UUID) -> ElectrodeBridgeEventListener? {
        assertionFailure("should override")
        return nil
    }

    public func emitEventTestEvent(buttonId _: String) {
        assertionFailure("should override")
    }
}

public class SystemTestEventAPIRequests: NSObject {
}
#endif
