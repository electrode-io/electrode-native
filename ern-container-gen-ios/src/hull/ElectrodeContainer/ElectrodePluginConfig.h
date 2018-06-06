//
//  ElectrodePluginConfig.h
//  ElectrodeContainer
//
//  Created by Claire Weijie Li on 5/1/18.
//  Copyright © 2018 Walmart. All rights reserved.
//
@protocol RCTBridgeDelegate;

#pragma mark - ElectrodePluginConfigurator
/**
 Used as configuration for the start up of the ElectrodeReactNative system. Build
 a class that adheres to this
 */
@protocol ElectrodePluginConfig <NSObject>
-(void)setupConfigWithDelegate: (id<RCTBridgeDelegate>) delegate;

@optional
// Optional Instance Methods

/**
 Builds an instance of the configurator based off of a plist of configuration.
 @return instancetype of the class that adheres to the protocol.
 */
- (instancetype)initWithIsDebugEnabled: (BOOL) enabled;
- (instancetype)initWithPlist:(NSString *)plist;
- (instancetype)initWithDeploymentKey: (NSString *)deploymentKey;

// Optional Properties
@property (nonatomic, copy, readonly) NSString *codePushWithServerURLString;

@property (nonatomic, copy, readonly) NSString *codePushWithIDString;

@end

