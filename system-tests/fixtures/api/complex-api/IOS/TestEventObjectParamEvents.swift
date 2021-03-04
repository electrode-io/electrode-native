#if swift(>=4.0)
@objcMembers public class TestEventObjectParamEvents: TestEventObjectParamAPIEvents {
    public override func addTestEventObjectParamEventListener(eventListener: @escaping ElectrodeBridgeEventListener) -> UUID? {
        let listenerProcessor = EventListenerProcessor(
            eventName: TestEventObjectParamAPI.kEventTestEventObjectParam,
            eventPayloadClass: TestEventObjectParamData.self,
            eventListener: eventListener
        )

        return listenerProcessor.execute()
    }

    public override func removeTestEventObjectParamEventListener(uuid: UUID) -> ElectrodeBridgeEventListener? {
        return ElectrodeBridgeHolder.removeEventListener(uuid)
    }

    public override func emitEventTestEventObjectParam(testEventObjectParamData: TestEventObjectParamData) {
        let eventProcessor = EventProcessor(
            eventName: TestEventObjectParamAPI.kEventTestEventObjectParam,
            eventPayload: testEventObjectParamData
        )

        eventProcessor.execute()
    }
}

#else

public class TestEventObjectParamEvents: TestEventObjectParamAPIEvents {
    public override func addTestEventObjectParamEventListener(eventListener: @escaping ElectrodeBridgeEventListener) -> UUID? {
        let listenerProcessor = EventListenerProcessor(
            eventName: TestEventObjectParamAPI.kEventTestEventObjectParam,
            eventPayloadClass: TestEventObjectParamData.self,
            eventListener: eventListener
        )

        return listenerProcessor.execute()
    }

    public override func removeTestEventObjectParamEventListener(uuid: UUID) -> ElectrodeBridgeEventListener? {
        return ElectrodeBridgeHolder.removeEventListener(uuid)
    }

    public override func emitEventTestEventObjectParam(testEventObjectParamData: TestEventObjectParamData) {
        let eventProcessor = EventProcessor(
            eventName: TestEventObjectParamAPI.kEventTestEventObjectParam,
            eventPayload: testEventObjectParamData
        )

        eventProcessor.execute()
    }
}
#endif
