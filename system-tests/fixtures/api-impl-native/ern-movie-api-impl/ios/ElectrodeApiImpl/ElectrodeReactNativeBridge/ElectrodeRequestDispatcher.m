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

#import "ElectrodeRequestDispatcher.h"
#import "ElectrodeBridgeFailureMessage.h"
#import "ElectrodeLogger.h"

NS_ASSUME_NONNULL_BEGIN
@interface ElectrodeRequestRegistrar ()
@property(nonatomic, strong) ElectrodeRequestRegistrar *requestRegistrar;

@end

@implementation ElectrodeRequestDispatcher
- (instancetype)initWithRequestRegistrar:
    (ElectrodeRequestRegistrar *)requestRegistrar {
  if (self = [super init]) {
    _requestRegistrar = [[ElectrodeRequestRegistrar alloc] init];
  }
  return self;
}

- (void)dispatchRequest:(ElectrodeBridgeRequest *)bridgeRequest
      completionHandler:(ElectrodeBridgeResponseCompletionHandler)completion

{
  NSString *requestId = bridgeRequest.messageId;
  NSString *requestName = bridgeRequest.name;

  ERNDebug(@"ElectrodeRequestDispatcher dispatching request(id=%@) locally",
           requestId);

  ElectrodeBridgeRequestCompletionHandler requestCompletionHandler =
      [self.requestRegistrar getRequestHandler:requestName];
  if (requestCompletionHandler == nil) {
    NSString *errorMessage = [NSString
        stringWithFormat:@"No registered request handler for request name %@",
                         requestName];
    id<ElectrodeFailureMessage> failureMessage = [ElectrodeBridgeFailureMessage
        createFailureMessageWithCode:@"ENOHANDLER"
                             message:errorMessage];
    if (completion) {
      completion(nil, failureMessage);
    }
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    requestCompletionHandler(bridgeRequest.data, completion);
  });
}
- (BOOL)canHandlerRequestWithName:(NSString *)name {
  return ([self.requestRegistrar getRequestHandler:name] != nil);
}
@end

NS_ASSUME_NONNULL_END
