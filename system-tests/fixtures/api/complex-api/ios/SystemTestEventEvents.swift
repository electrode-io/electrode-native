#if swift(>=4.0)
@objcMembers public class SystemTestEventEvents: SystemTestEventAPIEvents {
    public override func addTestEventEventListener(eventListener: @escaping ElectrodeBridgeEventListener) -> UUID? {
        let listenerProcessor = EventListenerProcessor(
            eventName: SystemTestEventAPI.kEventTestEvent,
            eventPayloadClass: String.self,
            eventListener: eventListener
        )

        return listenerProcessor.execute()
    }

    public override func removeTestEventEventListener(uuid: UUID) -> ElectrodeBridgeEventListener? {
        return ElectrodeBridgeHolder.removeEventListener(uuid)
    }

    public override func emitEventTestEvent(buttonId: String) {
        let eventProcessor = EventProcessor(
            eventName: SystemTestEventAPI.kEventTestEvent,
            eventPayload: buttonId
        )

        eventProcessor.execute()
    }
}

#else

public class SystemTestEventEvents: SystemTestEventAPIEvents {
    public override func addTestEventEventListener(eventListener: @escaping ElectrodeBridgeEventListener) -> UUID? {
        let listenerProcessor = EventListenerProcessor(
            eventName: SystemTestEventAPI.kEventTestEvent,
            eventPayloadClass: String.self,
            eventListener: eventListener
        )

        return listenerProcessor.execute()
    }

    public override func removeTestEventEventListener(uuid: UUID) -> ElectrodeBridgeEventListener? {
        return ElectrodeBridgeHolder.removeEventListener(uuid)
    }

    public override func emitEventTestEvent(buttonId: String) {
        let eventProcessor = EventProcessor(
            eventName: SystemTestEventAPI.kEventTestEvent,
            eventPayload: buttonId
        )

        eventProcessor.execute()
    }
}
#endif
