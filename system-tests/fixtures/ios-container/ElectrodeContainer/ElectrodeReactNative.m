/*
 * Copyright 2017 WalmartLabs

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
#import "NSBundle+frameworkBundle.h"
#import <CoreText/CTFontManager.h>

NSString * const ERNCodePushConfig = @"CodePush";
NSString * const ERNCodePushConfigServerUrl = @"CodePushConfigServerUrl";
NSString * const ERNCodePushConfigDeploymentKey = @"CodePushConfigDeploymentKey";
NSString * const ERNDebugEnabledConfig = @"DebugEnabledConfig";
NSString * const kElectrodeContainerFrameworkIdentifier = @"com.walmartlabs.ern.ElectrodeContainer";
static dispatch_semaphore_t semaphore;

@implementation ElectrodeContainerConfig

- (void) setupConfigWithDelegate:(id<RCTBridgeDelegate>)delegate {
    if ([delegate respondsToSelector:@selector(setJsBundleURL:)]) {
        NSURL *url;
        if (self.debugEnabled) {
            url = [NSURL URLWithString:@"http://localhost:8081/index.ios.bundle?platform=ios&dev=true"];
            NSLog(@"using local port to debug");
        } else {
            url = [self allJSBundleFiles][0];
        }

        ElectrodeBridgeDelegate *bridgeDelegate = (ElectrodeBridgeDelegate *)delegate;
        [bridgeDelegate setJsBundleURL:url];
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

@interface ElectrodeReactNative ()
@property (nonatomic, strong) RCTBridge *bridge;
@property (nonatomic, strong) ElectrodeBridgeDelegate *bridgeDelegate;
@end

@implementation ElectrodeReactNative

////////////////////////////////////////////////////////////////////////////////
#pragma mark - Public Methods

+ (void)startWithConfigurations:(id<ElectrodePluginConfig>)reactContainerConfig
                electrodeCodePushConfig: (id<ElectrodePluginConfig>) electrodeCodePushConfig

{
    id sharedInstance = [ElectrodeReactNative sharedInstance];
    static dispatch_once_t startOnceToken;
    semaphore = dispatch_semaphore_create(0);
    dispatch_once(&startOnceToken, ^{
        [sharedInstance startContainerWithConfiguration:reactContainerConfig
         electrodeCodePushConfig:electrodeCodePushConfig
];
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
                electrodeCodePushConfig: (id<ElectrodePluginConfig>) electrodeCodePushConfig
{
    ElectrodeBridgeDelegate *delegate = [[ElectrodeBridgeDelegate alloc] init];

    [reactContainerConfig setupConfigWithDelegate:delegate];
            [electrodeCodePushConfig setupConfigWithDelegate:delegate];

    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:delegate launchOptions:nil];
    self.bridge = bridge;

     [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(notifyElectrodeReactNativeOnInitialized:)
                                                     name:RCTDidInitializeModuleNotification object:nil];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(signalElectrodeOnReactNativeInitializedSemaphore:)
                                                     name:RCTJavaScriptDidLoadNotification object:nil];
    [self loadCustomFonts];


}

- (void)loadCustomFonts {
    NSArray *fontPaths = [[NSBundle frameworkBundle] pathsForResourcesOfType:nil inDirectory:nil];
    for (NSString *fontPath in fontPaths) {
        if ([[fontPath pathExtension] isEqualToString:@"ttf"] || [[fontPath pathExtension] isEqualToString:@"otf"]) {
            NSData *inData = [NSData dataWithContentsOfFile:fontPath];
            CFErrorRef error;
            CGDataProviderRef provider = CGDataProviderCreateWithCFData((__bridge CFDataRef)inData);
            CGFontRef font = CGFontCreateWithDataProvider(provider);
            if (! CTFontManagerRegisterGraphicsFont(font, &error)) {
                CFStringRef errorDescription = CFErrorCopyDescription(error);
                NSLog(@"Failed to load font: %@", errorDescription);
                CFRelease(errorDescription);
            }
            CFRelease(font);
            CFRelease(provider);
        }
    }
}


- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void) notifyElectrodeReactNativeOnInitialized: (NSNotification *) notification {
    if (notification) {
        if ([notification.object isKindOfClass:[RCTBridge class]] ) {
            id localModuleInstance = notification.userInfo[@"module"];
            SEL selector = NSSelectorFromString(@"onReactNativeInitialized");
            SEL transceiverReadySelector = NSSelectorFromString(@"onTransceiverModuleInitialized");
            if ([localModuleInstance  respondsToSelector:selector]) {
                dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                    double delayInSeconds = 180.0;
                    dispatch_time_t dispatchTime = dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC);
                    long waitValue = dispatch_semaphore_wait(semaphore, dispatchTime);
                    if (waitValue == 0) {
                        ((void (*)(id, SEL))[localModuleInstance methodForSelector:selector])(localModuleInstance, selector);
                    }
                    else {
                        [NSException raise:@"Timeout occurred" format:@"waitValue is %ld & RCTJavaScriptDidLoadNotification was not raised", waitValue];
                    }
                });
            }

            if ([localModuleInstance  respondsToSelector:transceiverReadySelector]) {
                ((void (*)(id, SEL))[localModuleInstance methodForSelector:transceiverReadySelector])(localModuleInstance, transceiverReadySelector);
            }
        }
    }
}

- (void) signalElectrodeOnReactNativeInitializedSemaphore: (NSNotification *) notification {
    dispatch_semaphore_signal(semaphore);
}

@end
