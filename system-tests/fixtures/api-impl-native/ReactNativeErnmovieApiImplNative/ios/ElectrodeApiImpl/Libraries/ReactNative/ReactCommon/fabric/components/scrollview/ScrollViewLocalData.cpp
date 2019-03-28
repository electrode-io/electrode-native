/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewLocalData.h"

#include <fabric/debug/debugStringConvertibleUtils.h>
#include <fabric/graphics/conversions.h>

namespace facebook {
namespace react {

ScrollViewLocalData::ScrollViewLocalData(Rect contentBoundingRect):
  contentBoundingRect(contentBoundingRect) {}

Size ScrollViewLocalData::getContentSize() const {
  return Size {contentBoundingRect.getMaxX(), contentBoundingRect.getMaxY()};
}

#pragma mark - DebugStringConvertible

std::string ScrollViewLocalData::getDebugName() const {
  return "ScrollViewLocalData";
}

SharedDebugStringConvertibleList ScrollViewLocalData::getDebugProps() const {
  return {
    debugStringConvertibleItem("contentBoundingRect", contentBoundingRect)
  };
}

} // namespace react
} // namespace facebook
