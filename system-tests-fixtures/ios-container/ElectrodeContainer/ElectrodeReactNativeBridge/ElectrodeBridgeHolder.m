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

#import "ElectrodeBridgeProtocols.h"
#import "ElectrodeBridgeHolder.h"
#import "ElectrodeBridgeTransceiver.h"
#import "ElectrodeLogger.h"

NS_ASSUME_NONNULL_BEGIN

@implementation ElectrodeBridgeHolder
static ElectrodeBridgeTransceiver *electrodeNativeBridge;
static BOOL isReactNativeReady = NO;
static BOOL isTransceiverReady = NO;
static NSMutableDictionary *queuedRequestHandlerRegistration;
static NSMutableDictionary *queuedEventListenerRegistration;
static NSMutableDictionary *queuedRequests;
static NSMutableArray *queuedEvent;
static NSMutableArray<id<ConstantsProvider>> *queuedConstantsProvider;

+ (void)initialize {
  ERNDebug(@"in bridge holder initialization");
  queuedRequestHandlerRegistration = [[NSMutableDictionary alloc] init];
  queuedEventListenerRegistration = [[NSMutableDictionary alloc] init];
  queuedRequests = [[NSMutableDictionary alloc] init];
  queuedEvent = [[NSMutableArray alloc] init];
  queuedConstantsProvider = [[NSMutableArray alloc] init];
  [ElectrodeBridgeHolder registerReactReadyListenr];
  [ElectrodeBridgeHolder registerReactTransceiverReadyListner];
}

+ (void)registerReactReadyListenr {
  [ElectrodeBridgeTransceiver
      registerReactNativeReadyListener:^(
          ElectrodeBridgeTransceiver *_Nonnull transceiver) {
        isReactNativeReady = YES;
        electrodeNativeBridge = transceiver;
        [ElectrodeBridgeHolder registerQueuedEventListeners];
        [ElectrodeBridgeHolder registerQueuedRequestHandlers];
        [ElectrodeBridgeHolder sendQueuedEvents];
        [ElectrodeBridgeHolder sendQueuedRequests];
        [ElectrodeBridgeHolder addQueuedConstantsProvider];
      }];
}

+ (void)registerReactTransceiverReadyListner {
  [ElectrodeBridgeTransceiver
      registerReactTransceiverReadyListner:^(
          ElectrodeBridgeTransceiver *_Nonnull transceiver) {
        isTransceiverReady = YES;
        electrodeNativeBridge = transceiver;
        [ElectrodeBridgeHolder addQueuedConstantsProvider];
      }];
}

+ (void)addQueuedConstantsProvider {
  for (id<ConstantsProvider> provider in queuedConstantsProvider) {
    [ElectrodeBridgeHolder addConstantsProvider:provider];
  }
}

+ (void)addConstantsProvider:(id<ConstantsProvider>)constantsProvider {
  if (!isTransceiverReady) {
    [queuedConstantsProvider addObject:constantsProvider];
  } else {
    [electrodeNativeBridge addConstantsProvider:constantsProvider];
  }
}

+ (void)sendEvent:(ElectrodeBridgeEvent *)event {
  if (!isReactNativeReady) {
    [queuedEvent addObject:event];
  } else {
    [electrodeNativeBridge sendEvent:event];
  }
}

+ (void)sendRequest:(ElectrodeBridgeRequest *)request
    completionHandler:(ElectrodeBridgeResponseCompletionHandler)completion {
  if (!isReactNativeReady) {
    [queuedRequests setObject:completion forKey:request];
  } else {
    [electrodeNativeBridge sendRequest:request completionHandler:completion];
  }
}

+ (void)registerRequestHanlderWithName:(NSString *)name
              requestCompletionHandler:
                  (ElectrodeBridgeRequestCompletionHandler)completion {
  if (!isReactNativeReady) {
    [queuedRequestHandlerRegistration setObject:completion forKey:name];
    ERNDebug(@"queuedRequestHandlerRegistration when react is not ready %@",
             queuedRequestHandlerRegistration);
  } else {
    NSError *error;
    ERNDebug(@"BridgeHolderNew: registering request handler with name %@",
             name);
    [electrodeNativeBridge registerRequestCompletionHandlerWithName:name
                                                  completionHandler:completion];

    if (error) {
      [NSException raise:@"registration failed"
                  format:@"registration for request handler failed"];
    }
  }
}

+ (void)addEventListnerWithName:(NSString *)name
                   eventListner:(ElectrodeBridgeEventListener)eventListner {
  if (!isReactNativeReady) {
    [queuedEventListenerRegistration setObject:eventListner forKey:name];
  } else {
    [electrodeNativeBridge addEventListenerWithName:name
                                      eventListener:eventListner];
  }
}

+ (BOOL)isReactNativeReady {
  return isReactNativeReady;
}

+ (void)registerQueuedRequestHandlers {
  ERNDebug(@"registering Queued requesters");
  ERNDebug(@"queuedRequestHandlerRegistration %@",
           queuedRequestHandlerRegistration);
  for (NSString *requestName in queuedRequestHandlerRegistration) {
    ElectrodeBridgeRequestCompletionHandler requestHandler =
        queuedRequestHandlerRegistration[requestName];
    ERNDebug(@"requestName name for handler");
    [ElectrodeBridgeHolder registerRequestHanlderWithName:requestName
                                 requestCompletionHandler:requestHandler];
  }

  [queuedRequestHandlerRegistration removeAllObjects];
}

+ (void)registerQueuedEventListeners {
  for (NSString *eventListnerName in queuedEventListenerRegistration) {
    ElectrodeBridgeEventListener eventListener =
        queuedEventListenerRegistration[eventListnerName];
    [ElectrodeBridgeHolder addEventListnerWithName:eventListnerName
                                      eventListner:eventListener];
  }

  [queuedEventListenerRegistration removeAllObjects];
}

+ (void)sendQueuedRequests {
  ERNDebug(@"Start sending queued request: %@", queuedRequests);
  for (ElectrodeBridgeRequest *request in queuedRequests) {
    ElectrodeBridgeResponseCompletionHandler completion =
        queuedRequests[request];
    [ElectrodeBridgeHolder sendRequest:request completionHandler:completion];
  }

  [queuedRequests removeAllObjects];
}

+ (void)sendQueuedEvents {
  for (ElectrodeBridgeEvent *event in queuedEvent) {
    [ElectrodeBridgeHolder sendEvent:event];
  }

  [queuedEvent removeAllObjects];
}

+ (void)setBridge:(ElectrodeBridgeTransceiver *)bridge {
  isReactNativeReady = YES;
  electrodeNativeBridge = bridge;
}

@end
NS_ASSUME_NONNULL_END
