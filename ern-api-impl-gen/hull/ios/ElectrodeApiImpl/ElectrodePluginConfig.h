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

@protocol RCTBridgeDelegate;

#pragma mark - ElectrodePluginConfigurator
/**
 Used as configuration for the start up of the ElectrodeReactNative system. Build
 a class that adheres to this
 */
@protocol ElectrodePluginConfig <NSObject>
- (void)setupConfigWithDelegate:(id<RCTBridgeDelegate>)delegate;

@optional
// Optional Instance Methods

/**
 Builds an instance of the configurator based off of a plist of configuration.
 @return instancetype of the class that adheres to the protocol.
 */
- (instancetype)initWithIsDebugEnabled:(BOOL)enabled;
- (instancetype)initWithPlist:(NSString *)plist;
- (instancetype)initWithDeploymentKey:(NSString *)deploymentKey;

// Optional Properties
@property (nonatomic, copy, readonly) NSString *codePushWithServerURLString;
@property (nonatomic, copy, readonly) NSString *codePushWithIDString;

@end
