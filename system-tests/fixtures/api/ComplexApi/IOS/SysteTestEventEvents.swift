
public class SysteTestEventEvents:  SysteTestEventAPIEvents {
    public override func addTestEventEventListener(eventListener: @escaping ElectrodeBridgeEventListener) {
        let listenerProcessor = EventListenerProcessor(
                                eventName: SysteTestEventAPI.kEventTestEvent,
                                eventPayloadClass: String.self,
                                eventListener: eventListener)

        listenerProcessor.execute()
    }

    public override func emitEventTestEvent(buttonId: String) {
        let eventProcessor = EventProcessor(
                                eventName: SysteTestEventAPI.kEventTestEvent,
                                eventPayload: buttonId)

        eventProcessor.execute()
    }
}
