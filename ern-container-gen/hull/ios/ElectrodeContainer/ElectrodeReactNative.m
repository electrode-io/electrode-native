//
//  ElectrodeReactNative.m
//  ElectrodeContainer
//
//  Created by Cody Garvin on 1/18/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import "ElectrodeReactNative_Internal.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <CodePush/CodePush.h>

#import "ElectrodeBridgeDelegate.h"
#import "ElectrodeBridgeTransceiver.h"

NSString * const ERNCodePushConfig = @"CodePush";
NSString * const ERNCodePushConfigServerUrl = @"CodePushConfigServerUrl";
NSString * const ERNCodePushConfigDeploymentKey = @"CodePushConfigDeploymentKey";
NSString * const ERNDebugEnabledConfig = @"DebugEnabledConfig";

@interface ElectrodeReactNative ()
@property (nonatomic, strong) RCTBridge *bridge;
@property (nonatomic, strong) ElectrodeBridgeDelegate *bridgeDelegate;
@end

@implementation ElectrodeReactNative

////////////////////////////////////////////////////////////////////////////////
#pragma mark - Public Methods
- (instancetype)init
{
    self = [super init];
    if (self)
    {
        [self initializeBundles];
    }

    return self;
}

+ (void)startWithConfigurations:(id<ElectrodePluginConfigurator>)configuration
{
    id sharedInstance = [ElectrodeReactNative sharedInstance];

    static dispatch_once_t startOnceToken;
    dispatch_once(&startOnceToken, ^{
        [sharedInstance setupPluginsWithConfigurations:configuration];
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
    if (self.bridge)
    {
        // Use the bridge to generate the view
        RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:name initialProperties:properties];

        rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

        miniAppViewController = [UIViewController new];
        miniAppViewController.view = rootView;
    }

    return miniAppViewController;
}

////////////////////////////////////////////////////////////////////////////////
#pragma mark - Convenience Methods
- (void)setupPluginsWithConfigurations:(id<ElectrodePluginConfigurator>)configuration
{
    // Look for CodePush
    [CodePush initialize];
    [self configureCodePush:configuration];
}

- (void)initializeBundles
{
    NSArray* bundleFiles = [self allJSBundleFiles];
    ElectrodeBridgeDelegate *delegate = [[ElectrodeBridgeDelegate alloc] initWithURL:bundleFiles[0]];
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:delegate launchOptions:nil];
    self.bridge = bridge;
    ElectrodeBridgeTransceiver *electrodeBridge = [self.bridge moduleForClass:[ElectrodeBridgeTransceiver class]];
    [electrodeBridge onReactNativeInitialized];
}

- (id<ElectrodeNativeBridge>)getNativeBridge
{
    return [self.bridge moduleForClass:[ElectrodeBridgeTransceiver class]];
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
        [self setUpCodePushWithID:[configuration codePushWithIDString]];
    }

    if (configuration && [configuration respondsToSelector:@selector(codePushWithServerURLString)])
    {
        [self setUpCodePushWithServer:[configuration codePushWithServerURLString]];
    }
}

- (void)setUpCodePushWithID:(NSString *)codePushID
{
    [CodePush setDeploymentKey:codePushID];
}

- (void)setUpCodePushWithServer:(NSString *)serverURL
{
    [CodePushConfig current].serverURL = serverURL;
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
