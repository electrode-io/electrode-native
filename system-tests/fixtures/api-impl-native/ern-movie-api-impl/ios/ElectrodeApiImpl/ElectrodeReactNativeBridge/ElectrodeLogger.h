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

#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
typedef NS_ENUM(NSInteger, ElectrodeLogLevel) {
  ElectrodeLogLevelNone = 1 << 0,
  ElectrodeLogLevelError = 1 << 1,
  ElectrodeLogLevelInfo = 1 << 2,
  ElectrodeLogLevelDebug = 1 << 3,
  ElectrodeLogLevelVerbose = 1 << 4
};

@interface ElectrodeLoggerObjc : NSObject
+ (void)loglevel:(ElectrodeLogLevel)level format:(NSString *)format, ...;
@end

#define ERNLog(lvl, frmt, ...)                                                 \
  [ElectrodeLoggerObjc loglevel:lvl format:frmt, ##__VA_ARGS__]

#define ERNDebug(frmt, ...) ERNLog(ElectrodeLogLevelDebug, frmt, ##__VA_ARGS__)

@protocol ElectrodeLogger <NSObject>

@property(nonatomic, assign) ElectrodeLogLevel logLevel;
+ (instancetype)sharedInstance;
- (void)log:(ElectrodeLogLevel)level message:(NSString *)message;
- (void)debug:(NSString *)message;

@end

/*
 * ElectrodeConsoleLogger sets the log level for ERN framework
 * an example usage could be like below
 * ElectrodeConsoleLogger.sharedInstance.logLevel = ElectrodeLogLevelDebug
 */
@interface ElectrodeConsoleLogger : NSObject <ElectrodeLogger>

@end

NS_ASSUME_NONNULL_END
