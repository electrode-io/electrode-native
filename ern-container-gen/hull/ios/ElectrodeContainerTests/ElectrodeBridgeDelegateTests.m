//
//  ElectrodeBridgeDelegateTests.m
//  ElectrodeContainer
//
//  Created by Claire Weijie Li on 2/28/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "ElectrodeBridgeDelegate.h"
#import <ElectrodeReactNativeBridge/ElectrodeReactNativeBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>


@interface MockElectrodeBridgeModule: NSObject<RCTBridgeModule>
@end

@implementation MockElectrodeBridgeModule

+ (NSString *)moduleName {
    return @"MockElectrodeBridgeModule";
}

@end

@interface ElectrodeBridgeDelegateTests : XCTestCase
@property(nonatomic, strong) ElectrodeBridgeDelegate *bridgeDelegate;
@end

@implementation ElectrodeBridgeDelegateTests

- (void)testInitializationWithAbsoluteURL {
    NSURL *url = [[NSURL alloc]initWithString:@"http://localhost:8081/index.ios.bundle"];
    id<RCTBridgeModule> module= [[MockElectrodeBridgeModule alloc] init];
    NSArray<id<RCTBridgeModule>> *modules = @[module];
    self.bridgeDelegate = [[ElectrodeBridgeDelegate alloc] initWithModuleURL:url extraModules:modules];
    XCTAssertNotNil(self.bridgeDelegate);
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self.bridgeDelegate launchOptions:nil];
    XCTAssertEqual([self.bridgeDelegate sourceURLForBridge:bridge], url);
}

- (void)testInitializationWithLocalFilePath {
    NSURL *url = [[NSURL alloc]initWithString:@"file://.../main.jsbundle"];
    id<RCTBridgeModule> module= [[MockElectrodeBridgeModule alloc] init];
    NSArray<id<RCTBridgeModule>> *modules = @[module];
    self.bridgeDelegate = [[ElectrodeBridgeDelegate alloc] initWithModuleURL:url extraModules:modules];
    XCTAssertNotNil(self.bridgeDelegate);
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self.bridgeDelegate launchOptions:nil];
    XCTAssertEqual([self.bridgeDelegate sourceURLForBridge:bridge], url);
}



@end
