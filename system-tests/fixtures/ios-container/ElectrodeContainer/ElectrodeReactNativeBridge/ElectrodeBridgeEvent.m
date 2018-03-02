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

#import "ElectrodeBridgeEvent.h"
#import "ElectrodeBridgeMessage.h"
#import "ElectrodeLogger.h"

@implementation ElectrodeBridgeEvent
+ (nullable instancetype)createEventWithData:(NSDictionary *)data {
  if ([ElectrodeBridgeMessage isValidFromData:data
                                     withType:ElectrodeMessageTypeEvent]) {
    return [[super alloc] initWithData:data];
  }

  ERNDebug(@"%@ : unable to create with data %@",
           [ElectrodeBridgeEvent className], data);
  return nil;
}

- (instancetype)initWithName:(NSString *)name data:(id)data {
  if (self =
          [super initWithName:name type:ElectrodeMessageTypeEvent data:data]) {
    return self;
  }
  ERNDebug(@"%@ : unable to create with data %@",
           [ElectrodeBridgeEvent className], data);
  return nil;
}

+ (NSString *)className {
  return NSStringFromClass(self.class);
}

@end
