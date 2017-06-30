//
//  ElectrodeBridgeDelegate.m
//  ElectrodeContainer
//
//  Created by Cody Garvin on 2/15/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import "ElectrodeBridgeDelegate.h"

@interface ElectrodeBridgeDelegate ()
@property (nonatomic, copy) NSURL *sourceURL;
@property (nonatomic, strong) NSArray *extraModules;
@property(nonatomic, strong) id<ElectrodePluginConfig> containerConfig;
@property(nonatomic, strong) id<ElectrodePluginConfig> codePushConfig;
@end

@implementation ElectrodeBridgeDelegate

- (instancetype)initWithModuleURL:(NSURL *)url extraModules:(NSArray *)modules
{
    self = [super init];
    if (self)
    {
        self.sourceURL = url;
        self.extraModules = modules;
    }
    
    return self;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
    return self.jsBundleURL;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
    return _extraModules;
}

- (instancetype)initWithContainerConfig: (id<ElectrodePluginConfig>) containerConfig
                         codePushConfig: (id<ElectrodePluginConfig>) codePushConfig {
    if (self = [super init]) {
        _codePushConfig = codePushConfig;
        _containerConfig = containerConfig;
        
    }
    
    return self;
}

- (void) setUp {
    
}
@end
