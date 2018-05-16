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
#import "ElectrodeBridgeTransceiver.h"

NSString * const ERNCodePushConfig = @"CodePush";
NSString * const ERNCodePushConfigServerUrl = @"CodePushConfigServerUrl";
NSString * const ERNCodePushConfigDeploymentKey = @"CodePushConfigDeploymentKey";
NSString * const ERNDebugEnabledConfig = @"DebugEnabledConfig";
NSString * const kElectrodeContainerFrameworkIdentifier = @"com.walmartlabs.ern.ElectrodeContainer";

@interface ElectrodeReactNative ()
@property (nonatomic, strong) RCTBridge *bridge;
@property (nonatomic, strong) ElectrodeBridgeDelegate *bridgeDelegate;
@end

@implementation ElectrodeReactNative

////////////////////////////////////////////////////////////////////////////////
#pragma mark - Public Methods

+ (void)startWithConfigurations:(id<ElectrodePluginConfigurator>)configuration
{
    id sharedInstance = [ElectrodeReactNative sharedInstance];
    
    static dispatch_once_t startOnceToken;
    dispatch_once(&startOnceToken, ^{
        [sharedInstance startContainerWithConfiguration:configuration];
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

- (void)startContainerWithConfiguration:(id<ElectrodePluginConfigurator>)configuration
{
    // Look for CodePush
    /*
    [CodePush initialize];
    [self configureCodePush:configuration];
    
    NSURL *url;
    if([configuration isDebugEnabled]) {
        url = [NSURL URLWithString:@"http://localhost:8081/index.ios.bundle?platform=ios&dev=true"];
        NSLog(@"using local port to debug");
    } else {
        url = [CodePush bundleURLForResource:@"MiniApp"
                               withExtension:@"jsbundle"
                                subdirectory:nil
                                      bundle:[NSBundle bundleForClass:[self class]]];

    }
    */
    NSURL *url;

    //NSArray* bundleFiles = [self allJSBundleFiles];
    //ElectrodeBridgeDelegate *delegate = [[ElectrodeBridgeDelegate alloc] initWithURL:bundleFiles[0]];
    
    ElectrodeBridgeDelegate *delegate = [[ElectrodeBridgeDelegate alloc] initWithURL:url];
    
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

////////////////////////////////////////////////////////////////////////////////
#pragma mark - CodePush Methods
- (void)configureCodePush:(id<ElectrodePluginConfigurator>)configuration
{
    if (configuration && [configuration respondsToSelector:@selector(codePushWithIDString)])
    {
        // [self setUpCodePushWithID:[configuration codePushWithIDString]];
    }
    
    if (configuration && [configuration respondsToSelector:@selector(codePushWithServerURLString)])
    {
       // [self setUpCodePushWithServer:[configuration codePushWithServerURLString]];
    }
}

- (void)setUpCodePushWithID:(NSString *)codePushID
{
    // [CodePush setDeploymentKey:codePushID];
}

- (void)setUpCodePushWithServer:(NSString *)serverURL
{
    // [CodePushConfig current].serverURL = serverURL;
}

@end

////////////////////////////////////////////////////////////////////////////////
#pragma mark - ElectrodeCofnigure

@implementation ElectrodeConfigure

- (instancetype)initWithPlist:(NSString *)plist
{
    self = [super init];
    if (self)
    {
        
        if (plist)
        {
            [self configure:plist];
        }
    }
    
    return self;
}

- (instancetype)initWithData: (NSDictionary *)data {
    if (self = [super init]) {
        [self configureWithData:data];
    }
    
    return self;
}

- (void)configureWithData: (NSDictionary *)data {
    if (data)
    { // Configure
        if ([data objectForKey:ERNDebugEnabledConfig])
        {
            NSNumber *debugEnabled = [data objectForKey:ERNDebugEnabledConfig];
            if (debugEnabled && [debugEnabled isKindOfClass:[NSNumber class]])
            {
                _isDebugEnabled = debugEnabled.boolValue;
            }
            
            NSString *codePushID = [data objectForKey:ERNCodePushConfigDeploymentKey];
            if (codePushID && [codePushID isKindOfClass:[NSString class]])
            {
                _codePushWithIDString = codePushID;
            }
            
            NSString *codePushURL = [data objectForKey:ERNCodePushConfigServerUrl];
            if (codePushURL && [codePushURL isKindOfClass:[NSString class]])
            {
                _codePushWithServerURLString = codePushURL;
            }
        }
    }
}

- (void)configure:(NSString *)plist
{
    NSDictionary *data = [self dataForPlist:plist];
    [self configureWithData:data];
}

- (NSDictionary *)dataForPlist:(NSString *)plist
{
    // Remove the extension if necessary
    if ([[plist pathExtension] isEqualToString:@"plist"])
    {
        plist = [plist stringByReplacingOccurrencesOfString:@".plist" withString:@""];
    }
    NSDictionary *data =
    [NSDictionary dictionaryWithContentsOfFile:
     [[NSBundle bundleForClass:self.class] pathForResource:plist ofType:@"plist"]];
    
    return data;
}

@end
