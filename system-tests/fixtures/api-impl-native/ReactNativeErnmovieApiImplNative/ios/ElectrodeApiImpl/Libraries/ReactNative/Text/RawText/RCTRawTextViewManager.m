/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRawTextViewManager.h"

#import "RCTRawTextShadowView.h"

@implementation RCTRawTextViewManager

RCT_EXPORT_MODULE(RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (RCTShadowView *)shadowView
{
  return [RCTRawTextShadowView new];
}

RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
