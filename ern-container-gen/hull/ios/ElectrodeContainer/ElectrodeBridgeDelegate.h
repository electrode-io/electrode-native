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

@interface ElectrodeBridgeDelegate : NSObject <RCTBridgeDelegate>

- (instancetype)initWithModuleURL:(NSURL *)url extraModules:(NSArray *)modules;
- (instancetype)initWithURL: (NSURL *)url;

@end
