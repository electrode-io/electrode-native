/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBundleURLProvider.h"

#import "RCTConvert.h"
#import "RCTDefines.h"

NSString *const RCTBundleURLProviderUpdatedNotification = @"RCTBundleURLProviderUpdatedNotification";

const NSUInteger kRCTBundleURLProviderDefaultPort = RCT_METRO_PORT;

static NSString *const kRCTJsLocationKey = @"RCT_jsLocation";
static NSString *const kRCTEnableLiveReloadKey = @"RCT_enableLiveReload";
static NSString *const kRCTEnableDevKey = @"RCT_enableDev";
static NSString *const kRCTEnableMinificationKey = @"RCT_enableMinification";

@implementation RCTBundleURLProvider

- (instancetype)init
{
  self = [super init];
  if (self) {
    [self setDefaults];
  }
  return self;
}

- (NSDictionary *)defaults
{
  return @{
    kRCTEnableLiveReloadKey: @NO,
    kRCTEnableDevKey: @YES,
    kRCTEnableMinificationKey: @NO,
  };
}

- (void)settingsUpdated
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTBundleURLProviderUpdatedNotification object:self];
}

- (void)setDefaults
{
  [[NSUserDefaults standardUserDefaults] registerDefaults:[self defaults]];
}

- (void)resetToDefaults
{
  for (NSString *key in [[self defaults] allKeys]) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
  }
  [self setDefaults];
  [self settingsUpdated];
}

static NSURL *serverRootWithHost(NSString *host)
{
  return [NSURL URLWithString:
          [NSString stringWithFormat:@"http://%@:%lu/",
           host, (unsigned long)kRCTBundleURLProviderDefaultPort]];
}

#if RCT_DEV
- (BOOL)isPackagerRunning:(NSString *)host
{
  NSURL *url = [serverRootWithHost(host) URLByAppendingPathComponent:@"status"];
  NSURLRequest *request = [NSURLRequest requestWithURL:url];
  NSURLResponse *response;
  NSData *data = [NSURLConnection sendSynchronousRequest:request returningResponse:&response error:NULL];
  NSString *status = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  return [status isEqualToString:@"packager-status:running"];
}

- (NSString *)guessPackagerHost
{
  static NSString *ipGuess;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *ipPath = [[NSBundle mainBundle] pathForResource:@"ip" ofType:@"txt"];
    ipGuess = [[NSString stringWithContentsOfFile:ipPath encoding:NSUTF8StringEncoding error:nil]
               stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]];
  });

  NSString *host = ipGuess ?: @"localhost";
  if ([self isPackagerRunning:host]) {
    return host;
  }
  return nil;
}
#endif

- (NSString *)packagerServerHost
{
  NSString *location = [self jsLocation];
  if (location != nil) {
    return location;
  }
#if RCT_DEV
  NSString *host = [self guessPackagerHost];
  if (host) {
    return host;
  }
#endif
  return nil;
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackResource:(NSString *)resourceName fallbackExtension:(NSString *)extension
{
  NSString *packagerServerHost = [self packagerServerHost];
  if (!packagerServerHost) {
    return [self jsBundleURLForFallbackResource:resourceName fallbackExtension:extension];
  } else {
    return [RCTBundleURLProvider jsBundleURLForBundleRoot:bundleRoot
                                             packagerHost:packagerServerHost
                                                enableDev:[self enableDev]
                                       enableMinification:[self enableMinification]];
  }
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackResource:(NSString *)resourceName
{
  return [self jsBundleURLForBundleRoot:bundleRoot fallbackResource:resourceName fallbackExtension:nil];
}

- (NSURL *)jsBundleURLForFallbackResource:(NSString *)resourceName
                        fallbackExtension:(NSString *)extension
{
  resourceName = resourceName ?: @"main";
  extension = extension ?: @"jsbundle";
  return [[NSBundle mainBundle] URLForResource:resourceName withExtension:extension];
}

- (NSURL *)resourceURLForResourceRoot:(NSString *)root
                         resourceName:(NSString *)name
                    resourceExtension:(NSString *)extension
                        offlineBundle:(NSBundle *)offlineBundle
{
  NSString *packagerServerHost = [self packagerServerHost];
  if (!packagerServerHost) {
    // Serve offline bundle (local file)
    NSBundle *bundle = offlineBundle ?: [NSBundle mainBundle];
    return [bundle URLForResource:name withExtension:extension];
  }
  NSString *path = [NSString stringWithFormat:@"/%@/%@.%@", root, name, extension];
  return [[self class] resourceURLForResourcePath:path packagerHost:packagerServerHost query:nil];
}

+ (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                       packagerHost:(NSString *)packagerHost
                          enableDev:(BOOL)enableDev
                 enableMinification:(BOOL)enableMinification
{
  NSString *path = [NSString stringWithFormat:@"/%@.bundle", bundleRoot];
  // When we support only iOS 8 and above, use queryItems for a better API.
  NSString *query = [NSString stringWithFormat:@"platform=ios&dev=%@&minify=%@",
                      enableDev ? @"true" : @"false",
                      enableMinification ? @"true": @"false"];
  return [[self class] resourceURLForResourcePath:path packagerHost:packagerHost query:query];
}

+ (NSURL *)resourceURLForResourcePath:(NSString *)path
                         packagerHost:(NSString *)packagerHost
                                query:(NSString *)query
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:serverRootWithHost(packagerHost) resolvingAgainstBaseURL:NO];
  components.path = path;
  if (query != nil) {
    components.query = query;
  }
  return components.URL;
}

- (void)updateValue:(id)object forKey:(NSString *)key
{
  [[NSUserDefaults standardUserDefaults] setObject:object forKey:key];
  [[NSUserDefaults standardUserDefaults] synchronize];
  [self settingsUpdated];
}

- (BOOL)enableDev
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTEnableDevKey];
}

- (BOOL)enableLiveReload
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTEnableLiveReloadKey];
}

- (BOOL)enableMinification
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTEnableMinificationKey];
}

- (NSString *)jsLocation
{
  return [[NSUserDefaults standardUserDefaults] stringForKey:kRCTJsLocationKey];
}

- (void)setEnableDev:(BOOL)enableDev
{
  [self updateValue:@(enableDev) forKey:kRCTEnableDevKey];
}

- (void)setEnableLiveReload:(BOOL)enableLiveReload
{
  [self updateValue:@(enableLiveReload) forKey:kRCTEnableLiveReloadKey];
}

- (void)setJsLocation:(NSString *)jsLocation
{
  [self updateValue:jsLocation forKey:kRCTJsLocationKey];
}

- (void)setEnableMinification:(BOOL)enableMinification
{
  [self updateValue:@(enableMinification) forKey:kRCTEnableMinificationKey];
}

+ (instancetype)sharedSettings
{
  static RCTBundleURLProvider *sharedInstance;
  static dispatch_once_t once_token;
  dispatch_once(&once_token, ^{
    sharedInstance = [RCTBundleURLProvider new];
  });
  return sharedInstance;
}

@end
