/*
 * Copyright 2017 WalmartLabs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "ElectrodeBridgeFailureMessage.h"
#import "ElectrodeBridgeRequest.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const kElectrodeBridgeResponseError;
extern NSString *const kElectrodeBridgeResponseErrorCode;
extern NSString *const kElectrodeBridgeResponseErrorMessage;
extern NSString *const kElectrodeBridgeResponseUnknownErrorCode;

@interface ElectrodeBridgeResponse : ElectrodeBridgeMessage

@property(readonly, nonatomic, weak, nullable) id<ElectrodeFailureMessage>
    failureMessage;

+ (nullable instancetype)createResponseWithData:(NSDictionary *)data;
+ (nullable instancetype)
createResponseForRequest:(ElectrodeBridgeRequest *)request
        withResponseData:(nullable NSDictionary *)data
      withFailureMessage:(nullable id<ElectrodeFailureMessage>)failureMessage;
@end

NS_ASSUME_NONNULL_END
