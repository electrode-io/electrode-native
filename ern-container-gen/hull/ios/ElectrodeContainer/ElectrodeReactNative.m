//
//  ElectrodeReactNative.m
//  ElectrodeContainer
//
//  Created by Cody Garvin on 1/18/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import "ElectrodeReactNative_Internal.h"

#if __has_include(<React/RCTBundleURLProvider.h>)
#import <React/RCTBundleURLProvider.h>
#elif __has_include("RCTBundleURLProvider.h")
#import "RCTBundleURLProvider.h"
#else
#import "React/RCTBundleURLProvider.h"   // Required when used as a Pod in a Swift project
#endif

#if __has_include(<React/RCTRootView.h>)
#import <React/RCTRootView.h>
#elif __has_include("RCTRootView.h")
#import "RCTRootView.h"
#else
#import "React/RCTRootView.h"   // Required when used as a Pod in a Swift project
#endif



#import "ElectrodeBridgeDelegate.h"
#import "ElectrodeBridgeTransceiver.h"

NSString * const ERNCodePushConfig = @"CodePush";
NSString * const ERNCodePushConfigServerUrl = @"CodePushConfigServerUrl";
NSString * const ERNCodePushConfigDeploymentKey = @"CodePushConfigDeploymentKey";
NSString * const ERNDebugEnabledConfig = @"DebugEnabledConfig";
NSString * const kElectrodeContainerFrameworkIdentifier = @"com.walmart.electronics.ElectrodeContainer";

@implementation ElectrodeContainerConfig

- (void) setupConfigWithDelegate:(id<RCTBridgeDelegate>)delegate {
    if (self.useOkHttpClient && [delegate respondsToSelector:@selector(setJsBundleURL:)]) {
        ElectrodeBridgeDelegate *bridgeDelegate = (ElectrodeBridgeDelegate *)delegate;
        [bridgeDelegate setJsBundleURL:self.useOkHttpClient];
    }
}

@end

@interface ElectrodeReactNative ()
@property (nonatomic, strong) RCTBridge *bridge;
@property (nonatomic, strong) ElectrodeBridgeDelegate *bridgeDelegate;
@end

@implementation ElectrodeReactNative

////////////////////////////////////////////////////////////////////////////////
#pragma mark - Public Methods

+ (void)startWithConfigurations:(id<ElectrodePluginConfig>)reactContainerConfig
                {{#plugins}}
                    {{#configurable}}
                {{{lcname}}}: (id<ElectrodePluginConfig>) {{{lcname}}}
                    {{/configurable}}
                {{/plugins}}

{
    id sharedInstance = [ElectrodeReactNative sharedInstance];
    static dispatch_once_t startOnceToken;
    dispatch_once(&startOnceToken, ^{
        [sharedInstance startContainerWithConfiguration:reactContainerConfig
         {{#plugins}}
         {{#configurable}}
         {{{lcname}}}:{{{lcname}}}
         {{/configurable}}
         {{/plugins}}];
    });
}

+ (instancetype)sharedInstance
{
    static dispatch_once_t onceToken;
    static id sharedInstance;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    
    return sharedInstance;
}

- (UIViewController *)miniAppWithName:(NSString *)name
                           properties:(NSDictionary *)properties
{
    
    UIViewController *miniAppViewController = nil;
    
    // Build out the view controller
    // Use the bridge to generate the view
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:name initialProperties:properties];
    
    rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
    
    miniAppViewController = [UIViewController new];
    miniAppViewController.view = rootView;
    
    return miniAppViewController;}

////////////////////////////////////////////////////////////////////////////////
#pragma mark - Convenience Methods

- (void)startContainerWithConfiguration:(id<ElectrodePluginConfig>)reactContainerConfig
         {{#plugins}}
            {{#configurable}}
                {{{lcname}}}: (id<ElectrodePluginConfig>) {{{lcname}}}
            {{/configurable}}
         {{/plugins}}
{
    ElectrodeBridgeDelegate *delegate = [[ElectrodeBridgeDelegate alloc] init];
    
    [reactContainerConfig setupConfigWithDelegate:delegate];
    {{#plugins}}
        {{#configurable}}
            [{{{lcname}}} setupConfigWithDelegate:delegate];
        {{/configurable}}
    {{/plugins}}
    
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:delegate launchOptions:nil];
    self.bridge = bridge;
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(notifyElectrodeOnReactInitialized:)
                                                 name:RCTDidInitializeModuleNotification object:nil];
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void) notifyElectrodeOnReactInitialized: (NSNotification *) notification {
    if (notification) {
        if ([notification.object isKindOfClass:[RCTBridge class]] ) {
            RCTBridge *initializedBridge = (RCTBridge *) notification.object;
            id moduleInstance = notification.userInfo[@"module"];
            if ([moduleInstance isKindOfClass:[ElectrodeBridgeTransceiver class]]) {
                ElectrodeBridgeTransceiver *electrodeBridge = [self.bridge moduleForClass:[ElectrodeBridgeTransceiver class]];
                [electrodeBridge onReactNativeInitialized];
            }
        }
    }
}

- (NSArray *)allJSBundleFiles
{
    NSArray *returnFiles = nil;
    NSURL *bundle = [[NSBundle bundleForClass:self.class] bundleURL];
    NSError *error = nil;
    
    NSArray *files =
    [[NSFileManager defaultManager] contentsOfDirectoryAtURL:bundle
                                  includingPropertiesForKeys:nil
                                                     options:NSDirectoryEnumerationSkipsHiddenFiles
                                                       error:&error];
    if (!error)
    {
        NSPredicate *jsBundlePredicate = [NSPredicate predicateWithFormat:@"pathExtension='jsbundle'"];
        returnFiles = [files filteredArrayUsingPredicate:jsBundlePredicate];
    }
    return returnFiles;
}
@end
