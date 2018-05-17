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

public class EventListenerProcessor<T>: NSObject, Processor {
    private let tag: String
    private let eventName: String
    private let eventPayloadClass: T.Type
    private let appEventListener: ElectrodeBridgeEventListener
    private let logger = ElectrodeConsoleLogger.sharedInstance()

    public init(eventName: String, eventPayloadClass: T.Type, eventListener: @escaping ElectrodeBridgeEventListener) {
        tag = String(describing: type(of: self))
        self.eventName = eventName
        self.eventPayloadClass = eventPayloadClass
        appEventListener = eventListener
        super.init()
    }

    public func execute() -> UUID? {
        let uuid = ElectrodeBridgeHolder.addEventListener(withName: eventName, eventListner: { (eventPayload: Any?) in
            self.logger.debug("Processing final result for the event with payload bundle (\(String(describing: eventPayload)))")
            let result = try? NSObject.generateObject(data: eventPayload as AnyObject, classType: self.eventPayloadClass)
            self.appEventListener(result)
        })
        return uuid
    }
}
