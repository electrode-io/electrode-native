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

#import <React/RCTDevMenu.h>
#import <React/RCTUtils.h>
#import "ERNDevSettingsViewController.h"
#import <React/RCTBridge+Private.h>
#import "ElectrodeBridgeDelegate.h"
#import "NSBundle+frameworkBundle.h"
#import <CoreText/CTFontManager.h>

NSString * const ERNCodePushConfig = @"CodePush";
NSString * const ERNCodePushConfigServerUrl = @"CodePushConfigServerUrl";
NSString * const ERNCodePushConfigDeploymentKey = @"CodePushConfigDeploymentKey";
NSString * const ERNDebugEnabledConfig = @"DebugEnabledConfig";
NSString * const kElectrodeContainerFrameworkIdentifier = @"com.walmartlabs.ern.ElectrodeContainer";
static NSString *packagerIPPort = @"bundleStoreHostPort";
static NSString *bundleStore = @"bundleStore";
static NSString *storeBundleId = @"storeBundleId";
static NSString *autoReloadBundle = @"autoReloadBundle";
static NSString *enableBundleStore = @"enableBundleStore";

@implementation ElectrodeContainerConfig

- (instancetype)init {
    self = [super init];
    if (self) {
        //default values
        self.packagerHost= @"localhost";
        self.packagerPort = @"8081";
    }
    return self;
}

