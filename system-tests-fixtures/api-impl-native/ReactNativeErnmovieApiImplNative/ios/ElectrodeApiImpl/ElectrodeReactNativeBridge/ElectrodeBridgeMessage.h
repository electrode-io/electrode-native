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
NS_ASSUME_NONNULL_BEGIN

extern NSString *const kElectrodeBridgeMessageName;
extern NSString *const kElectrodeBridgeMessageId;
extern NSString *const kElectrodeBridgeMessageType;
extern NSString *const kElectrodeBridgeMessageData;

extern NSString *const kElectrodeBridgeMessageRequest;
extern NSString *const kElectrodeBridgeMessageResponse;
extern NSString *const kElectordeBridgeMessageEvent;

typedef NS_ENUM(NSUInteger, ElectrodeMessageType) {
  ElectrodeMessageTypeRequest,
  ElectrodeMessageTypeResponse,
  ElectrodeMessageTypeEvent,
  ElectrodeMessageTypeUnknown
};

@interface ElectrodeBridgeMessage : NSObject

@property(nonatomic, copy, readonly) NSString *name;
@property(nonatomic, copy, readonly) NSString *messageId;
@property(nonatomic, assign, readonly) ElectrodeMessageType type;
// this could be NSDictionary, primitives, or NSArray
@property(nonatomic, strong, readonly, nullable) id data;

+ (BOOL)isValidFromData:(NSDictionary *)data;
+ (BOOL)isValidFromData:(NSDictionary *)data
               withType:(ElectrodeMessageType)type;
+ (NSString *)UUID;

- (instancetype)initWithName:(NSString *)name
                   messageId:(NSString *)messageId
                        type:(ElectrodeMessageType)type
                        data:(id _Nullable)data;

/*
 * @param data could be NSDictionary, primitives, or NSArray
 */
- (instancetype)initWithName:(NSString *)name
                        type:(ElectrodeMessageType)type
                        data:(id _Nullable)data;
/*
 * return an instance of bridge message from a NSDictionary representation of
 * it.
 * @param data NSDictionary representation of BridgeMessage. Has keys of
 * 'id','name','type','data'
 */
- (nullable instancetype)initWithData:(NSDictionary *)data;
+ (ElectrodeMessageType)typeFromString:(NSString *)string;
+ (NSString *)convertEnumTypeToString:
    (ElectrodeMessageType)electrodeMessageType;
- (NSDictionary *)toDictionary;

@end

NS_ASSUME_NONNULL_END
