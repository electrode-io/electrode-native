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

#import "ElectrodeEventDispatcher.h"
#import "ElectrodeBridgeProtocols.h"
#import "ElectrodeLogger.h"

@interface ElectrodeEventRegistrar ()

@property(nonatomic, strong) ElectrodeEventRegistrar *eventRegistrar;

@end

@implementation ElectrodeEventDispatcher

- (instancetype)initWithEventRegistrar:
    (ElectrodeEventRegistrar *)eventRegistrar {
  if (self = [super init]) {
    _eventRegistrar = eventRegistrar;
  }

  return self;
}

- (void)dispatchEvent:(ElectrodeBridgeEvent *)bridgeEvent {
  NSArray<ElectrodeBridgeEventListener> *eventListeners =
      [self.eventRegistrar getEventListnersForName:bridgeEvent.name];

  for (ElectrodeBridgeEventListener eventListener in eventListeners) {
    ERNDebug(@"ElectrodeEventDispatcher is dispatching events %@, id(%@) to "
             @"listener %@",
             bridgeEvent.name, bridgeEvent.messageId, eventListener);
    dispatch_async(dispatch_get_main_queue(), ^{
      if (eventListener) {
        eventListener(bridgeEvent.data);
      }
    });
  }
}

@end
