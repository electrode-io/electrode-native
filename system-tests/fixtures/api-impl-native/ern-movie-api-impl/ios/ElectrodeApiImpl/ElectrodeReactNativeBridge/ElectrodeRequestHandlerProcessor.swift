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

public class ElectrodeRequestHandlerProcessor<TReq, TResp>: NSObject, Processor {
    let tag: String
    let requestName: String
    let reqClass: TReq.Type
    let reqItemType: Any.Type?
    let respClass: TResp.Type
    let requestCompletionHandler: ElectrodeBridgeRequestCompletionHandler

    public init(requestName: String,
                reqClass: TReq.Type,
                reqItemType: Any.Type? = nil,
                respClass: TResp.Type,
                requestCompletionHandler: @escaping ElectrodeBridgeRequestCompletionHandler) {
        tag = String(describing: type(of: self))
        self.requestName = requestName
        self.reqClass = reqClass
        self.reqItemType = reqItemType
        self.respClass = respClass
        self.requestCompletionHandler = requestCompletionHandler
        super.init()
    }

    public func execute() -> UUID? {
        let uuid = ElectrodeBridgeHolder.registerRequestHandler(withName: requestName) { (data: Any?, responseCompletion: @escaping ElectrodeBridgeResponseCompletionHandler) in
            let request: Any?
            if self.reqClass == None.self {
                request = nil
            } else {
                if let nonnilData = data {
                    request = try? ElectrodeUtilities.generateObject(data: nonnilData, classType: self.reqClass, itemType: self.reqItemType)
                } else {
                    request = nil
                }
            }
            //this is passed back to Native side.
            self.requestCompletionHandler(request, responseCompletion)
        }
        return uuid
    }
}
