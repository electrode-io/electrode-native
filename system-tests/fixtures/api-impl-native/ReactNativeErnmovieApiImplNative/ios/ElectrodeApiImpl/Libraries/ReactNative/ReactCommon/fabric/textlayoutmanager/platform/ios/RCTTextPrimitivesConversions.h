/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <fabric/textlayoutmanager/RCTFontProperties.h>
#include <fabric/textlayoutmanager/RCTFontUtils.h>

using namespace facebook::react;

inline static NSTextAlignment RCTNSTextAlignmentFromTextAlignment(TextAlignment textAlignment) {
  switch (textAlignment) {
    case TextAlignment::Natural: return NSTextAlignmentNatural;
    case TextAlignment::Left: return NSTextAlignmentLeft;
    case TextAlignment::Right: return NSTextAlignmentRight;
    case TextAlignment::Center: return NSTextAlignmentCenter;
    case TextAlignment::Justified: return NSTextAlignmentJustified;
  }
}

inline static NSWritingDirection RCTNSWritingDirectionFromWritingDirection(WritingDirection writingDirection) {
  switch (writingDirection) {
    case WritingDirection::Natural: return NSWritingDirectionNatural;
    case WritingDirection::LeftToRight: return NSWritingDirectionLeftToRight;
    case WritingDirection::RightToLeft: return NSWritingDirectionRightToLeft;
  }
}

inline static RCTFontStyle RCTFontStyleFromFontStyle(FontStyle fontStyle) {
  switch (fontStyle) {
    case FontStyle::Normal: return RCTFontStyleNormal;
    case FontStyle::Italic: return RCTFontStyleItalic;
    case FontStyle::Oblique: return RCTFontStyleOblique;
  }
}

inline static RCTFontVariant RCTFontVariantFromFontVariant(FontVariant fontVariant) {
  return (RCTFontVariant)fontVariant;
}

inline static NSUnderlineStyle RCTNSUnderlineStyleFromStyleAndPattern(TextDecorationLineStyle textDecorationLineStyle, TextDecorationLinePattern textDecorationLinePattern) {
  NSUnderlineStyle style = NSUnderlineStyleNone;

  switch (textDecorationLineStyle) {
    case TextDecorationLineStyle::Single:
      style = NSUnderlineStyle(style | NSUnderlineStyleSingle); break;
    case TextDecorationLineStyle::Thick:
      style = NSUnderlineStyle(style | NSUnderlineStyleThick); break;
    case TextDecorationLineStyle::Double:
      style = NSUnderlineStyle(style | NSUnderlineStyleDouble); break;
  }

  switch (textDecorationLinePattern) {
    case TextDecorationLinePattern::Solid:
      style = NSUnderlineStyle(style | NSUnderlinePatternSolid); break;
    case TextDecorationLinePattern::Dash:
      style = NSUnderlineStyle(style | NSUnderlinePatternDash); break;
    case TextDecorationLinePattern::Dot:
      style = NSUnderlineStyle(style | NSUnderlinePatternDot); break;
    case TextDecorationLinePattern::DashDot:
      style = NSUnderlineStyle(style | NSUnderlinePatternDashDot); break;
    case TextDecorationLinePattern::DashDotDot:
      style = NSUnderlineStyle(style | NSUnderlinePatternDashDotDot); break;
  }

  return style;
}

inline static UIColor *RCTUIColorFromSharedColor(const SharedColor &color) {
  return color ? [UIColor colorWithCGColor:color.get()] : nil;
}
