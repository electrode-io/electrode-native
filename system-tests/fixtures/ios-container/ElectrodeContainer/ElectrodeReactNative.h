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
#import <UIKit/UIKit.h>
#import "ElectrodePluginConfig.h"




NS_ASSUME_NONNULL_BEGIN

@interface ElectrodeContainerConfig: NSObject <ElectrodePluginConfig>
@property (nonatomic, assign) BOOL debugEnabled;
@end

////////////////////////////////////////////////////////////////////////////////
#pragma mark - ElectrodeReactNative
/**
 Container for Electrode plugins and React Native bundles that isolates
 logic, files and set up from Native engineers.
 */
@interface ElectrodeReactNative : NSObject

/**
 Create a singleton instance of ElectrodeReactNative with the ability to set
 configurations for the plugins associated with the container.
 
 @return A singleton instance of ElectrodeReactNative.
 */
+ (instancetype)sharedInstance;

/**
 Start an instance of ElectrodeReactNative with the ability to set
 configurations for the plugins associated with the container. Only needed to be
 called once.
 
 @param reactContainerConfig NSDictionary that uses ERN keys such as ERNCodePushConfig
 to store NSDictionary of configurations. The main key signifies which plugin
 the configuration is for, the subsequent NSDictionary is the actual
 configuration. This allows the ability to pass in multiple configurations for
 multiple plugins.
 */

+ (void)startWithConfigurations:(id<ElectrodePluginConfig>)reactContainerConfig
                        electrodeCodePushConfig: (id<ElectrodePluginConfig>) electrodeCodePushConfig
;


/**
 Returns a react native miniapp (from a JSBundle) inside a view controller.
 
 @param name The name of the mini app, preferably the same name as the jsbundle
 without the extension.
 @param properties Any configuration to set up the mini app with.
 @return A UIViewController containing the view of the miniapp.
 */
- (UIViewController *)miniAppWithName:(NSString *)name
                           properties:(NSDictionary * _Nullable)properties;
@end
NS_ASSUME_NONNULL_END
