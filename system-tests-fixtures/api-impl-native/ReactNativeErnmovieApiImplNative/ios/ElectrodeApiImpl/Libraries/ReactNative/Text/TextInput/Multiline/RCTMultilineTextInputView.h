/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTView.h>
#import <React/UIView+React.h>

#import "RCTBaseTextInputView.h"

@class RCTBridge;

@interface RCTMultilineTextInputView : RCTBaseTextInputView

@property (nonatomic, assign) UITextAutocorrectionType autocorrectionType;
@property (nonatomic, assign) UITextSpellCheckingType spellCheckingType;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, copy) NSString *text;
@property (nonatomic, strong) UIColor *placeholderTextColor;
@property (nonatomic, copy) NSString *placeholder;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, strong) NSNumber *maxLength;

@property (nonatomic, copy) RCTDirectEventBlock onChange;
@property (nonatomic, copy) RCTDirectEventBlock onTextInput;
@property (nonatomic, copy) RCTDirectEventBlock onScroll;

- (void)performTextUpdate;

@end
