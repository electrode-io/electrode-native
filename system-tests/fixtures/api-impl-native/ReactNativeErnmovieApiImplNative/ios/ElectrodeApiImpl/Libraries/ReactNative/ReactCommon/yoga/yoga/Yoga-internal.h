/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>
#include "Yoga.h"

using YGVector = std::vector<YGNodeRef>;

YG_EXTERN_C_BEGIN

WIN_EXPORT float YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

YG_EXTERN_C_END

namespace facebook {
namespace yoga {

inline bool isUndefined(float value) {
  // Value of a float in the case of it being not defined is 10.1E20. Earlier
  // it used to be NAN, the benefit of which was that if NAN is involved in any
  // mathematical expression the result was NAN. But since we want to have
  // `-ffast-math` flag being used by compiler which assumes that the floating
  // point values are not NAN and Inf, we represent YGUndefined as 10.1E20. But
  // now if YGUndefined is involved in any mathematical operations this
  // value(10.1E20) would change. So the following check makes sure that if the
  // value is outside a range (-10E8, 10E8) then it is undefined.
  return value >= 10E8 || value <= -10E8;
}

} // namespace yoga
} // namespace facebook

using namespace facebook;

extern const std::array<YGEdge, 4> trailing;
extern const std::array<YGEdge, 4> leading;
extern bool YGValueEqual(const YGValue a, const YGValue b);
extern const YGValue YGValueUndefined;
extern const YGValue YGValueAuto;
extern const YGValue YGValueZero;

template <std::size_t size>
bool YGValueArrayEqual(
    const std::array<YGValue, size> val1,
    const std::array<YGValue, size> val2) {
  bool areEqual = true;
  for (uint32_t i = 0; i < size && areEqual; ++i) {
    areEqual = YGValueEqual(val1[i], val2[i]);
  }
  return areEqual;
}

struct YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  YGMeasureMode widthMeasureMode;
  YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;

  YGCachedMeasurement()
      : availableWidth(0),
        availableHeight(0),
        widthMeasureMode((YGMeasureMode)-1),
        heightMeasureMode((YGMeasureMode)-1),
        computedWidth(-1),
        computedHeight(-1) {}

  bool operator==(YGCachedMeasurement measurement) const {
    bool isEqual = widthMeasureMode == measurement.widthMeasureMode &&
        heightMeasureMode == measurement.heightMeasureMode;

    if (!yoga::isUndefined(availableWidth) ||
        !yoga::isUndefined(measurement.availableWidth)) {
      isEqual = isEqual && availableWidth == measurement.availableWidth;
    }
    if (!yoga::isUndefined(availableHeight) ||
        !yoga::isUndefined(measurement.availableHeight)) {
      isEqual = isEqual && availableHeight == measurement.availableHeight;
    }
    if (!yoga::isUndefined(computedWidth) ||
        !yoga::isUndefined(measurement.computedWidth)) {
      isEqual = isEqual && computedWidth == measurement.computedWidth;
    }
    if (!yoga::isUndefined(computedHeight) ||
        !yoga::isUndefined(measurement.computedHeight)) {
      isEqual = isEqual && computedHeight == measurement.computedHeight;
    }

    return isEqual;
  }
};

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define YG_MAX_CACHED_RESULT_COUNT 16

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

extern bool YGFloatsEqual(const float a, const float b);
extern bool YGValueEqual(const YGValue a, const YGValue b);
extern const YGValue* YGComputedEdgeValue(
    const std::array<YGValue, YGEdgeCount>& edges,
    const YGEdge edge,
    const YGValue* const defaultValue);
