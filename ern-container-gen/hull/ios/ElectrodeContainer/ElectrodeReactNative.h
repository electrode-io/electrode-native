//
//  ElectrodeReactNative.h
//  ElectrodeContainer
//
//  Created by Cody Garvin on 1/18/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
@protocol ElectrodePluginConfig;
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
 
 @param configuration NSDictionary that uses ERN keys such as ERNCodePushConfig
 to store NSDictionary of configurations. The main key signifies which plugin
 the configuration is for, the subsequent NSDictionary is the actual
 configuration. This allows the ability to pass in multiple configurations for
 multiple plugins.
 */

+ (void)startWithConfigurations:(id<ElectrodePluginConfig>)reactContainerConfig
                        {{#plugins}}
                        {{#configurable}}
                        {{{lcname}}}: (id<ElectrodePluginConfig>) {{{lcname}}}
                        {{/configurable}}
                        {{/plugins}};


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
