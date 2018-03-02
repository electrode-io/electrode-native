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

#import "ElectrodeBridgeTransaction.h"
#import "ElectrodeBridgeMessage.h"
NS_ASSUME_NONNULL_BEGIN
@interface ElectrodeBridgeTransaction ()

@property(nonatomic, strong, nonnull) ElectrodeBridgeRequest *request;
@property(nonatomic, strong, nullable)
    ElectrodeBridgeResponseCompletionHandler completion;

@end

@implementation ElectrodeBridgeTransaction

- (nonnull instancetype)initWithRequest:(ElectrodeBridgeRequest *)request
                      completionHandler:
                          (ElectrodeBridgeResponseCompletionHandler _Nullable)
                              completion;
{
  if (request.type != ElectrodeMessageTypeRequest) {
    [NSException raise:@"Invalid type"
                format:@"BridgeTransaction constrictor expects a request type, "
                       @"did you accidentally pass in a different type"];
  }

  if (self = [super init]) {
    _request = request;
    _completion = completion;
  }

  return self;
}

- (nonnull NSString *)transactionId {
  return self.request.messageId;
}
- (BOOL)isJsInitiated {
  return self.request.isJsInitiated;
}

@end
NS_ASSUME_NONNULL_END
