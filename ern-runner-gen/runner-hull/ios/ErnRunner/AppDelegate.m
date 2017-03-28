//
//  AppDelegate.m
//  ErnRunner
//
//  Created by Benoit Lemaire on 3/28/17.
//  Copyright © 2017 Benoit Lemaire. All rights reserved.
//

#import "AppDelegate.h"
#import <ElectrodeContainer/ElectrodeContainer.h>

@interface AppDelegate ()

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Start the container
    [ElectrodeReactNative startWithConfigurations:nil];
    
    UIViewController *iOSRNProjectViewController =
    [[ElectrodeReactNative sharedInstance] miniAppWithName:@"{{{miniAppName}}}" properties:nil];
    
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    self.window.rootViewController = iOSRNProjectViewController;
    [self.window makeKeyAndVisible];
    return YES;
}

@end
