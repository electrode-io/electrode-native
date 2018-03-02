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

#import "ElectrodeBridgeFailureMessage.h"
#import <Foundation/Foundation.h>

@interface ElectrodeBridgeFailureMessage ()
@property(copy, nonatomic) NSString *code;
@property(copy, nonatomic) NSString *message;
@property(copy, nonatomic, nullable) NSString *debugMessage;
@property(copy, nonatomic, nullable) NSException *exception;
@end

@implementation ElectrodeBridgeFailureMessage

+ (instancetype)createFailureMessageWithCode:(NSString *)code
                                     message:(NSString *)message {
  return [[ElectrodeBridgeFailureMessage alloc] initWithCode:code
                                                     message:message
                                                   exception:nil
                                                debugMessage:nil];
}

+ (instancetype)createFailureMessageWithCode:(NSString *)code
                                     message:(NSString *)message
                                   exception:(nullable NSException *)exception {
  return [[ElectrodeBridgeFailureMessage alloc] initWithCode:code
                                                     message:message
                                                   exception:exception
                                                debugMessage:nil];
}

+ (instancetype)createFailureMessageWithCode:(NSString *)code
                                     message:(NSString *)message
                                debugMessage:(nullable NSString *)debugMessage {
  return [[ElectrodeBridgeFailureMessage alloc] initWithCode:code
                                                     message:message
                                                   exception:nil
                                                debugMessage:debugMessage];
}

- (instancetype)initWithCode:(NSString *)code
                     message:(NSString *)message
                   exception:(nullable NSException *)exception
                debugMessage:(nullable NSString *)debugMessage {

  if (self = [super init]) {
    _code = code;
    _message = message;
    _exception = exception;
    _debugMessage = (debugMessage == nil) ? exception.reason : nil;
    return self;
  }

  return nil;
}

- (NSString *)description {
  return [NSString
      stringWithFormat:
          @"%@ -> code: %@, message: %@, exception %@, debugMessage %@",
          NSStringFromClass([self class]), self.code, self.message,
          self.exception.name, self.debugMessage];
}

@end
