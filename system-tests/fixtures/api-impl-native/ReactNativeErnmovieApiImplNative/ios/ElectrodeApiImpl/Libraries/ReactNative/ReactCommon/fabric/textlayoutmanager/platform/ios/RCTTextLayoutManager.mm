/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextLayoutManager.h"

#import "NSTextStorage+FontScaling.h"
#import "RCTAttributedTextUtils.h"

using namespace facebook::react;

@implementation RCTTextLayoutManager

static NSLineBreakMode RCTNSLineBreakModeFromWritingDirection(EllipsizeMode ellipsizeMode) {
  switch (ellipsizeMode) {
    case EllipsizeMode::Clip: return NSLineBreakByClipping;
    case EllipsizeMode::Head: return NSLineBreakByTruncatingHead;
    case EllipsizeMode::Tail: return NSLineBreakByTruncatingTail;
    case EllipsizeMode::Middle: return NSLineBreakByTruncatingMiddle;
  }
}

- (facebook::react::Size)measureWithAttributedString:(AttributedString)attributedString
                                 paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                   layoutConstraints:(LayoutConstraints)layoutConstraints
{
  CGSize maximumSize = CGSize {layoutConstraints.maximumSize.width, layoutConstraints.maximumSize.height};
  NSTextStorage *textStorage =
    [self _textStorageAndLayoutManagerWithAttributesString:RCTNSAttributedStringFromAttributedString(attributedString)
                                       paragraphAttributes:paragraphAttributes
                                                      size:maximumSize];

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  CGSize size = [layoutManager usedRectForTextContainer:textContainer].size;

  size = (CGSize){
    MIN(size.width, maximumSize.width),
    MIN(size.height, maximumSize.height)
  };

  return facebook::react::Size {size.width, size.height};
}

- (void)drawAttributedString:(AttributedString)attributedString
         paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame
{
  NSTextStorage *textStorage =
    [self _textStorageAndLayoutManagerWithAttributesString:RCTNSAttributedStringFromAttributedString(attributedString)
                                       paragraphAttributes:paragraphAttributes
                                                      size:frame.size];
   NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
   NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

   NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
   [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:frame.origin];
   [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:frame.origin];
}

- (NSTextStorage *)_textStorageAndLayoutManagerWithAttributesString:(NSAttributedString *)attributedString
                                                paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                               size:(CGSize)size
{
  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];

  textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
  textContainer.lineBreakMode =
    paragraphAttributes.maximumNumberOfLines > 0 ? RCTNSLineBreakModeFromWritingDirection(paragraphAttributes.ellipsizeMode) : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = paragraphAttributes.maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage =
    [[NSTextStorage alloc] initWithAttributedString:attributedString];

  [textStorage addLayoutManager:layoutManager];

  if (paragraphAttributes.adjustsFontSizeToFit) {
    CGFloat minimumFontSize = !isnan(paragraphAttributes.minimumFontSize) ? paragraphAttributes.minimumFontSize : 4.0;
    CGFloat maximumFontSize = !isnan(paragraphAttributes.maximumFontSize) ? paragraphAttributes.maximumFontSize : 96.0;
    [textStorage scaleFontSizeToFitSize:size
                        minimumFontSize:minimumFontSize
                        maximumFontSize:maximumFontSize];
  }

  return textStorage;
}

@end
