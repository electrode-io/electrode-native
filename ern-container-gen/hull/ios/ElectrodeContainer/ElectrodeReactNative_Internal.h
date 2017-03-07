//
//  ElectrodeReactNative_Internal.h
//  ElectrodeContainer
//
//  Created by Claire Weijie Li on 3/1/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import <ElectrodeContainer/ElectrodeContainer.h>

@interface ElectrodeConfigure : NSObject <ElectrodePluginConfigurator>

@property (nonatomic, assign, readonly) BOOL isDebugEnabled;

@property (nonatomic, copy, readonly) NSString *codePushWithIDString;

@property (nonatomic, copy, readonly) NSString *codePushWithServerURLString;

- (instancetype)initWithData: (NSDictionary *)data;

@end
