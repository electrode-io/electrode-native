//
//  ElectrodeCodePushConfig.m
//  ElectrodeContainer
//
//  Created by Claire Weijie Li on 6/27/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import "ElectrodeCodePushConfig.h"
#import <CodePush/CodePush.h>

#if __has_include(<React/RCTBridgeDelegate.h>)
#import <React/RCTBridgeDelegate.h>
#elif __has_include("RCTBridgeDelegate.h")
#import "RCTBridgeDelegate.h"
#else
#import "React/RCTBridgeDelegate.h"   // Required when used as a Pod in a Swift project
#endif

#import "ElectrodeBridgeDelegate.h"
@interface ElectrodeCodePushConfig()

@property(nonatomic, copy) NSString *deploymentKey;
@property(nonatomic, copy, nullable) NSString *serverURL;
@property(nonatomic, weak, nullable) ElectrodeContainerConfig *containerConfig;

@end
@implementation ElectrodeCodePushConfig

- (instancetype) initWithDeploymentKey:(NSString *)deploymentKey
                             serverURL: (NSString * _Nullable)serverURL
                       containerConfig: (ElectrodeContainerConfig *)containerConfig
{
    if (self = [super init]) {
        _deploymentKey = deploymentKey;
        _serverURL = serverURL;
        _containerConfig = containerConfig;
    }
    
    return self;
}

- (void)setupConfigWithDelegate: (id<RCTBridgeDelegate>) delegate {
    [CodePush initialize];
    [CodePush setDeploymentKey:self.deploymentKey];
    if (self.serverURL) {
      [CodePushConfig current].serverURL = self.serverURL;
    }
    if (!self.containerConfig.debugEnabled) {
        if ([delegate isKindOfClass:[ElectrodeBridgeDelegate class]]) {
            ElectrodeBridgeDelegate *bridgeDelegate = (ElectrodeBridgeDelegate *)delegate;
            [bridgeDelegate setJsBundleURL:[self codePushBundleURL]];
        }
    }
}

- (NSURL *) codePushBundleURL {
    NSURL *url = [CodePush bundleURLForResource:@"MiniApp"
                                  withExtension:@"jsbundle"
                                   subdirectory:nil
                                         bundle:[NSBundle bundleForClass:[self class]]];
    
    
    return url;
}

@end
