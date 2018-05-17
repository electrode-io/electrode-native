/*
 * Copyright 2017 WalmartLabs
 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 
 * http://www.apache.org/licenses/LICENSE-2.0
 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import UIKit

public class EventProcessor<T>: NSObject, Processor {
    private let tag: String
    private let eventPayload: T?
    private let eventName: String
    private let logger = ElectrodeConsoleLogger.sharedInstance()

    public init(eventName: String, eventPayload: T?) {
        tag = String(describing: type(of: self))
        self.eventName = eventName
        self.eventPayload = eventPayload
        super.init()
    }

    public func execute() -> UUID? {
        logger.debug("\(tag) EventProcessor is emitting event (\(eventName)) with payload (\(String(describing: eventPayload)))")
        let event = ElectrodeBridgeEvent(name: eventName, type: .event, data: eventPayload)
        ElectrodeBridgeHolder.send(event)
        return nil
    }
}
