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

@interface ElectrodeQueuedEventListener: NSObject
@property (nonatomic, strong) NSUUID *uuid;
@property (copy) ElectrodeBridgeEventListener listener;
- (instancetype) initWithUUID: (NSUUID *) uuid
                     listener: (ElectrodeBridgeEventListener) listener;
@end

@implementation ElectrodeQueuedEventListener
- (instancetype) initWithUUID: (NSUUID *) uuid
                     listener: (ElectrodeBridgeEventListener) listener {
    if (self = [super init]) {
        _uuid = uuid;
        _listener = listener;
    }
    
    return self;
}
@end

@interface ElectrodeQueuedRequestHandler: NSObject
@property (nonatomic, strong) NSUUID *uuid;
@property (copy) ElectrodeBridgeRequestCompletionHandler handler;
- (instancetype) initWithUUID: (NSUUID *) uuid
                     handler: (ElectrodeBridgeRequestCompletionHandler) handler;
@end

@implementation ElectrodeQueuedRequestHandler
- (instancetype) initWithUUID: (NSUUID *) uuid
                     handler: (ElectrodeBridgeRequestCompletionHandler) handler {
    if (self = [super init]) {
        _uuid = uuid;
        _handler = handler;
    }
    
    return self;
}
@end
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

+ (nullable ElectrodeBridgeEventListener)removeEventListener: (NSUUID *)UUID {
    return [electrodeNativeBridge removeEventListnerWithUUID: UUID];
}

+ (void)sendRequest:(ElectrodeBridgeRequest *)request
    completionHandler:(ElectrodeBridgeResponseCompletionHandler)completion {
  if (!isReactNativeReady) {
    [queuedRequests setObject:completion forKey:request];
  } else {
    [electrodeNativeBridge sendRequest:request completionHandler:completion];
  }
}

+ (NSUUID *)registerRequestHandlerWithName:(NSString *)name
                  requestCompletionHandler:
(ElectrodeBridgeRequestCompletionHandler)completion {
    NSUUID *uuid = [NSUUID UUID];
    if (!isReactNativeReady) {
        ElectrodeQueuedRequestHandler *handler = [[ElectrodeQueuedRequestHandler alloc] initWithUUID:uuid handler:completion];
        [queuedRequestHandlerRegistration setObject:handler forKey:name];
        ERNDebug(@"queuedRequestHandlerRegistration when react is not ready %@",
                 queuedRequestHandlerRegistration);
    } else {
        ERNDebug(@"BridgeHolderNew: registering request handler with name %@",
                 name);
        [electrodeNativeBridge registerRequestCompletionHandlerWithName:name
                                                                   uuid:uuid
                                                             completion:completion];
    }
    return uuid;
}

+ (nullable ElectrodeBridgeRequestCompletionHandler)unregisterRequestHandlerWithUUID: (NSUUID *)uuid {
    return [electrodeNativeBridge unregisterRequestHandlerWithUUID:uuid];
}

+ (NSUUID *)addEventListenerWithName:(NSString *)name
                   eventListner:(ElectrodeBridgeEventListener)eventListner {
  NSUUID *eventListenerUUID = [NSUUID UUID];
  if (!isReactNativeReady) {
      ElectrodeQueuedEventListener *listener = [[ElectrodeQueuedEventListener alloc] initWithUUID:eventListenerUUID
                                                                                         listener:eventListner];
    [queuedEventListenerRegistration setObject:listener forKey:name];
  } else {
      [electrodeNativeBridge registerEventListenerWithName:name uuid:eventListenerUUID listener:eventListner];
  }
    
    return eventListenerUUID;
}

+ (BOOL)isReactNativeReady {
  return isReactNativeReady;
}

+ (void)registerQueuedRequestHandlers {
  ERNDebug(@"registering Queued requesters");
  ERNDebug(@"queuedRequestHandlerRegistration %@",
           queuedRequestHandlerRegistration);

  for (NSString *handlerName in queuedRequestHandlerRegistration) {
      ERNDebug(@"Registering queued request handler %@", handlerName);

      ElectrodeQueuedRequestHandler *handleObj = queuedRequestHandlerRegistration[handlerName];
      NSUUID *uuid = [handleObj uuid];
      ElectrodeBridgeRequestCompletionHandler completion = [handleObj handler];
      [electrodeNativeBridge registerRequestCompletionHandlerWithName:handlerName
                                                                 uuid:uuid
                                                           completion:completion];
  }

  [queuedRequestHandlerRegistration removeAllObjects];
}

+ (void)registerQueuedEventListeners {
    for (NSString *eventListnerName in queuedEventListenerRegistration) {
        ElectrodeQueuedEventListener *handleObj = queuedEventListenerRegistration[eventListnerName];
        NSUUID *uuid = [handleObj uuid];
        [electrodeNativeBridge registerEventListenerWithName:eventListnerName uuid:uuid listener:[handleObj listener]];
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
