/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextViewManager.h"

#import <React/RCTAccessibilityManager.h>
#import <React/RCTAssert.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTShadowView+Layout.h>
#import <React/UIView+React.h>
#import <yoga/Yoga.h>

#import "RCTRawTextShadowView.h"
#import "RCTTextShadowView.h"
#import "RCTTextView.h"
#import "RCTMultilineTextInputView.h"

static void collectDirtyNonTextDescendants(RCTTextShadowView *shadowView, NSMutableArray *nonTextDescendants) {
  for (RCTShadowView *child in shadowView.reactSubviews) {
    if ([child isKindOfClass:[RCTTextShadowView class]]) {
      collectDirtyNonTextDescendants((RCTTextShadowView *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[RCTRawTextShadowView class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface RCTTextShadowView (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(YGMeasureMode)widthMode;

@end


@implementation RCTTextViewManager

RCT_EXPORT_MODULE(RCTText)

- (UIView *)view
{
  return [RCTTextView new];
}

- (RCTShadowView *)shadowView
{
  return [RCTTextShadowView new];
}

#pragma mark - Shadow properties

RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, RCTTextDecorationLineType)
RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, RCTShadowView *> *)shadowViewRegistry
{
  for (RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactRootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      RCTShadowView *shadowView = queue[i];
      RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[RCTTextShadowView class]]) {
        ((RCTTextShadowView *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(RCTTextShadowView *)shadowView recomputeText];
        collectDirtyNonTextDescendants((RCTTextShadowView *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[RCTRawTextShadowView class]]) {
        RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(RCTRawTextShadowView *)shadowView text]);
      } else {
        for (RCTShadowView *child in [shadowView reactSubviews]) {
          if ([child isTextDirty]) {
            [queue addObject:child];
          }
        }
      }

      [shadowView setTextComputed];
    }
  }

  return nil;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTTextShadowView *)shadowView
{
  NSNumber *reactTag = shadowView.reactTag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTTextView *> *viewRegistry) {
    RCTTextView *text = viewRegistry[reactTag];
    text.contentInset = padding;
  };
}

@end
