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

#import "ElectrodeBridgeRequest.h"
#import "ElectrodeLogger.h"

const int kElectrodeBridgeRequestDefaultTimeOut = 5000;
const int kElectrodeBridgeRequestNoTimeOut = -1;

@interface ElectrodeBridgeRequest ()

@property(nonatomic, assign) int timeoutMs;
@property(nonatomic, assign) BOOL isJsInitiated;

@end

@implementation ElectrodeBridgeRequest

+ (nullable instancetype)createRequestWithData:(NSDictionary *)data {
  if ([super isValidFromData:data withType:ElectrodeMessageTypeRequest]) {
    return [[self alloc] initWithData:data];
  }

  ERNDebug(@"cannot create class ElectrodeBridgeRequest with data");
  return nil;
}

- (instancetype)initWithData:(NSDictionary *)data {
  if (self = [super initWithData:data]) {
    _timeoutMs = kElectrodeBridgeRequestNoTimeOut;
    _isJsInitiated = YES;
  }
  return self;
}

- (instancetype)initWithName:(NSString *)name data:(id)data {
  if (self = [super initWithName:name
                            type:ElectrodeMessageTypeRequest
                            data:data]) {
    _timeoutMs = kElectrodeBridgeRequestDefaultTimeOut;
    _isJsInitiated = NO;
  }
  return self;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@, timeOut:%d, isJsInitiated:%d",
                                    [super description], self.timeoutMs,
                                    self.isJsInitiated];
}

- (id)copyWithZone:(nullable NSZone *)zone {
  return self;
}

@end
