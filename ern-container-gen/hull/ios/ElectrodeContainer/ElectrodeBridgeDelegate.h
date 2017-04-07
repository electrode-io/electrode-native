//
//  ElectrodeBridgeDelegate.h
//  ElectrodeContainer
//
//  Created by Cody Garvin on 2/15/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeDelegate.h>

@interface ElectrodeBridgeDelegate : NSObject <RCTBridgeDelegate>

- (instancetype)initWithModuleURL:(NSURL *)url extraModules:(NSArray *)modules;
- (instancetype)initWithURL: (NSURL *)url;

@end
