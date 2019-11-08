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
#import "ElectrodeLogger.h"

NS_ASSUME_NONNULL_BEGIN

@interface ElectrodeConsoleLogger ()
@end

@implementation ElectrodeConsoleLogger
@synthesize logLevel = _logLevel;
- (instancetype)init {
  if (self = [super init]) {
    _logLevel = ElectrodeLogLevelNone;
  }

  return self;
}
+ (instancetype)sharedInstance {
  static dispatch_once_t onceToken;
  static ElectrodeConsoleLogger *sharedInstance;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[ElectrodeConsoleLogger alloc] init];
  });

  return sharedInstance;
}
- (void)log:(ElectrodeLogLevel)level message:(NSString *)message {
  if (self.logLevel >= level) {
    switch (level) {
    case ElectrodeLogLevelNone:
      // log nothing
      break;
    case ElectrodeLogLevelError:
      NSLog(@"[ERN Error] %@", message);
      break;
    case ElectrodeLogLevelInfo:
      NSLog(@"[ERN Info] %@", message);
      break;
    case ElectrodeLogLevelDebug:
      NSLog(@"[ERN Debug] %@", message);
      break;
    case ElectrodeLogLevelVerbose:
      NSLog(@"[ERN Verbose] %@", message);
      break;
    default:
      break;
    }
  }
}

- (void)debug:(NSString *)message {
  [self log:ElectrodeLogLevelDebug message:message];
}
@end

@implementation ElectrodeLoggerObjc

+ (void)loglevel:(ElectrodeLogLevel)level format:(NSString *)format, ... {
  va_list argp;
  va_start(argp, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:argp];
  va_end(argp);

  [[ElectrodeConsoleLogger sharedInstance] log:level message:message];
}

@end
NS_ASSUME_NONNULL_END
