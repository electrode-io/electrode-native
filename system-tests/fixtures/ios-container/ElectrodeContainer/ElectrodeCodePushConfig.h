//
//  ElectrodeCodePushConfig.h
//  ElectrodeContainer
//
//  Created by Claire Weijie Li on 6/27/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ElectrodeReactNative.h"
NS_ASSUME_NONNULL_BEGIN
@interface ElectrodeCodePushConfig : NSObject<ElectrodePluginConfig>

@property(nonatomic, copy, readonly) NSString *deploymentKey;
@property(nonatomic, copy, readonly, nullable) NSString *serverURL;

- (instancetype) initWithDeploymentKey:(NSString *)deploymentKey
                             serverURL: (NSString * _Nullable)severURL
                       containerConfig: (ElectrodeContainerConfig *)containerConfig;
- (NSURL *) codePushBundleURL;

@end

NS_ASSUME_NONNULL_END
