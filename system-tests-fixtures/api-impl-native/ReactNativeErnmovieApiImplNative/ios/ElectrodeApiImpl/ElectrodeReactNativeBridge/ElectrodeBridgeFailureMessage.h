//
//  ElectrodeBridgeFailureMessage.h
//  ElectrodeReactNativeBridge
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

@protocol ElectrodeFailureMessage <NSObject>

@property(readonly, copy, nonatomic) NSString *code;
@property(readonly, copy, nonatomic) NSString *message;

@optional
@property(readonly, copy, nonatomic, nullable) NSString *debugMessage;
@property(readonly, copy, nonatomic, nullable) NSException *exception;

@end

@interface ElectrodeBridgeFailureMessage : NSObject <ElectrodeFailureMessage>

@property(readonly, copy, nonatomic) NSString *code;
@property(readonly, copy, nonatomic) NSString *message;
@property(readonly, copy, nonatomic, nullable) NSString *debugMessage;
@property(readonly, copy, nonatomic, nullable) NSException *exception;

+ (instancetype)createFailureMessageWithCode:(NSString *)code
                                     message:(NSString *)message;
+ (instancetype)createFailureMessageWithCode:(NSString *)code
                                     message:(NSString *)message
                                   exception:(nullable NSException *)exception;
+ (instancetype)createFailureMessageWithCode:(NSString *)code
                                     message:(NSString *)message
                                debugMessage:(nullable NSString *)debugMessage;

@end

NS_ASSUME_NONNULL_END
