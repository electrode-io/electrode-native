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
#import "ElectrodeBridgeFailureMessage.h"
#import "ElectrodeBridgeRequest.h"
#import "ElectrodeBridgeEvent.h"

@class ElectrodeBridgeTransceiver;
NS_ASSUME_NONNULL_BEGIN
typedef void (^ElectrodeBridgeReactNativeReadyListner)(
    ElectrodeBridgeTransceiver *transceiver);

#pragma ElectrodeBridgeResponseListener protocol

/**

 */
typedef void (^ElectrodeBridgeResponseCompletionHandler)(
    id _Nullable data, id<ElectrodeFailureMessage> _Nullable message);
/**
 ElectrodeBridgeResponseCompletionHandler execute when a given request comes
 through. The
 completioners execute once the request has fully been handled.
 */
typedef void (^ElectrodeBridgeRequestCompletionHandler)(
    id _Nullable data, ElectrodeBridgeResponseCompletionHandler block);
/*
 * ElectrodeBridgeEventListener execute when an event is dispatched.
 */
typedef void (^ElectrodeBridgeEventListener)(id _Nullable eventPayload);

@interface ElectrodeBridgeProtocols : NSObject

@end

@protocol ConstantsProvider <NSObject>
/**
 * Returns constant values exposed to JavaScript.
 * Its implementation is not required but is very useful to key pre-defined
 * values that need to be propagated from JavaScript to NativeiOS in sync
 * @return Dictionary containing a constant values
 */
- (NSDictionary<NSString *, id> *)constantsToExport;
@end

////////////////////////////////////////////////
#pragma ElectrodeNativeBridge protocol
/*
 * Native client facing bridge API. Define all the actions a native client can
 * perform over the bridge.
 */
@protocol ElectrodeNativeBridge <NSObject>

/**
 * Send a request from iOS native side to either native or React Native side
 * depending on where the request handler is registered.
 * @param request    The ElectrodeBridgeRequest that contains request name,
 * data, destination mode and timeout
 * @param completion The response call back listener to issue success/failure of
 * the request.
 */
- (void)sendRequest:(ElectrodeBridgeRequest *)request
    completionHandler:(ElectrodeBridgeResponseCompletionHandler)completion;

/**
 * Register the request handler
 * @param name name of the request
 * @param uuid uuid of the request handler
 * @param completion call back to be issued for a given request.
 */
- (void) registerRequestCompletionHandlerWithName:(NSString *)name
                                             uuid: (NSUUID *) uuid
                                       completion: (ElectrodeBridgeRequestCompletionHandler) completion;

/**
 * Unregister a request handler
 * @param uuid returned when register a request handler
 */

- (nullable ElectrodeBridgeRequestCompletionHandler)unregisterRequestHandlerWithUUID: (NSUUID *)uuid;

/**
 * Sends an event with payload to all the event listeners
 * @param event The event to emit
 */
- (void)sendEvent:(ElectrodeBridgeEvent *)event;

/**
 * Add an event listener for the passed event
 * @param name   The event name this listener is interested in
 * @param eventListener The event listener
 * @param uuid of the event listener.
 */

- (void) registerEventListenerWithName: (NSString *_Nonnull)name
                                  uuid: (NSUUID * _Nonnull)uuid
                              listener: (ElectrodeBridgeEventListener _Nonnull)eventListener;

/**
 * Remove an event listener
 * @param uuid returned when listner is added.
 */
- (nullable ElectrodeBridgeEventListener)removeEventListnerWithUUID: (NSUUID *) uuid;

- (void)addConstantsProvider:(id<ConstantsProvider>)constantsProvider;

@end

////////////////////////////////////////////////
#pragma ElectrodeReactBridge protocol

/**
 * React facing bridge API. React Native side calls to talk to bridge
 */
@protocol ElectrodeReactBridge <NSObject>
/**
 * Invoked by React side to communicate the bridge
 * @params bridgeMessage  The NSDictionary representation of BridgeMessage
 */

- (void)sendMessage:(NSDictionary *)bridgeMessage;

@end

NS_ASSUME_NONNULL_END

