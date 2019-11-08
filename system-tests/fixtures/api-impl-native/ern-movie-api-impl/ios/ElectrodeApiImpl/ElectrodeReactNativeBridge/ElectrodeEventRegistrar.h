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

@interface ElectrodeEventRegistrar : NSObject

/**
 Add a specific event listener that will respond to a given event name.

 @param name The name of the event in reverse url format.
 @param eventListener The event listener that will respond to a given event.
 @param uuid The uuid of the listener
 */
- (void) registerEventListener:(ElectrodeBridgeEventListener _Nonnull)eventListener
                          name: (NSString *_Nonnull)name
                          uuid: (NSUUID * _Nonnull)uuid;

/**
 Remove an event listener by a given UUID. It is possible to have multiple event
 listeners for a given name. They are grouped by the name and separated by UUID.

 @param eventListenerUUID The UUID of the event listener.
 */
- (nullable ElectrodeBridgeEventListener)unregisterEventListener:(NSUUID *_Nonnull)eventListenerUUID;

/**
 Grabs all of the event listeners of a given name.

 @param name The name that the event listeners will respond to.
 @return An array of all of the event listeners, will return nil if none are
 found.
 */
- (NSArray<ElectrodeBridgeEventListener> *_Nullable)getEventListnersForName:
    (NSString *_Nonnull)name;

@end
