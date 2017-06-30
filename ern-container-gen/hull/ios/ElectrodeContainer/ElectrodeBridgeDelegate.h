//
//  ElectrodeBridgeDelegate.h
//  ElectrodeContainer
//
//  Created by Cody Garvin on 2/15/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import <Foundation/Foundation.h>

#if __has_include(<React/RCTBridgeDelegate.h>)
#import <React/RCTBridgeDelegate.h>
#elif __has_include("RCTBridgeDelegate.h")
#import "RCTBridgeDelegate.h"
#else
#import "React/RCTBridgeDelegate.h"   // Required when used as a Pod in a Swift project
#endif
NS_ASSUME_NONNULL_BEGIN
////////////////////////////////////////////////////////////////////////////////
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
 
 @param plist A string of the name of the plist with configuration in it.
 @return instancetype of the class that adheres to the protocol.
 */
- (instancetype)initWithIsDebugEnabled: (BOOL) enabled;
- (instancetype)initWithPlist:(NSString *)plist;
- (instancetype)initWithDeploymentKey: (NSString *)deploymentKey;

// Optional Properties
@property (nonatomic, copy, readonly) NSString *codePushWithServerURLString;

@property (nonatomic, copy, readonly) NSString *codePushWithIDString;

@end


@interface ElectrodeBridgeDelegate : NSObject <RCTBridgeDelegate>
@property (nonatomic, strong) NSURL *jsBundleURL;

- (instancetype)initWithModuleURL:(NSURL *)url extraModules:(NSArray *)modules;
/*
 * @deprecate
 */
- (instancetype)initWithURL: (NSURL *)url;

- (instancetype)initWithContainerConfig: (id<ElectrodePluginConfig>) containerConfig
                         codePushConfig: (id<ElectrodePluginConfig>) codePushConfig;

- (void) setUp;
NS_ASSUME_NONNULL_END
@end


