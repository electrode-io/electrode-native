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

#import "ElectrodeBridgeDelegate.h"

@interface ElectrodeBridgeDelegate ()
@property (nonatomic, copy) NSURL *sourceURL;
@property (nonatomic, strong) NSArray *extraModules;
@end

@implementation ElectrodeBridgeDelegate

- (instancetype)initWithModuleURL:(NSURL *)url extraModules:(NSArray *)modules
{
    self = [super init];
    if (self)
    {
        self.sourceURL = url;
        self.extraModules = modules;
    }
    
    return self;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
    return _sourceURL;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
    return _extraModules;
}

- (instancetype)initWithURL: (NSURL *)url
{
    if (self = [super init])
    {
        _sourceURL = url;
    }
    
    return self;
}

@end
