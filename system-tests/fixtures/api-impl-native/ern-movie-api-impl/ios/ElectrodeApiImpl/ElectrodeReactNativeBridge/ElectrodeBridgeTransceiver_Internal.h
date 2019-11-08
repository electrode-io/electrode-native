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

#import "ElectrodeBridgeTransceiver.h"
NS_ASSUME_NONNULL_BEGIN
static ElectrodeBridgeReactNativeReadyListner reactNativeReadyListener = nil;
static ElectrodeBridgeReactNativeReadyListner reactNativeTransceiver = nil;
static BOOL isReactNativeReady = NO;
static BOOL isTransceiverReady = NO;
static ElectrodeBridgeTransceiver *sharedInstance;

@interface ElectrodeBridgeTransceiver ()
- (void)emitMessage:(ElectrodeBridgeMessage *_Nonnull)bridgeMessage;
- (void)resetRegistrar;
@end

NS_ASSUME_NONNULL_END
