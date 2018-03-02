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

#import "ElectrodeBridgeResponse.h"
#import "ElectrodeBridgeFailureMessage.h"

NSString *const kElectrodeBridgeResponseError = @"error";
NSString *const kElectrodeBridgeResponseErrorCode = @"code";
NSString *const kElectrodeBridgeResponseErrorMessage = @"message";
NSString *const kElectrodeBridgeResponseUnknownErrorCode = @"EUNKNOWN";

@interface ElectrodeBridgeResponse ()

@property(nonatomic, strong, nullable) id<ElectrodeFailureMessage>
    failureMessage;

@end

@implementation ElectrodeBridgeResponse

+ (nullable instancetype)createResponseWithData:(NSDictionary *)data {
  if ([super isValidFromData:data withType:ElectrodeMessageTypeResponse]) {
    return [[ElectrodeBridgeResponse alloc] initWithData:data];
  }

  return nil;
}

+ (nullable instancetype)
createResponseForRequest:(ElectrodeBridgeRequest *)request
        withResponseData:(nullable id)data
      withFailureMessage:(nullable id<ElectrodeFailureMessage>)failureMessage {
  return
      [[ElectrodeBridgeResponse alloc] initWithName:request.name
                                          messageId:request.messageId
                                               type:ElectrodeMessageTypeResponse
                                               data:data
                                     failureMessage:failureMessage];
}

- (nullable instancetype)initWithData:(NSDictionary *)data {
  if (self = [super initWithData:data]) {
    NSDictionary *error = [data objectForKey:kElectrodeBridgeResponseError];
    if (error != nil &&
        [error isKindOfClass:[NSDictionary class]]) { // check the
                                                      // arguemntsEx.toBundle
                                                      // thingy
      NSString *code =
          (NSString *)[error objectForKey:kElectrodeBridgeResponseErrorCode];
      NSString *message =
          (NSString *)[error objectForKey:kElectrodeBridgeResponseErrorMessage];
      _failureMessage = [ElectrodeBridgeFailureMessage
          createFailureMessageWithCode:
              (code != nil ? code : kElectrodeBridgeResponseUnknownErrorCode)
                               message:(message != nil ? message
                                                       : @"unknown error")];
    }
  }

  return self;
}

- (nullable instancetype)initWithName:(NSString *)name
                            messageId:(NSString *)messageId
                                 type:(ElectrodeMessageType)type
                                 data:(id)data
                       failureMessage:
                           (id<ElectrodeFailureMessage>)failureMessage {
  if (self =
          [super initWithName:name messageId:messageId type:type data:data]) {
    _failureMessage = failureMessage;
  }

  return self;
}

- (NSDictionary *)toDictionary {
  if (_failureMessage) {
    NSMutableDictionary *messageDict =
        [[NSMutableDictionary alloc] initWithDictionary:[super toDictionary]];
    NSMutableDictionary *errorDict = [[NSMutableDictionary alloc] init];
    [errorDict setObject:_failureMessage.message
                  forKey:kElectrodeBridgeResponseErrorMessage];
    [errorDict setObject:_failureMessage.code
                  forKey:kElectrodeBridgeResponseErrorCode];
    [messageDict setObject:errorDict forKey:kElectrodeBridgeResponseError];
    return messageDict;
  }
  return [super toDictionary];
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@, failureMessage:%@",
                                    [super description], self.failureMessage];
}

@end
