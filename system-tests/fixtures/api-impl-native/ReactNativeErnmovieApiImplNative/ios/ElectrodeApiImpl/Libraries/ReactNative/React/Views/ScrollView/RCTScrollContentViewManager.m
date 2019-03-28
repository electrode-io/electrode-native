/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentViewManager.h"

#import "RCTScrollContentShadowView.h"
#import "RCTScrollContentView.h"

@implementation RCTScrollContentViewManager

RCT_EXPORT_MODULE()

- (RCTScrollContentView *)view
{
  return [RCTScrollContentView new];
}

- (RCTShadowView *)shadowView
{
  return [RCTScrollContentShadowView new];
}

@end
