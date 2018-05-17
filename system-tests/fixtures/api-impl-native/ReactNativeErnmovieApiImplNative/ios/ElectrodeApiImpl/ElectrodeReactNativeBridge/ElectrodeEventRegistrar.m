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

#import "ElectrodeEventRegistrar.h"

@interface ElectrodeEventRegistrar ()

@property(nonatomic, strong) NSMutableDictionary *eventListenerByUUID;
@property(nonatomic, strong) NSMutableDictionary *eventListenersByEventName;

@end

@implementation ElectrodeEventRegistrar
- (void) registerEventListener:(ElectrodeBridgeEventListener _Nonnull)eventListener
                          name: (NSString *_Nonnull)name
                          uuid: (NSUUID * _Nonnull)uuid {
  @synchronized(self) {
    if ([self.eventListenersByEventName objectForKey:name]) {
      NSMutableArray *eventListenerArray =
          [self.eventListenersByEventName objectForKey:name];
      [eventListenerArray addObject:eventListener];
      [self.eventListenersByEventName setValue:eventListenerArray forKey:name];
    } else {
      NSMutableArray *eventListenerArray = [[NSMutableArray alloc] init];
      [eventListenerArray addObject:eventListener];
      [self.eventListenersByEventName setObject:eventListenerArray forKey:name];
    }
      
    [self.eventListenerByUUID setObject:eventListener forKey:uuid];
  }
}

- (nullable ElectrodeBridgeEventListener) unregisterEventListener:(NSUUID *_Nonnull)eventListenerUUID {
    ElectrodeBridgeEventListener eventListener;
    @synchronized(self) {
    eventListener =
        [self.eventListenerByUUID objectForKey:eventListenerUUID];
    [self.eventListenerByUUID removeObjectForKey:eventListenerUUID];

    if (eventListener) {
      NSArray *keys = [self.eventListenersByEventName allKeys];
      for (NSString *key in keys) {
        NSMutableArray *eventListeners =
            [self.eventListenersByEventName objectForKey:key];
        if ([eventListeners containsObject:eventListener]) {
          [eventListeners removeObject:eventListener];
        }
        [self.eventListenersByEventName setObject:eventListeners forKey:key];
      }
    }
  }
    return eventListener;
}

- (NSArray<ElectrodeBridgeEventListener> *_Nullable)getEventListnersForName:
    (NSString *_Nonnull)name {
  @synchronized(self) {
    NSArray<ElectrodeBridgeEventListener> *eventListeners = nil;

    if ([self.eventListenersByEventName objectForKey:name]) {
      id tempListeners = [self.eventListenersByEventName objectForKey:name];
      if ([tempListeners isKindOfClass:[NSArray class]]) {
        eventListeners = (NSArray<ElectrodeBridgeEventListener> *)[NSArray
            arrayWithArray:tempListeners];
      }
    }
    return eventListeners;
  }
}

- (NSMutableDictionary *)eventListenersByEventName {
  // Lazy instantiation
  if (!_eventListenersByEventName) {
    _eventListenersByEventName = [[NSMutableDictionary alloc] init];
  }

  return _eventListenersByEventName;
}

- (NSMutableDictionary *)eventListenerByUUID {
  // Lazy instantiation
  if (!_eventListenerByUUID) {
    _eventListenerByUUID = [[NSMutableDictionary alloc] init];
  }

  return _eventListenerByUUID;
}

@end
