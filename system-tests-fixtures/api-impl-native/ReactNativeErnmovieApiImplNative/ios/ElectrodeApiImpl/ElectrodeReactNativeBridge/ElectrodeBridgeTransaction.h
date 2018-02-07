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

#import <Foundation/Foundation.h>
#import "ElectrodeBridgeProtocols.h"
#import "ElectrodeBridgeRequest.h"
#import "ElectrodeBridgeResponse.h"
NS_ASSUME_NONNULL_BEGIN
@interface ElectrodeBridgeTransaction : NSObject

@property(nonatomic, readonly, strong) ElectrodeBridgeRequest *request;
@property(nonatomic, readonly, strong, nullable) ElectrodeBridgeResponseCompletionHandler completion;
// Note: response can be set
@property(nonatomic, readwrite, strong, nullable)
    ElectrodeBridgeResponse *response;

- (instancetype)initWithRequest:(ElectrodeBridgeRequest *)request
              completionHandler:(ElectrodeBridgeResponseCompletionHandler _Nullable)completion;
- (NSString *)transactionId;
- (BOOL)isJsInitiated;

@end
NS_ASSUME_NONNULL_END
