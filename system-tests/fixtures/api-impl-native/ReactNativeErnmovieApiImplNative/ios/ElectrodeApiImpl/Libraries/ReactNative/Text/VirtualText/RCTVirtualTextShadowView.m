/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTVirtualTextShadowView.h"

#import <React/RCTShadowView+Layout.h>
#import <yoga/Yoga.h>

#import "RCTRawTextShadowView.h"

@implementation RCTVirtualTextShadowView {
  BOOL _isLayoutDirty;
}

#pragma mark - Life Cycle

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertReactSubview:subview atIndex:index];

  [self dirtyLayout];

  if (![subview isKindOfClass:[RCTVirtualTextShadowView class]]) {
    YGNodeSetDirtiedFunc(subview.yogaNode, RCTVirtualTextShadowViewYogaNodeDirtied);
  }

}

- (void)removeReactSubview:(RCTShadowView *)subview
{
  if (![subview isKindOfClass:[RCTVirtualTextShadowView class]]) {
    YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }

  [self dirtyLayout];

  [super removeReactSubview:subview];
}

#pragma mark - Layout

- (void)dirtyLayout
{
  [super dirtyLayout];

  if (_isLayoutDirty) {
    return;
  }
  _isLayoutDirty = YES;

  [self.superview dirtyLayout];
}

- (void)clearLayout
{
  _isLayoutDirty = NO;
}

static void RCTVirtualTextShadowViewYogaNodeDirtied(YGNodeRef node)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)YGNodeGetContext(node);

  RCTVirtualTextShadowView *virtualTextShadowView =
    (RCTVirtualTextShadowView *)shadowView.reactSuperview;

  [virtualTextShadowView dirtyLayout];
}

@end
