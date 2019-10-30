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

typealias ElectrodeRequestProcessorSuccessClosure = (Any?) -> Void
typealias ElectrodeRequestProcessorFailureClosure = (ElectrodeFailureMessage) -> Void

public class ElectrodeRequestProcessor<TReq, TResp, TItem>: NSObject {
    private let tag: String
    private let requestName: String
    private let requestPayload: Any?
    private let responseClass: TResp.Type
    private let responseItemType: Any.Type?
    private let responseCompletionHandler: ElectrodeBridgeResponseCompletionHandler

    public init(requestName: String,
                requestPayload: Any?,
                respClass: TResp.Type,
                responseItemType: Any.Type?,
                responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        tag = String(describing: type(of: self))
        self.requestName = requestName
        self.requestPayload = requestPayload
        responseClass = respClass
        self.responseItemType = responseItemType
        self.responseCompletionHandler = responseCompletionHandler
        super.init()
    }

    public func execute() -> UUID? {
        ElectrodeConsoleLogger.sharedInstance().debug("RequestProcessor started processing request (\(requestName)) with payload (\(String(describing: requestPayload)))")
        let bridgeMessageData = ElectrodeUtilities.convertObjectToBridgeMessageData(object: requestPayload)

        let validRequest = ElectrodeBridgeRequest(name: requestName, data: bridgeMessageData)

        ElectrodeBridgeHolder.send(validRequest) { (responseData: Any?, failureMessage: ElectrodeFailureMessage?) in
            if let failureMessage = failureMessage {
                self.responseCompletionHandler(nil, failureMessage)
            } else {
                let processedResp: Any?
                if self.responseClass != None.self {
                    processedResp = self.processSuccessResponse(responseData: responseData)
                } else {
                    processedResp = nil
                }
                self.responseCompletionHandler(processedResp, nil)
            }
        }
        return nil
    }

    private func processSuccessResponse(responseData: Any?) -> Any? {
        guard let anyData = responseData else {
            return nil
        }

        let generatedRes: Any?
        do {
            generatedRes = try NSObject.generateObject(data: anyData, classType: responseClass, itemType: responseItemType)

        } catch {
            assertionFailure("Failed to convert responseData to valid obj")
            generatedRes = nil
        }

        return generatedRes
    }
}
