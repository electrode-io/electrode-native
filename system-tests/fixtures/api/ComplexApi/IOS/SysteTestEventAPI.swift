#if swift(>=4.0)
@objcMembers public class SysteTestEventAPI: NSObject  {
    static let kEventTestEvent = "com.ComplexApi.ern.api.event.testEvent";


    public lazy var events: SysteTestEventAPIEvents = {
        return SysteTestEventEvents()
    }()


    public lazy var requests: SysteTestEventAPIRequests = {
        return SysteTestEventRequests()
    }()
}

@objcMembers public class SysteTestEventAPIEvents: NSObject {
    public func addTestEventEventListener(eventListener: @escaping ElectrodeBridgeEventListener) -> UUID?{
        assertionFailure("should override")
        return UUID()
    }

    public func removeTestEventEventListener(uuid: UUID) -> ElectrodeBridgeEventListener? {
        assertionFailure("should override")
        return nil
    }

    public func emitEventTestEvent(buttonId: String) {
        assertionFailure("should override")

    }
}

@objcMembers public class SysteTestEventAPIRequests: NSObject {


}
#else
public class SysteTestEventAPI: NSObject  {
    static let kEventTestEvent = "com.ComplexApi.ern.api.event.testEvent";


    public lazy var events: SysteTestEventAPIEvents = {
        return SysteTestEventEvents()
    }()


    public lazy var requests: SysteTestEventAPIRequests = {
        return SysteTestEventRequests()
    }()
}

public class SysteTestEventAPIEvents: NSObject {
    public func addTestEventEventListener(eventListener: @escaping ElectrodeBridgeEventListener) -> UUID?{
        assertionFailure("should override")
        return UUID()
    }

    public func removeTestEventEventListener(uuid: UUID) -> ElectrodeBridgeEventListener? {
        assertionFailure("should override")
        return nil
    }

    public func emitEventTestEvent(buttonId: String) {
        assertionFailure("should override")

    }
}

public class SysteTestEventAPIRequests: NSObject {


}

#endif
