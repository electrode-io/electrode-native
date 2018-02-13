/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
