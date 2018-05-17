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

#import "ElectrodeRequestRegistrar.h"
#import "ElectrodeLogger.h"
NS_ASSUME_NONNULL_BEGIN
@interface ElectrodeRequestRegistrar ()

@property(nonatomic, strong) NSMutableDictionary *requestNameByUUID;
@property(nonatomic, strong) NSMutableDictionary *requestHandlerByRequestName;

@end

@implementation ElectrodeRequestRegistrar

- (void) registerRequestCompletionHandlerWithName:(NSString *)name
                                             uuid: (NSUUID *) uuid
                                       completion: (ElectrodeBridgeRequestCompletionHandler) completion {
  @synchronized(self) {
    ERNDebug(@"***Logging registering requestHandler with Name %@", name);
    [self.requestHandlerByRequestName setObject:completion forKey:name];
    [self.requestNameByUUID setObject:name forKey:uuid];
    ERNDebug(@"***Logging registered requestHandlerDictionary:%@",
             self.requestHandlerByRequestName);
  }
}

- (nullable ElectrodeBridgeRequestCompletionHandler)unregisterRequestHandler:(NSUUID *)uuid {
  ElectrodeBridgeRequestCompletionHandler handler;
  @synchronized(self) {
    NSString *requestName = [self.requestNameByUUID objectForKey:uuid];

    if (requestName) {
      [self.requestNameByUUID removeObjectForKey:uuid];
      handler = [self.requestHandlerByRequestName objectForKey:requestName];
      [self.requestHandlerByRequestName removeObjectForKey:requestName];
    }
  }
  return handler;
}

- (nullable ElectrodeBridgeRequestCompletionHandler)getRequestHandler:
    (NSString *)name;
{
  ERNDebug(@"***Logging getting request handler requestHandlerDictionary:%@",
           self.requestHandlerByRequestName);
  ERNDebug(@"%@", self);

  @synchronized(self) {
    return [self.requestHandlerByRequestName objectForKey:name];
  }
}

- (void)reset {
  self.requestNameByUUID = [[NSMutableDictionary alloc] init];
  self.requestHandlerByRequestName = [[NSMutableDictionary alloc] init];
}
////////////////////////////////////////////////////////////////////////////////
#pragma mark - Lazy Loading

- (NSMutableDictionary *)requestNameByUUID {
  // Lazy instatiation
  if (!_requestNameByUUID) {
    _requestNameByUUID = [[NSMutableDictionary alloc] init];
  }

  return _requestNameByUUID;
}

- (NSMutableDictionary *)requestHandlerByRequestName {
  // Lazy instatiation
  if (!_requestHandlerByRequestName) {
    _requestHandlerByRequestName = [[NSMutableDictionary alloc] init];
  }

  return _requestHandlerByRequestName;
}

@end
NS_ASSUME_NONNULL_END
