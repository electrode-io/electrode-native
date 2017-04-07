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

- (instancetype)initWithURL: (NSURL *)url 
{
    if (self = [super init]) 
    {
        _sourceURL = url;
    }
    
    return self;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
    return _sourceURL;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
    return _extraModules;
}

@end
