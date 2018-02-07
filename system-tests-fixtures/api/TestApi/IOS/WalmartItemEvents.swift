
public class WalmartItemEvents:  WalmartItemAPIEvents {
    public override func addItemAddedEventListener(eventListener: @escaping ElectrodeBridgeEventListener) {
        let listenerProcessor = EventListenerProcessor(
                                eventName: WalmartItemAPI.kEventItemAdded,
                                eventPayloadClass: String.self,
                                eventListener: eventListener)

        listenerProcessor.execute()
    }

    public override func emitEventItemAdded(itemId: String) {
        let eventProcessor = EventProcessor(
                                eventName: WalmartItemAPI.kEventItemAdded,
                                eventPayload: itemId)

        eventProcessor.execute()
    }
}
