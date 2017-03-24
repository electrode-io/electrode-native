//
//  ElectrodeReactNativeTests.m
//  ElectrodeContainer
//
//  Created by Claire Weijie Li on 3/1/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "ElectrodeReactNative_Internal.h"
#import <CodePush/CodePush.h>

@interface ElectrodeReactNativeTests : XCTestCase

@end

@implementation ElectrodeReactNativeTests

- (void)testCreateUniqueInstance {
    ElectrodeReactNative *uniqueReactNativeInstance = [[ElectrodeReactNative alloc] init];
    XCTAssertNotNil(uniqueReactNativeInstance);
    XCTAssert([uniqueReactNativeInstance isKindOfClass:[ElectrodeReactNative class]]);
}

- (void)testCreateSharedInstance {
    ElectrodeReactNative *singletonReactNativeInstance = [ElectrodeReactNative sharedInstance];
    XCTAssertNotNil(singletonReactNativeInstance);
    XCTAssert([singletonReactNativeInstance isKindOfClass:[ElectrodeReactNative class]]);
}

- (void)testSingletonAlwaysReturnSameInstance {
    ElectrodeReactNative *singletonOne = [ElectrodeReactNative sharedInstance];
    ElectrodeReactNative *singletonTwo = [ElectrodeReactNative sharedInstance];
    XCTAssertEqual(singletonOne, singletonTwo);
}

- (void)testSingletonInstanceIsNotUniqueInstance {
    ElectrodeReactNative *uniqueInstance = [[ElectrodeReactNative alloc] init];
    XCTAssertNotNil(uniqueInstance);
    ElectrodeReactNative *sharedInstance = [ElectrodeReactNative sharedInstance];
    XCTAssertNotNil(sharedInstance);
    XCTAssertNotEqual(uniqueInstance, sharedInstance);
}

- (void)testCreateUniqueInstanceReturnsDifferentInstances {
    ElectrodeReactNative *uniqueInstanceOne = [[ElectrodeReactNative alloc] init];
    ElectrodeReactNative *uniqueInstanceTwo = [[ElectrodeReactNative alloc] init];
    XCTAssertNotNil(uniqueInstanceOne);
    XCTAssertNotNil(uniqueInstanceTwo);
    XCTAssertNotEqual(uniqueInstanceOne, uniqueInstanceTwo);
}
@end
