/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextProps.h"

namespace facebook {
namespace react {

TextProps::TextProps(const TextProps &sourceProps, const RawProps &rawProps):
  BaseTextProps::BaseTextProps(sourceProps, rawProps) {};

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList TextProps::getDebugProps() const {
  return BaseTextProps::getDebugProps();
}

} // namespace react
} // namespace facebook
