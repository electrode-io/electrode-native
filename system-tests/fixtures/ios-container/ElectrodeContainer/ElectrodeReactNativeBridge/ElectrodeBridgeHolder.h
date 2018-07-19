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
#import "ElectrodeBridgeEvent.h"
#import "ElectrodeBridgeRequest.h"

#import "ElectrodeBridgeProtocols.h"

@class ElectrodeBridgeTransceiver;
@protocol ElectrodeBridgeRequestHandler
, ElectrodeBridgeEventListener;

NS_ASSUME_NONNULL_BEGIN

/**
 * Client facing class.
 * Facade to ElectrodeBridgeTransceiver.
 * Handles queuing every method calls until react native is ready.
 */

@interface ElectrodeBridgeHolder : NSObject

+ (void)sendEvent:(ElectrodeBridgeEvent *)event;

+ (void)sendRequest:(ElectrodeBridgeRequest *)request
    completionHandler:(ElectrodeBridgeResponseCompletionHandler)completion;

+ (NSUUID *)registerRequestHandlerWithName:(NSString *)name
              requestCompletionHandler:
                  (ElectrodeBridgeRequestCompletionHandler)completion;

+ (nullable ElectrodeBridgeRequestCompletionHandler)unregisterRequestHandlerWithUUID: (NSUUID *)uuid;


+ (NSUUID *)addEventListenerWithName:(NSString *)name
                   eventListner:(ElectrodeBridgeEventListener)eventListner;

+ (nullable ElectrodeBridgeEventListener)removeEventListener: (NSUUID *)UUID;

+ (void)setBridge:(ElectrodeBridgeTransceiver *)bridge;
+ (void)addConstantsProvider:(id<ConstantsProvider>)constantsProvider;
@end
NS_ASSUME_NONNULL_END
