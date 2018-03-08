/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTRawTextShadowView.h"

#import <React/RCTShadowView+Layout.h>

@implementation RCTRawTextShadowView

- (void)setText:(NSString *)text
{
  if (_text != text && ![_text isEqualToString:text]) {
    _text = [text copy];
    [self dirtyLayout];
  }
}

- (void)dirtyLayout
{
  [self.superview dirtyLayout];
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  return [[superDescription substringToIndex:superDescription.length - 1] stringByAppendingFormat:@"; text: %@>", self.text];
}

@end
