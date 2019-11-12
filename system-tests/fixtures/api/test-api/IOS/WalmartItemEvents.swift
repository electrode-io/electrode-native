#if swift(>=4.0)
@objcMembers public class WalmartItemEvents: WalmartItemAPIEvents {
    public override func addItemAddedEventListener(eventListener: @escaping ElectrodeBridgeEventListener) -> UUID? {
        let listenerProcessor = EventListenerProcessor(
            eventName: WalmartItemAPI.kEventItemAdded,
            eventPayloadClass: String.self,
            eventListener: eventListener
        )

        return listenerProcessor.execute()
    }

    public override func removeItemAddedEventListener(uuid: UUID) -> ElectrodeBridgeEventListener? {
        return ElectrodeBridgeHolder.removeEventListener(uuid)
    }

    public override func emitEventItemAdded(itemId: String) {
        let eventProcessor = EventProcessor(
            eventName: WalmartItemAPI.kEventItemAdded,
            eventPayload: itemId
        )

        eventProcessor.execute()
    }
}

#else

public class WalmartItemEvents: WalmartItemAPIEvents {
    public override func addItemAddedEventListener(eventListener: @escaping ElectrodeBridgeEventListener) -> UUID? {
        let listenerProcessor = EventListenerProcessor(
            eventName: WalmartItemAPI.kEventItemAdded,
            eventPayloadClass: String.self,
            eventListener: eventListener
        )

        return listenerProcessor.execute()
    }

    public override func removeItemAddedEventListener(uuid: UUID) -> ElectrodeBridgeEventListener? {
        return ElectrodeBridgeHolder.removeEventListener(uuid)
    }

    public override func emitEventItemAdded(itemId: String) {
        let eventProcessor = EventProcessor(
            eventName: WalmartItemAPI.kEventItemAdded,
            eventPayload: itemId
        )

        eventProcessor.execute()
    }
}
#endif
