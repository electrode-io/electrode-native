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

NS_ASSUME_NONNULL_BEGIN
@interface ElectrodeRequestRegistrar : NSObject

/**
 Register a request handler with a given name. An error is returned if a handler
 already exists for the given name. Only one request is allowed per name.

 @param name The name of the event in reverse url format.
 @param completion The request handler that will parse and process a request.
 */
- (void) registerRequestCompletionHandlerWithName:(NSString *)name
                                             uuid: (NSUUID *) uuid
                                       completion: (ElectrodeBridgeRequestCompletionHandler) completion;

/**
 * Unregisters a request handler
 *
 * @param uuid - The UUID that was obtained through initial
 * registerRequestHandler
 * call
 */
- (nullable ElectrodeBridgeRequestCompletionHandler)unregisterRequestHandler:(NSUUID *)uuid;

/**
 Grabs a given request handler for a request name.

 @param name The name of the request, in reverse url format.
 @return Returns a request handler for a specific name.
 */
- (nullable ElectrodeBridgeRequestCompletionHandler)getRequestHandler:
    (NSString *)name;
- (void)reset;

@end

NS_ASSUME_NONNULL_END