//10.74.57.21:8080/bundles/benoit/ios/latest complete JS location
- (void) setupConfigWithDelegate:(id<RCTBridgeDelegate>)delegate {
    NSString *urlString = nil;
    if ([delegate respondsToSelector:@selector(setJsBundleURL:)]) {
        NSURL *url;
        if (self.bundleStoreHostPort == nil) {
            self.bundleStoreHostPort = @"localhost:8080";
        }
        [[NSUserDefaults standardUserDefaults]  setObject:self.bundleStoreHostPort forKey:packagerIPPort];
        if (self.debugEnabled) {
            BOOL isBundleStoreEnabled = [[NSUserDefaults standardUserDefaults] boolForKey:enableBundleStore];
            if (isBundleStoreEnabled) {
                urlString = [NSString stringWithFormat:@"http://%@/bundles/%@/ios/%@/index.bundle",
                                       [[NSUserDefaults standardUserDefaults] objectForKey:packagerIPPort],
                                       [[NSUserDefaults standardUserDefaults] objectForKey:bundleStore],
                                       [[NSUserDefaults standardUserDefaults] objectForKey:storeBundleId]];
            } else {
             // iOS device and Macbook must be on the same Wi-fi & metro packager (bundler) by default runs on 8081 port.
              urlString = [NSString stringWithFormat:@"http://%@:%@/{{{jsMainModuleName}}}.bundle?platform=ios&dev=true",self.packagerHost,self.packagerPort];
              self.bundleStoreHostPort = [NSString stringWithFormat:@"%@:%@",self.packagerHost,self.packagerPort];
             //disable Bundle Store functionality to load it from the default bundle
              [[ElectrodeReactNative sharedInstance] setDefaultHostAndPort:self.bundleStoreHostPort];
            }
            url = [NSURL URLWithString:urlString];
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
@property (nonatomic, weak) id<ERNDelegate> ernDelegate;
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
                {{#hasAtleastOneApiImplConfig}}
                apiImplementationsConfig: (NSObject <APIImplsConfigWrapperDelegate> *) apiImplConfig
                {{/hasAtleastOneApiImplConfig}}
{
    id sharedInstance = [ElectrodeReactNative sharedInstance];
    static dispatch_once_t startOnceToken;
    dispatch_once(&startOnceToken, ^{
        [sharedInstance startContainerWithConfiguration:reactContainerConfig ernDelegate:nil
         {{#plugins}}
         {{#configurable}}
         {{{lcname}}}:{{{lcname}}}
         {{/configurable}}
         {{/plugins}}
         {{#hasAtleastOneApiImplConfig}}
         apiImplementationsConfig: apiImplConfig
         {{/hasAtleastOneApiImplConfig}}];
    });
}

+ (void)startWithConfigurations:(id<ElectrodePluginConfig>)reactContainerConfig ernDelegate:(id<ERNDelegate> _Nullable)ernDelegate
                {{#plugins}}
                {{#configurable}}
                {{{lcname}}}: (id<ElectrodePluginConfig> _Nullable) {{{lcname}}}
                {{/configurable}}
                {{/plugins}}
                {{#hasAtleastOneApiImplConfig}}
                apiImplementationsConfig: (NSObject <APIImplsConfigWrapperDelegate> *) apiImplConfig
                {{/hasAtleastOneApiImplConfig}}

{
    id sharedInstance = [ElectrodeReactNative sharedInstance];
    static dispatch_once_t startOnceToken;
    dispatch_once(&startOnceToken, ^{
        [sharedInstance startContainerWithConfiguration:reactContainerConfig ernDelegate:ernDelegate
         {{#plugins}}
         {{#configurable}}
         {{{lcname}}}:{{{lcname}}}
         {{/configurable}}
         {{/plugins}}
         {{#hasAtleastOneApiImplConfig}}
         apiImplementationsConfig: apiImplConfig
         {{/hasAtleastOneApiImplConfig}}];
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
                           properties:(NSDictionary *_Nullable)properties
{
    UIViewController *miniAppViewController = [UIViewController new];
    miniAppViewController.view = [self miniAppViewWithName:name properties:properties];
    return miniAppViewController;
}

- (UIViewController *)miniAppWithName:(NSString *)name
                           properties:(NSDictionary *_Nullable)properties
                              overlay:(BOOL)overlay
                      sizeFlexibility:(NSInteger)sizeFlexibility
                             delegate:(id<MiniAppViewDelegate> _Nullable)delegate {
    UIViewController *miniAppViewController = [UIViewController new];
    miniAppViewController.view = [self miniAppViewWithName:name properties:properties overlay:overlay sizeFlexibility:sizeFlexibility delegate:delegate];
    return miniAppViewController;
}

- (UIView *)miniAppViewWithName:(NSString *)name properties:(NSDictionary *_Nullable)properties {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:name initialProperties:properties];
    rootView.backgroundColor = [self rootViewColorWithOverlay:NO];
    return rootView;
}

- (UIView *)miniAppViewWithName:(NSString *)name properties:(NSDictionary *_Nullable)properties overlay:(BOOL)overlay {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:name initialProperties:properties];
    rootView.backgroundColor = [self rootViewColorWithOverlay:overlay];
    return rootView;
}

- (UIView *)miniAppViewWithName:(NSString *)name
                     properties:(NSDictionary *_Nullable)properties
                sizeFlexibility:(NSInteger)sizeFlexibilty {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:name initialProperties:properties];
    rootView.sizeFlexibility = (RCTRootViewSizeFlexibility)sizeFlexibilty;
    rootView.backgroundColor = [self rootViewColorWithOverlay:NO];
    return rootView;
}

- (UIView *)miniAppViewWithName:(NSString *)name
                     properties:(NSDictionary *_Nullable)properties
                sizeFlexibility:(NSInteger)sizeFlexibilty
                       delegate:(id<MiniAppViewDelegate> _Nullable)delegate {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:name initialProperties:properties];
    rootView.sizeFlexibility = (RCTRootViewSizeFlexibility)sizeFlexibilty;
    rootView.backgroundColor = [self rootViewColorWithOverlay:NO];
    rootView.delegate = delegate;
    return rootView;
}

- (UIView *)miniAppViewWithName:(NSString *)name
                     properties:(NSDictionary *_Nullable)properties
                        overlay:(BOOL)overlay
                sizeFlexibility:(NSInteger)sizeFlexibility
                       delegate:(id<MiniAppViewDelegate> _Nullable)delegate {
    // Use the bridge to generate the view
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:name initialProperties:properties];
    rootView.sizeFlexibility = (RCTRootViewSizeFlexibility)sizeFlexibility;
    rootView.backgroundColor = [self rootViewColorWithOverlay:overlay];
    rootView.delegate = delegate;
    return rootView;
}

- (UIColor *)rootViewColorWithOverlay:(BOOL)overlay {
    if (overlay) {
        return [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:0.5];
    }
    return [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
}

- (void)updateView:(UIView *)view withProps:(NSDictionary *)newProps {
    if([view isKindOfClass:[RCTRootView class]]) {
        [((RCTRootView *) view) setAppProperties:newProps];
    }
}

////////////////////////////////////////////////////////////////////////////////
#pragma mark - Convenience Methods

- (void)startContainerWithConfiguration:(id<ElectrodePluginConfig>)reactContainerConfig ernDelegate:(id<ERNDelegate>)ernDelegate
         {{#plugins}}
            {{#configurable}}
                {{{lcname}}}: (id<ElectrodePluginConfig>) {{{lcname}}}
            {{/configurable}}
         {{/plugins}}
         {{#hasAtleastOneApiImplConfig}}
         apiImplementationsConfig: (NSObject <APIImplsConfigWrapperDelegate> *) apiImplConfig
         {{/hasAtleastOneApiImplConfig}}
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

    self.ernDelegate = ernDelegate;

     [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(notifyElectrodeReactNativeOnInitialized:)
                                                     name:RCTDidInitializeModuleNotification object:nil];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(signalElectrodeOnReactNativeInitialized:)
                                                     name:RCTJavaScriptDidLoadNotification object:nil];
    [self loadCustomFonts];

    {{#hasApiImpl}}
    [self registerAPIImplementations:{{#hasAtleastOneApiImplConfig}}apiImplConfig{{/hasAtleastOneApiImplConfig}}{{^hasAtleastOneApiImplConfig}}nil{{/hasAtleastOneApiImplConfig}}];
    {{/hasApiImpl}}

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
                CFRelease(error);
            }
            CFRelease(font);
            CFRelease(provider);
        }
    }
}

 {{#hasApiImpl}}
- (void)registerAPIImplementations:(NSObject <APIImplsConfigWrapperDelegate> *)configWrapper
{
    {{#apiImplementations}}
    [[{{apiName}}ApiController new] registerWithConfig:{{#hasConfig}}[configWrapper {{apiVariableName}}ApiConfig]]{{/hasConfig}}{{^hasConfig}}nil]{{/hasConfig}};
    {{/apiImplementations}}

}
 {{/hasApiImpl}}

- (void) notifyElectrodeReactNativeOnInitialized: (NSNotification *) notification {
    if (notification) {
        if ([notification.object isKindOfClass:[RCTBridge class]] ) {
            id localModuleInstance = notification.userInfo[@"module"];
            SEL selector = NSSelectorFromString(@"onReactNativeInitialized");
            SEL transceiverReadySelector = NSSelectorFromString(@"onTransceiverModuleInitialized");
            if ([localModuleInstance  respondsToSelector:selector]) {
                NSLog(@"RCTDidInitializeModuleNotification received");
                ((void (*)(id, SEL))[localModuleInstance methodForSelector:selector])(localModuleInstance, selector);
                if ([self.ernDelegate respondsToSelector:@selector(rctModuleDidInitialize)]) {
                    [self.ernDelegate rctModuleDidInitialize];
                }
            }
            if ([localModuleInstance  respondsToSelector:transceiverReadySelector]) {
                ((void (*)(id, SEL))[localModuleInstance methodForSelector:transceiverReadySelector])(localModuleInstance, transceiverReadySelector);
            }
        }
    }
}

- (void)addExtraDevMenu {
    RCTDevMenuItem *dev = [RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
        return @"Electrode Native Settings";
    } handler:^{
        ERNDevSettingsViewController* vc = [[ERNDevSettingsViewController alloc] initWithStyle:UITableViewStyleGrouped];
        vc.delegate = self;
        UINavigationController* navController = [[UINavigationController alloc] initWithRootViewController:vc];
        [RCTPresentedViewController() presentViewController:navController animated:YES completion:NULL];
    }];
    [[self.bridge devMenu] addItem:dev];
    BOOL enableDev = [[RCTBundleURLProvider sharedSettings] enableDev];
    NSString *enableDevTitle = enableDev ? @"Disable Dev": @"Enable Dev";
    RCTDevMenuItem *enableDevMenu = [RCTDevMenuItem buttonItemWithTitle:enableDevTitle handler:^{
        [[RCTBundleURLProvider sharedSettings] setEnableDev:!enableDev];
        __strong RCTBridge *strongBridge = self.bridge;
        strongBridge.bundleURL = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
        [strongBridge reload];
    }];
    [[self.bridge devMenu] addItem:enableDevMenu];
    BOOL enableMinify = [[RCTBundleURLProvider sharedSettings] enableMinification];
    NSString *minifyTitle = enableMinify ? @"Disable Minification" : @"Enable Minification";
    RCTDevMenuItem *enableMinifyMenu = [RCTDevMenuItem buttonItemWithTitle:minifyTitle handler:^{
        [[RCTBundleURLProvider sharedSettings] setEnableMinification:!enableMinify];
        __strong RCTBridge *strongBridge = self.bridge;
        strongBridge.bundleURL = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
        [strongBridge reload];
    }];
    [[self.bridge devMenu] addItem:enableMinifyMenu];
}

- (void) signalElectrodeOnReactNativeInitialized: (NSNotification *) notification {
    // add the ExtraDevMenu after React Native is initiliazed.
    [self addExtraDevMenu];

    // notify delegate that React Native is initalized.
    if (self.ernDelegate && [self.ernDelegate respondsToSelector:@selector(reactNativeDidInitialize)]) {
        [self.ernDelegate reactNativeDidInitialize];
    }
}

- (void)reloadBundleStoreBundle {
    [self reloadBundle];
}

- (void)reloadBundle {
    NSLog(@"Reload bundle");
    BOOL isBundleStoreEnabled = [[NSUserDefaults standardUserDefaults] boolForKey:enableBundleStore];
    BOOL autoReload = [[NSUserDefaults standardUserDefaults] boolForKey:autoReloadBundle];
    __strong RCTBridge *strongBridge = self.bridge;
    NSString *urlString = nil;
    if (isBundleStoreEnabled) {
            urlString = [NSString stringWithFormat:@"http://%@/bundles/%@/ios/%@/index.bundle",
                         [[NSUserDefaults standardUserDefaults] objectForKey:packagerIPPort],
                         [[NSUserDefaults standardUserDefaults] objectForKey:bundleStore],
                         [[NSUserDefaults standardUserDefaults] objectForKey:storeBundleId]];
    } else if (!isBundleStoreEnabled) {
        NSString *s = [[ElectrodeReactNative sharedInstance] defaultHostAndPort];
        urlString = [NSString stringWithFormat:@"http://%@/index.bundle?platform=ios&dev=true",s];
    }
    if (strongBridge) {
        strongBridge.bundleURL = [NSURL URLWithString:urlString];
        if (autoReload) {
            [strongBridge reload];
        }
    }
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
